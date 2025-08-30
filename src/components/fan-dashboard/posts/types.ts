// Shared types for post components
export interface Post {
  id: string;
  userId: string;
  userType: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  userName: string;
  userAvatar: string;
  userVerified: boolean;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video' | 'gallery';
  carNumber?: string;
  location?: string;
  eventDate?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  timestamp: string;
  updated_at: string;
}

// Represents the structure of post data coming from the database
export interface DatabasePost {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  likes_count: number;
  comments_count: number;
  user_id?: string;
  user_type?: 'racer' | 'fan' | 'track';
  fan_id?: string; // For fan posts
  racer_id?: string; // For racer posts
  profiles?: { // For unified posts
    name: string;
    avatar: string;
    user_type?: string;
  };
  racer?: { // For racer posts
    id: string;
    username: string;
    profile_photo_url: string;
  };
}

// Helper function to transform database posts into UI-ready posts
export const transformDbPostToUIPost = (post: DatabasePost): Post => {
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return {
    id: post.id,
    userId: post.user_id || post.racer_id || post.fan_id || '',
    userName: post.profiles?.name || post.racer?.username || 'Unknown User',
    userAvatar: post.profiles?.avatar || post.racer?.profile_photo_url || '',
    userType: (post.user_type?.toUpperCase() as 'RACER' | 'FAN' | 'TRACK' | 'SERIES') || 'FAN',
    userVerified: post.user_type === 'racer',
    content: post.content,
    mediaUrls: Array.isArray(post.media_urls) ? post.media_urls : [],
    mediaType: post.media_urls && post.media_urls.length > 0
      ? (post.media_urls[0].match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image')
      : undefined,
    timestamp: formatTimestamp(post.created_at),
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: 0,
    isLiked: false,
    carNumber: post.user_type === 'racer' ? '23' : undefined,
    updated_at: post.updated_at || post.created_at
  };
};

export interface PostCreationPayload {
  content: string;
  mediaFiles: File[];
  mediaType: 'photo' | 'video' | null;
  visibility: 'public' | 'community';
  location?: string;
  eventDate?: string;
}
