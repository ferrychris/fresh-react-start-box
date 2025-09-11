import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTeamsIMemberOf, Team, createTeam } from '../../../integrations/supabase/teams';

export const TeamsPanel: React.FC = () => {
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const mine = await listTeamsIMemberOf();
        if (!mine.error) setMyTeams(mine.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // No follow/unfollow controls in this view; only show teams the racer belongs to

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-slate-300">Loading teams…</div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Teams</h3>
        {myTeams.length > 0 && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {showCreate ? 'Close' : 'Create Team'}
          </button>
        )}
      </div>

      {/* Create Team form */}
      {(showCreate || myTeams.length === 0) && (
        <div className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="text-white font-medium mb-3">Create a Team</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <input
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Short description (optional)"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <button
              disabled={creating || teamName.trim() === ''}
              onClick={async () => {
                if (!teamName.trim()) return;
                setCreating(true);
                try {
                  const { error } = await createTeam(teamName.trim(), teamDesc.trim() || undefined, null, null);
                  if (error) throw error;
                  setTeamName('');
                  setTeamDesc('');
                  // reload memberships
                  setLoading(true);
                  const mine = await listTeamsIMemberOf();
                  if (!mine.error) setMyTeams(mine.data);
                } catch (e) {
                  console.error('Failed to create team', e);
                } finally {
                  setCreating(false);
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create Team'}
            </button>
          </div>
        </div>
      )}

      {myTeams.length === 0 ? (
        <div className="text-slate-400">No teams to display yet.</div>
      ) : (
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
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Member</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
;
