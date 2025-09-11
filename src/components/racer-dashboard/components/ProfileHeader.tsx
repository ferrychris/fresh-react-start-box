import React, { useState, useEffect } from 'react';
import { Flame, Users, Crown, DollarSign, Pencil, Eye, Camera, CheckCircle, AlertTriangle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../../../integrations/supabase/client';
import { recordActivityForStreak } from '../../../integrations/supabase/streaks';
import { 
  fetchProfileCompletionData, 
  analyzeProfileCompletion, 
  getMissingFieldLabels 
} from '../../../utils/profileCompletion';

interface ProfileHeaderProps {
  userId: string;
  isOwner?: boolean;
  onEditProfile?: () => void;
  onPreviewProfile?: () => void;
  onLoadingChange?: (loading: boolean) => void;
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

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userId, isOwner = false, onEditProfile, onPreviewProfile, onLoadingChange }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<RacerProfileData | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null); // the racer being viewed
  const [viewerId, setViewerId] = useState<string | null>(null); // the currently logged-in user
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [completionPct, setCompletionPct] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [copiedTooltip, setCopiedTooltip] = useState<boolean>(false);

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

  // Resolve current user and viewer in a single auth call to avoid double round-trip
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const authedUserId = data?.user?.id ?? null;
        if (!cancelled) {
          setViewerId(authedUserId);
          setResolvedUserId(userId && userId !== 'current-user' ? userId : authedUserId);
        }
      } catch {
        if (!cancelled) {
          setViewerId(null);
          setResolvedUserId(userId && userId !== 'current-user' ? userId : null);
        }
      }
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
  
  const handleShareProfile = async () => {
    try {
      const targetId = resolvedUserId || userId;
      const shareUrl = `${window.location.origin}/racer/${targetId ?? ''}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this racer on OnlyRaceFans',
          text: 'Follow this racer and stay updated on their latest posts and schedule.',
          url: shareUrl,
        });
        toast.success('Share sheet opened');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied');
        setCopiedTooltip(true);
        window.setTimeout(() => setCopiedTooltip(false), 1500);
      }
    } catch (err) {
      console.warn('Failed to share profile', err);
      try {
        const fallback = `${window.location.origin}/racer/${resolvedUserId || userId || ''}`;
        await navigator.clipboard.writeText(fallback);
        toast.success('Profile link copied');
        setCopiedTooltip(true);
        window.setTimeout(() => setCopiedTooltip(false), 1500);
      } catch {
        toast.error('Unable to share this profile');
      }
    }
  };
  
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!resolvedUserId) return;
      setLoading(true);
      try {
        // Kick off all requests in parallel to reduce total load time
        const profileQuery = supabase
          .from('profiles')
          .select(`id, name, email, user_type, avatar, banner_image, is_verified`)
          .eq('id', resolvedUserId)
          .single();

        const followersQuery = supabase
          .from('fan_connections')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', resolvedUserId);

        const streakQuery = supabase
          .from('fan_streaks')
          .select('current_streak')
          .eq('fan_id', resolvedUserId)
          .maybeSingle();

        const viewsQuery = supabase
          .from('profile_views')
          .select('view_count')
          .eq('profile_id', resolvedUserId)
          .maybeSingle();

        const subsQuery = supabase
          .from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', resolvedUserId)
          .eq('status', 'active');

        const tipsQuery = supabase
          .from('transactions')
          .select('total_amount_cents')
          .eq('racer_id', resolvedUserId)
          .eq('transaction_type', 'tip')
          .eq('status', 'completed');

        const racerProfileQuery = supabase
          .from('racer_profiles')
          .select('profile_photo_url, banner_photo_url, car_number, racing_class, team_name')
          .eq('id', resolvedUserId)
          .maybeSingle();

        const [profileRes, followersRes, streakRes, viewsRes, subsRes, tipsRes, racerRes] = await Promise.all([
          profileQuery, followersQuery, streakQuery, viewsQuery, subsQuery, tipsQuery, racerProfileQuery
        ]);

        if (profileRes.error) {
          console.error('Error fetching profile:', profileRes.error);
          return;
        }

        const profileRow = profileRes.data as any;
        const username = (profileRow?.email || '')?.split('@')[0] || 'racer';
        setIsVerified(!!profileRow?.is_verified);

        const followerCount = followersRes.count || 0;
        const streakDays = (streakRes.data as any)?.current_streak || 0;
        // viewsRes currently unused in header UI but left fetched for future quick use
        const subscribersCount = subsRes.count || 0;

        let totalTipsCents = 0;
        if (!tipsRes.error && Array.isArray(tipsRes.data)) {
          totalTipsCents = tipsRes.data.reduce((acc: number, r: { total_amount_cents?: number | null }) => acc + (r?.total_amount_cents || 0), 0);
        }

        const racerProfile = racerRes.data as any;

        setProfileData({
          id: profileRow.id,
          name: profileRow.name || 'Racer',
          username,
          avatar: profileRow.avatar || racerProfile?.profile_photo_url || '',
          bio: `${profileRow.user_type || 'racer'} profile`,
          car_number: racerProfile?.car_number || '00',
          racing_class: racerProfile?.racing_class || 'Open Class',
          team: racerProfile?.team_name || 'Independent',
          followers_count: followerCount,
          streak_days: streakDays,
          subscribers_count: subscribersCount,
          total_tips_cents: totalTipsCents,
          _media: {
            profile_photo_url: racerProfile?.profile_photo_url || null,
            avatar: profileRow.avatar || null,
            banner_image: profileRow.banner_image || null,
            racer_banner: racerProfile?.banner_photo_url || null,
          },
        });

        // Use our comprehensive profile completion system
        try {
          const completionData = await fetchProfileCompletionData(resolvedUserId);
          if (completionData) {
            const completionStatus = analyzeProfileCompletion(completionData);
            setCompletionPct(completionStatus.completionPercentage);
            setMissingFields(getMissingFieldLabels(completionStatus.missingFields));
          } else {
            // Fallback to old system if new system fails
            const checklist: Array<{ key: string; ok: boolean; label: string }> = [
              { key: 'profile_photo_url', ok: !!racerProfile?.profile_photo_url, label: 'Profile photo' },
              { key: 'banner_photo_url', ok: !!racerProfile?.banner_photo_url, label: 'Banner photo' },
              { key: 'car_number', ok: !!racerProfile?.car_number, label: 'Car number' },
              { key: 'racing_class', ok: !!racerProfile?.racing_class, label: 'Racing class' },
              { key: 'team_name', ok: !!racerProfile?.team_name, label: 'Team name' },
            ];
            const total = checklist.length;
            const done = checklist.filter(c => c.ok).length;
            setCompletionPct(Math.round((done / total) * 100));
            setMissingFields(checklist.filter(c => !c.ok).map(c => c.label));
          }
        } catch (completionError) {
          console.warn('Profile completion check failed, using fallback:', completionError);
          // Fallback to old system
          const checklist: Array<{ key: string; ok: boolean; label: string }> = [
            { key: 'profile_photo_url', ok: !!racerProfile?.profile_photo_url, label: 'Profile photo' },
            { key: 'banner_photo_url', ok: !!racerProfile?.banner_photo_url, label: 'Banner photo' },
            { key: 'car_number', ok: !!racerProfile?.car_number, label: 'Car number' },
            { key: 'racing_class', ok: !!racerProfile?.racing_class, label: 'Racing class' },
            { key: 'team_name', ok: !!racerProfile?.team_name, label: 'Team name' },
          ];
          const total = checklist.length;
          const done = checklist.filter(c => c.ok).length;
          setCompletionPct(Math.round((done / total) * 100));
          setMissingFields(checklist.filter(c => !c.ok).map(c => c.label));
        }
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

  // Resolve avatar for meta tags
  const avatarForMetaRaw = profileData?._media?.avatar
    || (profileData as any)?._media?.avatar_url
    || displayUser.avatar
    || profileData?._media?.profile_photo_url
    || '';
  const avatarForMeta = toPublicUrl(avatarForMetaRaw);

  // Compute verified display: backend flag OR (profile complete AND >=10 followers)
  const followersForDisplay = (profileData?.followers_count ?? 0);
  const computedVerified = isVerified || (completionPct >= 100 && followersForDisplay >= 10);

  return (
    <>
      {/* SEO: Open Graph & Twitter meta for racer profiles */}
      <Helmet>
        <title>{`${displayUser.name} (@${displayUser.username}) | OnlyRaceFans`}</title>
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayUser.name} • Racer on OnlyRaceFans`} />
        <meta property="og:description" content={`Follow ${displayUser.name} to see posts, schedule and more.`} />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/racer/${resolvedUserId || userId}`} />
        <meta property="og:image" content={bannerUrl || avatarForMeta} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayUser.name} • Racer on OnlyRaceFans`} />
        <meta name="twitter:description" content={`Follow ${displayUser.name} to see posts, schedule and more.`} />
        <meta name="twitter:image" content={bannerUrl || avatarForMeta} />
      </Helmet>

      <div className="relative h-64 sm:h-72 lg:h-80 -mt-16">
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
                loading="eager"
                decoding="async"
                // @ts-expect-error: experimental property widely supported in modern browsers
                fetchpriority="high"
                width={1920}
                height={320}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
          </div>
        )}
      </div>

      {/* Foreground header content */}
      <div className="relative z-10 px-6 pb-6 pt-0 h-full">
        {/* Owner action buttons (top-right over banner) */}
        {isOwner && (
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {/* Quick actions: edit profile and preview */}
            <button
              onClick={onEditProfile}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900/70 text-gray-100 border border-gray-700 hover:bg-gray-800 transition"
              >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit Profile</span>
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
        <div className="max-w-6xl mx-auto flex flex-col justify-end h-full">
          {/* Top row: avatar + name on left, metrics on right */}
          <div className="flex items-start sm:items-center justify-between gap-4 mb-4 mt-8 sm:mt-0">
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-muted animate-pulse"></div>
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
                      className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover ring-4 ring-primary"
                      loading="eager"
                      decoding="async"
                      // @ts-expect-error: experimental property widely supported in modern browsers
                      fetchpriority="high"
                      width={112}
                      height={112}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full ring-4 ring-primary bg-gray-800 flex items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-gray-200">{initials}</span>
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
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex flex-wrap items-center gap-2">
                        {displayUser.name}
                        {computedVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30" title="Verified racer">
                            <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" /> Verified
                          </span>
                        )}
                      </h1>
                      <span className="ml-2 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">#{displayUser.car_number}</span>
                    </>
                  )}
                </div>
                {loading ? (
                  <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2"></div>
                ) : (
                  <>
                    <p className="text-muted-foreground">@{displayUser.username} • Racer Dashboard</p>
                    {isOwner && completionPct < 100 && (
                      <div className="relative mt-2">
                        <button
                          onClick={() => setShowMissing(v => !v)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700"
                          title="View missing fields"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${completionPct < 30 ? 'bg-red-500' : completionPct < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${completionPct}%` }}
                                />
                              </div>
                              <span>Profile {completionPct}% complete</span>
                            </div>
                          </div>
                        </button>
                        {showMissing && (
                          <div className="absolute z-20 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3">
                            <p className="text-xs text-slate-400 mb-2">Complete these to verify faster:</p>
                            <ul className="space-y-1">
                              {missingFields.map((m) => (
                                <li key={m} className="text-xs text-slate-300 flex items-center gap-2">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" /> {m}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 text-right">
                              <button onClick={onEditProfile} className="text-xs px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white">Complete now</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {displayUser.bio && <p className="text-muted-foreground mt-1">{displayUser.bio}</p>}
                    {/* Metrics directly beneath racer name */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {/* Fans */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400">
                          <Users className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{(displayUser.followers_count || 0).toLocaleString()}</span>
                        <span className="hidden sm:inline">followers</span>
                      </div>
                      {/* Subscribers */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/15 text-purple-400">
                          <Crown className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{(displayUser.subscribers_count || 0).toLocaleString()}</span>
                        <span className="hidden sm:inline">subscribers</span>
                      </div>
                      {/* Total Tips */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/15 text-green-400">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">${(((displayUser.total_tips_cents || 0) / 100).toLocaleString())}</span>
                        <span className="hidden sm:inline">total tips</span>
                      </div>
                      {/* Day Streak */}
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400">
                          <Flame className="w-4 h-4" />
                        </span>
                        <span className="text-foreground font-semibold">{displayUser.streak_days || 0}</span>
                        <span className="hidden sm:inline">day streak</span>
                      </div>
                    </div>
                    {/* Follow/Unfollow button for non-owners */}
                    {!isOwner && viewerId && viewerId !== resolvedUserId && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={toggleFollow}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isFollowing ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                        <div className="relative">
                          <button
                            onClick={handleShareProfile}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
                            title="Share profile"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                          {copiedTooltip && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] rounded bg-slate-800 border border-slate-700 text-slate-200 shadow">
                              Link copied
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {(!viewerId || isOwner || (viewerId && viewerId === resolvedUserId)) && (
                      <div className="mt-3">
                        <div className="relative inline-block">
                          <button
                            onClick={handleShareProfile}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
                            title="Share profile"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                          {copiedTooltip && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] rounded bg-slate-800 border border-slate-700 text-slate-200 shadow">
                              Link copied
                            </span>
                          )}
                        </div>
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
    </>
  );
};
