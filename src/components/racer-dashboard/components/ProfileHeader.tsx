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
          .select('id, name, username, avatar, bio')
          .eq('id', resolvedUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // Fetch racer specific data
        const { data: racerData, error: racerError } = await supabase
          .from('racer_profiles')
          .select('car_number, racing_class, team')
          .eq('user_id', resolvedUserId)
          .single();
          
        if (racerError && racerError.code !== 'PGRST116') {
          console.error('Error fetching racer profile:', racerError);
        }
        
        // Fetch follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('fan_follows')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', resolvedUserId);
          
        if (followerError) {
          console.error('Error fetching follower count:', followerError);
        }
        
        // Fetch streak days (activity streak)
        const { data: streakData, error: streakError } = await supabase
          .from('user_activity_streaks')
          .select('streak_days')
          .eq('user_id', resolvedUserId)
          .single();
          
        if (streakError && streakError.code !== 'PGRST116') {
          console.error('Error fetching streak data:', streakError);
        }
        
        // Combine all data
        setProfileData({
          id: profileData.id,
          name: profileData.name || 'Racer',
          username: profileData.username || 'racer',
          avatar: profileData.avatar || '',
          bio: profileData.bio || '',
          car_number: racerData?.car_number || '00',
          racing_class: racerData?.racing_class || '',
          team: racerData?.team || '',
          followers_count: followerCount || 0,
          streak_days: streakData?.streak_days || 0
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
    <div className="bg-slate-900 border-b border-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          {loading ? (
            <div className="w-16 h-16 rounded-2xl bg-slate-800 animate-pulse"></div>
          ) : (
            <img
              src={displayUser.avatar || 'https://placehold.co/128x128?text=Racer'}
              alt={displayUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center">
              {loading ? (
                <div className="h-8 w-32 bg-slate-800 rounded animate-pulse"></div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white racing-number">{displayUser.name}</h1>
                  <span className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">#{displayUser.car_number}</span>
                </>
              )}
            </div>
            {loading ? (
              <div className="h-4 w-48 bg-slate-800 rounded animate-pulse mt-2"></div>
            ) : (
              <>
                <p className="text-slate-400">@{displayUser.username} • Racer Dashboard</p>
                {displayUser.bio && <p className="text-slate-300 mt-1">{displayUser.bio}</p>}
              </>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                {loading ? (
                  <div className="h-6 w-12 bg-slate-800 rounded animate-pulse mx-auto mb-1"></div>
                ) : (
                  <div className="text-2xl font-bold text-blue-500 racing-number">{displayUser.followers_count.toLocaleString()}</div>
                )}
                <div className="text-xs text-slate-400">Followers</div>
              </div>
              <div className="text-center">
                {loading ? (
                  <div className="h-6 w-12 bg-slate-800 rounded animate-pulse mx-auto mb-1"></div>
                ) : (
                  <div className="text-2xl font-bold text-blue-400 racing-number flex items-center">
                    <Flame className="w-6 h-6 mr-1" />
                    {displayUser.streak_days}
                  </div>
                )}
                <div className="text-xs text-slate-400">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
