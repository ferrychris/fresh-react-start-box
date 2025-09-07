import React from 'react';
import { Trophy, Users } from 'lucide-react';

interface RacerData {
  id: string;
  name: string;
  avatar: string;
  car?: string;
  cls?: string;
  team?: string;
}

interface TeamData {
  name: string;
  avatar: string;
}

interface RightSidebarProps {
  suggestionsLoading: boolean;
  suggestionsError: string | null;
  featuredRacers: RacerData[];
  featuredTeams: TeamData[];
  onFollowRacer?: (racerId: string) => Promise<void> | void;
  onUnfollowRacer?: (racerId: string) => Promise<void> | void;
  followingRacers?: Set<string> | string[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  suggestionsLoading,
  suggestionsError,
  featuredRacers,
  featuredTeams,
  onFollowRacer,
  onUnfollowRacer,
  followingRacers
}) => {
  const isFollowing = (id: string) => {
    if (!followingRacers) return false;
    return Array.isArray(followingRacers)
      ? followingRacers.includes(id)
      : (followingRacers as Set<string>).has(id);
  };
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-4 space-y-4">
        {/* Suggested Racers Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Suggested Racers</h2>
            <Trophy className="w-4 h-4 text-slate-400" />
          </div>
          {suggestionsLoading ? (
            <div className="text-sm text-slate-400">Loading suggestions...</div>
          ) : suggestionsError ? (
            <div className="text-sm text-red-400">{suggestionsError}</div>
          ) : featuredRacers.length > 0 ? (
            <ul className="space-y-3">
              {featuredRacers.slice(0, 5).map((racer) => (
                <li key={racer.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={racer.avatar}
                      alt={racer.name}
                      className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-700"
                    />
                    <div className="ml-3">
                      <div className="text-sm text-white font-medium">{racer.name}</div>
                      {racer.car && racer.cls && (
                        <div className="text-[11px] text-slate-400">#{racer.car} • {racer.cls}</div>
                      )}
                    </div>
                  </div>
                  {isFollowing(racer.id) ? (
                    onUnfollowRacer && (
                      <button
                        onClick={() => onUnfollowRacer(racer.id)}
                        className="px-2 py-1 text-xs font-semibold text-green-500 hover:text-green-400"
                        title="Unfollow"
                      >
                        Fan
                      </button>
                    )
                  ) : (
                    onFollowRacer && (
                      <button
                        onClick={() => onFollowRacer(racer.id)}
                        className="px-2 py-1 text-xs font-semibold text-orange-500 hover:text-orange-400"
                      >
                        Fan
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">No suggested racers available.</div>
          )}
        </div>
        
        {/* Active Teams/Racers Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Active Teams/Racers</h2>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          {suggestionsLoading ? (
            <div className="text-sm text-slate-400">Loading active teams...</div>
          ) : suggestionsError ? (
            <div className="text-sm text-red-400">{suggestionsError}</div>
          ) : featuredTeams.length > 0 ? (
            <ul className="space-y-3">
              {featuredTeams.slice(0, 3).map((team, index) => (
                <li key={index} className="flex items-center">
                  <img
                    src={team.avatar}
                    alt={team.name}
                    className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-700"
                  />
                  <div className="ml-3">
                    <div className="text-sm text-white font-medium">{team.name}</div>
                    <div className="text-[11px] text-slate-400">Active team</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">No active teams available.</div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
