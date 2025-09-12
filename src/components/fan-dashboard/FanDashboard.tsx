import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase/client';
import { ProfileCompletionGuide } from '../ProfileCompletionGuide';

// Import components
import ProfileHeader from './ProfileHeader';
import NavigationTabs from './NavigationTabs';
import StatsCards from './StatsCards';
// FavoriteRacers removed from Fan Dashboard per request
// RecentActivity moved to notifications dropdown in Fanheader
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

// Favorite racers removed

interface ActivityItem {
  id: string;
  type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
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

// Favorite racers removed

interface ActivityData {
  id: string;
  activity_type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
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
  // const [loadingFavorites, setLoadingFavorites] = useState<boolean>(true);
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
  // Favorite racers removed from Fan Dashboard
  // const [favoriteRacers, setFavoriteRacers] = useState<Racer[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Profile guide state (must be declared before any early returns)
  const [showProfileGuide, setShowProfileGuide] = useState<boolean>(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState<number>(0);
  const [hasCheckedProfile, setHasCheckedProfile] = useState<boolean>(false);

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
      // favorites loading removed
      setLoadingActivity(true);
      if (!targetId) {
        // Defer until we have a route id or an authenticated user id
        // Keep loading indicators so the user doesn't need to reload manually
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

      // 2) Stats via lightweight queries (avoid RPC/table pitfalls)
      (async () => {
        try {
          if (!targetId) return;
          // Active subscriptions count (planned count to reduce overhead)
          const { count: subsCount } = await supabase
            .from('fan_connections')
            .select('*', { count: 'planned', head: true })
            .eq('fan_id', targetId)
            .eq('is_subscribed', true);

          // Sum total tips from fan_connections for this user
          const { data: tipsRows } = await supabase
            .from('fan_connections')
            .select('total_tips')
            .eq('fan_id', targetId);
          const totalTips = Array.isArray(tipsRows)
            ? tipsRows.reduce((sum: number, r: any) => sum + (Number(r.total_tips) || 0), 0)
            : 0;

          // Following count (racers this fan follows)
          const { count: followingCount } = await supabase
            .from('fan_connections')
            .select('*', { count: 'planned', head: true })
            .eq('fan_id', targetId);

          // Badges count
          const { count: badgesCount } = await supabase
            .from('fan_badges')
            .select('*', { count: 'planned', head: true })
            .eq('fan_id', targetId);

          // Current streak from fan_streaks (fallback to 0 if missing)
          let streak = 0;
          try {
            const { data: streakRow } = await supabase
              .from('fan_streaks')
              .select('current_streak')
              .eq('fan_id', targetId)
              .maybeSingle();
            streak = Number((streakRow as any)?.current_streak) || 0;
          } catch {
            // keep default 0
          }

          setStats({
            support_points: Number(totalTips) + Number(subsCount || 0) * 10,
            total_tips: Number(totalTips) || 0,
            active_subscriptions: Number(subsCount) || 0,
            activity_streak: streak
          });

          // Also augment local fanProfile counts once loaded
          setFanProfile((prev) => prev ? {
            ...prev,
            favorites_count: Number(followingCount) || 0,
            badges_count: Number(badgesCount) || 0,
          } : prev);
        } finally {
          setLoadingStats(false);
        }
      })();

      // 3) Favorites
      // Favorites section removed from Fan Dashboard

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
            if (!activityError) activityData = (data as ActivityData[] | null) || [];
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
                  type: 'badge',
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
                  racerId: item.racer_id || undefined,
                  racerName: item.racer_name || undefined,
                  amount: item.amount || undefined,
                  badgeName: item.badge_name || undefined,
                  postId: item.post_id || undefined,
                  postContent: item.post_content || undefined,
                  commentContent: item.comment_content || undefined,
                  likes: item.likes || undefined,
                },
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
    // Only load when we have either route id or logged-in user id available
    if (!id && !user?.id) return;
    loadFanProfile();
  }, [id, user?.id, loadFanProfile]);

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle edit profile button click
  const handleEditProfile = () => {
    navigate('/settings/profile');
  };

  // Handle tipping a racer
  // Tip racer functionality removed with Favorite Racers section

