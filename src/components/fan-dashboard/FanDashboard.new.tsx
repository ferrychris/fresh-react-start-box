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

  // Profile guide state
  const [showProfileGuide, setShowProfileGuide] = useState<boolean>(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState<number>(0);
  const [hasCheckedProfile, setHasCheckedProfile] = useState<boolean>(false);

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

      // Load fan profile
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
      } catch (e) {
        console.error('Error loading fan profile:', e);
      } finally {
        setLoadingProfile(false);
        setLoading(false);
      }

      // Load stats
      try {
        const { count: subsCount } = await supabase
          .from('fan_connections')
          .select('*', { count: 'planned', head: true })
          .eq('fan_id', targetId)
          .eq('is_subscribed', true);

        const { data: tipsRows } = await supabase
          .from('fan_connections')
          .select('total_tips')
          .eq('fan_id', targetId);
          
        const totalTips = Array.isArray(tipsRows)
          ? tipsRows.reduce((sum: number, r: any) => sum + (Number(r.total_tips) || 0), 0)
          : 0;

        setStats({
          support_points: Number(totalTips) + Number(subsCount || 0) * 10,
          total_tips: Number(totalTips) || 0,
          active_subscriptions: Number(subsCount) || 0,
          activity_streak: 0
        });
      } catch (e) {
        console.error('Error loading stats:', e);
      } finally {
        setLoadingStats(false);
      }

      // Load favorite racers
      try {
        const { data, error: racersError } = await supabase
          .from('fan_connections')
          .select(`
            racer_id,
            total_tips,
            is_subscribed,
            profiles!fan_connections_racer_id_fkey(
              id,
              name,
              avatar,
              user_type
            )
          `)
          .eq('fan_id', targetId)
          .order('total_tips', { ascending: false })
          .limit(5);

        if (!racersError && data) {
          const formattedRacers = data
            .filter(item => item.profiles)
            .map((item: any) => ({
              id: item.racer_id,
              name: item.profiles.name || 'Unknown Racer',
              avatarUrl: item.profiles.avatar || '/default-avatar.png',
              flag: '/default-flag.png',
              lastTipped: null,
              totalTipped: item.total_tips || 0,
              subscription: item.is_subscribed ? 'Active' : 'None',
              nextRace: { track: 'Unknown', date: 'Unknown' }
            }));
          setFavoriteRacers(formattedRacers);
        }
      } catch (e) {
        console.error('Error loading favorite racers:', e);
      } finally {
        setLoadingFavorites(false);
      }

      // Load recent activity
      try {
        const activities = [];
        if (user?.id === targetId) {
          activities.push({
            id: 'welcome-1',
            type: 'badge' as const,
            timestamp: new Date().toISOString(),
            timeAgo: 'just now',
            content: '',
            metadata: {
              badgeName: 'Welcome to OnlyRaceFans'
            }
          });
        }
        setRecentActivity(activities);
      } catch (e) {
        console.error('Error loading activity:', e);
      } finally {
        setLoadingActivity(false);
      }

    } catch (error) {
      console.error('Error loading fan profile:', error);
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
    console.log(`Tipping racer ${racerId} with $${amount}`);
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

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === targetId;

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.id || !isOwnProfile) return;
      
      try {
        // Check profile completion but don't block loading
        const { data: fanProfile, error } = await supabase
          .from('fan_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.log('Fan profile check skipped:', error.message);
          setHasCheckedProfile(true);
          return;
        }
        
        if (!fanProfile) {
          // Create empty profile if it doesn't exist, but don't require completion
          try {
            await supabase
              .from('fan_profiles')
              .insert({ id: user.id });
          } catch (insertError) {
            console.log('Fan profile creation skipped:', insertError);
          }
          setProfileCompletionPercentage(0);
          setHasCheckedProfile(true);
          return;
        }
        
        // Calculate completion percentage but make it optional
        const fields = [
          { name: 'location', completed: Boolean(fanProfile?.location) },
          { name: 'favorite_classes', completed: Boolean(fanProfile?.favorite_classes?.length) },
          { name: 'favorite_tracks', completed: Boolean(fanProfile?.favorite_tracks?.length) },
          { name: 'followed_racers', completed: Boolean(fanProfile?.followed_racers?.length) },
          { name: 'why_i_love_racing', completed: Boolean(fanProfile?.why_i_love_racing) },
          { name: 'profile_photo_url', completed: Boolean(fanProfile?.profile_photo_url) },
        ];
        
        const completedCount = fields.filter(f => f.completed).length;
        const percentage = Math.round((completedCount / fields.length) * 100);
        
        setProfileCompletionPercentage(percentage);
        setHasCheckedProfile(true);
      } catch (error) {
        console.log('Profile completion check failed:', error);
        setHasCheckedProfile(true);
      }
    };
    
    checkProfileCompletion();
  }, [user?.id, isOwnProfile]);
  
  const handleCloseGuide = () => {
    setShowProfileGuide(false);
    localStorage.setItem('profile_guide_seen', 'true');
  };

  const hasAnyData = Boolean(fanProfile) || favoriteRacers.length > 0 || recentActivity.length > 0;
  const isLoadingOverall = !hasAnyData && (loadingProfile || loadingStats || loadingFavorites || loadingActivity);

  return (
    <>
      {isLoadingOverall ? (
        <div className="min-h-screen p-6">
          <div className="max-w-5xl mx-auto">
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
          </div>
        </div>
      ) : (
        fanProfile ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-5xl mx-auto px-4 py-6">
              {/* Profile Header */}
              <ProfileHeader
                fanProfile={fanProfile}
                stats={stats}
                isOwnProfile={isOwnProfile}
                onEditProfile={handleEditProfile}
                bannerImage={bannerImage}
                loading={loadingProfile}
              />

              {/* Navigation Tabs */}
              <NavigationTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              {/* Content Based on Active Tab */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {activeTab === 'overview' && (
                  <>
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      <StatsCards stats={stats} loading={loadingStats} />
                      {isOwnProfile && <PersonalPost />}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      <FavoriteRacers
                        racers={favoriteRacers}
                        loading={loadingFavorites}
                        onTipRacer={handleTipRacer}
                        isOwnProfile={isOwnProfile}
                      />
                      <RecentActivity
                        activities={recentActivity}
                        loading={loadingActivity}
                        onViewAll={handleViewAllActivity}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'posts' && (
                  <div className="lg:col-span-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Posts</h3>
                      <p className="text-gray-400">Posts content will be displayed here.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'racers' && (
                  <div className="lg:col-span-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Supported Racers</h3>
                      <FavoriteRacers
                        racers={favoriteRacers}
                        loading={loadingFavorites}
                        onTipRacer={handleTipRacer}
                        isOwnProfile={isOwnProfile}
                        expanded={true}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="lg:col-span-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Activity</h3>
                      <RecentActivity
                        activities={recentActivity}
                        loading={loadingActivity}
                        onViewAll={handleViewAllActivity}
                        expanded={true}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'badges' && (
                  <div className="lg:col-span-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Badges</h3>
                      <p className="text-gray-400">Badges content will be displayed here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-white mb-2">Welcome to your Fan Dashboard</h2>
            <p className="text-gray-400">We couldn't load a fan profile. If you just signed up, complete your profile in Settings.</p>
          </div>
        )
      )}
      {/* Optional profile completion notification - non-blocking */}
      {isOwnProfile && hasCheckedProfile && profileCompletionPercentage < 50 && profileCompletionPercentage > 0 && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-orange-300">
                Complete your profile ({profileCompletionPercentage}% done) to get better recommendations
              </span>
            </div>
            <button
              onClick={() => navigate('/settings/profile')}
              className="text-xs text-orange-400 hover:text-orange-300 underline"
            >
              Complete now
            </button>
          </div>
        </div>
      )}

      {/* Optional modal for guided completion */}
      {user && showProfileGuide && hasCheckedProfile && isOwnProfile && (
        <ProfileCompletionGuide 
          userId={user.id}
          onClose={handleCloseGuide}
        />
      )}
    </>
  );
};

export default FanDashboard;