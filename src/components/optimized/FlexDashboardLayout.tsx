import React from 'react';
import { Heart, TrendingUp, CreditCard, Bell, Users, MessageCircle, Trophy } from 'lucide-react';

interface DashboardStats {
  activeSubscriptions: number;
  monthlySpending: number;
  totalTipsGiven: number;
  totalActivity: number;
}

interface FlexDashboardLayoutProps {
  stats: DashboardStats;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  children: React.ReactNode;
}

export const FlexDashboardLayout: React.FC<FlexDashboardLayoutProps> = ({
  stats,
  activeTab,
  onTabChange,
  userName = 'Fan',
  children
}) => {
  const subscriptionsChange = stats.activeSubscriptions > 0 ? 8.2 : 0;
  const spendingChange = stats.monthlySpending > 0 ? 12.5 : 0;
  const tipsChange = stats.totalTipsGiven > 0 ? 15.7 : 0;

  return (
    <div className="min-h-screen bg-black py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header - Responsive Flex Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold italic mb-1">
              Hi {userName}
            </h1>
            <p className="text-sm text-gray-400">Welcome to your dashboard</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Users className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards - Responsive Flexbox Grid */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mb-8">
          {/* Active Subscriptions */}
          <div className="flex-1 bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6">
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

          {/* Monthly Spending */}
          <div className="flex-1 bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6">
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

          {/* Total Tips */}
          <div className="flex-1 bg-gray-900/40 md:bg-gray-900 rounded-xl p-4 md:p-6">
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

        {/* Mobile Icon Tabs - Flexbox Layout */}
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
                onClick={() => onTabChange(key)}
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

        {/* Desktop Tabs - Flexbox Layout */}
        <div className="hidden md:flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
          {['feeds', 'subscriptions', 'activity', 'payments', 'notifications'].map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
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
            {children}
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop with flex */}
          <div className="hidden lg:flex lg:flex-col lg:w-80 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-col space-y-3">
                <button className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium">Find New Racers</span>
                </button>
                <button className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium">View Feed</span>
                </button>
                <button className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium">Leaderboard</span>
                </button>
              </div>
            </div>

            {/* Recent Activity Quick View */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Tipped $5 to Racer #23</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Subscribed to Team Racing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Earned Support Badge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexDashboardLayout;