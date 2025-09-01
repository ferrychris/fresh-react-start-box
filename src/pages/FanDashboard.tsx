import React, { useState, useEffect } from 'react';
import { Heart, Bell, CreditCard, TrendingUp, Star, MessageCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PostCreator } from '../components/PostCreator';
import { PostCard } from '../components/PostCard';
import Feed from './Feed';
import { 
  getFanSubscriptions, 
  getFanActivity, 
  getFanNotifications,
  getFanStats,
  getFanPosts,
  supabase,
  type FanSubscription,
  type FanActivity 
} from '../lib/supabase';

export const FanDashboard: React.FC = () => {
  const { user, setUser, racers } = useApp();
  const [activeTab, setActiveTab] = useState('feeds');
  const [subscriptions, setSubscriptions] = useState<FanSubscription[]>([]);
  const [activity, setActivity] = useState<FanActivity[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    monthlySpending: 0,
    totalTipsGiven: 0,
    totalActivity: 0
  });

  useEffect(() => {
    if (user) {
      loadFanData();
      if (activeTab === 'feeds') {
        loadFanPosts();
      }
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        loadFanData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  const loadFanPosts = async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      const fanPosts = await getFanPosts();
      setPosts(fanPosts);
    } catch (error) {
      console.error('Error loading fan posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadFanData = async () => {
    if (!user) return;
    
    try {
      // Load fan subscriptions
      const { data: fanConnections, error: connectionsError } = await supabase
        .from('fan_connections')
        .select(`
          *,
          racer_profiles!inner(
            id,
            username,
            profile_photo_url,
            car_number,
            racing_class,
            profiles!inner(
              name,
              avatar
            )
          )
        `)
        .eq('fan_id', user.id)
        .eq('is_subscribed', true);

      if (connectionsError) {
        console.error('Error loading fan connections:', connectionsError);
        setSubscriptions([]);
      } else {
        const formattedSubscriptions = (fanConnections || []).map(connection => ({
          id: connection.id,
          racerId: connection.racer_id,
          racerName: connection.racer_profiles?.profiles?.name || connection.racer_profiles?.username || 'Unknown Racer',
          racerImage: connection.racer_profiles?.profiles?.avatar || connection.racer_profiles?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${connection.racer_profiles?.profiles?.name || 'Racer'}`,
          carNumber: connection.racer_profiles?.car_number || 'TBD',
          racingClass: connection.racer_profiles?.racing_class || 'Racing',
          subscriptionTier: 'Supporter', // Default tier
          monthlyAmount: 19, // Default amount
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          totalTipped: connection.total_tips || 0,
          subscribedAt: connection.became_fan_at
        }));
        setSubscriptions(formattedSubscriptions);
      }

      // Load fan activity from gift transactions and post interactions
      const { data: giftTransactions, error: giftsError } = await supabase
        .from('gift_transactions')
        .select(`
          *,
          racer_profiles!gift_transactions_receiver_id_fkey(
            username,
            profile_photo_url,
            profiles!inner(
              name
            )
          )
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (giftsError) {
        console.error('Error loading gift transactions:', giftsError);
      }

      // Load post interactions
      const { data: postInteractions, error: interactionsError } = await supabase
        .from('post_interactions')
        .select(`
          *,
          racer_posts!inner(
            racer_id,
            racer_profiles!inner(
              username,
              profile_photo_url,
              profiles!inner(
                name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError) {
        console.error('Error loading post interactions:', interactionsError);
      }

      // Combine and format activity
      const combinedActivity = [];
      
      // Add gift transactions
      if (giftTransactions) {
        giftTransactions.forEach(gift => {
          combinedActivity.push({
            id: `gift_${gift.id}`,
            type: 'gift',
            action: `Sent gift to ${gift.racer_profiles?.profiles?.name || gift.racer_profiles?.username || 'Unknown Racer'}`,
            date: gift.created_at,
            amount: gift.token_amount
          });
        });
      }

      // Add post interactions
      if (postInteractions) {
        postInteractions.forEach(interaction => {
          let actionText = '';
          switch (interaction.interaction_type) {
            case 'like':
              actionText = `Liked ${interaction.racer_posts?.racer_profiles?.profiles?.name || interaction.racer_posts?.racer_profiles?.username || 'Unknown Racer'}'s post`;
              break;
            case 'tip':
              actionText = `Tipped ${interaction.racer_posts?.racer_profiles?.profiles?.name || interaction.racer_posts?.racer_profiles?.username || 'Unknown Racer'} $${interaction.tip_amount || 0}`;
              break;
            case 'comment':
              actionText = `Commented on ${interaction.racer_posts?.racer_profiles?.profiles?.name || interaction.racer_posts?.racer_profiles?.username || 'Unknown Racer'}'s post`;
              break;
          }
          
          combinedActivity.push({
            id: `interaction_${interaction.id}`,
            type: interaction.interaction_type,
            action: actionText,
            date: interaction.created_at,
            amount: interaction.tip_amount
          });
        });
      }

      // Sort by date and take most recent
      combinedActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(combinedActivity.slice(0, 10));

      // Calculate stats from real data
      const activeSubscriptionsCount = fanConnections?.length || 0;
      const monthlySpendingAmount = fanConnections?.reduce((sum, conn) => sum + 19, 0) || 0; // Default $19 per subscription
      const totalTipsAmount = fanConnections?.reduce((sum, conn) => sum + (conn.total_tips || 0), 0) || 0;
      const totalActivityCount = combinedActivity.length;

      setStats({
        activeSubscriptions: activeSubscriptionsCount,
        monthlySpending: monthlySpendingAmount,
        totalTipsGiven: totalTipsAmount,
        totalActivity: totalActivityCount
      });

      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsError) {
        console.error('Error loading notifications:', notificationsError);
        setNotifications([]);
      } else {
        setNotifications(notificationsData || []);
      }

    } catch (error) {
      console.error('Error loading fan data:', error);
      // Set default values on error
      setSubscriptions([]);
      setActivity([]);
      setNotifications([]);
      setStats({
        activeSubscriptions: 0,
        monthlySpending: 0,
        totalTipsGiven: 0,
        totalActivity: 0
      });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-start mb-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold italic mb-1">Hi {user?.name || user?.username}</h1>
          </div>
          
        </div>

        {/* Stats Cards - single row on all breakpoints */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative p-3 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white shadow">
                  {stats.activeSubscriptions}
                </span>
              </div>
              {subscriptionsChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{subscriptionsChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-sm">Active Subscriptions</div>
          </div>

          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative p-3 bg-green-600/20 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-500" />
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600 text-white shadow">
                  ${stats.monthlySpending}
                </span>
              </div>
              {spendingChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{spendingChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-sm">Monthly Spending</div>
          </div>

          <div className="bg-gray-900/40 md:bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative p-3 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-600 text-white shadow">
                  {stats.totalTipsGiven}
                </span>
              </div>
              {tipsChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{tipsChange}%
                </div>
              )}
            </div>
            <div className="text-gray-400 text-sm">Total Tips Given</div>
          </div>
        </div>

        {/* Mobile Icon Tabs */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-5 gap-2 bg-gray-900 p-2 rounded-xl">
            <button
              onClick={() => setActiveTab('feeds')}
              className={`flex flex-col items-center justify-center space-y-1 py-3 rounded-lg transition-all ${
                activeTab === 'feeds'
                  ? 'bg-fedex-orange/20 text-fedex-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              aria-label="Feeds"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[11px] font-medium">Feeds</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex flex-col items-center justify-center space-y-1 py-3 rounded-lg transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-fedex-orange/20 text-fedex-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              aria-label="Subscriptions"
            >
              <Heart className="h-5 w-5" />
              <span className="text-[11px] font-medium">Subs</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex flex-col items-center justify-center space-y-1 py-3 rounded-lg transition-all ${
                activeTab === 'activity'
                  ? 'bg-fedex-orange/20 text-fedex-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              aria-label="Activity"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-[11px] font-medium">Activity</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex flex-col items-center justify-center space-y-1 py-3 rounded-lg transition-all ${
                activeTab === 'payments'
                  ? 'bg-fedex-orange/20 text-fedex-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              aria-label="Payments"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-[11px] font-medium">Payments</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex flex-col items-center justify-center space-y-1 py-3 rounded-lg transition-all ${
                activeTab === 'notifications'
                  ? 'bg-fedex-orange/20 text-fedex-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="text-[11px] font-medium">Alerts</span>
            </button>
          </div>
        </div>

        {/* Desktop Tabs */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">My Subscriptions</h3>
                    <span
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-200 md:bg-gray-700"
                      aria-label={`Total subscriptions: ${subscriptions.length}`}
                    >
                      {subscriptions.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                            <div className="h-20 bg-gray-700"></div>
                            <div className="p-4 pt-10">
                              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                              <div className="flex space-x-2">
                                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : subscriptions.length > 0 ? (
                      subscriptions.map(subscription => (
                        <div key={subscription.id} className="bg-transparent md:bg-gray-800 rounded-lg overflow-hidden">
                          {/* Header Photo */}
                          <div className="relative h-20 bg-gradient-to-r from-fedex-purple to-fedex-orange">
                            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                            <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                              <img
                                src={subscription.racerImage}
                                alt={subscription.racerName}
                                className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                              />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 pt-10">
                            <div className="flex flex-col space-y-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-lg text-white mb-1">{subscription.racerName}</h4>
                                <p className="text-sm text-gray-400 mb-2">#{subscription.carNumber} • {subscription.racingClass}</p>
                                <div className="flex items-center mt-1">
                                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                  <span className="text-sm text-gray-400">{subscription.subscriptionTier} Tier</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-400">
                                    ${subscription.monthlyAmount}/mo
                                  </div>
                                  <div className="text-sm text-gray-400">Next billing: {subscription.nextBilling}</div>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2 pt-2">
                                <Link
                                  to={`/racer/${subscription.racerId}`}
                                  className="flex-1 px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-sm font-semibold transition-colors text-center"
                                >
                                  View Profile
                                </Link>
                                <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
                                  Manage
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-transparent md:bg-gray-800 rounded-xl">
                        <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
                        <p className="text-gray-400 mb-6">
                          Start supporting your favorite racers by subscribing to their content!
                        </p>
                        <Link
                          to="/racers"
                          className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                        >
                          Browse Racers
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Racers */}
                <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {racers.filter(r => !subscriptions.some(s => s.racerId === r.id)).slice(0, 4).map(racer => (
                      <div key={racer.id} className="bg-transparent md:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={racer.profilePicture}
                            alt={racer.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-sm">{racer.name}</h4>
                            <p className="text-xs text-gray-400">{racer.class}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{racer.bio}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-400">
                            From ${racer.subscriptionTiers && racer.subscriptionTiers.length > 0 ? racer.subscriptionTiers[0].price : 9}/mo
                          </span>
                          <Link
                            to={`/racer/${racer.id}`}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                          >
                            Subscribe
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feeds' && (
              <div className="space-y-6">
                <Feed />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center space-x-4 p-3 bg-transparent md:bg-gray-800 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activity.length > 0 ? (
                    activity.map((activityItem) => (
                      <div key={activityItem.id} className="flex items-center space-x-4 p-3 bg-transparent md:bg-gray-800 rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activityItem.type === 'gift' ? 'bg-pink-600/20' :
                          activityItem.type === 'tip' ? 'bg-green-600/20' :
                          activityItem.type === 'like' ? 'bg-red-600/20' : 'bg-blue-600/20'
                        }`}>
                          <span className="text-lg">{getActivityIcon(activityItem.type)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activityItem.action}</p>
                          <p className="text-sm text-gray-400">{formatTimeAgo(activityItem.date)}</p>
                        </div>
                        {activityItem.amount && (
                          <div className="text-green-400 font-semibold">
                            {activityItem.type === 'gift' ? `${activityItem.amount} tokens` : `$${activityItem.amount}`}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                      <p className="text-gray-400 mb-6">
                        Start interacting with racers to see your activity here!
                      </p>
                      <Link
                        to="/feed"
                        className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                      >
                        Explore Feed
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-transparent md:bg-gray-800 rounded-lg animate-pulse">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                          <div className="h-6 bg-gray-700 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : subscriptions.length > 0 ? (
                    subscriptions.map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between p-4 bg-transparent md:bg-gray-800 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{subscription.racerName}</h4>
                          <p className="text-sm text-gray-400">Monthly subscription - {subscription.subscriptionTier}</p>
                          <p className="text-sm text-gray-400">Next billing: {subscription.nextBilling}</p>
                        </div>
                        <div className="text-green-400 font-bold">${subscription.monthlyAmount}/mo</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400">
                      <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                      <p className="text-gray-400 mb-6">
                        Your payment history will appear here once you start supporting racers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-3 bg-transparent md:bg-gray-800 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-3 bg-transparent md:bg-gray-800 rounded-lg">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-sm text-gray-400">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                      <p className="text-gray-400">
                        You'll receive notifications here when racers you follow post new content.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="p-3 bg-transparent md:bg-gray-800 rounded-lg">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-sm text-gray-400">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                View All
              </button>
            </div>

            {/* Upcoming Races */}
            <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Races</h3>
              <div className="space-y-3">
                {subscriptions.slice(0, 3).map(subscription => (
                  <div key={subscription.id} className="p-3 bg-transparent md:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={subscription.racerImage}
                        alt={subscription.racerName}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="font-medium text-sm">{subscription.racerName}</span>
                    </div>
                    <div className="text-sm text-red-400">Feb 15 - Winter Nationals</div>
                    <div className="text-xs text-gray-400">Eldora Speedway</div>
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Subscribe to racers to see their upcoming races</p>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                <Calendar className="inline h-4 w-4 mr-2" />
                View Calendar
              </button>
            </div>

            {/* Quick Support */}
            <div className="bg-transparent md:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Tip</h3>
              <p className="text-sm text-gray-400 mb-4">Send a quick tip to your favorite racer</p>
              <select className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mb-4">
                <option>Select a racer...</option>
                {subscriptions.map(subscription => (
                  <option key={subscription.id} value={subscription.racerId}>{subscription.racerName}</option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[5, 10, 25].map(amount => (
                  <button
                    key={amount}
                    className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <button 
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                disabled={subscriptions.length === 0}
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};