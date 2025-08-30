import React from 'react';
import { Link } from 'react-router-dom';

interface Racer {
  id: string;
  name: string;
  avatarUrl: string;
  flag: string;
  number?: string | number;
  isLive?: boolean;
  lastTipped: string | null;
  totalTipped: number;
  subscription: string | null;
  nextRace: {
    track: string;
    date: string;
  };
}

interface FavoriteRacersProps {
  racers: Racer[];
  onTip: (racerId: string, amount: number) => void;
}

const FavoriteRacers: React.FC<FavoriteRacersProps> = ({ racers, onTip }) => {
  // Theme context available if needed for future styling

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Favorite Racers</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {racers.map((racer) => (
          <div
            key={racer.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl shadow-black/40 h-full flex flex-col"
          >
            {/* Header: avatar + name + last tipped + amount on the right */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link to={`/racer/${racer.id}`}>
                  <div className="relative">
                    <img
                      src={racer.avatarUrl}
                      alt={racer.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    {racer.flag && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full overflow-hidden border border-gray-800 flex items-center justify-center bg-black/60">
                        <span className="text-[10px] leading-none">{racer.flag}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/racer/${racer.id}`}
                      className="text-white text-xs font-semibold hover:text-green-500 transition-colors"
                    >
                      {racer.name}
                    </Link>
                    {typeof racer.number !== 'undefined' && (
                      <span className="text-[10px] text-gray-300 bg-gray-800 rounded px-1 py-0.5">#{racer.number}</span>
                    )}
                    {racer.isLive && (
                      <span className="flex items-center gap-1 text-[10px] text-red-400">
                        <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">Last post {racer.lastTipped || 'Never'}</div>
                </div>
              </div>
              {/* Right side kept empty per new rows layout */}
            </div>

            {/* Details rows */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Total tipped</span>
                <span className="text-[10px] text-green-500 font-semibold">${racer.totalTipped}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Subscription</span>
                <span className="text-[10px] text-blue-400">{racer.subscription || 'None'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Next race</span>
                <span className="text-[10px] text-white">{racer.nextRace.track} - {racer.nextRace.date}</span>
              </div>
            </div>

            {/* Footer: Tip button full width and bell icon to the right */}
            <div className="mt-auto pt-3 flex items-center gap-2">
              <button
                onClick={() => onTip(racer.id, 5)}
                className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
              >
                Tip $5
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6z" />
                  <path d="M9 18a3 3 0 006 0H9z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {racers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">You haven't added any favorite racers yet.</p>
          <Link
            to="/racers"
            className="mt-4 inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Find Racers
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoriteRacers;
