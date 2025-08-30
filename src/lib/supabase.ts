import * as supabase from './supabase/client';
import * as profiles from './supabase/profiles';
import * as posts from './supabase/posts';
import * as storage from './supabase/storage';
import * as tokens from './supabase/tokens';
import * as gifts from './supabase/gifts';
import * as notifications from './supabase/notifications';
import * as fans from './supabase/fans';
import * as schedule from './supabase/schedule';
import * as subscriptions from './supabase/subscriptions';
import * as tracks from './supabase/tracks';
import { supabase as sb } from './supabase/client';

// Backward-compatible barrel exports
// - Directly re-export the Supabase client instance
// - Re-export all functions/types from modular files so named imports keep working

export { supabase } from './supabase/client';

// Feature modules (functions/types)
export * from './supabase/profiles';
export * from './supabase/posts';
export * from './supabase/storage';
export * from './supabase/tokens';
export * from './supabase/gifts';
export * from './supabase/notifications';
export * from './supabase/fans';
export * from './supabase/schedule';
export * from './supabase/subscriptions';
export * from './supabase/tracks';
// Namespace exports for modules consumed as grouped imports (e.g., `gifts as supabaseGifts`)
export { gifts };
export { tokens };

// Type re-exports  
export type { 
  FanStats, 
  DatabasePost, 
  Notification, 
  GiftTransaction, 
  ExtendedUser, 
  PostComment, 
  RaceSchedule,
  VirtualGift,
  UserTokens,
  TokenPurchase,
  LiveStream,
  RacerProfile,
  FanSubscription,
  FanActivity,
  RacerPost,
  RacerFan,
  SubscriptionTier,
  SponsorshipPackage,
  SeriesProfile,
  TrackProfile
} from './supabase/types';

// Add missing notification functions
export const getNotificationsForUser = async (userId: string, limit: number = 20) => {
  return notifications.getNotifications(userId);
};

// Export notifications namespace
export { notifications };

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await sb
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { count, error } = await sb
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  
  if (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
  
  return count || 0;
};

