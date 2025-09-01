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
  if (!userId) {
    console.warn('getUnreadNotificationCount called with no userId');
    return 0;
  }

  // Retry logic
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Check if we have a valid session first
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        console.warn('No active session when fetching notification count');
        return 0;
      }
      
      // Use planned/estimated count to reduce compute overhead
      const { count, error } = await sb
        .from('notifications')
        .select('id', { count: 'planned' })
        .eq('user_id', userId)
        .eq('read', false)
        .limit(1); // minimize payload
      
      if (error) {
        if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
          console.warn(`Retry ${retries + 1}/${maxRetries} for notification count`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        }
        console.error('Error getting unread notification count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (err) {
      if (retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} for notification count after exception`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      console.error('Exception getting unread notification count:', err);
      return 0;
    }
  }
  
  return 0;
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

export const getRacerGifts = async (racerId: string, limit: number = 50) => {
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
      .order('created_at', { ascending: false })
      .limit(limit);
    
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

export const getRacerFans = async (racerId: string, limit: number = 100) => {
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
    .order('became_fan_at', { ascending: false })
    .limit(limit);
  
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

export const updateSeriesProfile = async (
  seriesId: string,
  updates: Partial<{
    series_name: string;
    contact_person: string | null;
    category: string | null;
    season: string | null;
    phone?: string | null;
    website?: string | null;
    show_contact_for_sponsorship?: boolean;
  }>
) => {
  try {
    if (!seriesId) throw new Error('seriesId is required');

    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Authentication required');

    // Only persist known fields to avoid accidental broad updates
    const allowed: Record<string, any> = {};
    const keys: (keyof typeof updates)[] = [
      'series_name',
      'contact_person',
      'category',
      'season',
      'phone',
      'website',
      'show_contact_for_sponsorship',
    ];
    for (const k of keys) {
      if (k in updates) (allowed as any)[k] = (updates as any)[k];
    }
    (allowed as any).updated_at = new Date().toISOString();

    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
      try {
        const { data, error } = await sb
          .from('series_profiles')
          .update(allowed)
          .eq('id', seriesId)
          .select('*')
          .single();
        if (error) {
          if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          console.error('Error updating series profile:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (retries < maxRetries - 1) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Maximum retries reached while updating series profile');
  } catch (e) {
    console.error('[series.updateSeriesProfile] error:', e);
    throw e;
  }
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

export const createTrackPost = async (post: any): Promise<{ data: any | null; error: any | null }> => {
  try {
    // Validate required fields
    if (!post.racer_id) {
      return { data: null, error: { message: 'Track ID is required' } };
    }
    
    // Check if we have a valid session first
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required to create track posts' } };
    }
    
    // Create the post with retry logic
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { data, error } = await sb.from('racer_posts').insert([post]).select();
        
        if (error) {
          if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
            console.warn(`Network error creating track post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
            continue;
          }
          
          console.error('Error creating track post:', error);
          return { data: null, error };
        }
        
        return { data, error: null };
      } catch (err) {
        if (retries < maxRetries - 1) {
          console.warn(`Unexpected error creating track post, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Exception creating track post:', err);
        return { 
          data: null, 
          error: { message: err instanceof Error ? err.message : 'Unknown error creating track post' } 
        };
      }
    }
    
    return { data: null, error: { message: 'Maximum retries reached while creating track post' } };
  } catch (err) {
    console.error('Unhandled exception in createTrackPost:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Unknown error creating track post' } 
    };
  }
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
export const getFanSubscriptions = async (fanId: string, limit: number = 100) => {
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
    .eq('is_subscribed', true)
    .order('became_fan_at', { ascending: false })
    .limit(limit);
  
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

export const getRacerTransactions = async (racerId: string, limit: number = 100) => {
  try {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .eq('racer_id', racerId)
      .order('created_at', { ascending: false })
      .limit(limit);
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
    // Prefer RPC for server-side aggregation if available
    try {
      const { data: rpcData, error: rpcError } = await sb
        .rpc('get_fan_counts', { racer_ids: racerIds });
      if (!rpcError && Array.isArray(rpcData)) {
        const map: Record<string, number> = {};
        for (const row of rpcData as any[]) {
          map[row.racer_id] = Number(row.fan_count) || 0;
        }
        // Ensure all requested IDs exist in the map
        for (const id of racerIds) if (!(id in map)) map[id] = 0;
        return map;
      }
    } catch (_) {
      // fall through to client-side fallback
    }

    // Fallback: minimal select + in-memory count
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

export const addPostComment = async (postId: string, userId: string, content: string): Promise<{ data: any | null; error: any | null }> => {
  try {
    // Validate required fields
    if (!postId || !userId || !content) {
      return { 
        data: null, 
        error: { message: 'Post ID, user ID, and comment content are required' } 
      };
    }
    
    // Check if we have a valid session first
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required to add comments' } };
    }
    
    // Ensure the authenticated user matches the userId
    if (session.user.id !== userId) {
      return { data: null, error: { message: 'You can only add comments as yourself' } };
    }
    
    // Add comment with retry logic
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { data, error } = await sb
          .from('post_interactions')
          .insert([{
            post_id: postId,
            user_id: userId,
            interaction_type: 'comment',
            comment_text: content
          }])
          .select();
        
        if (error) {
          if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
            console.warn(`Network error adding comment, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
            continue;
          }
          
          console.error('Error adding post comment:', error);
          return { data: null, error };
        }
        
        return { data: data?.[0] || null, error: null };
      } catch (err) {
        if (retries < maxRetries - 1) {
          console.warn(`Unexpected error adding comment, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Exception adding post comment:', err);
        return { 
          data: null, 
          error: { message: err instanceof Error ? err.message : 'Unknown error adding comment' } 
        };
      }
    }
    
    return { data: null, error: { message: 'Maximum retries reached while adding comment' } };
  } catch (err) {
    console.error('Unhandled exception in addPostComment:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Unknown error adding comment' } 
    };
  }
};

// Minimal helper to create a notification (useful for testing Realtime and reducing ad-hoc SQL)
export const createNotification = async (params: {
  user_id: string;
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, any>;
}): Promise<{ data: any | null; error: any | null }> => {
  try {
    if (!params?.user_id || !params?.type) {
      return { data: null, error: { message: 'user_id and type are required' } };
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const payload = {
      user_id: params.user_id,
      type: params.type,
      title: params.title ?? null,
      message: params.message ?? null,
      data: params.data ?? null,
      read: false,
      created_at: new Date().toISOString(),
    };

    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
      try {
        const { data, error } = await sb
          .from('notifications')
          .insert([payload])
          .select('id, user_id, type, title, message, read, created_at')
          .single();
        if (error) {
          if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { data: null, error };
        }
        return { data, error: null };
      } catch (err) {
        if (retries < maxRetries - 1) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
      }
    }
    return { data: null, error: { message: 'Maximum retries reached creating notification' } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

// Subscribed-only fan counts via RPC with safe fallback
export const getSubscribedFanCountsForRacers = async (
  racerIds: string[]
): Promise<Record<string, number>> => {
  if (!Array.isArray(racerIds) || racerIds.length === 0) return {};
  try {
    // Try RPC first (server-side aggregation)
    try {
      const { data: rpcData, error: rpcError } = await sb
        .rpc('get_subscribed_fan_counts', { racer_ids: racerIds });
      if (!rpcError && Array.isArray(rpcData)) {
        const map: Record<string, number> = {};
        for (const row of rpcData as any[]) {
          map[(row as any).racer_id] = Number((row as any).subscribed_count) || 0;
        }
        for (const id of racerIds) if (!(id in map)) map[id] = 0;
        return map;
      }
    } catch (_) {
      // fall through
    }

    // Fallback: minimal select and in-memory count
    const { data, error } = await sb
      .from('fan_connections')
      .select('racer_id')
      .in('racer_id', racerIds)
      .eq('is_subscribed', true);
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of (data || []) as any[]) {
      const rid = (row as any).racer_id as string;
      counts[rid] = (counts[rid] || 0) + 1;
    }
    for (const id of racerIds) if (!(id in counts)) counts[id] = 0;
    return counts;
  } catch (e) {
    console.error('[fans.getSubscribedFanCountsForRacers] error:', e);
    // Return zeros to keep UI resilient
    return racerIds.reduce((acc, id) => { acc[id] = 0; return acc; }, {} as Record<string, number>);
  }
};

// Daily fan counts (total and subscribed) from materialized view
export const getDailyFanCounts = async (
  racerId: string,
  options?: { since?: string; until?: string; limit?: number }
): Promise<Array<{ day: string; total_fans: number; subscribed_fans: number }>> => {
  try {
    let q = sb
      .from('mv_fan_counts_daily')
      .select('day, total_fans, subscribed_fans')
      .eq('racer_id', racerId)
      .order('day', { ascending: true });

    if (options?.since) q = q.gte('day', options.since);
    if (options?.until) q = q.lte('day', options.until);
    if (options?.limit) q = q.limit(options.limit);

    const { data, error } = await q;
    if (error) {
      console.error('[fans.getDailyFanCounts] error:', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      day: r.day,
      total_fans: Number(r.total_fans) || 0,
      subscribed_fans: Number(r.subscribed_fans) || 0,
    }));
  } catch (e) {
    console.error('[fans.getDailyFanCounts] exception:', e);
    return [];
  }
};
