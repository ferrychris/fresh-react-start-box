import { supabase } from '@/integrations/supabase/client';

export interface Team {
  id: string;
  team_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  founded_year?: number;
  headquarters?: string;
  website?: string;
  social_links?: any;
  contact_email?: string;
  contact_phone?: string;
  racing_classes?: string[];
  featured_racers?: string[];
  is_active: boolean;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamFollower {
  id: string;
  user_id: string;
  team_id: string;
  followed_at: string;
  is_active: boolean;
}

// Get all teams
export const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('follower_count', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return data || [];
};

// Get team by ID
export const getTeam = async (id: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching team:', error);
    return null;
  }

  return data;
};

// Toggle team follow
export const toggleTeamFollow = async (teamId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // First check if the user already follows this team
    const { data: existingFollow } = await supabase
      .from('team_followers')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('team_id', teamId)
      .maybeSingle();
    
    if (existingFollow) {
      // Record exists, toggle is_active status
      const newStatus = !existingFollow.is_active;
      
      const { data, error } = await supabase
        .from('team_followers')
        .update({ 
          is_active: newStatus,
          followed_at: newStatus ? new Date().toISOString() : undefined
        })
        .eq('id', existingFollow.id)
        .select('is_active');
      
      if (error) throw error;
      
      // Update follower count directly
      if (newStatus) {
        await supabase
          .from('teams')
          .update({ follower_count: supabase.sql`follower_count + 1` })
          .eq('id', teamId);
      } else {
        await supabase
          .from('teams')
          .update({ follower_count: supabase.sql`GREATEST(0, follower_count - 1)` })
          .eq('id', teamId);
      }
      
      return newStatus;
    } else {
      // No record exists, create a new follow
      const { data, error } = await supabase
        .from('team_followers')
        .insert({
          user_id: user.id,
          team_id: teamId,
          is_active: true,
          followed_at: new Date().toISOString()
        })
        .select('is_active');
      
      if (error) {
        // If we get a unique violation, the record was created in a race condition
        // Update the existing record instead
        if (error.code === '23505') {
          const { data: updatedData, error: updateError } = await supabase
            .from('team_followers')
            .update({ 
              is_active: true,
              followed_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)
            .eq('team_id', teamId)
            .select('is_active');
          
          if (updateError) throw updateError;
          
          // Increment follower count directly
          await supabase
            .from('teams')
            .update({ follower_count: supabase.sql`follower_count + 1` })
            .eq('id', teamId);
          
          return true;
        } else {
          throw error;
        }
      }
      
      // Increment follower count directly
      await supabase
        .from('teams')
        .update({ follower_count: supabase.sql`follower_count + 1` })
        .eq('id', teamId);
      
      return true;
    }
  } catch (error) {
    console.error('Error toggling team follow:', error);
    throw error;
  }
};

// Check if user follows team
export const checkTeamFollow = async (teamId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('team_followers')
    .select('id')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking team follow:', error);
    return false;
  }

  return !!data;
};

// Get user's followed teams
export const getUserFollowedTeams = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('team_followers')
    .select(`
      team_id,
      teams!inner(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching followed teams:', error);
    return [];
  }

  return data?.map(item => item.teams).filter(Boolean) || [];
};