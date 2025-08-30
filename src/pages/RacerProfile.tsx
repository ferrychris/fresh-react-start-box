import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Calendar, MapPin, Users, Image, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useApp } from '../App';
import type { Racer } from '../types';
import { SuperFanBadge } from '../components/SuperFanBadge';
import { SupabaseImageUpload } from '../components/SupabaseImageUpload';
import { PostCreator } from '../components/PostCreator';
import { PostCard, type Post } from '../components/PostCard';
import { TipModal } from '../components/TipModal';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { GiftModal } from '../components/GiftModal';
import { ShareModal } from '../components/ShareModal';
import { DynamicMetaTags } from '../components/DynamicMetaTags';
import { LiveStreamIndicator } from '../components/LiveStreamIndicator';
import { 
  supabase,
  updateRacerProfile,
  getRacerPosts,
  becomeFan,
  unfollowRacer,
  checkFanStatus,
  getRacerFanStats,
  getRacerFans,
  type FanStats,
  type RacerFan
} from '../lib/supabase';

// Define specific types for data structures

export interface ScheduleEvent {
  id: number;
  event_name: string;
  track_name: string;
  date: string;
  series_name: string;
  race_date: string;
}

export interface ViewEvent {
  day_date: string;
}

export const RacerProfile: React.FC = () => {
  const { id } = useParams();
  const { racers, racersLoading, user } = useApp();
  
  // All useState hooks first
  const [activeTab, setActiveTab] = useState('posts');
  const [fanStats, setFanStats] = useState<FanStats>({ total_fans: 0, super_fans: 0 });
  const [isFan, setIsFan] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [carPhotos, setCarPhotos] = useState<string[]>([]);
  const [isSuperfan, setIsSuperfan] = useState(false);
  const [fans, setFans] = useState<RacerFan[]>([]);
  
  const racer = racers.find(r => r.id === id);

  useEffect(() => {
    if (racer?.car_photos) {
      setCarPhotos(racer.car_photos);
    }
  }, [racer]);

  // Handle and aggregate stats for UI chips
  const handle = racer
    ? '@' + (((racer as { username?: string }).username as string) || racer.name.toLowerCase().replace(/\s+/g, ''))
    : '';
  
  // Check if racers data is still loading
  const isRacersLoading = racersLoading;

  // Load posts function
  const loadPosts = useCallback(async () => {
    if (!id) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - using empty posts array');
      setPosts([]);
      return;
    }
    
    setPostsLoading(true);
    try {
            const racerPosts = await getRacerPosts(id as string, user?.id) as unknown as Post[];
      setPosts(racerPosts);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error loading posts - database may be unavailable');
        setPosts([]);
      } else {
        console.error('Error loading posts:', error);
        setPosts([]);
      }
    } finally {
      setPostsLoading(false);
    }
  }, [id, user?.id]);

  // Load fans function
  const loadFans = useCallback(async () => {
    if (!id) return;
    try {
      const fanData = await getRacerFans(id);
      setFans(fanData);
    } catch (error) {
      console.error('Error loading fans:', error);
      setFans([]);
    }
  }, [id]);

  // Load last 14 days of view events for owner sparkline

  // Helper: record unique-per-day view in events table
  // Only counts when an authenticated non-owner viewer is present
  const recordProfileView = useCallback(async (profileId: string, viewerId?: string) => {
    if (!profileId) return;
    // Require an authenticated viewer and skip self-views
    if (!viewerId || viewerId === profileId) return;
    try {
      if (!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)) return;
      // Upsert into events table using per-day unique key (profile_id, viewer_id, day_date)
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
      if (import.meta.env.VITE_VIEW_TRACKING_DEBUG === 'true') {
        console.info('[views] recording attempt', { profileId, viewerId });
      }
      const { error: upsertErr } = await supabase
        .from('profile_view_events')
        .upsert(
          [{ profile_id: profileId, viewer_id: viewerId, user_agent: ua }],
          { onConflict: 'profile_id,viewer_id,day_date', ignoreDuplicates: true }
        );
      if (!upsertErr) {
        if (import.meta.env.VITE_VIEW_TRACKING_DEBUG === 'true') {
          console.info('[views] profile_view_events upsert ok');
        }
      } else {
        console.warn('⚠️ Failed to upsert profile_view_events, falling back to legacy profile_views:', upsertErr);
        // Fallback: increment legacy aggregate table if it exists
        try {
          const { data, error: selErr } = await supabase
            .from('profile_views')
            .select('view_count')
            .eq('profile_id', profileId)
            .maybeSingle();
          if (selErr) throw selErr;
          if (data) {
            const next = (data.view_count || 0) + 1;
            const { error: updErr } = await supabase
              .from('profile_views')
              .update({ view_count: next })
              .eq('profile_id', profileId);
            if (updErr) console.warn('⚠️ Legacy profile_views update failed:', updErr);
          } else {
            const { error: insErr } = await supabase
              .from('profile_views')
              .insert([{ profile_id: profileId, view_count: 1 }]);
            if (insErr) console.warn('⚠️ Legacy profile_views insert failed:', insErr);
          }
        } catch (fallbackErr) {
          console.warn('⚠️ Legacy profile_views fallback not available:', fallbackErr);
        }
      }
    } catch (e) {
      console.error('Error recording profile view:', e);
    }
  }, []);

  const hasRecordedViewRef = React.useRef(false);
  const hasInteractedRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    // Only track authenticated non-owner viewers
    if (!user?.id || user.id === id) return;

    const debug = import.meta.env.VITE_VIEW_TRACKING_DEBUG === 'true';
    if (debug) {
      // Consider interaction satisfied in debug mode for quicker testing
      hasInteractedRef.current = true;
    }

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const startTimer = () => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && hasInteractedRef.current && !hasRecordedViewRef.current) {
          recordProfileView(id, user.id);
          hasRecordedViewRef.current = true;
        }
      }, 5000); // 5 seconds
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        clearTimer();
      }
    };

    const onScroll = () => { hasInteractedRef.current = true; };
    const onClick = () => { hasInteractedRef.current = true; };

    startTimer();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onClick);
      clearTimer();
    };
  }, [id, user?.id, recordProfileView]);

  const loadFanData = useCallback(async () => {
    if (!user || !id) return;
    
    try {
      // Check if Supabase is configured before making requests
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - using default fan data');
        setFanStats({ total_fans: 0, super_fans: 0 });
        setIsFan(false);
        return;
      }

      // Check if current user is a fan
      const fanStatus = await checkFanStatus(user.id, id);
      setIsFan(!!fanStatus);
      setIsSuperfan(fanStatus?.is_superfan || false);
      
      // Load fan statistics
      const fanStatsData = await getRacerFanStats(id);
      setFanStats(fanStatsData);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error loading fan data - database may be unavailable');
        setFanStats({ total_fans: 0, super_fans: 0 });
        setIsFan(false);
      } else {
        console.error('Error loading fan data:', error);
        setFanStats({ total_fans: 0, super_fans: 0 });
        setIsFan(false);
      }
    }
  }, [id, user]);


  const handleCarPhotoAdded = async (imageUrl: string) => {
    if (!id) return;
    const next = [...carPhotos, imageUrl];
    setCarPhotos(next);
    try {
      await updateRacerProfile(id, { car_photos: next });
    } catch (err) {
      console.error('Failed to save car photo:', err);
      // Revert optimistic update if saving fails
      setCarPhotos(carPhotos);
      alert('Failed to save car photo. Please try again.');
    }
  };
  
  // Set uploaded image as the banner (first car photo)
  const handleCarBannerChange = async (imageUrl: string) => {
    if (!id) return;
    const deduped = (carPhotos || []).filter(p => p && p !== imageUrl);
    const next = [imageUrl, ...deduped];
    setCarPhotos(next);
    try {
      await updateRacerProfile(id, { car_photos: next });
    } catch (err) {
      console.error('Failed to set banner car photo:', err);
      setCarPhotos(carPhotos);
      alert('Failed to update cover photo. Please try again.');
    }
  };

  const loadSchedule = useCallback(async () => {
    if (!id) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - using empty schedule array');
      setSchedule([]);
      return;
    }
    
    setScheduleLoading(true);
    try {
      const { data, error } = await supabase
        .from('race_schedules')
        .select('*')
        .eq('racer_id', id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });
      
      if (error) {
        // Handle specific database errors gracefully
        if (error.code === 'PGRST002' || error.message?.includes('schema cache') || error.message?.includes('Failed to fetch') || error.code === '57014') {
          console.warn('⚠️ Database temporarily unavailable - using empty schedule array');
          setSchedule([]);
          return;
        }
        throw error;
      }
      
      setSchedule(data || []);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error loading schedule - database may be unavailable');
      } else {
        console.error('Error loading schedule:', error);
      }
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, [id]);

  const handleBecomeFan = async () => {
    if (!user || !id) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      alert('⚠️ Database not configured yet. Please set up Supabase environment variables to enable fan features.');
      return;
    }
    
    try {
      if (isFan) {
        await unfollowRacer(user.id, id);
        setIsFan(false);
        setFanStats(prev => ({ ...prev, total_fans: prev.total_fans - 1 }));
      } else {
        await becomeFan(user.id, id);
        setIsFan(true);
        setFanStats(prev => ({ ...prev, total_fans: prev.total_fans + 1 }));
      }
      
      // Refresh fan data to ensure consistency
      const updatedStats = await getRacerFanStats(id);
      setFanStats(updatedStats);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error updating fan status - database may be unavailable');
        alert('Unable to connect to database. Please check your internet connection and try again.');
      } else {
        console.error('Error updating fan status:', error);
        alert('Failed to update fan status. Please try again.');
      }
    }
  };

  useEffect(() => {
    loadFanData();

    if (id) {
      if (activeTab === 'posts') loadPosts();
      if (activeTab === 'schedule') loadSchedule();
      if (activeTab === 'fans') loadFans();
    }
  }, [activeTab, id, user, loadPosts, loadSchedule, loadFans, loadFanData]);

  const handleSubscriptionComplete = () => {
    // After a successful subscription, refresh fan data to reflect the new status
    loadFanData();
    setShowSubscriptionModal(false);
  };

  // Early return after all hooks have been called
  if (isRacersLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Racer Profile</h2>
          <p className="text-gray-400">
            Please wait while we load the racer's information...
          </p>
        </div>
      </div>
    );
  }

  if (!racer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Racer Not Found</h2>
          <p className="text-gray-400 mb-6">
            The racer you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/racers"
            className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            Back to Racers
          </Link>
        </div>
      </div>
    );
  }
  // Decide cover image: prefer first car photo, then racer.bannerImage, then default
  const coverImage = (carPhotos[0] && carPhotos[0].trim() !== '')
    ? carPhotos[0]
    : (racer.bannerImage && racer.bannerImage.trim() !== '')
    ? racer.bannerImage
    : 'https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=1920';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* Dynamic Meta Tags for Social Sharing */}
      {racer && (
        <DynamicMetaTags
          title={`${racer.name} - Racing Profile | OnlyRaceFans`}
          description={racer.bio || `Support ${racer.name} and get exclusive racing content! #${racer.carNumber} ${racer.class} from ${racer.location}.`}
          image={racer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${racer.name}&backgroundColor=ff6600&textColor=ffffff&size=1200`}
          url={`${window.location.origin}/racer/${racer.id}`}
          type="profile"
        />
      )}

      {/* Hero Section */}
      <div className="relative h-80 md:h-96 lg:h-[32rem] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
        
        {user && user.id === racer.id && (
          <div className="absolute top-6 left-6 z-10 max-w-xs">
            <SupabaseImageUpload
              type="banner"
              currentImage={carPhotos[0] || ''}
              userId={user.id}
              onImageChange={handleCarBannerChange}
              titleOverride="Update Car Cover"
              descriptionOverride="Upload a wide car photo for your profile cover."
            />
          </div>
        )}
        
        <div className="absolute top-6 right-6">
          <LiveStreamIndicator streamerId={racer.id} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
            <div className="relative mb-4 md:mb-0 md:mr-8 flex-shrink-0">
              <img 
                src={racer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${racer.name}&backgroundColor=222222&textColor=ffffff&size=128`}
                alt={racer.name}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-gray-800 object-cover bg-gray-700 shadow-2xl"
              />
              {isSuperfan && (
                <div className="absolute -top-2 -right-2">
                  <SuperFanBadge />
                </div>
              )}
            </div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">{racer.name}</h1>
              <p className="text-lg text-gray-300">{handle}</p>
            </div>
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <button onClick={() => setShowShareModal(true)} className="p-3 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
              {user && user.id !== id && (
                <button onClick={handleBecomeFan} className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${isFan ? 'bg-gray-700 hover:bg-gray-600' : 'bg-fedex-orange hover:bg-fedex-orange-dark'}`}>
                  {isFan ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isFan ? 'Fan' : 'Become a Fan'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (About & Stats) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
              <h2 className="text-2xl font-bold mb-4">About {racer.name}</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{racer.bio || 'No bio available.'}</p>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
              <h2 className="text-2xl font-bold mb-4">Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center"><div className="text-3xl font-bold text-fedex-orange">{fanStats.total_fans}</div><div className="text-gray-400">Fans</div></div>
                <div className="text-center"><div className="text-3xl font-bold text-purple-400">{fanStats.super_fans}</div><div className="text-gray-400">Super Fans</div></div>
                <div className="text-center"><div className="text-3xl font-bold">{racer.career_wins || 0}</div><div className="text-gray-400">Wins</div></div>
                <div className="text-center"><div className="text-3xl font-bold">{racer.podiums || 0}</div><div className="text-gray-400">Podiums</div></div>
              </div>
            </div>
          </div>

          {/* Right Column (Tabs & Content) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-800/50">
              <div className="flex space-x-1">
                {['posts', 'fans', 'schedule', 'about'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-sm capitalize ${activeTab === tab ? 'bg-gradient-to-r from-fedex-orange to-orange-500 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {user && user.id === id && (
                    <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 shadow-xl">
                      <PostCreator racerId={id} onPostCreated={loadPosts} />
                    </div>
                  )}
                  {postsLoading ? (
                    <div className="text-center py-20"><Loader2 className="w-12 h-12 text-fedex-orange animate-spin mx-auto" /></div>
                  ) : posts.length > 0 ? (
                    posts.map(post => (
                      <div key={post.id} className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50 overflow-hidden shadow-xl">
                        <PostCard post={post} onPostUpdate={loadPosts} onPostDeleted={loadPosts} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50">
                      <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6"><Image className="h-10 w-10 text-gray-500" /></div>
                      <h3 className="text-2xl font-bold mb-3">No posts yet</h3>
                      <p className="text-gray-400 mb-8 text-lg">{user && user.id === id ? "Share your first racing moment!" : `${racer.name} hasn't posted yet.`}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'fans' && (
                 <div className="space-y-6">
                    {fans.length > 0 ? (
                      <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">All Fans ({fans.length})</h3>
                        <div className="space-y-4">
                          {fans.map(fan => (
                            <div key={fan.fan_id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                               <div className="flex items-center space-x-4">
                                <img src={fan.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${fan.name}`} alt={fan.name} className="w-12 h-12 rounded-full object-cover"/>
                                <div>
                                  <div className="font-semibold text-white">{fan.name}</div>
                                  <div className="text-sm text-gray-400">Fan since {new Date(fan.created_at).toLocaleDateString()}</div>
                                </div>
                                {fan.is_superfan && <SuperFanBadge />} 
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-gray-500" /></div>
                        <h4 className="text-xl font-bold text-white">No Fans Yet</h4>
                        <p className="text-gray-400 mt-2">Be the first to support {racer.name}!</p>
                      </div>
                    )}
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {scheduleLoading ? (
                    <div className="text-center py-20"><Loader2 className="w-12 h-12 text-fedex-orange animate-spin mx-auto" /></div>
                  ) : schedule.length > 0 ? (
                    <div className="space-y-4">
                      {schedule.map(race => (
                        <div key={race.id} className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 shadow-xl">
                          <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1">
                              <div className="text-sm text-purple-400 font-semibold mb-2">{race.series_name}</div>
                              <h4 className="text-xl font-bold text-white mb-3">{race.event_name}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-400 text-sm">
                                {race.race_date && (
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(race.race_date).toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </div>
                                )}
                                {race.track_name && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {race.track_name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center space-x-3">
                              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
                                Upcoming
                              </div>
                              <button className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors">
                                <Calendar className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-800/50">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-white">No upcoming races</h3>
                      <p className="text-gray-400 mb-8 text-lg">
                        {user && user.id === id 
                          ? "Add your race schedule to let fans know where you'll be racing next!"
                          : `${racer?.name} hasn't added any upcoming races to their schedule yet.`
                        }
                      </p>
                      {user && user.id === id && (
                        <Link
                          to="/dashboard"
                          className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                        >
                          Go to Dashboard
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/50">
                  <h3 className="text-2xl font-bold text-white mb-6">About {racer.name}</h3>
                  <div className="space-y-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-400 text-sm">{racer.bio || 'No bio available.'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8 pt-6 border-t border-gray-800">
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-4">Career Stats</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wins:</span>
                            <span className="text-white font-semibold">{racer.career_wins || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Podiums:</span>
                            <span className="text-white font-semibold">{racer.podiums || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Championships:</span>
                            <span className="text-white font-semibold">{racer.championships || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Years Racing:</span>
                            <span className="text-white font-semibold">{racer.years_racing || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-4">Car Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Number:</span>
                            <span className="text-white font-semibold">#{racer.carNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Class:</span>
                            <span className="text-white font-semibold">{racer.class}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Team:</span>
                            <span className="text-white font-semibold">{racer.teamName || '—'}</span>
                          </div>
                        </div>
                        {/* Owner-only: Upload racer's car photo */}
                        {user && user.id === racer.id && (
                          <div className="mt-6">
                            <h5 className="text-sm font-semibold text-white mb-2">Upload Racer’s Car</h5>
                            <SupabaseImageUpload
                              type="banner"
                              currentImage={''}
                              userId={user.id}
                              onImageChange={handleCarPhotoAdded}
                              context="racer"
                              titleOverride="Racer Car Photo"
                              descriptionOverride="Upload a clear photo of your race car. JPG/PNG/WebP up to 5MB."
                              placeholderOverride="Car Photo"
                              className="mt-2"
                            />
                          </div>
                        )}
                        {/* Car Photos Grid */}
                        {carPhotos && carPhotos.length > 0 && (
                          <div className="mt-6">
                            <h5 className="text-sm font-semibold text-white mb-2">Car Photos</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {carPhotos.map((url, idx) => (
                                <div key={`${url}-${idx}`} className="aspect-video rounded-xl overflow-hidden border border-gray-800/60 bg-gray-800/40">
                                  <img src={url} alt={`Car ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">Sponsor My Racing Journey</h3>
                      <p className="text-gray-300 mb-6 text-lg">
                        Help me compete at the highest level by sponsoring my car. Your brand will be featured prominently.
                      </p>
                      <Link
                        to={`/racer/${id}/sponsorship`}
                        className="inline-block px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        View Sponsorship Packages
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTipModal && (
        <TipModal
          racerId={id!}
          racerName={racer.name}
          onClose={() => setShowTipModal(false)}
          onSuccess={async () => {
            // Refresh fan data after successful tip
            const updatedStats = await getRacerFanStats(id!);
            setFanStats(updatedStats);
            const updatedFansList = await getRacerFans(id!);
            setFans(updatedFansList);
            // Check if user became a superfan
            const fanStatus = await checkFanStatus(user?.id!, id!);
            setIsFan(!!fanStatus);
            setIsSuperfan(fanStatus?.is_superfan || false);
          }}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          racerId={id!}
          racerName={racer.name}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionComplete}
        />
      )}

      {showGiftModal && (
        <GiftModal
          racerId={id!}
          racerName={racer.name}
          onClose={() => setShowGiftModal(false)}
          onGiftSent={async () => {
            // Refresh fan data after successful gift
            const updatedStats = await getRacerFanStats(id!);
            setFanStats(updatedStats);
            const updatedFansList = await getRacerFans(id!);
            setFans(updatedFansList);
          }}
        />
      )}

      {showShareModal && racer && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          racerName={racer.name}
          racerId={racer.id}
          racerImage={racer.profile_picture}
          racerBio={racer.bio}
        />
      )}
    </div>
  );
};