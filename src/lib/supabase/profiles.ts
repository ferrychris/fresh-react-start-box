import { supabase } from './client';
import { RacerProfile } from './types';

export const getRacerProfile = async (id: string): Promise<RacerProfile | null> => {
  const { data, error } = await supabase
    .from('racers')
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
    .from('racers')
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
    .from('racers')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating racer profile:', error);
  }

  return { data, error };
};

export const incrementRacerViews = async (racerId: string) => {
    const { error } = await supabase.rpc('increment_racer_views', { racer_id: racerId });
    if (error) {
        console.error('Error incrementing racer views:', error);
    }
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  // Best-effort cascading deletes. Wrap each in try/catch so missing tables don't break the flow.
  const safeDelete = async (table: string, column: string) => {
    try {
      await supabase.from(table).delete().eq(column, userId);
    } catch (err) {
      console.warn(`[deleteUserProfile] Skipping table ${table}:`, err);
    }
  };

  // Common related data
  await safeDelete('racer_posts', 'racer_id');
  await safeDelete('post_comments', 'user_id');
  await safeDelete('track_followers', 'track_id');
  await safeDelete('race_schedules', 'track_id');
  await safeDelete('followers', 'racer_id');
  await safeDelete('followers', 'fan_id');

  // Profile variants by role
  await safeDelete('racers', 'id');
  await safeDelete('tracks', 'id');
  await safeDelete('series', 'id');
  await safeDelete('fans', 'id');

  // Generic profile table (if present)
  await safeDelete('profiles', 'id');
};
