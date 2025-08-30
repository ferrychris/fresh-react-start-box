export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      avatars: {
        Row: {
          created_at: string | null
          file_name: string
          id: string
          image_type: string
          image_url: string
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          id?: string
          image_type: string
          image_url: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          id?: string
          image_type?: string
          image_url?: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_activity: {
        Row: {
          activity_type: string
          amount: number | null
          badge_id: string | null
          badge_image_url: string | null
          badge_name: string | null
          comment_content: string | null
          content: string | null
          created_at: string | null
          fan_id: string
          id: string
          likes: number | null
          post_content: string | null
          post_id: string | null
          racer_id: string | null
          racer_name: string | null
        }
        Insert: {
          activity_type: string
          amount?: number | null
          badge_id?: string | null
          badge_image_url?: string | null
          badge_name?: string | null
          comment_content?: string | null
          content?: string | null
          created_at?: string | null
          fan_id: string
          id?: string
          likes?: number | null
          post_content?: string | null
          post_id?: string | null
          racer_id?: string | null
          racer_name?: string | null
        }
        Update: {
          activity_type?: string
          amount?: number | null
          badge_id?: string | null
          badge_image_url?: string | null
          badge_name?: string | null
          comment_content?: string | null
          content?: string | null
          created_at?: string | null
          fan_id?: string
          id?: string
          likes?: number | null
          post_content?: string | null
          post_id?: string | null
          racer_id?: string | null
          racer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_activity_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_connections: {
        Row: {
          became_fan_at: string | null
          created_at: string | null
          fan_id: string
          id: string
          is_subscribed: boolean | null
          is_superfan: boolean | null
          last_support_date: string | null
          racer_id: string
          total_tips: number | null
          updated_at: string | null
        }
        Insert: {
          became_fan_at?: string | null
          created_at?: string | null
          fan_id: string
          id?: string
          is_subscribed?: boolean | null
          is_superfan?: boolean | null
          last_support_date?: string | null
          racer_id: string
          total_tips?: number | null
          updated_at?: string | null
        }
        Update: {
          became_fan_at?: string | null
          created_at?: string | null
          fan_id?: string
          id?: string
          is_subscribed?: boolean | null
          is_superfan?: boolean | null
          last_support_date?: string | null
          racer_id?: string
          total_tips?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_connections_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_connections_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_favorite_racers: {
        Row: {
          created_at: string | null
          fan_id: string
          id: string
          last_tipped: string | null
          racer_id: string
          subscription_tier: string | null
          total_tipped: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fan_id: string
          id?: string
          last_tipped?: string | null
          racer_id: string
          subscription_tier?: string | null
          total_tipped?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fan_id?: string
          id?: string
          last_tipped?: string | null
          racer_id?: string
          subscription_tier?: string | null
          total_tipped?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_favorite_racers_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_metrics: {
        Row: {
          active_subscriptions_count: number
          monthly_spend_cents_30d: number
          total_tips_cents: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_subscriptions_count?: number
          monthly_spend_cents_30d?: number
          total_tips_cents?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_subscriptions_count?: number
          monthly_spend_cents_30d?: number
          total_tips_cents?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_profiles: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
            foreignKeyName: "fan_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_stats: {
        Row: {
          active_subscriptions: number | null
          activity_streak: number | null
          created_at: string | null
          fan_id: string
          id: string
          support_points: number | null
          total_tips: number | null
          updated_at: string | null
        }
        Insert: {
          active_subscriptions?: number | null
          activity_streak?: number | null
          created_at?: string | null
          fan_id: string
          id?: string
          support_points?: number | null
          total_tips?: number | null
          updated_at?: string | null
        }
        Update: {
          active_subscriptions?: number | null
          activity_streak?: number | null
          created_at?: string | null
          fan_id?: string
          id?: string
          support_points?: number | null
          total_tips?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          created_at: string | null
          gift_id: string | null
          id: string
          is_public: boolean | null
          message: string | null
          platform_token_amount: number | null
          racer_token_amount: number | null
          receiver_id: string | null
          sender_id: string | null
          token_amount: number
        }
        Insert: {
          created_at?: string | null
          gift_id?: string | null
          id?: string
          is_public?: boolean | null
          message?: string | null
          platform_token_amount?: number | null
          racer_token_amount?: number | null
          receiver_id?: string | null
          sender_id?: string | null
          token_amount: number
        }
        Update: {
          created_at?: string | null
          gift_id?: string | null
          id?: string
          is_public?: boolean | null
          message?: string | null
          platform_token_amount?: number | null
          racer_token_amount?: number | null
          receiver_id?: string | null
          sender_id?: string | null
          token_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean | null
          started_at: string | null
          stream_key: string | null
          streamer_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          stream_key?: string | null
          streamer_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          stream_key?: string | null
          streamer_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue: {
        Row: {
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          sponsorship_revenue_cents: number | null
          subscription_revenue_cents: number | null
          tip_revenue_cents: number | null
          total_revenue_cents: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          sponsorship_revenue_cents?: number | null
          subscription_revenue_cents?: number | null
          tip_revenue_cents?: number | null
          total_revenue_cents?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          sponsorship_revenue_cents?: number | null
          subscription_revenue_cents?: number | null
          tip_revenue_cents?: number | null
          total_revenue_cents?: number | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_interactions: {
        Row: {
          comment_text: string | null
          created_at: string | null
          id: string
          interaction_type: string
          post_id: string
          tip_amount: number | null
          user_id: string
        }
        Insert: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          post_id: string
          tip_amount?: number | null
          user_id: string
        }
        Update: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          post_id?: string
          tip_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "racer_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_view_events: {
        Row: {
          created_at: string
          day_date: string
          id: string
          profile_id: string
          user_agent: string | null
          viewer_id: string
        }
        Insert: {
          created_at?: string
          day_date?: string
          id?: string
          profile_id: string
          user_agent?: string | null
          viewer_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          id?: string
          profile_id?: string
          user_agent?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_view_events_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string | null
          last_viewed_at: string | null
          profile_id: string
          view_count: number
        }
        Insert: {
          created_at?: string | null
          last_viewed_at?: string | null
          profile_id: string
          view_count?: number
        }
        Update: {
          created_at?: string | null
          last_viewed_at?: string | null
          profile_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          avatars: string | null
          banner_image: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          profile_complete: boolean | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          avatar?: string | null
          avatars?: string | null
          banner_image?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          profile_complete?: boolean | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          avatar?: string | null
          avatars?: string | null
          banner_image?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          profile_complete?: boolean | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      race_schedules: {
        Row: {
          created_at: string | null
          event_date: string
          event_name: string
          event_time: string | null
          id: string
          location: string | null
          racer_id: string | null
          track_id: string | null
          track_name: string
        }
        Insert: {
          created_at?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          id?: string
          location?: string | null
          racer_id?: string | null
          track_id?: string | null
          track_name: string
        }
        Update: {
          created_at?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          id?: string
          location?: string | null
          racer_id?: string | null
          track_id?: string | null
          track_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_schedules_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_schedules_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      racer_earnings: {
        Row: {
          created_at: string | null
          id: string
          last_payout_at: string | null
          payout_schedule: string | null
          pending_payout_cents: number | null
          racer_id: string
          sponsorship_earnings_cents: number | null
          stripe_account_id: string | null
          subscription_earnings_cents: number | null
          tip_earnings_cents: number | null
          total_earnings_cents: number | null
          total_paid_out_cents: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_payout_at?: string | null
          payout_schedule?: string | null
          pending_payout_cents?: number | null
          racer_id: string
          sponsorship_earnings_cents?: number | null
          stripe_account_id?: string | null
          subscription_earnings_cents?: number | null
          tip_earnings_cents?: number | null
          total_earnings_cents?: number | null
          total_paid_out_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_payout_at?: string | null
          payout_schedule?: string | null
          pending_payout_cents?: number | null
          racer_id?: string
          sponsorship_earnings_cents?: number | null
          stripe_account_id?: string | null
          subscription_earnings_cents?: number | null
          tip_earnings_cents?: number | null
          total_earnings_cents?: number | null
          total_paid_out_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racer_earnings_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: true
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      racer_posts: {
        Row: {
          allow_tips: boolean | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          media_urls: Json | null
          post_type: string | null
          racer_id: string | null
          total_tips: number | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
          visibility: string | null
        }
        Insert: {
          allow_tips?: boolean | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_urls?: Json | null
          post_type?: string | null
          racer_id?: string | null
          total_tips?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          visibility?: string | null
        }
        Update: {
          allow_tips?: boolean | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_urls?: Json | null
          post_type?: string | null
          racer_id?: string | null
          total_tips?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racer_posts_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      racer_profiles: {
        Row: {
          achievements: string | null
          address_line1: string
          address_line2: string | null
          banner_photo_url: string | null
          bio: string | null
          car_number: string | null
          car_photos: Json | null
          career_history: string | null
          career_wins: number | null
          championships: number | null
          city: string
          country: string
          created_at: string | null
          facebook_url: string | null
          highlights: string | null
          hometown: string | null
          id: string
          instagram_url: string | null
          is_featured: boolean | null
          main_sponsor_photo_url: string | null
          monetization_enabled: boolean | null
          phone: string
          podiums: number | null
          postal_code: string
          profile_photo_url: string | null
          profile_published: boolean | null
          racing_class: string | null
          social_links: Json | null
          state: string
          support_tiers: Json | null
          team_name: string | null
          thank_you_message: string | null
          tiktok_url: string | null
          updated_at: string | null
          username: string | null
          years_racing: number | null
          youtube_url: string | null
        }
        Insert: {
          achievements?: string | null
          address_line1?: string
          address_line2?: string | null
          banner_photo_url?: string | null
          bio?: string | null
          car_number?: string | null
          car_photos?: Json | null
          career_history?: string | null
          career_wins?: number | null
          championships?: number | null
          city?: string
          country?: string
          created_at?: string | null
          facebook_url?: string | null
          highlights?: string | null
          hometown?: string | null
          id: string
          instagram_url?: string | null
          is_featured?: boolean | null
          main_sponsor_photo_url?: string | null
          monetization_enabled?: boolean | null
          phone?: string
          podiums?: number | null
          postal_code?: string
          profile_photo_url?: string | null
          profile_published?: boolean | null
          racing_class?: string | null
          social_links?: Json | null
          state?: string
          support_tiers?: Json | null
          team_name?: string | null
          thank_you_message?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          username?: string | null
          years_racing?: number | null
          youtube_url?: string | null
        }
        Update: {
          achievements?: string | null
          address_line1?: string
          address_line2?: string | null
          banner_photo_url?: string | null
          bio?: string | null
          car_number?: string | null
          car_photos?: Json | null
          career_history?: string | null
          career_wins?: number | null
          championships?: number | null
          city?: string
          country?: string
          created_at?: string | null
          facebook_url?: string | null
          highlights?: string | null
          hometown?: string | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          main_sponsor_photo_url?: string | null
          monetization_enabled?: boolean | null
          phone?: string
          podiums?: number | null
          postal_code?: string
          profile_photo_url?: string | null
          profile_published?: boolean | null
          racing_class?: string | null
          social_links?: Json | null
          state?: string
          support_tiers?: Json | null
          team_name?: string | null
          thank_you_message?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          username?: string | null
          years_racing?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series_profiles: {
        Row: {
          banner_photo_url: string | null
          championship_purse_cents: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          featured_racers: string[] | null
          featured_tracks: string[] | null
          founded: number | null
          headquarters: string | null
          id: string
          profile_published: boolean | null
          series_logo_url: string | null
          series_name: string
          series_type: string | null
          social_links: Json | null
          total_events: number | null
          total_purse_cents: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          banner_photo_url?: string | null
          championship_purse_cents?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          featured_racers?: string[] | null
          featured_tracks?: string[] | null
          founded?: number | null
          headquarters?: string | null
          id: string
          profile_published?: boolean | null
          series_logo_url?: string | null
          series_name: string
          series_type?: string | null
          social_links?: Json | null
          total_events?: number | null
          total_purse_cents?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          banner_photo_url?: string | null
          championship_purse_cents?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          featured_racers?: string[] | null
          featured_tracks?: string[] | null
          founded?: number | null
          headquarters?: string | null
          id?: string
          profile_published?: boolean | null
          series_logo_url?: string | null
          series_name?: string
          series_type?: string | null
          social_links?: Json | null
          total_events?: number | null
          total_purse_cents?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_inquiries: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          racer_id: string | null
          sponsor_budget: string | null
          sponsor_email: string
          sponsor_name: string
          spot_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          sponsor_budget?: string | null
          sponsor_email: string
          sponsor_name: string
          spot_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          racer_id?: string | null
          sponsor_budget?: string | null
          sponsor_email?: string
          sponsor_name?: string
          spot_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_inquiries_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_inquiries_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_packages: {
        Row: {
          benefits: Json | null
          car_placement: string | null
          created_at: string | null
          description: string | null
          duration_races: number | null
          id: string
          is_active: boolean | null
          package_name: string
          price_cents: number
          racer_id: string
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          car_placement?: string | null
          created_at?: string | null
          description?: string | null
          duration_races?: number | null
          id?: string
          is_active?: boolean | null
          package_name: string
          price_cents: number
          racer_id: string
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          car_placement?: string | null
          created_at?: string | null
          description?: string | null
          duration_races?: number | null
          id?: string
          is_active?: boolean | null
          package_name?: string
          price_cents?: number
          racer_id?: string
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_packages_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_spots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          position_left: string
          position_top: string
          price_per_race: number
          racer_id: string
          sponsor_logo_url: string | null
          sponsor_name: string | null
          spot_name: string
          spot_size: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          position_left?: string
          position_top?: string
          price_per_race?: number
          racer_id: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          spot_name: string
          spot_size?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          position_left?: string
          position_top?: string
          price_per_race?: number
          racer_id?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          spot_name?: string
          spot_size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_spots_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          benefits: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price_cents: number
          racer_id: string
          stripe_price_id: string | null
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price_cents: number
          racer_id: string
          stripe_price_id?: string | null
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price_cents?: number
          racer_id?: string
          stripe_price_id?: string | null
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tiers_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_purchases: {
        Row: {
          created_at: string | null
          id: string
          price_cents: number
          status: string | null
          stripe_payment_intent_id: string | null
          token_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_cents: number
          status?: string | null
          stripe_payment_intent_id?: string | null
          token_amount: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price_cents?: number
          status?: string | null
          stripe_payment_intent_id?: string | null
          token_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_donations: {
        Row: {
          amount_cents: number
          created_at: string | null
          donation_purpose: string
          donor_id: string | null
          donor_message: string | null
          id: string
          is_anonymous: boolean | null
          status: string | null
          stripe_payment_intent_id: string | null
          track_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          donation_purpose?: string
          donor_id?: string | null
          donor_message?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          track_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          donation_purpose?: string
          donor_id?: string | null
          donor_message?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_donations_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_events: {
        Row: {
          classes: string[] | null
          created_at: string | null
          custom_classes: string[] | null
          description: string | null
          entry_fee_cents: number | null
          event_date: string
          event_flyer_url: string | null
          event_time: string | null
          event_title: string
          id: string
          is_published: boolean | null
          payout_cents: number | null
          track_id: string
          updated_at: string | null
        }
        Insert: {
          classes?: string[] | null
          created_at?: string | null
          custom_classes?: string[] | null
          description?: string | null
          entry_fee_cents?: number | null
          event_date: string
          event_flyer_url?: string | null
          event_time?: string | null
          event_title: string
          id?: string
          is_published?: boolean | null
          payout_cents?: number | null
          track_id: string
          updated_at?: string | null
        }
        Update: {
          classes?: string[] | null
          created_at?: string | null
          custom_classes?: string[] | null
          description?: string | null
          entry_fee_cents?: number | null
          event_date?: string
          event_flyer_url?: string | null
          event_time?: string | null
          event_title?: string
          id?: string
          is_published?: boolean | null
          payout_cents?: number | null
          track_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_followers: {
        Row: {
          created_at: string | null
          followed_at: string | null
          id: string
          is_active: boolean | null
          track_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          followed_at?: string | null
          id?: string
          is_active?: boolean | null
          track_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          followed_at?: string | null
          id?: string
          is_active?: boolean | null
          track_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_followers_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_profiles: {
        Row: {
          banner_photo_url: string | null
          classes_hosted: string[] | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          featured_racers: string[] | null
          id: string
          location: string | null
          sponsors: Json | null
          track_logo_url: string | null
          track_name: string | null
          track_type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          banner_photo_url?: string | null
          classes_hosted?: string[] | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          featured_racers?: string[] | null
          id: string
          location?: string | null
          sponsors?: Json | null
          track_logo_url?: string | null
          track_name?: string | null
          track_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          banner_photo_url?: string | null
          classes_hosted?: string[] | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          featured_racers?: string[] | null
          id?: string
          location?: string | null
          sponsors?: Json | null
          track_logo_url?: string | null
          track_name?: string | null
          track_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          payer_id: string | null
          platform_amount_cents: number
          processed_at: string | null
          racer_amount_cents: number
          racer_id: string
          sponsorship_package_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          stripe_subscription_id: string | null
          subscription_tier_id: string | null
          total_amount_cents: number
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payer_id?: string | null
          platform_amount_cents: number
          processed_at?: string | null
          racer_amount_cents: number
          racer_id: string
          sponsorship_package_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          stripe_subscription_id?: string | null
          subscription_tier_id?: string | null
          total_amount_cents: number
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payer_id?: string | null
          platform_amount_cents?: number
          processed_at?: string | null
          racer_amount_cents?: number
          racer_id?: string
          sponsorship_package_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          stripe_subscription_id?: string | null
          subscription_tier_id?: string | null
          total_amount_cents?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sponsorship_package_id_fkey"
            columns: ["sponsorship_package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          status: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_gifts: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          rarity: string | null
          token_cost: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          rarity?: string | null
          token_cost: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rarity?: string | null
          token_cost?: number
        }
        Relationships: []
      }
    }
    Views: {
      fan_monthly_spend: {
        Row: {
          fan_id: string | null
          month: string | null
          subscriptions_cents: number | null
          tips_cents: number | null
          total_spend_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_racer_tips: {
        Row: {
          fan_id: string | null
          racer_id: string | null
          tips_cents: number | null
          tips_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_racer_id_fkey"
            columns: ["racer_id"]
            isOneToOne: false
            referencedRelation: "racer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_revenue_split: {
        Args: { total_cents: number }
        Returns: {
          platform_amount: number
          racer_amount: number
        }[]
      }
      check_track_follow: {
        Args: { p_track_id: string; p_user_id: string }
        Returns: boolean
      }
      decrement_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      get_fan_monthly_spend: {
        Args: { p_fan_id: string }
        Returns: {
          month: string
          subscriptions_cents: number
          tips_cents: number
          total_spend_cents: number
        }[]
      }
      get_fan_tips_to_racers: {
        Args: { p_fan_id: string }
        Returns: {
          racer_id: string
          tips_cents: number
          tips_count: number
        }[]
      }
      get_racer_fan_stats: {
        Args: { racer_uuid: string }
        Returns: {
          super_fans: number
          top_superfan_id: string
          top_superfan_name: string
          top_superfan_total: number
          total_fans: number
        }[]
      }
      get_track_donation_stats: {
        Args: { track_uuid: string }
        Returns: {
          avg_donation_cents: number
          recent_donations_count: number
          top_donation_cents: number
          total_donations_cents: number
          total_donors: number
        }[]
      }
      get_track_follower_count: {
        Args: { track_uuid: string }
        Returns: number
      }
      get_user_track_follows: {
        Args: { p_user_id: string }
        Returns: {
          followed_at: string
          location: string
          track_id: string
          track_logo_url: string
          track_name: string
          track_type: string
        }[]
      }
      increment_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_profile_views: {
        Args: {
          p_profile_id: string
          p_view_type?: string
          p_viewer_id?: string
        }
        Returns: undefined
      }
      recompute_fan_metrics: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      send_virtual_gift: {
        Args: {
          p_gift_id: string
          p_message?: string
          p_receiver_id: string
          p_sender_id: string
        }
        Returns: string
      }
      toggle_track_follow: {
        Args: { p_track_id: string; p_user_id: string }
        Returns: Json
      }
      update_racer_earnings: {
        Args: {
          p_amount_cents: number
          p_racer_id: string
          p_transaction_type: string
        }
        Returns: undefined
      }
      update_racer_token_earnings: {
        Args: { p_racer_id: string; p_token_amount: number }
        Returns: undefined
      }
      update_token_balance: {
        Args: { p_amount: number; p_operation?: string; p_user_id: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
