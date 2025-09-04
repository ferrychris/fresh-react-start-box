import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase/client';

// Import components
import ProfileHeader from './ProfileHeader';
import NavigationTabs from './NavigationTabs';
import StatsCards from './StatsCards';
import FavoriteRacers from './FavoriteRacers';
import RecentActivity from './RecentActivity';
import PersonalPost from './posts/PersonalPost';

// Define types for our data structures
interface FanProfile {
  id: string;
  username?: string;
  name: string;
  avatar_url?: string;
  avatar?: string | null;
  banner_image?: string | null;
  fan_type?: string;
  user_type?: string;
  created_at: string;
  points?: number;
  streak_days?: number;
  favorites_count?: number;
  badges_count?: number;
  email: string;
  profile_complete: boolean;
  updated_at: string;
  avatars?: string | null;
}

// Minimal PostgREST error shape for code inspection
interface PostgrestErrorLike {
  code?: string;
}

interface FanStats {
  support_points: number;
  total_tips: number;
  active_subscriptions: number;
  activity_streak: number;
}

interface Racer {
  id: string;
  name: string;
  avatarUrl: string;
  flag: string;
  lastTipped: string | null;
  totalTipped: number;
  subscription: string | null;
  nextRace: {
    track: string;
    date: string;
  };
}

interface ActivityItem {
  id: string;
  type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment' | 'welcome';
  timestamp: string;
  timeAgo: string;
  content: string;
  metadata: {
    racerId?: string;
    racerName?: string;
    amount?: number;
    badgeName?: string;
    postId?: string;
    postContent?: string;
    commentContent?: string;
    likes?: number;
  };
}

interface RacerData {
  racer_id: string;
  racer_profiles: {
    username: string | null;
    profile_photo_url: string | null;
    country: string | null;
  };
  last_tipped: string | null;
  total_tipped: number;
  subscription_tier: string | null;
}

interface ActivityData {
  id: string;
  activity_type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment' | 'welcome';
  created_at: string;
  content: string;
  racer_id?: string;
  racer_name?: string;
  amount?: number;
  badge_name?: string;
  post_id?: string;
  post_content?: string;
  comment_content?: string;
  likes?: number;
}

const FanDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const targetId = id || user?.id || null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(true);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('overview');
  // If we have a route param id, we're on the read-only preview route
  const isPreviewRoute = Boolean(id);
  
  // Fan data
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [stats, setStats] = useState<FanStats>({
    support_points: 0,
    total_tips: 0,
    active_subscriptions: 0,
    activity_streak: 0
  });
  
  // Favorite racers and activity
  const [favoriteRacers, setFavoriteRacers] = useState<Racer[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  const loadFanProfile = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProfile(true);
      setLoadingStats(true);
      setLoadingFavorites(true);
      setLoadingActivity(true);
      if (!targetId) {
        // No route id and no logged-in user; show empty state instead of hanging
        setFanProfile(null);
        setFavoriteRacers([]);
        setRecentActivity([]);
        setStats({ support_points: 0, total_tips: 0, active_subscriptions: 0, activity_streak: 0 });
        setLoading(false);
        setLoadingProfile(false);
        setLoadingStats(false);
        setLoadingFavorites(false);
        setLoadingActivity(false);
        return;
      }
      // Start all fetches in parallel; update sections independently as they resolve
      // 1) Profile and banner
      (async () => {
        try {
          const { data: fanData, error: fanError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          if (fanError) throw fanError;
          if (fanData) {
            setFanProfile({
              ...fanData,
              username: fanData.name || 'user',
              avatar_url: fanData.avatar || fanData.avatars || '',
              fan_type: fanData.user_type || 'Racing Fan',
              points: 0,
              streak_days: 0,
              favorites_count: 0,
              badges_count: 0
            });
          }
          // Banner resolution (best-effort)
          let resolvedBanner: string | null = null;
          try {
            const { data: racerData, error: racerError } = await supabase
              .from('racer_profiles')
              .select('banner_photo_url, car_photos')
              .eq('id', targetId)
              .maybeSingle();
            if (!racerError && racerData) {
              if (racerData.banner_photo_url && typeof racerData.banner_photo_url === 'string') {
                resolvedBanner = racerData.banner_photo_url;
              } else if (racerData.car_photos) {
                const carPhotos = racerData.car_photos as Array<{ url?: string } | string>;
                if (Array.isArray(carPhotos) && carPhotos.length > 0) {
                  const firstPhoto = carPhotos[0];
                  const url = typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url;
                  if (url && typeof url === 'string') resolvedBanner = url;
                }
              }
            }
          } catch (racerError: unknown) {
            const errorMsg = racerError instanceof Error ? racerError.message : 'Unknown error';
            console.log('Could not fetch racer profile or banner photo:', errorMsg);
          }
          if (!resolvedBanner && fanData?.banner_image && typeof fanData.banner_image === 'string') {
            resolvedBanner = fanData.banner_image;
          }
          if (resolvedBanner) setBannerImage(resolvedBanner);
        } catch (e) {
          console.error('Error loading fan profile:', e);
        } finally {
          setLoadingProfile(false);
          setLoading(false); // allow page render as soon as profile attempt finishes
        }
      })();

      // 2) Stats
      (async () => {
        try {
          let statsData = null;
          try {
            const { data, error: statsError } = await supabase
              .from('fan_stats')
              .select('*')
              .eq('fan_id', targetId)
              .maybeSingle();
            const errCode = (statsError as PostgrestErrorLike | null | undefined)?.code;
            if (!statsError || errCode === 'PGRST116') {
              statsData = data;
            }
          } catch (statsError: unknown) {
            const errorMsg = statsError instanceof Error ? statsError.message : 'Unknown error';
            console.log('Fan stats table may not exist yet:', errorMsg);
          }
          setStats({
            support_points: statsData?.support_points || 0,
            total_tips: statsData?.total_tips || 0,
            active_subscriptions: statsData?.active_subscriptions || 0,
            activity_streak: statsData?.activity_streak || 0
          });
          if (!statsData) console.log('No stats data found or table missing, using default values');
        } finally {
          setLoadingStats(false);
        }
      })();

      // 3) Favorites
      (async () => {
        try {
          let racersData: RacerData[] = [];
          try {
            const { data, error: racersError } = await supabase
              .from('fan_favorite_racers')
              .select(`
                racer_id,
                racer_profiles!fan_favorite_racers_racer_id_fkey (username, profile_photo_url, country),
                last_tipped,
                total_tipped,
                subscription_tier
              `)
              .eq('fan_id', targetId)
              .order('total_tipped', { ascending: false })
              .limit(5);
            if (!racersError) racersData = data || [];
          } catch (racersError: unknown) {
            const errorMsg = racersError instanceof Error ? racersError.message : 'Unknown error';
            console.log('Fan favorite racers table may not exist yet:', errorMsg);
          }
          if (racersData.length === 0) {
            if (user?.id === targetId) {
              setFavoriteRacers([
                {
                  id: 'placeholder-1',
                  name: 'Add Your First Favorite Racer',
                  avatarUrl: '/default-avatar.png',
                  flag: '/default-flag.png',
                  lastTipped: null,
                  totalTipped: 0,
                  subscription: 'None',
                  nextRace: { track: 'Unknown', date: 'Unknown' }
                }
              ]);
            } else {
              setFavoriteRacers([]);
            }
          } else {
            const formattedRacers = racersData.map((item: RacerData) => ({
              id: item.racer_id,
              name: item.racer_profiles?.username || 'Unknown Racer',
              avatarUrl: item.racer_profiles?.profile_photo_url || '/default-avatar.png',
              flag: item.racer_profiles?.country || '/default-flag.png',
              lastTipped: item.last_tipped ? (new Date(item.last_tipped).toLocaleDateString() as string | null) : null,
              totalTipped: item.total_tipped || 0,
              subscription: item.subscription_tier || 'None',
              nextRace: { track: 'Unknown', date: 'Unknown' }
            }));
            setFavoriteRacers(formattedRacers);
          }
        } finally {
          setLoadingFavorites(false);
        }
      })();

      // 4) Activity
      (async () => {
        try {
          let activityData: ActivityData[] = [];
          try {
            const { data, error: activityError } = await supabase
              .from('fan_activity')
              .select('*')
              .eq('fan_id', targetId)
              .order('created_at', { ascending: false })
              .limit(5);
            if (!activityError) activityData = data || [];
          } catch (activityError: unknown) {
            const errorMsg = activityError instanceof Error ? activityError.message : 'Unknown error';
            console.log('Fan activity table may not exist yet:', errorMsg);
          }
          let formattedActivity: ActivityItem[] = [];
          if (activityData.length === 0) {
            if (user?.id === targetId) {
              formattedActivity = [
                {
                  id: 'placeholder-1',
                  type: 'welcome',
                  timestamp: new Date().toISOString(),
                  timeAgo: 'just now',
                  content: '',
                  metadata: {
                    racerId: null,
                    racerName: null,
                    amount: null,
                    badgeName: 'Welcome to OnlyRaceFans',
                    postId: null,
                    postContent: null,
                    commentContent: null,
                    likes: null
                  }
                }
              ];
            }
          } else {
            formattedActivity = activityData.map((item: ActivityData) => {
              const timeAgo = getTimeAgo(new Date(item.created_at));
              return {
                id: item.id,
                type: item.activity_type,
                timestamp: item.created_at,
                timeAgo,
                content: item.content || '',
                metadata: {
                  racerId: item.racer_id,
                  racerName: item.racer_name,
                  amount: item.amount,
                  badgeName: item.badge_name,
                  postId: item.post_id,
                  postContent: item.post_content,
                  commentContent: item.comment_content,
                  likes: item.likes
                }
              };
            });
          }
          setRecentActivity(formattedActivity);
        } finally {
          setLoadingActivity(false);
        }
      })();
    } catch (error) {
      console.error('Error loading fan profile:', error);
      // If we at least have the fan profile data, we can still render the page
      // with default values for other sections
    } finally {
      setLoading(false);
    }
  }, [targetId, user?.id]);

  useEffect(() => {
    // Load when we have either route id or logged-in user id
    loadFanProfile();
  }, [loadFanProfile]);

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle edit profile button click
  const handleEditProfile = () => {
    navigate('/settings/profile');
  };

  // Handle tipping a racer
  const handleTipRacer = (racerId: string, amount: number) => {
    try {
      // Implement tip functionality
      console.log(`Tipping racer ${racerId} with $${amount}`);
      
      // Update the UI optimistically
      const updatedRacers = favoriteRacers.map(racer => {
        if (racer.id === racerId) {
          return {
            ...racer,
            lastTipped: new Date().toLocaleDateString(),
            totalTipped: racer.totalTipped + amount
          };
        }
        return racer;
      });
      
      setFavoriteRacers(updatedRacers);
      
      // Add to recent activity
      const racerName = favoriteRacers.find(r => r.id === racerId)?.name || 'Unknown Racer';
      
      const newActivity = {
        id: `temp-${Date.now()}`,
        type: 'tip' as const,
        timestamp: new Date().toISOString(),
        timeAgo: 'just now',
        content: '',
        metadata: {
          racerId,
          racerName,
          amount
        }
      };
      
      setRecentActivity([newActivity, ...recentActivity.slice(0, 4)]);
      
      // Update stats
      setStats({
        ...stats,
        total_tips: stats.total_tips + amount
      });
      
      // Save to database (would be implemented in a real app)
    } catch (error) {
      console.error('Error tipping racer:', error);
    }
  };

  // Handle view all activity button click
  const handleViewAllActivity = () => {
    setActiveTab('activity');
  };

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'Posts', count: 24 },
    { id: 'racers', label: 'Supported Racers', count: favoriteRacers.length },
    { id: 'activity', label: 'Activity' },
    { id: 'badges', label: 'Badges', count: fanProfile?.badges_count || 0 }
  ];

  // Only block the entire page if we haven't even attempted to load the profile yet
  if (loading && loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!fanProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Welcome to your Fan Dashboard</h2>
        <p className="text-gray-400">We couldn't load a fan profile. If you just signed up, complete your profile in Settings.</p>
      </div>
    );
  }

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === targetId;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Profile header */}
      {loadingProfile ? (
        <div className="relative w-full" aria-hidden="true">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl mx-4 sm:mx-6 lg:mx-8 animate-pulse">
            <div className="h-64 sm:h-72 lg:h-80 bg-gray-800/70" />
            <div className="relative pt-16 sm:pt-20 lg:pt-24 pb-8 px-6 sm:px-8 lg:px-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
                <div>
                  <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-8 sm:h-10 w-48 sm:w-64 bg-gray-700 rounded mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 bg-gray-700 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center w-1/2 sm:w-auto">
                    <div className="w-8 h-8 bg-gray-700 rounded mx-auto mb-2" />
                    <div className="h-6 w-16 bg-gray-700 rounded mx-auto mb-1" />
                    <div className="h-3 w-20 bg-gray-800 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProfileHeader
          name={fanProfile.name || 'Racing Fan'}
          username={fanProfile.username || 'user'}
          avatarUrl={fanProfile.avatar_url || fanProfile.avatar || 'https://placehold.co/150'}
          bannerImageUrl={fanProfile?.banner_image || bannerImage || undefined}
          memberSince={new Date(fanProfile.created_at).toLocaleDateString()}
          fanType={fanProfile.fan_type || 'Racing Fan'}
          points={stats.support_points}
          dayStreak={stats.activity_streak}
          favorites={favoriteRacers.length}
          badges={fanProfile.badges_count || 0}
          onEditProfile={!isPreviewRoute && isOwnProfile ? handleEditProfile : undefined}
          onPreviewProfile={!isPreviewRoute && isOwnProfile && targetId ? () => navigate(`/fan/${targetId}`) : undefined}
        />
      )}
      
      {/* Navigation tabs */}
      <NavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main content with improved spacing and responsive design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced stats cards section */}
            <div className="mb-8">
              {loadingStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-6 shadow-xl animate-pulse">
                      <div className="h-4 w-24 bg-gray-700 rounded mb-3" />
                      <div className="h-8 w-20 bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <StatsCards
                  supportPoints={stats.support_points}
                  totalTips={stats.total_tips}
                  activeSubscriptions={stats.active_subscriptions}
                  activityStreak={stats.activity_streak}
                />
              )}
            </div>
            
            {/* Improved responsive layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Favorite racers section with better styling */}
              <div className="xl:col-span-2">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-6 shadow-xl">
                  {loadingFavorites ? (
                    <div className="space-y-4" aria-hidden="true">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-700" />
                          <div className="flex-1">
                            <div className="h-4 w-40 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-24 bg-gray-800 rounded" />
                          </div>
                          <div className="h-8 w-20 bg-gray-700 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <FavoriteRacers
                      racers={favoriteRacers}
                      onTip={handleTipRacer}
                    />
                  )}
                </div>
              </div>
              
              {/* Recent activity with premium styling */}
              <div className="xl:col-span-1">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-6 shadow-xl">
                  {loadingActivity ? (
                    <div className="space-y-4" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                          <div className="flex-1">
                            <div className="h-3 w-32 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-800 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RecentActivity
                      activities={recentActivity}
                      onViewAllActivity={handleViewAllActivity}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'posts' && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-6 shadow-xl">
            <PersonalPost fanId={targetId || undefined} />
          </div>
        )}
        
        {activeTab === 'racers' && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-8 shadow-xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Supported Racers</h2>
              <p className="text-gray-400 max-w-md mx-auto">Your complete list of supported racers and subscription details will appear here.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-8 shadow-xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Activity History</h2>
              <p className="text-gray-400 max-w-md mx-auto">Your complete activity timeline including tips, posts, and interactions will be displayed here.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'badges' && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-3xl p-8 shadow-xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Achievement Badges</h2>
              <p className="text-gray-400 max-w-md mx-auto">Your earned badges and achievements for being an outstanding racing fan will be showcased here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FanDashboard;
