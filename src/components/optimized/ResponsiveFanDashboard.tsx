import React, { useState, useEffect } from 'react';
import { Heart, Bell, CreditCard, TrendingUp, Star, MessageCircle, Calendar, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

interface DashboardStats {
  activeSubscriptions: number;
  monthlySpending: number;
  totalTipsGiven: number;
  totalActivity: number;
}

interface FanSubscription {
  id: string;
  racerId: string;
  racerName: string;
  racerImage: string;
  carNumber: string;
  racingClass: string;
  subscriptionTier: string;
  monthlyAmount: number;
  nextBilling: string;
  totalTipped: number;
  subscribedAt: string;
}

interface FanActivity {
  id: string;
  type: 'gift' | 'like' | 'tip' | 'comment';
  action: string;
  date: string;
  amount?: number;
}

export const ResponsiveFanDashboard: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('feeds');
  const [subscriptions, setSubscriptions] = useState<FanSubscription[]>([]);
  const [activity, setActivity] = useState<FanActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeSubscriptions: 0,
    monthlySpending: 0,
    totalTipsGiven: 0,
    totalActivity: 0
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'gift': return '🎁';
      case 'like': return '❤️';
      case 'tip': return '💰';
      case 'comment': return '💬';
      default: return '📝';
    }
  };

  // Calculate percentage changes (mock data for demo)
  const subscriptionsChange = stats.activeSubscriptions > 0 ? 8.2 : 0;
  const spendingChange = stats.monthlySpending > 0 ? 12.5 : 0;
  const tipsChange = stats.totalTipsGiven > 0 ? 15.7 : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading fan dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header - Responsive Flex Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold italic mb-1">
              Hi {user?.name || 'Fan'}
            </h1>
            <p className="text-sm text-gray-400">Welcome to your dashboard</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/settings" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Users className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid with Flexbox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="relative p-2 md:p-3 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 md:px-2 rounded-full text-xs font-semibold bg-red-600 text-white shadow">
                  {stats.activeSubscriptions}
                </span>
              </div>
              {subscriptionsChange > 0 && (
                <div className="text-green-400 text-xs md:text-sm flex items-center">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  +{subscriptionsChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-xs md:text-sm font-medium">Active Subscriptions</div>
          </div>

          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="relative p-2 md:p-3 bg-green-600/20 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 md:px-2 rounded-full text-xs font-semibold bg-green-600 text-white shadow">
                  ${stats.monthlySpending}
                </span>
              </div>
              {spendingChange > 0 && (
                <div className="text-green-400 text-xs md:text-sm flex items-center">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  +{spendingChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-xs md:text-sm font-medium">Monthly Spending</div>
          </div>

          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="relative p-2 md:p-3 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 md:px-2 rounded-full text-xs font-semibold bg-purple-600 text-white shadow">
                  {stats.totalTipsGiven}
                </span>
              </div>
              {tipsChange > 0 && (
                <div className="text-green-400 text-xs md:text-sm flex items-center">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  +{tipsChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-xs md:text-sm font-medium">Total Tips Given</div>
          </div>
        </div>

        {/* Mobile Icon Tabs - Flex Layout */}
        <div className="md:hidden mb-6">
          <div className="flex bg-gray-900 p-2 rounded-xl overflow-x-auto">
            {[
              { key: 'feeds', icon: MessageCircle, label: 'Feeds' },
              { key: 'subscriptions', icon: Heart, label: 'Subs' },
              { key: 'activity', icon: TrendingUp, label: 'Activity' },
              { key: 'payments', icon: CreditCard, label: 'Payments' },
              { key: 'notifications', icon: Bell, label: 'Alerts' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center justify-center space-y-1 py-3 px-4 min-w-0 flex-shrink-0 rounded-lg transition-all ${
                  activeTab === key
                    ? 'bg-fedex-orange/20 text-fedex-orange'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Tabs - Flex Layout */}
        <div className="hidden md:flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
          {['feeds', 'subscriptions', 'activity', 'payments', 'notifications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area - Responsive Flex Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 lg:flex-[2]">
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="bg-transparent md:bg-gray-900 rounded-xl p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">My Subscriptions</h3>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-200 md:bg-gray-700">
                      {subscriptions.length}
                    </span>
                  </div>
                  
                  {subscriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No Subscriptions Yet</h4>
                      <p className="text-gray-500 mb-4">Start supporting your favorite racers!</p>
                      <Link
                        to="/racers"
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Browse Racers
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {subscriptions.map((subscription) => (
                        <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={subscription.racerImage}
                              alt={subscription.racerName}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div>
                              <h4 className="font-semibold text-white">{subscription.racerName}</h4>
                              <p className="text-sm text-gray-400">#{subscription.carNumber} • {subscription.racingClass}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-400">${subscription.monthlyAmount}/mo</p>
                            <p className="text-xs text-gray-500">Next: {subscription.nextBilling}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-transparent md:bg-gray-900 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  
                  {activity.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No Activity Yet</h4>
                      <p className="text-gray-500">Your interactions will show up here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activity.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg">
                          <span className="text-lg">{getActivityIcon(item.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300">{item.action}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(item.date)}</p>
                          </div>
                          {item.amount && (
                            <span className="text-sm font-semibold text-green-400">${item.amount}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Default content for other tabs */}
            {!['subscriptions', 'activity'].includes(activeTab) && (
              <div className="bg-gray-900 rounded-xl p-6 text-center">
                <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon
                </h3>
                <p className="text-gray-500">This feature is being developed</p>
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:w-80">
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/racers"
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium">Find New Racers</span>
                  </div>
                </Link>
                <Link
                  to="/grandstand"
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium">View Feed</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveFanDashboard;