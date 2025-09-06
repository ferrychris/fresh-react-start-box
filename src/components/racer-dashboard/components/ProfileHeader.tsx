import React, { useState, useEffect } from 'react';
import { Flame, Users, Crown, DollarSign, Pencil, Eye, Camera } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { recordActivityForStreak } from '../../../integrations/supabase/streaks';

interface ProfileHeaderProps {
  userId: string;
  isOwner?: boolean;
  onEditProfile?: () => void;
  onPreviewProfile?: () => void;
}

// Types for DB rows we select
interface RacerProfilesRel {
  profile_photo_url?: string | null;
  banner_photo_url?: string | null;
}

interface ProfilesRow {
  id: string;
  name?: string | null;
  email?: string | null;
  user_type?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  cover_photo?: string | null;
  banner_image?: string | null;
  banner?: string | null;
  bannerUrl?: string | null;
  racer_profiles?: RacerProfilesRel | RacerProfilesRel[] | null;
}

// UI-friendly normalized data for rendering
interface RacerProfileData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  car_number: string;
  racing_class: string;
  team: string;
  followers_count: number;
  streak_days: number;
  subscribers_count?: number;
  total_tips_cents?: number;
  // Keep a reference of raw media for banner resolution
  _media?: {
    profile_photo_url?: string | null;
    avatar_url?: string | null;
    avatar?: string | null;
    cover_photo?: string | null;
    banner_image?: string | null;
    banner?: string | null;
    bannerUrl?: string | null;
    racer_banner?: string | null;
  };
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userId, isOwner = false, onEditProfile, onPreviewProfile }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<RacerProfileData | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null); // the racer being viewed
  const [viewerId, setViewerId] = useState<string | null>(null); // the currently logged-in user
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // Helpers: detect if a string is already a URL and resolve storage paths to public URLs
  const isHttpUrl = (val?: string | null) => !!val && /^(https?:)?\/\//i.test(val);
  const toPublicUrl = (val?: string | null) => {
    if (!val) return '';
    if (isHttpUrl(val)) return val;
    try {
      // Default racer bucket where profile and banner images are stored
      const { data } = supabase.storage.from('racer-photos').getPublicUrl(val);
      return data.publicUrl || '';
    } catch (e) {
      console.warn('Failed to resolve public URL for', val, e);
      return '';
    }
  };

  // Resolve current user id if requested
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Determine the racer being viewed
      if (userId && userId !== 'current-user') {
        if (!cancelled) setResolvedUserId(userId);
      } else {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setResolvedUserId(data?.user?.id ?? null);
      }
      // Determine the viewer (logged-in user)
      const { data: viewer } = await supabase.auth.getUser();
      if (!cancelled) setViewerId(viewer?.user?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [userId]);
  
  // Record today's activity toward streak when we know the userId
  useEffect(() => {
    (async () => {
      if (!resolvedUserId) return;
      try {
        await recordActivityForStreak(resolvedUserId);
      } catch (e) {
        // non-fatal
        console.warn('streak update failed', e);
      }
    })();
  }, [resolvedUserId]);

  // Load follow status when viewer and racer ids are known
  useEffect(() => {
    (async () => {
      if (!viewerId || !resolvedUserId) return;
      try {
        const { data, error } = await supabase
          .from('fan_connections')
          .select('id')
          .eq('fan_id', viewerId)
          .eq('racer_id', resolvedUserId)
          .limit(1);
        if (!error) setIsFollowing(!!(data && data.length > 0));
      } catch (e) {
        console.warn('failed to load follow status', e);
      }
    })();
  }, [viewerId, resolvedUserId]);

  const toggleFollow = async () => {
    if (!viewerId || !resolvedUserId || viewerId === resolvedUserId) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('fan_connections')
          .delete()
          .eq('fan_id', viewerId)
          .eq('racer_id', resolvedUserId);
        if (!error) {
          setIsFollowing(false);
          setProfileData((pd) => pd ? { ...pd, followers_count: Math.max(0, (pd.followers_count || 0) - 1) } : pd);
        }
      } else {
        const { error } = await supabase
          .from('fan_connections')
          .insert({ fan_id: viewerId, racer_id: resolvedUserId });
        if (!error) {
          setIsFollowing(true);
          setProfileData((pd) => pd ? { ...pd, followers_count: (pd.followers_count || 0) + 1 } : pd);
        }
      }
    } catch (e) {
      console.warn('follow toggle failed', e);
    }
  };
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!resolvedUserId) return;
      
      setLoading(true);
      try {
        // Fetch basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            user_type,
            avatar,
            banner_image
          `)
          .eq('id', resolvedUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // Create a username from email if not available
        const username = (profileData.email || '')?.split('@')[0] || 'racer';
        
        // Fetch follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('fan_connections')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', resolvedUserId);
          
        if (followerError) {
          console.error('Error fetching follower count:', followerError);
        }
        
        // Fetch streak days (activity streak)
        const { data: streakData, error: streakError } = await supabase
          .from('fan_streaks')
          .select('current_streak')
          .eq('fan_id', resolvedUserId)
          .maybeSingle();
          
        if (streakError && streakError.code !== 'PGRST116') {
          console.error('Error fetching streak data:', streakError);
        }

        // Fetch profile views for this user
        const { data: viewData, error: viewError } = await supabase
          .from('profile_views')
          .select('view_count')
          .eq('profile_id', resolvedUserId)
          .maybeSingle();

        if (viewError && viewError.code !== 'PGRST116') {
          console.error('Error fetching view data:', viewError);
        }
        
        // Fetch subscribers count
        const { count: subscribersCount, error: subsError } = await supabase
          .from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', resolvedUserId)
          .eq('status', 'active');
        if (subsError) {
          console.error('Error fetching subscribers count:', subsError);
        }

        // Fetch total tips from transactions table
        let totalTipsCents = 0;
        const { data: tipsSum, error: tipsErr } = await supabase
          .from('transactions')
          .select('total_amount_cents')
          .eq('racer_id', resolvedUserId)
          .eq('transaction_type', 'tip')
          .eq('status', 'completed');
        if (!tipsErr && Array.isArray(tipsSum)) {
          totalTipsCents = tipsSum.reduce((acc: number, r: { total_amount_cents?: number | null }) => acc + (r?.total_amount_cents || 0), 0);
        }

        // Get racer profile data if available
        const { data: racerProfile, error: racerError } = await supabase
          .from('racer_profiles')
          .select('profile_photo_url, banner_photo_url, car_number, racing_class, team_name')
          .eq('id', resolvedUserId)
          .maybeSingle();
        
        if (racerError && racerError.code !== 'PGRST116') {
          console.error('Error fetching racer profile:', racerError);
        }

        // Combine all data
        setProfileData({
          id: profileData.id,
          name: profileData.name || 'Racer',
          username: username,
          avatar: profileData.avatar || racerProfile?.profile_photo_url || '',
          bio: `${profileData.user_type || 'racer'} profile`,
          car_number: racerProfile?.car_number || '00',
          racing_class: racerProfile?.racing_class || 'Open Class',
          team: racerProfile?.team_name || 'Independent',
          followers_count: followerCount || 0,
          streak_days: streakData?.current_streak || 0,
          subscribers_count: subscribersCount || 0,
          total_tips_cents: totalTipsCents || 0,
          _media: {
            profile_photo_url: racerProfile?.profile_photo_url || null,
            avatar: profileData.avatar || null,
            banner_image: profileData.banner_image || null,
            racer_banner: racerProfile?.banner_photo_url || null,
          },
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [resolvedUserId]);
  
  // Fall back values if database fetch fails
  const displayUser = profileData || {
    id: '',
    name: 'Racer',
    username: 'racer',
    avatar: '',
    bio: '',
    car_number: '00',
    racing_class: '',
    team: '',
    followers_count: 0,
    streak_days: 0
  };

  // Initials for avatar fallback (no external placeholder)
  const initials = (displayUser.name || 'Racer')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Resolve banner from the stored media map in order of preference
  const bannerRaw = profileData?._media?.banner_image
    || profileData?._media?.banner
    || profileData?._media?.bannerUrl
    || profileData?._media?.cover_photo
    || profileData?._media?.racer_banner
    || '';
  const bannerUrl = toPublicUrl(bannerRaw);

  return (
    <div className="relative border-b border-border min-h-[320px] md:min-h-[380px]">
      {/* Full-bleed banner background */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse"></div>
        ) : (
          <div className="w-full h-full relative">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
          </div>
        )}
      </div>

      {/* Foreground header content */}
      <div className="relative z-10 p-6 h-full">
        {/* Owner action buttons (top-right over banner) */}
        {isOwner && (
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {/* Quick actions: change avatar, change banner (route to edit for now) */}
            <button
              onClick={onEditProfile}
              title="Change Avatar"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900/70 text-gray-100 border border-gray-700 hover:bg-gray-800 transition"
            >
              <Camera className="w-4 h-4" />
              <span className="sr-only">Change Avatar</span>
            </button>
            <button
              onClick={onEditProfile}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900/70 text-gray-100 border border-gray-700 hover:bg-gray-800 transition"
              >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit Profile</span>
            </button>
            <button
              onClick={onEditProfile}
              title="Change Banner"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900/70 text-gray-100 border border-gray-700 hover:bg-gray-800 transition"
            >
              <Camera className="w-4 h-4" />
              <span className="sr-only">Change Banner</span>
            </button>
            <button
              onClick={onPreviewProfile}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
              >
              <Eye className="w-4 h-4" />
              <span className="sr-only">Preview</span>
            </button>
          </div>
        )}
        <div className="max-w-6xl mx-auto flex flex-col justify-end min-h-[320px] md:min-h-[380px]">
          {/* Top row: avatar + name on left, metrics on right */}
          <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-24 h-24 rounded-2xl bg-muted animate-pulse"></div>
              ) : (
                (() => {
                  const avatarRaw =
                    profileData?._media?.avatar ||
                    profileData?._media?.avatar_url ||
                    displayUser.avatar ||
                    profileData?._media?.profile_photo_url ||
                    '';
                  const avatarUrl = toPublicUrl(avatarRaw);
                  return avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayUser.name}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl ring-4 ring-primary bg-gray-800 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-200">{initials}</span>
                    </div>
                  );
                })()
              )}
              <div className="flex-1">
                <div className="flex items-center">
                  {loading ? (
                    <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-foreground">{displayUser.name}</h1>
                      <span className="ml-2 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">#{displayUser.car_number}</span>
                    </>
                  )}
                </div>
                {loading ? (
                  <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2"></div>
                ) : (
                  <>
                    <p className="text-muted-foreground">@{displayUser.username} • Racer Dashboard</p>
                    {displayUser.bio && <p className="text-muted-foreground mt-1">{displayUser.bio}</p>}
                    {/* Metrics directly beneath racer name */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {/* Fans */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400">
                          <Users className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{(displayUser.followers_count || 0).toLocaleString()}</span>
                        <span>fans</span>
                      </div>
                      {/* Subscribers */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/15 text-purple-400">
                          <Crown className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{(displayUser.subscribers_count || 0).toLocaleString()}</span>
                        <span>subscribers</span>
                      </div>
                      {/* Total Tips */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/15 text-green-400">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">${(((displayUser.total_tips_cents || 0) / 100).toLocaleString())}</span>
                        <span>total tips</span>
                      </div>
                      {/* Day Streak */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400">
                          <Flame className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{displayUser.streak_days || 0}</span>
                        <span>day streak</span>
                      </div>
                    </div>
                    {/* Follow/Unfollow button for non-owners */}
                    {!isOwner && viewerId && viewerId !== resolvedUserId && (
                      <div className="mt-3">
                        <button
                          onClick={toggleFollow}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isFollowing ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Metrics moved below name; right-side block removed */}
          </div>
          {/* Edit button could sit below or be re-added at right if needed */}
        </div>

        {/* Metrics rendered inside the identity block above */}
      </div>
    </div>
  );
};
