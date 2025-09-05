import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
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
          .select('id, name, email, avatar, user_type')
          .eq('id', resolvedUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // Create a username from email if not available
        const username = profileData.email?.split('@')[0] || 'racer';
        
        // Fetch follower count from fan_connections
        const { count: followerCount, error: followerError } = await supabase
          .from('fan_connections')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', resolvedUserId);
          
        if (followerError) {
          console.error('Error fetching follower count:', followerError);
        }
        
        // Fetch streak days from fan_streaks (if they exist)
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
          streak_days: streakData?.current_streak || 0
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

  return (
    <div className="bg-card border-b border-border p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          {loading ? (
            <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse"></div>
          ) : (
            <img
              src={displayUser.avatar || 'https://placehold.co/128x128?text=Racer'}
              alt={displayUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary"
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
                {displayUser.bio && <p className="text-foreground mt-1">{displayUser.bio}</p>}
              </>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                {loading ? (
                  <div className="h-6 w-12 bg-muted rounded animate-pulse mx-auto mb-1"></div>
                ) : (
                  <div className="text-2xl font-bold text-primary">{displayUser.followers_count.toLocaleString()}</div>
                )}
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                {loading ? (
                  <div className="h-6 w-12 bg-muted rounded animate-pulse mx-auto mb-1"></div>
                ) : (
                  <div className="text-2xl font-bold text-primary flex items-center">
                    <Flame className="w-6 h-6 mr-1" />
                    {displayUser.streak_days}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