// Add missing fan stats function
export const getRacerFanStats = async (racerId: string) => {
  try {
    const { data, error } = await sb.rpc('get_racer_fan_stats', { racer_uuid: racerId });
    
    if (error) {
      console.error('Error fetching racer fan stats:', error);
      return {
        total_fans: 0,
        super_fans: 0,
        top_superfan_id: undefined,
        top_superfan_name: undefined,
        top_superfan_total: undefined
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getRacerFanStats:', error);
    return {
      total_fans: 0,
      super_fans: 0,
      top_superfan_id: undefined,
      top_superfan_name: undefined,
      top_superfan_total: undefined
    };
  }
};

// Token packages constant
export const TOKEN_PACKAGES = [
  { tokens: 100, price: 9.99, bonus: 0 },
  { tokens: 500, price: 39.99, bonus: 50, popular: true },
  { tokens: 1000, price: 74.99, bonus: 150 },
  { tokens: 2500, price: 174.99, bonus: 500 },
];

// Add missing gift functions - provide mock data for now since tables may not exist or have data
export const getVirtualGifts = async () => {
  try {
    const { data, error } = await sb
      .from('gifts')
      .select('*')
      .order('token_cost', { ascending: true });
    
    if (error || !data || data.length === 0) {
      // Return mock gifts if database is empty or error
      return [
        { id: '1', name: 'Heart', emoji: '❤️', description: 'Show your love!', token_cost: 10, rarity: 'common', image_url: '', is_active: true, created_at: new Date().toISOString() },
        { id: '2', name: 'Star', emoji: '⭐', description: 'You are a star!', token_cost: 25, rarity: 'common', image_url: '', is_active: true, created_at: new Date().toISOString() },
        { id: '3', name: 'Trophy', emoji: '🏆', description: 'Champion!', token_cost: 50, rarity: 'rare', image_url: '', is_active: true, created_at: new Date().toISOString() },
        { id: '4', name: 'Diamond', emoji: '💎', description: 'Precious!', token_cost: 200, rarity: 'legendary', image_url: '', is_active: true, created_at: new Date().toISOString() }
      ];
    }
    
    return (data || []).map(gift => ({
      ...gift,
      emoji: gift.name?.charAt(0) || '🎁',
      description: `A wonderful ${gift.name || 'gift'} for your favorite racer!`,
      rarity: gift.token_cost && gift.token_cost > 100 ? 'rare' : 'common'
    }));
  } catch (error) {
    console.error('Error getting virtual gifts:', error);
    // Return mock data on error
    return [
      { id: '1', name: 'Heart', emoji: '❤️', description: 'Show your love!', token_cost: 10, rarity: 'common', image_url: '', is_active: true, created_at: new Date().toISOString() }
    ];
  }
};

export const getRacerGifts = async (racerId: string) => {
  try {
    const { data, error } = await sb
      .from('virtual_gifts')
      .select(`
        *,
        gifts!virtual_gifts_gift_id_fkey (
          name,
          image_url,
          token_cost
        ),
        profiles!virtual_gifts_sender_id_fkey (
          name,
          avatar
        )
      `)
      .eq('receiver_id', racerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting racer gifts:', error);
      return [];
    }
    
    return (data || []).map(gift => ({
      ...gift,
      gift: gift.gifts ? {
        ...gift.gifts,
        emoji: gift.gifts.name?.charAt(0) || '🎁',
        description: `A wonderful ${gift.gifts.name || 'gift'} for your favorite racer!`,
        rarity: gift.gifts.token_cost && gift.gifts.token_cost > 100 ? 'rare' : 'common'
      } : {
        name: 'Gift',
        image_url: '',
        token_cost: gift.token_amount || 0,
        emoji: '🎁',
        description: 'A wonderful gift!',
        rarity: 'common'
      },
      sender: gift.profiles || { name: 'Anonymous', avatar: '' }
    }));
  } catch (error) {
    console.error('Error getting racer gifts:', error);
    return [];
  }
};

// Add missing fan functions
export const becomeFan = async (fanId: string, racerId: string) => {
  const { data, error } = await sb
    .from('fan_connections')
    .upsert({
      fan_id: fanId,
      racer_id: racerId,
      became_fan_at: new Date().toISOString(),
      is_superfan: false,
      total_tips: 0,
      is_subscribed: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error becoming fan:', error);
    throw error;
  }
  return data;
};

export const unfollowRacer = async (fanId: string, racerId: string) => {
  const { error } = await sb
    .from('fan_connections')
    .delete()
    .eq('fan_id', fanId)
    .eq('racer_id', racerId);
  
  if (error) {
    console.error('Error unfollowing racer:', error);
    throw error;
  }
};

export const checkFanStatus = async (fanId: string, racerId: string) => {
  const { data, error } = await sb
    .from('fan_connections')
    .select('*')
    .eq('fan_id', fanId)
    .eq('racer_id', racerId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking fan status:', error);
    return null;
  }
  return data;
};

export const getRacerFans = async (racerId: string) => {
  const { data, error } = await sb
    .from('fan_connections')
    .select(`
      *,
      profiles!fan_connections_fan_id_fkey (
        name,
        avatar
      )
    `)
    .eq('racer_id', racerId)
    .order('became_fan_at', { ascending: false });
  
  if (error) {
    console.error('Error getting racer fans:', error);
    return [];
  }
  return data || [];
};

// Add missing series and track functions
export const getSeriesProfile = async (seriesId: string) => {
  const { data, error } = await sb
    .from('series_profiles')
    .select('*')
    .eq('id', seriesId)
    .single();
  
  if (error) {
    console.error('Error getting series profile:', error);
    return null;
  }
  return data;
};

export const createSeriesProfile = async (profile: any) => {
  const { data, error } = await sb
    .from('series_profiles')
    .insert([profile])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating series profile:', error);
    throw error;
  }
  return data;
};

export const updateSeriesProfile = async (seriesId: string, updates: any) => {
  const { data, error } = await sb
    .from('series_profiles')
    .update(updates)
    .eq('id', seriesId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating series profile:', error);
    throw error;
  }
  return data;
};

export const getTrackProfile = async (trackId: string) => {
  const { data, error } = await sb
    .from('track_profiles')
    .select('*')
    .eq('id', trackId)
    .single();
  
  if (error) {
    console.error('Error getting track profile:', error);
    return null;
  }
  return data;
};

export const updateTrackProfile = async (trackId: string, updates: any) => {
  const { data, error } = await sb
    .from('track_profiles')
    .update(updates)
    .eq('id', trackId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating track profile:', error);
    throw error;
  }
  return data;
};

export const createTrackPost = async (post: any) => {
  const { data, error } = await sb
    .from('racer_posts')
    .insert([post])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating track post:', error);
    throw error;
  }
  return data;
};

// Explicit re-exports for commonly used track helpers
export { checkTrackFollow, getTrackFollowerCount, toggleTrackFollow } from './supabase/tracks';

// Correct implementation of updateProfile that updates the `profiles` table directly
export const updateProfile = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    console.error('[profiles.updateProfile] error:', error);
    throw error;
  }
  return data;
};

