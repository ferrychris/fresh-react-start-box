import { supabase } from '../../integrations/supabase/client';
import { RacerProfile } from './types';

export const getRacerProfile = async (id: string): Promise<RacerProfile | null> => {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching racer profile:', error);
    return null;
  }

  return data as RacerProfile;
};

export const getRacerProfileByUsername = async (username: string): Promise<RacerProfile | null> => {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching racer profile by username:', error);
    return null;
  }

  return data as RacerProfile;
};

export const updateRacerProfile = async (id: string, updates: Partial<RacerProfile>) => {
  const { data, error } = await supabase
    .from('racer_profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating racer profile:', error);
  }

  return { data, error };
};

export const updateProfile = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
  }

  return { data, error };
};

export const getRacerEarnings = async (racerId: string) => {
  const { data, error } = await supabase
    .from('racer_earnings')
    .select('*')
    .eq('racer_id', racerId)
    .single();

  if (error) {
    console.error('Error fetching racer earnings:', error);
    return null;
  }

  return data;
};

export const getRacerFanStats = async (racerId: string) => {
  // Get fan connections count
  const { count: totalFans, error: fansError } = await supabase
    .from('fan_connections')
    .select('id', { count: 'exact', head: true })
    .eq('racer_id', racerId);

  if (fansError) {
    console.error('Error fetching fan count:', fansError);
  }

  // Get superfan count
  const { count: superFans, error: superFansError } = await supabase
    .from('fan_connections')
    .select('id', { count: 'exact', head: true })
    .eq('racer_id', racerId)
    .eq('is_superfan', true);

  if (superFansError) {
    console.error('Error fetching superfan count:', superFansError);
  }

  return {
    fan_id: racerId,
    total_fans: totalFans || 0,
    super_fans: superFans || 0,
    total_tips: 0,
    active_subscriptions: 0,
    support_points: 0,
    activity_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const getRacerPosts = async (racerId: string) => {
  const { data, error } = await supabase
    .from('racer_posts')
    .select(`
      *,
      profiles(name, avatar)
    `)
    .eq('racer_id', racerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching racer posts:', error);
    return [];
  }

  return data || [];
};

export const incrementRacerViews = async (racerId: string) => {
    // Use the increment_profile_views function instead
    const { error } = await supabase.rpc('increment_profile_views', { p_profile_id: racerId });
    if (error) {
        console.error('Error incrementing racer views:', error);
    }
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  // Best-effort cascading deletes. Wrap each in try/catch so missing tables don't break the flow.
  const safeDelete = async (table: string, column: string) => {
    try {
      const { error } = await supabase.from(table).delete().eq(column, userId);
      if (error) {
        console.warn(`[deleteUserProfile] Error deleting from ${table}:`, error);
      }
    } catch (err) {
      console.warn(`[deleteUserProfile] Skipping table ${table}:`, err);
    }
  };

  // Common related data
  await safeDelete('racer_posts', 'racer_id');
  await safeDelete('post_comments', 'user_id');
  await safeDelete('track_followers', 'track_id');
  await safeDelete('race_schedules', 'track_id');
  await safeDelete('fan_connections', 'racer_id');
  await safeDelete('fan_connections', 'fan_id');

  // Profile variants by role
  await safeDelete('racer_profiles', 'id');
  await safeDelete('track_profiles', 'id');
  await safeDelete('series_profiles', 'id');
  await safeDelete('fan_profiles', 'id');

  // Generic profile table (if present)
  await safeDelete('profiles', 'id');
};