  // Handle view all activity button click
  const handleViewAllActivity = () => {
    setActiveTab('activity');
  };

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'Posts', count: 24 },
    // { id: 'activity', label: 'Activity' }, // Commented out activity tab
    { id: 'badges', label: 'Badges', count: fanProfile?.badges_count || 0 }
  ];

  // Determine if we should show a loading state until some data is fetched
  const hasAnyData = Boolean(fanProfile) || recentActivity.length > 0;
  const isLoadingOverall = !hasAnyData && (loadingProfile || loadingStats || loadingActivity);

  // Removed early return to keep hooks order consistent

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === targetId;

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.id) return;
      try {
        // Try to fetch fan profile data; do not block UX or auto-create
        const { data: fp } = await supabase
          .from('fan_profiles')
          .select('location,favorite_classes,favorite_tracks,followed_racers,why_i_love_racing,profile_photo_url')
          .eq('id', user.id)
          .maybeSingle();

        if (fp) {
          const fields = [
            Boolean(fp.location),
            Boolean((fp as any).favorite_classes?.length),
            Boolean((fp as any).favorite_tracks?.length),
            Boolean((fp as any).followed_racers?.length),
            Boolean(fp.why_i_love_racing),
            Boolean(fp.profile_photo_url),
          ];
          const completedCount = fields.filter(Boolean).length;
          const percentage = Math.round((completedCount / fields.length) * 100);
          setProfileCompletionPercentage(percentage);
        } else {
          setProfileCompletionPercentage(0);
        }
      } catch (error) {
        // Non-fatal: keep defaults
      } finally {
        // Do not auto-open the guide; make it optional
        setShowProfileGuide(false);
        setHasCheckedProfile(true);
      }
    };
    checkProfileCompletion();
  }, [user?.id]);
  
  const handleCloseGuide = () => {
    setShowProfileGuide(false);
    // Remember that we've shown the guide
    localStorage.setItem('profile_guide_seen', 'true');
  };

  return (
    <>
      {isLoadingOverall ? (
        <div className="min-h-screen p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800" />
                <div className="flex-1">
                  <div className="w-40 h-4 bg-slate-800 rounded" />
                  <div className="w-24 h-3 bg-slate-800 rounded mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-800/60 h-16 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Sections skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
                    <div className="w-2/3 h-4 bg-slate-800 rounded mb-3" />
                    <div className="w-full h-24 bg-slate-800/70 rounded" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
                    <div className="w-1/2 h-4 bg-slate-800 rounded mb-3" />
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((__, j) => (
                        <div key={j} className="h-8 bg-slate-800/70 rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        fanProfile ? (
          <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-6">
              <ProfileHeader
                fanProfile={{
                  ...fanProfile!,
                  points: stats.support_points,
                  streak_days: stats.activity_streak,
                  favorites_count: fanProfile?.favorites_count ?? 0,
                  badges_count: fanProfile?.badges_count ?? 0,
                  total_tips: stats.total_tips,
                  active_subscriptions: stats.active_subscriptions,
                }}
                isOwnProfile={isOwnProfile}
                onEditProfile={handleEditProfile}
                profileCompletionPercentage={profileCompletionPercentage}
              />

              <div className="mt-6">
                <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
              </div>

              <div className="py-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    <div className="space-y-6">
                      <StatsCards 
                        supportPoints={stats.support_points}
                        totalTips={stats.total_tips}
                        activeSubscriptions={stats.active_subscriptions}
                        activityStreak={stats.activity_streak}
                        loading={loadingStats}
                      />
                      {/* RecentActivity removed: now available via the notifications dropdown */}
                    </div>
                  </div>
                )}
                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {isOwnProfile && (
                      <PersonalPost fanId={targetId || ''} />
                    )}
                  </div>
                )}
                {activeTab === 'badges' && (
                  <div className="text-center text-gray-400 py-10">
                    Coming Soon: Badges will be displayed here!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-white mb-2">Welcome to your Fan Dashboard</h2>
            <p className="text-gray-400">We couldn't load a fan profile. If you just signed up, complete your profile in Settings.</p>
            {isOwnProfile && hasCheckedProfile && user?.id && (
              <div className="mt-6">
                <ProfileCompletionGuide userId={user.id} onClose={handleCloseGuide} />
              </div>
            )}
          </div>
        )
      )}
      {/* Profile guide is optional; consider showing a small banner elsewhere instead */}
    </>
  );
};

export default FanDashboard;
