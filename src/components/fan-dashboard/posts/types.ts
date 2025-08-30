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
}

// Represents the structure of post data coming from the database
export interface DatabasePost {
  id: string;
  created_at: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  likes_count: number;
  comments_count: number;
  fan_id?: string; // For fan posts
  racer_id?: string; // For racer posts
  profiles?: { // For fan posts
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
  const isFanPost = !!post.fan_id;
  
  return {
    id: post.id,
    userId: isFanPost ? post.fan_id! : post.racer_id!,
    userName: isFanPost ? post.profiles?.name || 'Fan' : post.racer?.username || 'Racer',
    userAvatar: isFanPost ? post.profiles?.avatar || '' : post.racer?.profile_photo_url || '',
    userType: isFanPost ? (post.profiles?.user_type as 'FAN') || 'FAN' : 'RACER',
    userVerified: !isFanPost, // Assume racers are verified, fans are not
    content: post.content,
    mediaUrls: post.media_urls || [],
    mediaType: post.media_urls && post.media_urls.length > 0
      ? (post.media_urls[0].match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image')
      : undefined,
    timestamp: new Date(post.created_at).toLocaleDateString(),
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: 0, // Default shares to 0
    isLiked: false, // Default isLiked to false
    carNumber: !isFanPost ? '23' : undefined, // Example car number for racers
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
