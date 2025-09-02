export interface Racer {
  id: string;
  name: string;
  username?: string;
  bio?: string;
  bannerImage?: string;
  carNumber?: string;
  class?: string;
  location?: string;
  career_wins?: number;
  podiums?: number;
  championships?: number;
  years_racing?: number;
  career_history?: string;
  header_image?: string;
  profile_picture?: string;
  car_photos: string[];
  teamName?: string;
  [key: string]: string | number | string[] | undefined | null | boolean; // For any other properties
}

export interface Post {
  id: string;
  racer_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  content: string;
  post_type: 'text' | 'photo' | 'gallery' | 'video';
  media_urls: string[];
  visibility: 'public' | 'fans_only';
  likes_count: number;
  comments_count: number;
  total_tips: number;
  allow_tips: boolean;
  user_type?: 'racer' | 'fan' | 'track';
  racer_profiles?: {
    profiles?: {
      name?: string;
      avatar?: string;
      user_type?: string;
    };
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at?: string;
  user?: {
    name?: string;
    avatar?: string;
    user_type?: string;
  };
  profiles?: {
    name?: string;
    avatar?: string;
    user_type?: string;
  };
}

