import { supabase } from './client';

export interface Team {
  id: string;
  team_name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  follower_count?: number | null;
}

export async function listTeamsIMemberOf(): Promise<{ data: Team[]; error: any }>{
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { data: [], error: new Error('Not authenticated') };
  // team_members.racer_id references racer_profiles.id which equals profiles.id (auth.uid())
  const { data, error } = await supabase
    .from('team_members')
    .select('team:teams ( id, team_name, description, logo_url, banner_url, follower_count )')
    .eq('racer_id', userId);
  if (error) return { data: [], error };
  const teams = (data || []).map((row: any) => row.team).filter(Boolean) as Team[];
  return { data: teams, error: null };
}

export async function listTeams(): Promise<{ data: Team[]; error: any }> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, team_name, description, logo_url, banner_url, follower_count')
    .order('team_name', { ascending: true });
  return { data: (data as Team[]) || [], error };
}

export async function listTeamsIFollow(): Promise<{ data: Team[]; error: any }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { data: [], error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('team_followers')
    .select('team:teams ( id, team_name, description, logo_url, banner_url, follower_count )')
    .eq('user_id', userId);
  if (error) return { data: [], error };
  const teams = (data || []).map((row: any) => row.team).filter(Boolean) as Team[];
  return { data: teams, error: null };
}

// Team members
export type TeamMemberRole = 'member' | 'manager' | 'owner';

export interface TeamMember {
  id: string;
  team_id: string;
  racer_id: string;
  role: TeamMemberRole;
  created_at?: string;
}

export async function listTeamMembers(teamId: string): Promise<{ data: TeamMember[]; error: any | null }> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, racer_id, role, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });
  return { data: (data as TeamMember[]) || [], error };
}

export async function addMember(
  teamId: string,
  racerId: string,
  role: TeamMemberRole = 'member'
): Promise<{ error: any | null }> {
  const { error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, racer_id: racerId, role });
  return { error };
}

export async function removeMember(teamId: string, racerId: string): Promise<{ error: any | null }> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('racer_id', racerId);
  return { error };
}

export async function getTeamFollowersCount(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from('team_followers')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);
  if (error) {
    console.warn('getTeamFollowersCount error', error);
    return 0;
  }
  return count || 0;
}

export async function isFollowingTeam(teamId: string): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return false;
  const { data, error } = await supabase
    .from('team_followers')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .limit(1);
  if (error) {
    console.warn('isFollowingTeam error', error);
    return false;
  }
  return !!(data && data.length > 0);
}

export async function followTeam(teamId: string): Promise<{ error: any | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { error: new Error('Not authenticated') };
  const { error } = await supabase
    .from('team_followers')
    .insert({ team_id: teamId, user_id: userId });
  return { error };
}

export async function unfollowTeam(teamId: string): Promise<{ error: any | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { error: new Error('Not authenticated') };
  const { error } = await supabase
    .from('team_followers')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);
  return { error };
}
