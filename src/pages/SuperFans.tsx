import React, { useState } from 'react';
import { Trophy, Crown, Star, TrendingUp, Users, Award, Flame } from 'lucide-react';

interface SuperFan {
  id: string;
  username: string;
  name: string;
  avatar: string;
  totalSupport: number;
  supportType: 'tips' | 'subscriptions' | 'interactions';
  supportedRacers: number;
  supportedTracks: number;
  supportedSeries: number;
  streakDays: number;
  badges: string[];
  rank: number;
  monthlySupport: number;
  verified?: boolean;
}

const mockSuperFans: SuperFan[] = [
  {
    id: '1',
    username: 'speedfan92',
    name: 'Racing Fan',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    totalSupport: 2847,
    supportType: 'tips',
    supportedRacers: 5,
    supportedTracks: 3,
    supportedSeries: 2,
    streakDays: 45,
    badges: ['Top Tipper', 'Loyal Fan', 'Early Supporter'],
    rank: 1,
    monthlySupport: 450,
    verified: true
  },
  {
    id: '2',
    username: 'pitcrewchief',
    name: 'Mike Johnson',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    totalSupport: 2156,
    supportType: 'subscriptions',
    supportedRacers: 8,
    supportedTracks: 2,
    supportedSeries: 1,
    streakDays: 67,
    badges: ['Subscriber Pro', 'Community Leader'],
    rank: 2,
    monthlySupport: 380
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    username: 'trackqueen',
    name: 'Sarah Davis',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    totalSupport: 1923,
    supportType: 'interactions',
    supportedRacers: 12,
    supportedTracks: 5,
    supportedSeries: 3,
    streakDays: 89,
    badges: ['Social Butterfly', 'Track Expert'],
    rank: 3,
    monthlySupport: 320
  }
];

export const SuperFans: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'overall' | 'racers' | 'tracks' | 'series'>('overall');
  const [timeFilter, setTimeFilter] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');

  const categories = [
    { id: 'overall' as const, label: 'Overall', icon: Trophy },
    { id: 'racers' as const, label: 'Racer Fans', icon: Crown },
    { id: 'tracks' as const, label: 'Track Fans', icon: Award },
    { id: 'series' as const, label: 'Series Fans', icon: Star }
  ];

  const timeFilters = [
    { id: 'all-time' as const, label: 'All Time' },
    { id: 'monthly' as const, label: 'This Month' },
    { id: 'weekly' as const, label: 'This Week' }
  ];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-slate-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Award className="w-6 h-6 text-gray-300" />;
      case 3: return <Trophy className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <Crown className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white racing-number">Super Fans</h1>
              <p className="text-slate-400 text-sm lg:text-base">The most dedicated supporters in the OnlyRaceFans community</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 lg:gap-3 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap text-sm lg:text-base min-h-[44px] ${
                    activeCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-200 whitespace-nowrap min-h-[40px] ${
                  timeFilter === filter.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Super Fans Content */}
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
            {mockSuperFans.slice(0, 3).map((fan, index) => (
              <div
                key={fan.id}
                className={`relative text-center ${index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'}`}
              >
                <div className={`relative inline-block mb-4 ${index === 0 ? 'transform scale-110' : ''}`}>
                  {/* Rank Badge */}
                  <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    'bg-amber-600 text-amber-900'
                  }`}>
                    {fan.rank}
                  </div>
                  
                  <button className="block">
                    <img
                      src={fan.avatar}
                      alt={fan.name}
                      className={`rounded-2xl object-cover ring-4 transition-all duration-200 hover:scale-105 ${
                        index === 0 ? 'w-20 h-20 lg:w-24 lg:h-24 ring-yellow-500' :
                        index === 1 ? 'w-16 h-16 lg:w-20 lg:h-20 ring-gray-400' :
                        'w-16 h-16 lg:w-20 lg:h-20 ring-amber-600'
                      }`}
                    />
                  </button>

                  {/* Streak Indicator */}
                  {fan.streakDays > 30 && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Flame className="w-2 h-2 lg:w-3 lg:h-3" />
                      <span>{fan.streakDays}</span>
                    </div>
                  )}
                </div>

                <button className="block w-full text-center hover:bg-slate-900 rounded-xl p-2 lg:p-3 transition-all duration-200">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <h3 className="font-bold text-white text-base lg:text-lg">{fan.name}</h3>
                    {fan.verified && (
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-400 mb-2 text-sm">@{fan.username}</p>
                  
                  <div className="text-xl lg:text-2xl font-bold text-orange-500 racing-number mb-2">
                    ${fan.totalSupport.toLocaleString()}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 lg:gap-2 text-xs text-slate-400 mb-3">
                    <div>
                      <div className="text-white font-medium text-sm">{fan.supportedRacers}</div>
                      <div>Racers</div>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{fan.supportedTracks}</div>
                      <div>Tracks</div>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{fan.supportedSeries}</div>
                      <div>Series</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center">
                    {fan.badges.slice(0, 2).map((badge, badgeIndex) => (
                      <span key={badgeIndex} className="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {badge}
                      </span>
                    ))}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Full Leaderboard */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg lg:text-xl font-bold text-white">Super Fan Leaderboard</h3>
            </div>
            
            <div className="space-y-0">
              {mockSuperFans.map((fan) => (
                <button
                  key={fan.id}
                  className="w-full flex items-center justify-between p-4 lg:p-6 hover:bg-slate-800 transition-all duration-200 border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                    {/* Rank */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center bg-slate-800 flex-shrink-0">
                      {getRankIcon(fan.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={fan.avatar}
                        alt={fan.name}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-orange-500 transition-all duration-200"
                      />
                      {fan.streakDays > 30 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <Flame className="w-2 h-2 lg:w-3 lg:h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm lg:text-base truncate">{fan.name}</span>
                        {fan.verified && (
                          <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs lg:text-sm text-slate-400 truncate">@{fan.username}</div>
                      <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span>{fan.supportedRacers} racers</span>
                        <span>{fan.supportedTracks} tracks</span>
                        <span>{fan.supportedSeries} series</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-white racing-number text-base lg:text-lg">
                      ${fan.totalSupport.toLocaleString()}
                    </div>
                    <div className="text-xs lg:text-sm text-green-400">
                      +${fan.monthlySupport} this month
                    </div>
                    <div className="hidden lg:block text-xs text-slate-400 mt-1">
                      {fan.streakDays} day streak
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recognition Section */}
          <div className="mt-8 lg:mt-12 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-2xl p-4 lg:p-8 border border-orange-500/20">
            <div className="text-center">
              <Crown className="w-10 h-10 lg:w-12 lg:h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Become a Super Fan</h3>
              <p className="text-slate-300 mb-4 lg:mb-6 max-w-2xl mx-auto text-sm lg:text-base">
                Support your favorite racers, tracks, and series to climb the leaderboard and earn exclusive badges. 
                The most dedicated fans get featured here and receive special recognition from the community.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 max-w-2xl mx-auto">
                <div className="bg-slate-800 rounded-lg p-3 lg:p-4 text-center">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm lg:text-base">Tip Racers</div>
                  <div className="text-slate-400 text-xs lg:text-sm">Show direct support</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 lg:p-4 text-center">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm lg:text-base">Subscribe</div>
                  <div className="text-slate-400 text-xs lg:text-sm">Get exclusive content</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 lg:p-4 text-center">
                  <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm lg:text-base">Stay Active</div>
                  <div className="text-slate-400 text-xs lg:text-sm">Build your streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};