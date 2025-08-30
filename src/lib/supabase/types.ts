export interface Profile {
  id: string;
  user_type: 'racer' | 'fan' | 'track';
  name: string;
  email: string;
  avatar?: string;
  banner_image?: string;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface RacerProfile {
  id: string;
  username?: string;
  bio?: string;
  car_number?: string;
  racing_class?: string;
  hometown?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  team_name?: string;
  profile_photo_url?: string;
  banner_photo_url?: string;
  main_sponsor_photo_url?: string;
  car_photos: string[];
  monetization_enabled: boolean;
  support_tiers: Array<{
    name: string;
    price: number;
    description: string;
  }>;
  thank_you_message?: string;
  social_links: Record<string, string>;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  career_wins?: number;
  podiums?: number;
  championships?: number;
  years_racing?: number;
  career_history?: string;
  highlights?: string;
  achievements?: string;
  is_featured?: boolean;
  profile_published?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FanProfile {
  id: string;
  location?: string;
  favorite_classes: string[];
  favorite_tracks: string[];
  followed_racers: string[];
  why_i_love_racing?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackProfile {
  id: string;
  track_name?: string;
  contact_person?: string;
  track_type?: string;
  location?: string;
  contact_email?: string;
  website?: string;
  classes_hosted: string[];
  track_logo_url?: string;
  banner_photo_url?: string;
  featured_racers: string[];
  sponsors: Array<{
    name: string;
    website?: string;
    logo_url?: string;
  }>;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface RaceSchedule {
  id: string;
  racer_id?: string;
  track_id?: string;
  event_name: string;
  track_name: string;
  event_date: string;
  event_time?: string;
  location?: string;
  created_at?: string;
}

export interface SeriesProfile {
  id: string;
  series_name: string;
  description?: string;
  series_type: string;
  headquarters?: string;
  founded?: number;
  contact_email?: string;
  contact_person?: string;
  contact_phone?: string;
  website?: string;
  series_logo_url?: string;
  banner_photo_url?: string;
  social_links?: Record<string, string>;
  featured_racers?: string[];
  featured_tracks?: string[];
  total_purse_cents?: number;
  championship_purse_cents?: number;
  total_events?: number;
  profile_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabasePost {
  id: string;
  created_at: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  fan_id?: string;
  racer_id?: string;
  profiles?: { id: string; name: string; user_type: string; avatar: string };
  racer?: { id: string; username: string; profile_photo_url: string };
}

export interface SubscriptionTier {
  id: string;
  racer_id: string;
  tier_name: string;
  price_cents: number;
  description: string;
  benefits: string[];
  is_active: boolean;
  stripe_price_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FanConnection {
  id: string;
  fan_id: string;
  racer_id: string;
  became_fan_at: string;
  is_superfan: boolean;
  last_support_date?: string;
  total_tips: number;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FanStats {
  total_fans: number;
  super_fans: number;
  top_superfan_id?: string;
  top_superfan_name?: string;
  top_superfan_total?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'sponsorship_inquiry' | 'new_superfan' | 'new_fan' | 'tip_received' | 'post_like' | 'new_comment';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string;
  };
}

export interface RacerFan {
  fan_id: string;
  name: string;
  profile_picture: string;
  created_at: string;
  is_superfan: boolean;
}
