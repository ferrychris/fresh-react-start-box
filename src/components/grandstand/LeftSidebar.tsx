import React from 'react';
import { Users } from 'lucide-react';

interface TeamData {
  id: string;
  name: string;
  avatar: string;
  since?: string;
}

interface LeftSidebarProps {
  user: any;
  teamsLoading: boolean;
  teamsError: string | null;
  fanTeams: TeamData[];
  onUnfollowTeam?: (teamId: string) => Promise<void> | void;
  racersFollowed?: TeamData[];
  onUnfollowRacer?: (racerId: string) => Promise<void> | void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  user, 
  teamsLoading, 
  teamsError, 
  fanTeams,
  onUnfollowTeam,
  racersFollowed,
  onUnfollowRacer
}) => {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-4 space-y-4">
        {/* Community Guidelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Community Guidelines</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start">
              <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span>Be respectful. No harassment, hate speech, or bullying.</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span>Keep it racing. Off-topic or NSFW content may be removed.</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span>No spam, scams, or misleading promotions.</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span>Protect privacy. Don't share personal info without consent.</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span>Report issues. Use the menu to flag problematic posts.</span>
            </li>
          </ul>
          <div className="mt-3 text-xs text-slate-400">By participating, you agree to these rules.</div>
        </div>
        
        {/* Racers You Follow */}
        {user && racersFollowed && racersFollowed.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Racers You Follow</h2>
            </div>
            <ul className="space-y-3">
              {racersFollowed.map((racer) => (
                <li key={racer.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={racer.avatar}
                      alt={racer.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div className="ml-3">
                      <div className="text-sm text-white font-medium">{racer.name}</div>
                      {racer.since && (
                        <div className="text-[11px] text-slate-400">{racer.since}</div>
                      )}
                    </div>
                  </div>
                  {onUnfollowRacer && (
                    <button
                      onClick={() => onUnfollowRacer(racer.id)}
                      className="text-[11px] font-semibold text-green-500 hover:text-green-400"
                      title="Unfollow racer"
                    >
                      Fan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Teams You Follow Section */}
        {user && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Teams You Follow</h2>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            {teamsLoading ? (
              <div className="text-sm text-slate-400">Loading teams...</div>
            ) : teamsError ? (
              <div className="text-sm text-red-400">{teamsError}</div>
            ) : fanTeams.length > 0 ? (
              <ul className="space-y-3">
                {fanTeams.map((team) => (
                <li key={team.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={team.avatar}
                      alt={team.name}
                      className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-700"
                    />
                    <div className="ml-3">
                      <div className="text-sm text-white font-medium">{team.name}</div>
                      {team.since && (
                        <div className="text-[11px] text-slate-400">{team.since}</div>
                      )}
                    </div>
                  </div>
                  {onUnfollowTeam && (
                    <button
                      onClick={() => onUnfollowTeam(team.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-300"
                      title="Unfollow"
                    >
                      Unfollow
                    </button>
                  )}
                </li>
              ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-400">You haven't followed any teams yet.</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;
