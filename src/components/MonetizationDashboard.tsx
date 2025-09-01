import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Gift,
  Heart,
  Eye,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Crown,
  Trophy
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  getRacerEarnings,
  getRacerFanStats,
  getRacerGifts,
  getRacerTransactions,
  type RacerEarnings,
  type FanStats
} from '../lib/supabase';

interface MonetizationDashboardProps {
  racerId: string;
  timeframe?: '7d' | '30d' | '90d' | '1y';
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface RevenueStream {
  name: string;
  amount: number;
  percentage: number;
  trend: number;
  color: string;
}

export const MonetizationDashboard: React.FC<MonetizationDashboardProps> = ({
  racerId,
  timeframe = '30d'
}) => {
  const { user } = useApp();
  const [earnings, setEarnings] = useState<RacerEarnings | null>(null);
  const [fanStats, setFanStats] = useState<FanStats>({ 
    fan_id: user?.id || '', 
    total_tips: 0, 
    active_subscriptions: 0, 
    support_points: 0, 
    activity_streak: 0, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(),
    total_fans: 0, 
    super_fans: 0 
  });
  const [gifts, setGifts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMonetizationData();
  }, [racerId, timeframe]);

  const loadMonetizationData = async () => {
    try {
      const [earningsData, statsData, giftsData, transactionsData] = await Promise.all([
        getRacerEarnings(racerId),
        getRacerFanStats(racerId),
        getRacerGifts(racerId),
        getRacerTransactions(racerId)
      ]);

      setEarnings(earningsData);
      setFanStats(statsData);
      setGifts(giftsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalRevenue = earnings?.total_earnings_cents || 0;
  const monthlyRevenue = Math.round(totalRevenue * 0.3); // Estimate based on recent activity
  const avgRevenuePerFan = fanStats.total_fans > 0 ? totalRevenue / fanStats.total_fans : 0;
  const conversionRate = fanStats.total_fans > 0 ? (fanStats.super_fans / fanStats.total_fans) * 100 : 0;

  const metricCards: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 100).toFixed(2)}`,
      change: 15.7,
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-500',
      description: 'All-time earnings from fans'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(monthlyRevenue / 100).toFixed(2)}`,
      change: 8.3,
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-blue-500',
      description: 'Revenue this month'
    },
    {
      title: 'Total Fans',
      value: fanStats.total_fans,
      change: 12.5,
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-500',
      description: 'Active fan base'
    },
    {
      title: 'Super Fans',
      value: fanStats.super_fans,
      change: 25.0,
      changeType: 'increase',
      icon: Crown,
      color: 'text-yellow-500',
      description: 'High-value supporters'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      change: 5.2,
      changeType: 'increase',
      icon: Target,
      color: 'text-fedex-orange',
      description: 'Fans to super fans'
    },
    {
      title: 'Avg Revenue/Fan',
      value: `$${(avgRevenuePerFan / 100).toFixed(2)}`,
      change: 3.8,
      changeType: 'increase',
      icon: Star,
      color: 'text-pink-500',
      description: 'Revenue per fan'
    }
  ];

  const revenueStreams: RevenueStream[] = [
    {
      name: 'Subscriptions',
      amount: earnings?.subscription_earnings_cents || 0,
      percentage: 45,
      trend: 12.5,
      color: 'bg-blue-500'
    },
    {
      name: 'Tips',
      amount: earnings?.tip_earnings_cents || 0,
      percentage: 35,
      trend: 8.7,
      color: 'bg-green-500'
    },
    {
      name: 'Sponsorships',
      amount: earnings?.sponsorship_earnings_cents || 0,
      percentage: 20,
      trend: 15.3,
      color: 'bg-purple-500'
    }
  ];

  const engagementMetrics = {
    profileViews: 15420,
    postEngagement: 8.7,
    avgSessionTime: '4:32',
    returnVisitorRate: 67.3
  };

  const monetizationOpportunities = [
    {
      title: 'Increase Subscription Tiers',
      description: 'Add a premium tier at $99/month for exclusive content',
      potential: '$2,400/month',
      difficulty: 'Easy',
      priority: 'High'
    },
    {
      title: 'Merchandise Store',
      description: 'Sell branded merchandise to fans',
      potential: '$800/month',
      difficulty: 'Medium',
      priority: 'Medium'
    },
    {
      title: 'Live Stream Events',
      description: 'Host paid live streaming events',
      potential: '$1,200/event',
      difficulty: 'Medium',
      priority: 'High'
    },
    {
      title: 'Coaching Services',
      description: 'Offer one-on-one racing coaching',
      potential: '$150/hour',
      difficulty: 'Hard',
      priority: 'Low'
    }
  ];

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Monetization Analytics</h2>
          <select
            value={timeframe}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((metric, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-700`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className={`flex items-center text-sm ${
                  metric.changeType === 'increase' ? 'text-green-400' : 
                  metric.changeType === 'decrease' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {metric.changeType === 'increase' ? <ArrowUp className="h-3 w-3 mr-1" /> : 
                   metric.changeType === 'decrease' ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        {['overview', 'revenue', 'engagement', 'opportunities'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === tab
                ? 'bg-fedex-orange text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Streams</h3>
            <div className="space-y-4">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${stream.color}`}></div>
                    <span className="text-white">{stream.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      ${(stream.amount / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-400">
                      +{stream.trend}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Profile Views</span>
                <span className="text-white font-semibold">{engagementMetrics.profileViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Post Engagement</span>
                <span className="text-white font-semibold">{engagementMetrics.postEngagement}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Session Time</span>
                <span className="text-white font-semibold">{engagementMetrics.avgSessionTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Return Visitor Rate</span>
                <span className="text-white font-semibold">{engagementMetrics.returnVisitorRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trends</h3>
            <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Revenue analytics chart</p>
                <p className="text-sm">Shows revenue trends over time</p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.transaction_type === 'subscription' ? 'bg-blue-600/20' :
                      transaction.transaction_type === 'tip' ? 'bg-green-600/20' : 'bg-purple-600/20'
                    }`}>
                      {transaction.transaction_type === 'subscription' && <Users className="h-4 w-4 text-blue-400" />}
                      {transaction.transaction_type === 'tip' && <DollarSign className="h-4 w-4 text-green-400" />}
                      {transaction.transaction_type === 'sponsorship' && <Trophy className="h-4 w-4 text-purple-400" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">
                        {transaction.transaction_type}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold">
                    +${(transaction.racer_amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Fan Growth Chart */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Fan Growth Over Time</h3>
            <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>Fan growth analytics chart</p>
                <p className="text-sm">Shows follower acquisition trends</p>
              </div>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Content Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Average Likes per Post</span>
                  <span className="text-white font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Average Comments per Post</span>
                  <span className="text-white font-semibold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Share Rate</span>
                  <span className="text-white font-semibold">12.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Best Performing Content</span>
                  <span className="text-purple-400 font-semibold">Race Videos</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fan Demographics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Primary Age Group</span>
                  <span className="text-white font-semibold">25-34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Top Location</span>
                  <span className="text-white font-semibold">Ohio</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Peak Activity Time</span>
                  <span className="text-white font-semibold">7-9 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Mobile vs Desktop</span>
                  <span className="text-white font-semibold">73% / 27%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Monetization Opportunities */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Growth Opportunities</h3>
            <div className="space-y-4">
              {monetizationOpportunities.map((opportunity, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{opportunity.title}</h4>
                      <p className="text-sm text-gray-400">{opportunity.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      opportunity.priority === 'High' ? 'bg-red-600/20 text-red-400' :
                      opportunity.priority === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {opportunity.priority} Priority
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-green-400 font-semibold">
                      Potential: {opportunity.potential}
                    </div>
                    <div className="text-sm text-gray-400">
                      Difficulty: {opportunity.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Optimization Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Post Consistently</h4>
                  <p className="text-sm text-gray-400">Creators who post 3-5 times per week earn 40% more</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                <Heart className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Engage with Fans</h4>
                  <p className="text-sm text-gray-400">Respond to comments to increase fan loyalty by 60%</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                <Gift className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Exclusive Content</h4>
                  <p className="text-sm text-gray-400">Behind-the-scenes content increases subscription rates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-white font-semibold transition-colors text-left">
            <DollarSign className="h-6 w-6 mb-2" />
            <div>Update Pricing</div>
            <div className="text-sm opacity-80">Optimize subscription tiers</div>
          </button>
          <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors text-left">
            <Users className="h-6 w-6 mb-2" />
            <div>Fan Outreach</div>
            <div className="text-sm opacity-80">Engage with supporters</div>
          </button>
          <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors text-left">
            <Target className="h-6 w-6 mb-2" />
            <div>Set Goals</div>
            <div className="text-sm opacity-80">Define revenue targets</div>
          </button>
        </div>
      </div>
    </div>
  );
};