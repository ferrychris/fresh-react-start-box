import React, { useEffect, useState, useMemo } from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listTeams, listTeamsIMemberOf, isFollowingTeam, followTeam, unfollowTeam, getTeamFollowersCount, Team } from '../../../integrations/supabase/teams';

export const TeamsPanel: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await listTeams();
        setTeams(data);
        // Load teams current user is a member of
        const mine = await listTeamsIMemberOf();
        if (!mine.error) setMyTeams(mine.data);
        // hydrate following state and counts
        const followEntries = await Promise.all(
          data.map(async (t) => [t.id, await isFollowingTeam(t.id)] as const)
        );
        const countEntries = await Promise.all(
          data.map(async (t) => [t.id, await getTeamFollowersCount(t.id)] as const)
        );
        setFollowing(Object.fromEntries(followEntries));
        setCounts(Object.fromEntries(countEntries));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTeams = useMemo(() => {
    if (!showFollowedOnly) return teams;
    return teams.filter(t => following[t.id]);
  }, [teams, showFollowedOnly, following]);

  const toggleFollow = async (teamId: string) => {
    const isFollowing = following[teamId];
    if (isFollowing) {
      const { error } = await unfollowTeam(teamId);
      if (!error) {
        setFollowing((f) => ({ ...f, [teamId]: false }));
        setCounts((c) => ({ ...c, [teamId]: Math.max(0, (c[teamId] || 1) - 1) }));
      }
    } else {
      const { error } = await followTeam(teamId);
      if (!error) {
        setFollowing((f) => ({ ...f, [teamId]: true }));
        setCounts((c) => ({ ...c, [teamId]: (c[teamId] || 0) + 1 }));
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-slate-300">Loading teams…</div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Teams</h3>
        <button
          onClick={() => setShowFollowedOnly(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${showFollowedOnly ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'}`}
        >
          {showFollowedOnly ? 'Showing: Followed' : 'Show: Teams I Follow'}
        </button>
      </div>
      {/* My Teams Section (if any) */}
      {myTeams.length > 0 && (
        <div className="mb-6">
          <div className="text-slate-300 text-sm mb-2">My Teams</div>
          <div className="space-y-2">
            {myTeams.map((team) => (
              <div key={team.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-slate-700">
                <Link to={`/team/${team.id}`} className="flex items-center gap-3 group">
                  <img src={team.logo_url || '/placeholder.svg'} alt={team.team_name} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                  <div>
                    <div className="text-white font-medium group-hover:underline">{team.team_name}</div>
                    <div className="text-slate-400 text-xs line-clamp-1 max-w-[260px]">{team.description}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Member</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {filteredTeams.length === 0 ? (
          <div className="text-slate-400">No teams available</div>
        ) : (
          filteredTeams.map((team) => (
            <div key={team.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <Link to={`/team/${team.id}`} className="flex items-center gap-3 group">
                  <img src={team.logo_url || '/placeholder.svg'} alt={team.team_name} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                  <div>
                    <div className="text-white font-semibold group-hover:underline">{team.team_name}</div>
                    <div className="text-slate-400 text-xs line-clamp-1 max-w-[280px]">{team.description}</div>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                {following[team.id] && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-600/20 text-green-300 border border-green-600/30">Followed</span>
                )}
                <div className="flex items-center gap-1 text-slate-300 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{counts[team.id] ?? team.follower_count ?? 0}</span>
                </div>
                <button
                  onClick={() => toggleFollow(team.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    following[team.id] ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {following[team.id] ? (
                    <span className="flex items-center gap-1"><Minus className="w-3 h-3" /> Unfollow</span>
                  ) : (
                    <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Follow</span>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
;
