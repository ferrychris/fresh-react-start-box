import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase/client';
import { ProfileCompletionGuide } from '../ProfileCompletionGuide';

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

interface RacerData {
  racer_id: string;
  racer_profiles: {
    username: string;
    profile_photo_url: string;
    country: string;
  };
  last_tipped: string | null;
  total_tipped: number;
  subscription_tier: string | null;
}

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
      setLoadingFavorites(true);
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

          // Do not query fan_streaks to avoid 400s; default to 0
          const streak = 0;

          setStats({
            support_points: Number(totalTips) + Number(subsCount || 0) * 10,
            total_tips: Number(totalTips) || 0,
            active_subscriptions: Number(subsCount) || 0,
            activity_streak: streak
          });
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
            if (!racersError && data) {
              racersData = data.filter(item => item.racer_profiles).map(item => ({
                ...item,
                racer_profiles: {
                  username: item.racer_profiles?.[0]?.username || 'Unknown',
                  profile_photo_url: item.racer_profiles?.[0]?.profile_photo_url || '/default-avatar.png',
                  country: item.racer_profiles?.[0]?.country || 'Unknown'
                }
              }));
            }
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
              name: item.racer_profiles.username || 'Unknown Racer',
              avatarUrl: item.racer_profiles.profile_photo_url || '/default-avatar.png',
              flag: item.racer_profiles.country || '/default-flag.png',
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

  // Determine if we should show a loading state until some data is fetched
  const hasAnyData = Boolean(fanProfile) || favoriteRacers.length > 0 || recentActivity.length > 0;
  const isLoadingOverall = !hasAnyData && (loadingProfile || loadingStats || loadingFavorites || loadingActivity);

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
            {/* TODO: Render actual fan dashboard content here. This placeholder prevents recursive self-render. */}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-white mb-2">Welcome to your Fan Dashboard</h2>
            <p className="text-gray-400">We couldn't load a fan profile. If you just signed up, complete your profile in Settings.</p>
          </div>
        )
      )}
      {/* Profile guide is optional; consider showing a small banner elsewhere instead */}
    </>
  );
};

export default FanDashboard;
