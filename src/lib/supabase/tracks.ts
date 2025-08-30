import { supabase } from './client';

/**
 * Returns true if the user currently follows the track.
 */
export const checkTrackFollow = async (userId: string, trackId: string): Promise<boolean> => {
  if (!userId || !trackId) return false;
  const { data, error } = await supabase
    .from('track_followers')
    .select('id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[tracks.checkTrackFollow] error:', error);
  }
  return !!data;
};

/**
 * Returns number of followers for the track.
 */
export const getTrackFollowerCount = async (trackId: string): Promise<number> => {
  if (!trackId) return 0;
  const { count, error } = await supabase
    .from('track_followers')
    .select('id', { count: 'exact', head: true })
    .eq('track_id', trackId);

  if (error) {
    console.error('[tracks.getTrackFollowerCount] error:', error);
    return 0;
  }
  return count ?? 0;
};

/**
 * Toggles follow state and returns new state and follower count.
 */
export const toggleTrackFollow = async (
  userId: string,
  trackId: string
): Promise<{ following: boolean; follower_count: number }> => {
  if (!userId || !trackId) return { following: false, follower_count: 0 };

  // Check current state
  const isFollowing = await checkTrackFollow(userId, trackId);

  if (isFollowing) {
    const { error } = await supabase
      .from('track_followers')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);

    if (error) {
      console.error('[tracks.toggleTrackFollow] unfollow error:', error);
    }
  } else {
    const { error } = await supabase
      .from('track_followers')
      .insert({ user_id: userId, track_id: trackId, created_at: new Date().toISOString() });

    if (error) {
      console.error('[tracks.toggleTrackFollow] follow error:', error);
    }
  }

  const follower_count = await getTrackFollowerCount(trackId);
  return { following: !isFollowing, follower_count };
};
