import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useThemeClasses } from '../../hooks/useThemeClasses';
import { Trophy, Flame, DollarSign, Users, TrendingUp, Calendar, Bell, Star, Clock } from 'lucide-react';

// Mock data for the dashboard
const mockRecentActivity = [
  {
    id: '1',
    type: 'tip',
    fanName: 'Mike Johnson',
    amount: 15,
    timestamp: '2 hours ago',
    icon: '💰'
  },
  {
    id: '2',
    type: 'subscription',
    fanName: 'Sarah Williams',
    tier: 'Crew Chief',
    timestamp: '1 day ago',
    icon: '👑'
  },
  {
    id: '3',
    type: 'milestone',
    description: '500 Followers Reached',
    timestamp: '3 days ago',
    icon: '🏆'
  }
];

const mockUpcomingRaces = [
  {
    id: '1',
    eventName: 'Charlotte 400',
    date: '2024-09-15',
    track: 'Charlotte Motor Speedway',
    series: 'Cup Series'
  },
  {
    id: '2',
    eventName: 'Bristol Night Race',
    date: '2024-10-02',
    track: 'Bristol Motor Speedway',
    series: 'Cup Series'
  }
];

export function RacerDashboard() {
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content' | 'monetization'>('overview');

  // Add role validation
  if (!user || user.role !== 'RACER') {
    return (
      <div className={`min-h-screen ${theme.bg.primary} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>Access Denied</h2>
          <p className={theme.text.secondary}>You need to be logged in as a Racer to view this dashboard.</p>
        </div>
      </div>
    );
  }

  // Assume these properties exist on the user object
  const racerProfile = {
    carNumber: user.racerProfile?.carNumber || '00',
    followers: 1254,
    totalEarnings: 2450,
    subscriberCount: 87,
    nextRace: mockUpcomingRaces[0],
    streakDays: 14
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'activity' as const, label: 'Activity', icon: Calendar },
    { id: 'content' as const, label: 'Content', icon: Star },
    { id: 'monetization' as const, label: 'Monetization', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={user.avatar || 'https://placehold.co/128x128?text=Racer'}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-white racing-number">{user.name}</h1>
                <span className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">#{racerProfile.carNumber}</span>
              </div>
              <p className="text-slate-400">@{user.username} • Racer Dashboard</p>
              {user.bio && <p className="text-slate-300 mt-1">{user.bio}</p>}
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500 racing-number">{racerProfile.followers.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 racing-number flex items-center">
                    <Flame className="w-6 h-6 mr-1" />
                    {racerProfile.streakDays}
                  </div>
                  <div className="text-xs text-slate-400">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-400 racing-number">${racerProfile.totalEarnings}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Subscribers</p>
                      <p className="text-2xl font-bold text-blue-400 racing-number">{racerProfile.subscriberCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Followers</p>
                      <p className="text-2xl font-bold text-purple-400 racing-number">{racerProfile.followers}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Next Race</p>
                      <p className="text-2xl font-bold text-orange-400 racing-number">{racerProfile.nextRace ? new Date(racerProfile.nextRace.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 border-b border-slate-800 pb-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl">
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          {activity.type === 'tip' && (
                            <p className="text-slate-300">
                              <span className="font-semibold text-blue-400">{activity.fanName}</span> tipped you
                              <span className="font-bold text-green-400"> ${activity.amount}</span>
                            </p>
                          )}
                          {activity.type === 'subscription' && (
                            <p className="text-slate-300">
                              <span className="font-semibold text-blue-400">{activity.fanName}</span> subscribed at
                              <span className="font-bold text-purple-400"> {activity.tier}</span> tier
                            </p>
                          )}
                          {activity.type === 'milestone' && (
                            <p className="text-slate-300">
                              <span className="font-bold text-yellow-400">Milestone:</span> {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View All Activity
                  </button>
                </div>
                
                {/* Upcoming Races */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Upcoming Races</h3>
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {mockUpcomingRaces.map((race) => (
                      <div key={race.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white">{race.eventName}</h4>
                            <p className="text-slate-400">{race.track}</p>
                            <p className="text-xs text-slate-500">{race.series}</p>
                          </div>
                          <div className="bg-slate-700 px-3 py-1 rounded-lg text-white font-medium">
                            {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View Full Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4">Activity Feed</h3>
              <p className="text-slate-400">Detailed activity tracking coming soon.</p>
            </div>
          )}
          
          {activeTab === 'content' && (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4">Content Management</h3>
              <p className="text-slate-400">Create and manage your exclusive content for subscribers.</p>
              <button className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors">
                Create New Content
              </button>
            </div>
          )}
          
          {activeTab === 'monetization' && (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4">Monetization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h4 className="font-bold text-white">Subscription Tiers</h4>
                  <p className="text-slate-400 text-sm mt-1">Manage your subscription offerings</p>
                  <button className="mt-3 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                    Manage Tiers
                  </button>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h4 className="font-bold text-white">Payout Settings</h4>
                  <p className="text-slate-400 text-sm mt-1">Configure your payment methods</p>
                  <button className="mt-3 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                    Update Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