// Sponsorship helpers (to satisfy named imports from the barrel)
export const getRacerSponsorshipSpots = async (racerId: string) => {
  const { data, error } = await sb
    .from('sponsorship_spots')
    .select('*')
    .eq('racer_id', racerId)
    .order('price_per_race', { ascending: true });
  if (error) {
    console.error('[sponsorship.getRacerSponsorshipSpots] error:', error);
    return [] as any[];
  }
  return (data || []) as any[];
};

export const createSponsorshipSpot = async (spot: {
  racer_id: string;
  spot_name: string;
  price_per_race: number;
  position_top: string;
  position_left: string;
  spot_size: 'small' | 'medium' | 'large';
  description?: string;
  is_available?: boolean;
  sponsor_name?: string;
  sponsor_logo_url?: string;
}) => {
  const { data, error } = await sb
    .from('sponsorship_spots')
    .insert([{ ...spot, is_available: spot.is_available ?? true }])
    .select()
    .single();
  if (error) {
    console.error('[sponsorship.createSponsorshipSpot] error:', error);
    throw error;
  }
  return data;
};

export const updateSponsorshipSpot = async (
  spotId: string,
  updates: Partial<{
    spot_name: string;
    price_per_race: number;
    position_top: string;
    position_left: string;
    spot_size: 'small' | 'medium' | 'large';
    description: string;
    is_available: boolean;
    sponsor_name?: string;
    sponsor_logo_url?: string;
  }>
) => {
  const { data, error } = await sb
    .from('sponsorship_spots')
    .update(updates)
    .eq('id', spotId)
    .select()
    .maybeSingle();
  if (error) {
    console.error('[sponsorship.updateSponsorshipSpot] error:', error);
    throw error;
  }
  return data;
};

export const deleteSponsorshipSpot = async (spotId: string) => {
  const { error } = await sb
    .from('sponsorship_spots')
    .delete()
    .eq('id', spotId);
  if (error) {
    console.error('[sponsorship.deleteSponsorshipSpot] error:', error);
    throw error;
  }
  return true;
};

