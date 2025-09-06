import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Globe, MapPin, Share2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import {
  getTeamFollowersCount,
  isFollowingTeam,
  followTeam,
  unfollowTeam,
  addMember,
  removeMember,
  type TeamMember,
} from '../integrations/supabase/teams';

interface TeamRow {
  id: string;
  team_name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
  featured_racers?: string[] | null;
}

const SocialLinks: React.FC<{ links?: Record<string, string> | null }> = ({ links }) => {
  if (!links) return null;
  const entries = Object.entries(links).filter(([, v]) => !!v);
  if (!entries.length) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      {entries.map(([key, url]) => (
        <a key={key} href={url} target="_blank" rel="noreferrer" className="hover:text-white underline-offset-4 hover:underline">
          {key}
        </a>
      ))}
    </div>
  );
};

type MemberWithProfile = TeamMember & { profile?: { id: string; name?: string | null; username?: string | null; avatar?: string | null } };

const MemberRow: React.FC<{ m: MemberWithProfile; onRemove: (racerId: string) => void }> = ({ m, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-slate-700">
      <Link to={`/racer/${m.racer_id}`} className="flex items-center gap-3">
        <img src={m.profile?.avatar || '/placeholder.svg'} alt={m.profile?.name || m.profile?.username || m.racer_id} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
        <div className="text-slate-200 text-sm">
          <span className="font-medium">{m.profile?.name || 'Racer'}</span>
          {m.profile?.username && <span className="ml-2 text-slate-400">@{m.profile.username}</span>}
          <span className="ml-2 text-slate-400">({m.role})</span>
        </div>
      </Link>
      <button onClick={() => onRemove(m.racer_id)} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1">
        <Trash2 className="w-3 h-3" /> Remove
      </button>
    </div>
  );
};

const TeamDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = id as string;
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [amFollowing, setAmFollowing] = useState<boolean>(false);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [newMemberRacerId, setNewMemberRacerId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'manager' | 'owner'>('member');

  useEffect(() => {
    const load = async () => {
      if (!teamId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, team_name, description, logo_url, banner_url, website, social_links, featured_racers')
          .eq('id', teamId)
          .maybeSingle();
        if (!error) setTeam((data as TeamRow) || null);
        setFollowers(await getTeamFollowersCount(teamId));
        setAmFollowing(await isFollowingTeam(teamId));
        // Load team members joined with profiles for display
        const { data: memberRows } = await supabase
          .from('team_members')
          .select('id, team_id, racer_id, role, created_at, profile:profiles ( id, name, username, avatar )')
          .eq('team_id', teamId)
          .order('created_at', { ascending: true });
        setMembers((memberRows as any[] || []).map(r => ({
          id: r.id,
          team_id: r.team_id,
          racer_id: r.racer_id,
          role: r.role,
          created_at: r.created_at,
          profile: r.profile || undefined,
        })) as MemberWithProfile[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId]);

  const bannerUrl = useMemo(() => team?.banner_url || '/placeholder.svg', [team]);
  const logoUrl = useMemo(() => team?.logo_url || '/placeholder.svg', [team]);

  const toggleFollow = async () => {
    if (!teamId) return;
    if (amFollowing) {
      const { error } = await unfollowTeam(teamId);
      if (!error) {
        setAmFollowing(false);
        setFollowers((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await followTeam(teamId);
      if (!error) {
        setAmFollowing(true);
        setFollowers((c) => c + 1);
      }
    }
  };

  const handleAddMember = async () => {
    if (!teamId || !newMemberRacerId) return;
    const { error } = await addMember(teamId, newMemberRacerId, newMemberRole);
    if (!error) {
      const refreshed = await listTeamMembers(teamId);
      if (!refreshed.error) setMembers(refreshed.data);
      setNewMemberRacerId('');
      setNewMemberRole('member');
    }
  };

  const handleRemoveMember = async (racerId: string) => {
    if (!teamId) return;
    const { error } = await removeMember(teamId, racerId);
    if (!error) {
      setMembers((arr) => arr.filter((m) => m.racer_id !== racerId));
    }
  };

  if (loading) return <div className="p-6">Loading team…</div>;
  if (!team) return <div className="p-6">Team not found</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative h-56 md:h-72 w-full bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <div className="flex items-start gap-4">
            <img src={logoUrl} alt={team.team_name} className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{team.team_name}</h1>
                <div className="flex items-center gap-2">
                  <button onClick={toggleFollow} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${amFollowing ? 'bg-slate-700 hover:bg-slate-600' : 'bg-orange-500 hover:bg-orange-600'} transition-colors`}>
                    {amFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <div className="flex items-center gap-1 text-slate-300 text-sm"><Users className="w-4 h-4" /> {followers}</div>
                </div>
              </div>
              {team.description && <p className="text-slate-300 mt-2">{team.description}</p>}
              <div className="mt-3">
                <SocialLinks links={team.social_links as any} />
              </div>
            </div>
          </div>

          {/* Featured Racers placeholder */}
          {team.featured_racers && team.featured_racers.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Featured Racers</h3>
              <div className="text-slate-300 text-sm">{team.featured_racers.join(', ')}</div>
            </div>
          )}

          {/* Members */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Members</h3>
            <div className="space-y-2">
              {members.length === 0 ? (
                <div className="text-slate-400 text-sm">No members yet</div>
              ) : (
                members.map((m) => (
                  <MemberRow key={m.id} m={m} onRemove={handleRemoveMember} />
                ))
              )}
            </div>

            {/* Simple membership management */}
            <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-sm text-slate-300 mb-2">Add member by Racer ID</div>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="racer_id (UUID)"
                  value={newMemberRacerId}
                  onChange={(e) => setNewMemberRacerId(e.target.value)}
                />
                <select
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
                <button onClick={handleAddMember} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Recent posts placeholder */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Recent Team Posts</h3>
            <div className="text-slate-400 text-sm">Coming soon…</div>
          </div>

          <div className="mt-8">
            <Link to="/grandstand" className="text-blue-400 hover:text-blue-300 text-sm">Back to Grandstand</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
