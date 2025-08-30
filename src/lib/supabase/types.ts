export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      fan_activity: {
        Row: {
          activity_type: string | null
          created_at: string | null
          details: Json | null
          fan_id: string | null
          id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          details?: Json | null
          fan_id?: string | null
          id?: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          details?: Json | null
          fan_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_activity_fan_id_fkey"
            columns: ["fan_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      fan_connections: {
        Row: {
          became_fan_at: string | null
          fan_id: string | null
          id: string
          is_subscribed: boolean | null
          is_superfan: boolean | null
          racer_id: string | null
          total_tips: number | null
        }
        Insert: {
          became_fan_at?: string | null
          fan_id?: string | null
          id?: string
          is_subscribed?: boolean | null
          is_superfan?: boolean | null
          racer_id?: string | null
          total_tips?: number | null
        }
        Update: {
          became_fan_at?: string | null
          fan_id?: string | null
          id?: string
          is_subscribed?: boolean | null
          is_superfan?: boolean | null
          racer_id?: string | null
          total_tips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_connections_fan_id_fkey"
            columns: ["fan_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_connections_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      fans: {
        Row: {
          favorite_classes: string[] | null
          favorite_tracks: string[] | null
          followed_racers: string[] | null
          id: string
          location: string | null
          profile_photo_url: string | null
          updated_at: string | null
          why_i_love_racing: string | null
        }
        Insert: {
          favorite_classes?: string[] | null
          favorite_tracks?: string[] | null
          followed_racers?: string[] | null
          id: string
          location?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          why_i_love_racing?: string | null
        }
        Update: {
          favorite_classes?: string[] | null
          favorite_tracks?: string[] | null
          followed_racers?: string[] | null
          id?: string
          location?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          why_i_love_racing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fans_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      gifts: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string | null
          token_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          token_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          token_cost?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          read: boolean | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          read?: boolean | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          read?: boolean | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          racer_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          racer_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          racer_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      racer_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          racer_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          racer_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          racer_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racer_posts_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      racer_profiles: {
        Row: {
          about: string | null
          banner_photo_url: string | null
          birthdate: string | null
          car_number: string | null
          car_photo_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          facebook_url: string | null
          gender: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          racing_class: string | null
          stripe_account_id: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          youtube_url: string | null
        }
        Insert: {
          about?: string | null
          banner_photo_url?: string | null
          birthdate?: string | null
          car_number?: string | null
          car_photo_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          facebook_url?: string | null
          gender?: string | null
          id: string
          instagram_url?: string | null
          is_active?: boolean | null
          racing_class?: string | null
          stripe_account_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          youtube_url?: string | null
        }
        Update: {
          about?: string | null
          banner_photo_url?: string | null
          birthdate?: string | null
          car_number?: string | null
          car_photo_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          facebook_url?: string | null
          gender?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          racing_class?: string | null
          stripe_account_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racer_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      series_profiles: {
        Row: {
          banner_photo_url: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          banner_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          banner_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      sponsorship_inquiries: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          racer_id: string | null
          sponsor_budget: string | null
          sponsor_email: string | null
          sponsor_name: string | null
          spot_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          sponsor_budget?: string | null
          sponsor_email?: string | null
          sponsor_name?: string | null
          spot_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          sponsor_budget?: string | null
          sponsor_email?: string | null
          sponsor_name?: string | null
          spot_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_inquiries_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_inquiries_spot_id_fkey"
            columns: ["spot_id"]
            referencedRelation: "sponsorship_spots"
            referencedColumns: ["id"]
          }
        ]
      }
      sponsorship_packages: {
        Row: {
          car_placement: string | null
          created_at: string | null
          description: string | null
          digital_benefits: string[] | null
          duration_races: number | null
          id: string
          is_active: boolean | null
          package_name: string | null
          price_per_race: number | null
          racer_id: string | null
          updated_at: string | null
          visibility_benefits: string[] | null
        }
        Insert: {
          car_placement?: string | null
          created_at?: string | null
          description?: string | null
          digital_benefits?: string[] | null
          duration_races?: number | null
          id?: string
          is_active?: boolean | null
          package_name?: string | null
          price_per_race?: number | null
          racer_id?: string | null
          updated_at?: string | null
          visibility_benefits?: string[] | null
        }
        Update: {
          car_placement?: string | null
          created_at?: string | null
          description?: string | null
          digital_benefits?: string[] | null
          duration_races?: number | null
          id?: string
          is_active?: boolean | null
          package_name?: string | null
          price_per_race?: number | null
          racer_id?: string | null
          updated_at?: string | null
          visibility_benefits?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_packages_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sponsorship_spots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          position_left: string | null
          position_top: string | null
          price_per_race: number | null
          racer_id: string | null
          sponsor_logo_url: string | null
          sponsor_name: string | null
          spot_name: string | null
          spot_size: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          position_left?: string | null
          position_top?: string | null
          price_per_race?: number | null
          racer_id?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          spot_name?: string | null
          spot_size?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          position_left?: string | null
          position_top?: string | null
          price_per_race?: number | null
          racer_id?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          spot_name?: string | null
          spot_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_spots_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      track_follows: {
        Row: {
          created_at: string | null
          fan_id: string | null
          id: string
          track_id: string | null
        }
        Insert: {
          created_at?: string | null
          fan_id?: string | null
          id?: string
          track_id?: string | null
        }
        Update: {
          created_at?: string | null
          fan_id?: string | null
          id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_follows_fan_id_fkey"
            columns: ["fan_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_follows_track_id_fkey"
            columns: ["track_id"]
            referencedRelation: "track_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      track_profiles: {
        Row: {
          address: string | null
          banner_photo_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          phone_number: string | null
          state: string | null
          timezone: string | null
          track_length_km: number | null
          track_map_url: string | null
          track_type: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          banner_photo_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone_number?: string | null
          state?: string | null
          timezone?: string | null
          track_length_km?: number | null
          track_map_url?: string | null
          track_type?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          banner_photo_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone_number?: string | null
          state?: string | null
          timezone?: string | null
          track_length_km?: number | null
          track_map_url?: string | null
          track_type?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string | null
          currency: string | null
          details: Json | null
          id: string
          platform_amount_cents: number | null
          racer_amount_cents: number | null
          racer_id: string | null
          stripe_payment_intent_id: string | null
          total_amount_cents: number | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          details?: Json | null
          id?: string
          platform_amount_cents?: number | null
          racer_amount_cents?: number | null
          racer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount_cents?: number | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          details?: Json | null
          id?: string
          platform_amount_cents?: number | null
          racer_amount_cents?: number | null
          racer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount_cents?: number | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_tokens: {
        Row: {
          created_at: string | null
          id: string
          token_balance: number | null
          total_purchased: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_balance?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token_balance?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      virtual_gifts: {
        Row: {
          created_at: string | null
          gift_id: string | null
          id: string
          message: string | null
          racer_id: string | null
          receiver_id: string | null
          sender_id: string | null
          token_amount: number | null
        }
        Insert: {
          created_at?: string | null
          gift_id?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          token_amount?: number | null
        }
        Update: {
          created_at?: string | null
          gift_id?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          token_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_gifts_gift_id_fkey"
            columns: ["gift_id"]
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_gifts_racer_id_fkey"
            columns: ["racer_id"]
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_gifts_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_gifts_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_revenue_split: {
        Args: {
          total_cents: number
        }
        Returns: {
          platform_amount: number
          racer_amount: number
        }
      }
      get_racer_earnings: {
        Args: {
          p_racer_id: string
        }
        Returns: {
          total_earnings_cents: number
          pending_payout_cents: number
          subscription_earnings_cents: number
          tip_earnings_cents: number
          sponsorship_earnings_cents: number
          stripe_account_id: string
        }
      }
      get_racer_fan_stats: {
        Args: {
          racer_uuid: string
        }
        Returns: {
          total_fans: number
          super_fans: number
          top_superfan_id: string
          top_superfan_name: string
          top_superfan_total: number
        }
      }
      update_token_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_operation: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type RacerProfile = Database['public']['Tables']['racer_profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Track = Database['public']['Tables']['track_profiles']['Row'];
export type Series = Database['public']['Tables']['series_profiles']['Row'];
export type Gift = Database['public']['Tables']['gifts']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type FanConnection = Database['public']['Tables']['fan_connections']['Row'];
export type TrackFollow = Database['public']['Tables']['track_follows']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type UserTokens = Database['public']['Tables']['user_tokens']['Row'];
export type VirtualGift = Database['public']['Tables']['virtual_gifts']['Row'];
export type RacerPost = Database['public']['Tables']['racer_posts']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SponsorshipSpot = Database['public']['Tables']['sponsorship_spots']['Row'];
export type SponsorshipInquiry = Database['public']['Tables']['sponsorship_inquiries']['Row'];

export interface SponsorshipPackage {
  id: string;
  racer_id: string;
  package_name: string;
  description?: string;
  price_per_race: number;
  duration_races: number;
  car_placement: string;
  visibility_benefits: string[];
  digital_benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  racer_id: string;
  name: string;
  description?: string;
  price_cents: number;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FanSubscription {
  id: string;
  fan_id: string;
  racer_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'paused';
  created_at: string;
  updated_at: string;
  // Extended properties for UI display
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
  // Extended properties for UI display
  type?: string;
  action?: string;
  date?: string;
  amount?: number;
  racer_profile?: {
    username: string;
    profile_photo_url?: string;
  };
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  token_amount: number;
  price_cents: number;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  token_amount: number;
  message?: string;
  created_at: string;
  is_public: boolean;
  // Extended properties for UI display
  gift?: VirtualGift;
  sender?: {
    name: string;
    avatar?: string;
  };
}

// Additional interface definitions
export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  description: string;
  token_cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
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
  created_at: string;
  updated_at: string;
  stripe_price_id?: string;
}

export interface SponsorshipPackage {
  id: string;
  racer_id: string;
  package_name: string;
  description: string;
  price_cents: number;
  duration_races: number;
  car_placement: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stripe_price_id?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface DatabasePost {
  id: string;
  racer_id: string;
  content: string;
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  media_urls: string[];
  visibility: 'public' | 'fans_only';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  total_tips: number;
  allow_tips: boolean;
}

export interface LiveStream {
  id: string;
  streamer_id: string;
  title: string;
  description?: string;
  is_live: boolean;
  viewer_count: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FanStats {
  fan_id: string;
  total_tips: number;
  active_subscriptions: number;
  support_points: number;
  activity_streak: number;
  created_at: string;
  updated_at: string;
}
