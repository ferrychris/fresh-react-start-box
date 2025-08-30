import React from 'react';

interface LeaderBoardEntry {
  id: string;
  fanName: string;
  points: number;
  avatar?: string;
  rank: number;
}

const LeaderBoard: React.FC = () => {
  // Mock leaderboard data
  const leaderboardData: LeaderBoardEntry[] = [
    {
      id: 'l1',
      fanName: 'Max Verstappen Fan',
      points: 1250,
      rank: 1,
      avatar: '🏆'
    },
    {
      id: 'l2',
      fanName: 'Ferrari Enthusiast',
      points: 980,
      rank: 2,
      avatar: '🥈'
    },
    {
      id: 'l3',
      fanName: 'Lewis Hamilton Supporter',
      points: 875,
      rank: 3,
      avatar: '🥉'
    },
    {
      id: 'l4',
      fanName: 'McLaren Racing',
      points: 720,
      rank: 4,
      avatar: '🏎️'
    },
    {
      id: 'l5',
      fanName: 'Alpine F1 Team',
      points: 650,
      rank: 5,
      avatar: '🏁'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🏆</span>
        Fan Leaderboard
      </h3>
      
      <div className="space-y-3">
        {leaderboardData.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-medium text-blue-800">
                {entry.rank}
              </div>
              <div className="text-2xl">{entry.avatar}</div>
              <div>
                <p className="font-medium text-gray-900">{entry.fanName}</p>
                <p className="text-sm text-gray-500">{entry.points} points</p>
              </div>
            </div>
            
            {entry.rank <= 3 && (
              <div className="text-yellow-500">
                {entry.rank === 1 && '👑'}
                {entry.rank === 2 && '🥈'}
                {entry.rank === 3 && '🥉'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Points earned through posts, likes, and engagement
        </p>
      </div>
    </div>
  );
};

export default LeaderBoard;
