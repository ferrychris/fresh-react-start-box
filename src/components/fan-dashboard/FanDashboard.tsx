import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../App';
import { supabase } from '../../lib/supabase/client';

// Import components
import ProfileHeader from './ProfileHeader';
import NavigationTabs from './NavigationTabs';
import StatsCards from './StatsCards';
import FavoriteRacers from './FavoriteRacers';
import RecentActivity from './RecentActivity';
import IndexPost from './posts/indexpost';

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
  racers: {
    name: string;
    avatar_url: string;
    country_flag: string;
    next_race_track?: string;
    next_race_date?: string;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
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
      
      // Load fan profile data
      const { data: fanData, error: fanError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fanError) throw fanError;
      
      // Resolve banner image locally to avoid referencing state in dependencies
      let resolvedBanner: string | null = null;
      // Try to fetch banner_photo_url from racer_profiles if it exists
      try {
        const { data: racerData, error: racerError } = await supabase
          .from('racer_profiles')
          .select('banner_photo_url, car_photos')
          .eq('id', id)
          .maybeSingle();
          
        if (!racerError && racerData) {
          // First try to use banner_photo_url if available
          if (racerData.banner_photo_url && typeof racerData.banner_photo_url === 'string') {
            resolvedBanner = racerData.banner_photo_url;
          }
          // If no banner_photo_url, fall back to car_photos
          else if (racerData.car_photos) {
            const carPhotos = racerData.car_photos;
            if (Array.isArray(carPhotos) && carPhotos.length > 0) {
              const firstPhoto = carPhotos[0];
              if (firstPhoto && typeof firstPhoto === 'object' && 'url' in firstPhoto && typeof firstPhoto.url === 'string') {
                resolvedBanner = firstPhoto.url;
              }
            }
          }
        }
      } catch (racerError: unknown) {
        const errorMsg = racerError instanceof Error ? racerError.message : 'Unknown error';
        console.log('Could not fetch racer profile or banner photo:', errorMsg);
        // Continue execution - we'll use default banner
      }
      
      // If no racer banner found, fall back to profile banner_image
      if (!resolvedBanner && fanData?.banner_image && typeof fanData.banner_image === 'string') {
        resolvedBanner = fanData.banner_image;
      }
      
      if (resolvedBanner) {
        setBannerImage(resolvedBanner);
      }
      
      // Load fan stats with error handling for missing table
      let statsData = null;
      try {
        const { data, error: statsError } = await supabase
          .from('fan_stats')
          .select('*')
          .eq('fan_id', id)
          .maybeSingle();
        
        if (!statsError || statsError.code === 'PGRST116') {
          statsData = data;
        }
      } catch (statsError: unknown) {
        const errorMsg = statsError instanceof Error ? statsError.message : 'Unknown error';
        console.log('Fan stats table may not exist yet:', errorMsg);
        // Continue execution - we'll use default values
      }
      
      // Load favorite racers with error handling for missing table
      let racersData = [];
      try {
        const { data, error: racersError } = await supabase
          .from('fan_favorite_racers')
          .select(`
            racer_id,
            racers:racer_id (name, avatar_url, country_flag, next_race_track, next_race_date),
            last_tipped,
            total_tipped,
            subscription_tier
          `)
          .eq('fan_id', id)
          .order('total_tipped', { ascending: false })
          .limit(5);
        
        if (!racersError) {
          racersData = data || [];
        }
      } catch (racersError: unknown) {
        const errorMsg = racersError instanceof Error ? racersError.message : 'Unknown error';
        console.log('Fan favorite racers table may not exist yet:', errorMsg);
        // Continue execution with empty array
      }
      
      // Load recent activity with error handling for missing table
      let activityData = [];
      try {
        const { data, error: activityError } = await supabase
          .from('fan_activity')
          .select('*')
          .eq('fan_id', id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!activityError) {
          activityData = data || [];
        }
      } catch (activityError: unknown) {
        const errorMsg = activityError instanceof Error ? activityError.message : 'Unknown error';
        console.log('Fan activity table may not exist yet:', errorMsg);
        // Continue execution with empty array
      }
      
      // Format the data
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
      
      // Set default stats with more descriptive placeholders if statsData is null
      setStats({
        support_points: statsData?.support_points || 0,
        total_tips: statsData?.total_tips || 0,
        active_subscriptions: statsData?.active_subscriptions || 0,
        activity_streak: statsData?.activity_streak || 0
      });
      
      // Log a message if stats data is missing
      if (!statsData) {
        console.log('No stats data found or table missing, using default values');
      }
      
      // Format favorite racers
      if (racersData.length === 0) {
        console.log('No favorite racers found or table missing, using placeholder data');
        // Only use placeholder data if the user is viewing their own profile
        if (user?.id === id) {
          setFavoriteRacers([
            {
              id: 'placeholder-1',
              name: 'Add Your First Favorite Racer',
              avatarUrl: '/default-avatar.png',
              flag: '/default-flag.png',
              lastTipped: null,
              totalTipped: 0,
              subscription: 'None',
              nextRace: {
                track: 'Unknown',
                date: 'Unknown'
              }
            }
          ]);
        } else {
          setFavoriteRacers([]);
        }
      } else {
        const formattedRacers = racersData.map((item: RacerData) => ({
          id: item.racer_id,
          name: item.racers?.name || 'Unknown Racer',
          avatarUrl: item.racers?.avatar_url || '/default-avatar.png',
          flag: item.racers?.country_flag || '/default-flag.png',
          lastTipped: item.last_tipped ? (new Date(item.last_tipped).toLocaleDateString() as string | null) : null,
          totalTipped: item.total_tipped || 0,
          subscription: item.subscription_tier || 'None',
          nextRace: {
            track: item.racers?.next_race_track || 'Unknown',
            date: item.racers?.next_race_date ? (new Date(item.racers.next_race_date).toLocaleDateString() as string) : 'Unknown'
          }
        }));
        setFavoriteRacers(formattedRacers);
      }
      
      // Format activity
      let formattedActivity = [];
      if (activityData.length === 0) {
        console.log('No activity found or table missing, using placeholder data');
        // Only use placeholder data if the user is viewing their own profile
        if (user?.id === id) {
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
    } catch (error) {
      console.error('Error loading fan profile:', error);
      // If we at least have the fan profile data, we can still render the page
      // with default values for other sections
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (id) {
      loadFanProfile();
    }
  }, [id, loadFanProfile]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!fanProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Fan not found</h2>
        <p className="text-gray-400">The fan profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === id;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Profile header */}
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
        onEditProfile={isOwnProfile ? handleEditProfile : undefined}
      />
      
      {/* Navigation tabs */}
      <NavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main content based on active tab */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <StatsCards
              supportPoints={stats.support_points}
              totalTips={stats.total_tips}
              activeSubscriptions={stats.active_subscriptions}
              activityStreak={stats.activity_streak}
            />
            
            {/* Two-column layout for desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Favorite racers - takes up 2/3 of the space on desktop */}
              <div className="lg:col-span-2">
                <FavoriteRacers
                  racers={favoriteRacers}
                  onTip={handleTipRacer}
                />
              </div>
              
              {/* Recent activity - takes up 1/3 of the space on desktop */}
              <div>
                <RecentActivity
                  activities={recentActivity}
                  onViewAllActivity={handleViewAllActivity}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'posts' && (
          <IndexPost />
        )}
        
        {activeTab === 'racers' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Supported Racers</h2>
            <p className="text-gray-400">Full list of supported racers will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Activity History</h2>
            <p className="text-gray-400">Full activity history will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'badges' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
            <p className="text-gray-400">Earned badges will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FanDashboard;
