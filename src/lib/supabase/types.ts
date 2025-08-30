export type { Database } from '../../integrations/supabase/types';

// Additional types for UI components
export interface FanStats {
  fan_id: string;
  total_tips: number;
  active_subscriptions: number;
  support_points: number;
  activity_streak: number;
  created_at: string;
  updated_at: string;
  total_fans?: number;
  super_fans?: number;
  top_superfan_id?: string;
  top_superfan_name?: string;
  top_superfan_total?: number;
}

export interface DatabasePost {
  id: string;
  created_at: string;
  content: string;
  media_urls?: string[] | null;
  likes_count: number;
  racer_id?: string;
  fan_id?: string;
  visibility?: string;
  user_type?: 'racer' | 'fan' | 'track';
  post_type?: string;
  comments_count?: number;
  total_tips?: number;
  allow_tips?: boolean;
  racer?: {
    username?: string;
    profile_photo_url?: string;
    car_number?: string;
  };
  profiles?: {
    name?: string;
    avatar?: string;
    username?: string;
    profile_photo_url?: string;
    user_type?: string;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  comment_text?: string;
  created_at: string;
  user?: {
    name?: string;
    avatar?: string;
  };
  profiles?: {
    name?: string;
    avatar?: string;
    avatar_url?: string;
  };
}

export interface LiveStream {
  id: string;
  streamer_id: string;
  title: string;
  description?: string;
  is_live: boolean;
  viewer_count: number;
  stream_key?: string;
  thumbnail_url?: string;
  started_at: string;
  ended_at?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  message?: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  description: string;
  token_cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
}

export interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  token_amount: number;
  message?: string;
  created_at: string;
  is_public?: boolean;
  racer_token_amount?: number;
  platform_token_amount?: number;
  gift?: VirtualGift;
  sender?: { name?: string; avatar?: string };
}

export interface ExtendedUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  user_type?: string;
}

export interface RaceSchedule {
  id: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  track_name: string;
  location?: string;
  track_id?: string;
  racer_id?: string;
  created_at: string;
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  token_amount: number;
  price_cents: number;
  status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface UserTokens {
  user_id: string;
  token_balance: number;
  total_purchased: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipPackage {
  id: string;
  racer_id: string;
  package_name: string;
  description?: string;
  price_cents: number;
  duration_races: number;
  car_placement?: string;
  benefits?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  racer_id: string;
  tier_name: string;
  name?: string;
  description?: string;
  price_cents: number;
  benefits: string[];
  is_active: boolean;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RacerEarnings {
  id: string;
  racer_id: string;
  total_earnings_cents: number;
  subscription_earnings_cents: number;
  tip_earnings_cents: number;
  sponsorship_earnings_cents: number;
  pending_payout_cents: number;
  total_paid_out_cents: number;
  last_payout_at?: string;
  stripe_account_id?: string;
  payout_schedule: string;
  created_at: string;
  updated_at: string;
}

// Database table types from Supabase
export type RacerProfile = {
  id: string;
  username?: string;
  bio?: string;
  car_number?: string;
  racing_class?: string;
  hometown?: string;
  team_name?: string;
  profile_photo_url?: string;
  banner_photo_url?: string;
  main_sponsor_photo_url?: string;
  thank_you_message?: string;
  career_wins: number;
  podiums: number;
  championships: number;
  years_racing: number;
  achievements?: string;
  highlights?: string;
  career_history?: string;
  social_links?: any;
  support_tiers?: any;
  monetization_enabled: boolean;
  profile_published: boolean;
  is_featured: boolean;
  car_photos?: any;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
};

export interface FanSubscription {
  id: string;
  fan_id: string;
  racer_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'paused';
  created_at: string;
  updated_at: string;
  racerId?: string;
  racerName?: string;
  racerImage?: string;
  carNumber?: string;
  racingClass?: string;
  subscriptionTier?: string;
  monthlyAmount?: number;
  nextBilling?: string;
  totalTipped?: number;
  subscribedAt?: string;
}

export interface FanActivity {
  id: string;
  fan_id: string;
  activity_type: 'tip' | 'subscription' | 'follow' | 'comment' | 'like';
  details: Record<string, any>;
  created_at: string;
  type?: string;
  action?: string;
  date?: string;
  amount?: number;
  racer_profile?: {
    username: string;
    profile_photo_url?: string;
  };
}

export interface RacerPost {
  id: string;
  racer_id: string;
  content: string;
  post_type: string;
  visibility: string;
  media_urls?: any;
  likes_count: number;
  comments_count: number;
  total_tips: number;
  allow_tips: boolean;
  created_at: string;
  updated_at: string;
}

export interface RacerFan {
  id: string;
  fan_id: string;
  racer_id: string;
  total_tips: number;
  is_subscribed: boolean;
  is_superfan: boolean;
  last_support_date?: string;
  became_fan_at: string;
  created_at: string;
  updated_at: string;
  profile_picture?: string;
  name?: string;
}

export interface SeriesProfile {
  id: string;
  series_name: string;
  description?: string;
  series_type: string;
  headquarters?: string;
  founded?: number;
  series_logo_url?: string;
  banner_photo_url?: string;
  website?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  social_links?: any;
  featured_racers?: string[];
  featured_tracks?: string[];
  total_events: number;
  championship_purse_cents: number;
  total_purse_cents: number;
  profile_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackProfile {
  id: string;
  track_name: string;
  track_type: string;
  location?: string;
  track_logo_url?: string;
  banner_photo_url?: string;
  website?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  social_links?: any;
  track_length?: string;
  surface_type?: string;
  banking?: string;
  seating_capacity?: number;
  elevation?: number;
  established?: number;
  profile_published: boolean;
  created_at: string;
  updated_at: string;
}