export const createSponsorshipInquiry = async (inquiry: {
  spot_id: string;
  racer_id: string;
  sponsor_name: string;
  sponsor_email: string;
  sponsor_budget?: string;
  message?: string;
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}) => {
  const payload = {
    ...inquiry,
    status: inquiry.status ?? 'pending',
    created_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('sponsorship_inquiries')
    .insert([payload])
    .select()
    .single();
  if (error) {
    console.error('[sponsorship.createSponsorshipInquiry] error:', error);
    throw error;
  }
  return data;
};

// Add missing functions that are imported in components
export const createSponsorshipPackage = async (pkg: any) => {
  const { data, error } = await sb
    .from('sponsorship_packages')
    .insert([pkg])
    .select()
    .single();
  if (error) {
    console.error('[sponsorship.createSponsorshipPackage] error:', error);
    throw error;
  }
  return data;
};

export const updateSponsorshipPackage = async (id: string, updates: any) => {
  const { data, error } = await sb
    .from('sponsorship_packages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('[sponsorship.updateSponsorshipPackage] error:', error);
    throw error;
  }
  return data;
};

export const getRacerSponsorshipPackages = async (racerId: string) => {
  const { data, error } = await sb
    .from('sponsorship_packages')
    .select('*')
    .eq('racer_id', racerId)
    .eq('is_active', true);
  if (error) {
    console.error('[sponsorship.getRacerSponsorshipPackages] error:', error);
    return [];
  }
  return data || [];
};

export const createTransaction = async (transaction: any) => {
  const { data, error } = await sb
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  if (error) {
    console.error('[transactions.createTransaction] error:', error);
    throw error;
  }
  return data;
};

export const calculateRevenueSplit = async (totalCents: number) => {
  const { data, error } = await sb.rpc('calculate_revenue_split', { total_cents: totalCents });
  if (error) {
    console.error('[revenue.calculateRevenueSplit] error:', error);
    return { racer_amount: Math.floor(totalCents * 0.8), platform_amount: Math.floor(totalCents * 0.2) };
  }
  return data;
};

// Add missing fan subscription and activity functions
export const getFanSubscriptions = async (fanId: string) => {
  const { data, error } = await sb
    .from('fan_connections')
    .select(`
      *,
      racer_profiles!fan_connections_racer_id_fkey (
        username,
        profile_photo_url,
        car_number,
        racing_class
      )
    `)
    .eq('fan_id', fanId)
    .eq('is_subscribed', true);
  
  if (error) {
    console.error('Error getting fan subscriptions:', error);
    return [];
  }
  return data || [];
};

export const getFanActivity = async (fanId: string) => {
  const { data, error } = await sb
    .from('fan_activity')
    .select('*')
    .eq('fan_id', fanId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error getting fan activity:', error);
    return [];
  }
  return data || [];
};

export const getFanNotifications = async (fanId: string) => {
  return getNotificationsForUser(fanId);
};

// Earnings and transactions helpers/types
export type RacerEarnings = {
  total_earnings_cents: number;
  pending_payout_cents: number;
  subscription_earnings_cents: number;
  tip_earnings_cents: number;
  sponsorship_earnings_cents: number;
  stripe_account_id?: string | null;
};

export const getRacerEarnings = async (racerId: string): Promise<RacerEarnings> => {
  // Default structure to avoid UI crashes
  const defaults: RacerEarnings = {
    total_earnings_cents: 0,
    pending_payout_cents: 0,
    subscription_earnings_cents: 0,
    tip_earnings_cents: 0,
    sponsorship_earnings_cents: 0,
    stripe_account_id: null,
  };

  try {
    // Prefer RPC if available
    const { data, error } = await sb.rpc('get_racer_earnings', { p_racer_id: racerId }).maybeSingle();
    if (!error && data) {
      return Object.assign({}, defaults, data || {}) as RacerEarnings;
    }
  } catch (e) {
    // ignore and fallback
  }

  try {
    // Fallback: aggregate from transactions table if it exists
    const { data, error } = await sb
      .from('transactions')
      .select('transaction_type, racer_amount_cents')
      .eq('racer_id', racerId);
    if (!error && data) {
      const sums = data.reduce(
        (acc: any, row: any) => {
          const cents = Number(row.racer_amount_cents) || 0;
          acc.total += cents;
          if (row.transaction_type === 'subscription') acc.sub += cents;
          else if (row.transaction_type === 'tip') acc.tip += cents;
          else if (row.transaction_type === 'sponsorship') acc.spon += cents;
          return acc;
        },
        { total: 0, sub: 0, tip: 0, spon: 0 }
      );

      // Try to fetch optional stripe account id if present
      let stripeId: string | null = null;
      try {
        const { data: rp } = await sb
          .from('racer_profiles')
          .select('stripe_account_id')
          .eq('id', racerId)
          .maybeSingle();
        stripeId = (rp as any)?.stripe_account_id ?? null;
      } catch {}

      return {
        total_earnings_cents: sums.total,
        pending_payout_cents: 0, // if needed, add logic based on payout schedule
        subscription_earnings_cents: sums.sub,
        tip_earnings_cents: sums.tip,
        sponsorship_earnings_cents: sums.spon,
        stripe_account_id: stripeId,
      };
    }
  } catch (e) {
    console.error('[earnings.getRacerEarnings] fallback aggregation error:', e);
  }

  return defaults;
};

export const getRacerTransactions = async (racerId: string) => {
  try {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .eq('racer_id', racerId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[earnings.getRacerTransactions] error:', error);
      return [] as any[];
    }
    return (data || []) as any[];
  } catch (e) {
    console.error('[earnings.getRacerTransactions] unexpected error:', e);
    return [] as any[];
  }
};

// Remove this duplicate function - use the one above at line 146

// --- Batch helpers expected by App.tsx ---
export const getSubscriptionTiersForRacers = async (
  racerIds: string[]
): Promise<Record<string, any[]>> => {
  if (!Array.isArray(racerIds) || racerIds.length === 0) return {};
  try {
    const { data, error } = await sb
      .from('subscription_tiers')
      .select('*')
      .in('racer_id', racerIds)
      .eq('is_active', true)
      .order('price_cents', { ascending: true });
    if (error) {
      console.error('[subscriptions.getSubscriptionTiersForRacers] error:', error);
      return {};
    }
    const map: Record<string, any[]> = {};
    for (const row of data || []) {
      const rid = (row as any).racer_id;
      if (!map[rid]) map[rid] = [];
      map[rid].push(row);
    }
    return map;
  } catch (e) {
    console.error('[subscriptions.getSubscriptionTiersForRacers] unexpected error:', e);
    return {};
  }
};

export const getFanCountsForRacers = async (
  racerIds: string[]
): Promise<Record<string, number>> => {
  if (!Array.isArray(racerIds) || racerIds.length === 0) return {};
  try {
    // Fetch connections for all provided racer IDs and aggregate in-memory
    const { data, error } = await sb
      .from('fan_connections')
      .select('racer_id')
      .in('racer_id', racerIds);
    if (error) {
      console.error('[fans.getFanCountsForRacers] error:', error);
      return {};
    }
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const rid = (row as any).racer_id as string;
      counts[rid] = (counts[rid] || 0) + 1;
    }
    // Ensure all requested IDs exist in the map
    for (const id of racerIds) if (!(id in counts)) counts[id] = 0;
    return counts;
  } catch (e) {
    console.error('[fans.getFanCountsForRacers] unexpected error:', e);
    return {};
  }
};

