import React, { useState, useEffect } from 'react';
import { Flame, Users, Crown, DollarSign } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ProfileHeaderProps {
  userId: string;
}

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
  // Optional UI media fields
  banner?: string;
  banner_image?: string;
  bannerUrl?: string;
  subscribers_count?: number;
  total_tips_cents?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<RacerProfileData | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  // Resolve current user id if requested
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userId && userId !== 'current-user') {
        if (!cancelled) setResolvedUserId(userId);
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (!cancelled) {
        setResolvedUserId(data?.user?.id ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!resolvedUserId) return;
      
      setLoading(true);
      try {
        // Fetch basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar, user_type, banner, banner_image, bannerUrl')
          .eq('id', resolvedUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // Create a username from email if not available
        const username = profileData.email?.split('@')[0] || 'racer';
        
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
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', resolvedUserId)
          .eq('status', 'active');
        if (subsError) {
          console.error('Error fetching subscribers count:', subsError);
        }

        // Fetch total tips (assume cents if available, else dollars)
        let totalTipsCents = 0;
        const { data: tipsSumCents, error: tipsCentsErr } = await supabase
          .from('tips')
          .select('amount_cents')
          .eq('racer_id', resolvedUserId);
        if (!tipsCentsErr && Array.isArray(tipsSumCents)) {
          totalTipsCents = tipsSumCents.reduce((acc: number, r: any) => acc + (r?.amount_cents || 0), 0);
        } else {
          // try amount (dollars) as fallback
          const { data: tipsSum, error: tipsErr } = await supabase
            .from('tips')
            .select('amount')
            .eq('racer_id', resolvedUserId);
          if (!tipsErr && Array.isArray(tipsSum)) {
            totalTipsCents = tipsSum.reduce((acc: number, r: any) => acc + Math.round(((r?.amount || 0) * 100)), 0);
          }
        }

        // Combine all data
        setProfileData({
          id: profileData.id,
          name: profileData.name || 'Racer',
          username: username,
          avatar: profileData.avatar || '',
          bio: `${profileData.user_type} profile`,
          car_number: '00', // Default car number
          racing_class: 'Open Class', // Default racing class
          team: 'Independent', // Default team
          followers_count: followerCount || 0,
          streak_days: streakData?.current_streak || 0,
          subscribers_count: subscribersCount || 0,
          total_tips_cents: totalTipsCents || 0
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

  // Prefer a dedicated banner field if present, else fall back to avatar, else placeholder
  const bannerUrl = profileData?.banner
    || profileData?.banner_image
    || profileData?.bannerUrl
    || displayUser.avatar
    || '';

  return (
    <div className="relative border-b border-border min-h-[320px] md:min-h-[380px]">
      {/* Full-bleed banner background */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse"></div>
        ) : (
          <div className="w-full h-full relative">
            <img
              src={bannerUrl || 'https://placehold.co/1200x300?text=Racer+Banner'}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
          </div>
        )}
      </div>

      {/* Foreground header content */}
      <div className="relative z-10 p-6 h-full">
        <div className="max-w-6xl mx-auto flex flex-col justify-end min-h-[320px] md:min-h-[380px]">
          {/* Top row: avatar + name on left, metrics on right */}
          <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-24 h-24 rounded-2xl bg-muted animate-pulse"></div>
              ) : (
                <img
                  src={displayUser.avatar || 'https://placehold.co/128x128?text=Racer'}
                  alt={displayUser.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary"
                />
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