// --- Fan profile helper expected by FanSetup.tsx ---
export const createFanProfile = async (payload: {
  id: string;
  location?: string;
  favorite_classes?: string[];
  favorite_tracks?: string[];
  followed_racers?: string[];
  why_i_love_racing?: string;
  profile_photo_url?: string;
}) => {
  try {
    const { data, error } = await sb
      .from('fans')
      .upsert({
        id: payload.id,
        location: payload.location ?? null,
        favorite_classes: payload.favorite_classes ?? [],
        favorite_tracks: payload.favorite_tracks ?? [],
        followed_racers: payload.followed_racers ?? [],
        why_i_love_racing: payload.why_i_love_racing ?? null,
        profile_photo_url: payload.profile_photo_url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();
    if (error) {
      console.error('[fans.createFanProfile] error:', error);
      throw error;
    }
    return data;
  } catch (e) {
    console.error('[fans.createFanProfile] unexpected error:', e);
    throw e;
  }
};

// Add missing post functions
export const addPostComment = async (postId: string, userId: string, content: string) => {
  const { data, error } = await sb
    .from('post_interactions')
    .insert([{
      post_id: postId,
      user_id: userId,
      interaction_type: 'comment',
      comment_text: content
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding post comment:', error);
    throw error;
  }
  return data;
};
