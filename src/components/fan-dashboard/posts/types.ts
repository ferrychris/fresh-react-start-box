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
  updated_at?: string;
  content: string;
  media_urls?: string[];
  post_type?: 'text' | 'photo' | 'video' | 'gallery';
  likes_count: number;
  comments_count?: number;
  user_id?: string;
  user_type?: 'racer' | 'fan' | 'track';
  fan_id?: string;
  racer_id?: string;
  visibility?: string;
  total_tips?: number;
  allow_tips?: boolean;
  profiles?: {
    id: string;
    name: string;
    email?: string;
    user_type: string;
    avatar?: string;
  };
}

import { getPostPublicUrl, getFanPostPublicUrl } from '../../../lib/supabase/storage';

// Helper function to transform database posts into UI-ready posts
export const transformDbPostToUIPost = (post: DatabasePost): Post => {
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Normalize media_urls: can be array or JSON string; convert storage paths to public URLs
  let rawMedia = post.media_urls as unknown;
  let mediaArray: string[] = [];
  try {
    if (Array.isArray(rawMedia)) {
      mediaArray = rawMedia as string[];
    } else if (typeof rawMedia === 'string' && rawMedia.trim().length > 0) {
      const parsed = JSON.parse(rawMedia);
      if (Array.isArray(parsed)) mediaArray = parsed as string[];
    }
  } catch {}

  const userIdForPath = post.user_id || post.racer_id || post.fan_id || '';
  const isFanPost = (post.user_type || '').toLowerCase() === 'fan';

  const normalizedMedia: string[] = mediaArray
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .map((u) => {
      const isHttp = /^https?:\/\//i.test(u);
      if (isHttp) return u;

      // Allow data URLs as-is
      if (u.startsWith('data:image') || u.startsWith('data:video')) return u;

      // If looks like raw base64 image, wrap as data URL
      const base64Re = /^[A-Za-z0-9+/=]+$/;
      if (!/\//.test(u) && base64Re.test(u) && u.length % 4 === 0) {
        return `data:image/png;base64,${u}`;
      }

      // Otherwise treat non-http strings as storage paths (filename or full path)
      const looksLikeStoragePath = /\//.test(u);
      const path = looksLikeStoragePath ? u : (userIdForPath ? `${userIdForPath}/posts/images/${u}` : u);

      // Choose resolver by post type or path hint
      const resolver = isFanPost || /^(postimage|new_post)\//i.test(path) ? getFanPostPublicUrl : getPostPublicUrl;
      return resolver(path) || path;
    })
    .filter(Boolean);

  // Prefer images first when choosing mediaType and display order
  const imageExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.avif)$/i;
  const videoExtensions = /(\.mp4|\.webm|\.ogg|\.mov|\.m4v)$/i;
  const images = normalizedMedia.filter((u) => imageExtensions.test(u));
  const videos = normalizedMedia.filter((u) => videoExtensions.test(u));
  const orderedMedia = images.length > 0 ? [...images, ...videos] : normalizedMedia;
  const mediaType = orderedMedia.length > 0
    ? (videoExtensions.test(orderedMedia[0]) ? 'video' : 'image')
    : undefined;

  // Get profile info
  const profile = post.profiles;
  
  // Normalize avatar: support http(s), storage paths, or raw base64
  const rawAvatar = profile?.avatar || '';
  const userAvatar = (() => {
    if (!rawAvatar) return '';
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    if (rawAvatar.startsWith('data:image')) return rawAvatar;
    const base64Re = /^[A-Za-z0-9+/=]+$/;
    if (base64Re.test(rawAvatar) && rawAvatar.length % 4 === 0) {
      return `data:image/png;base64,${rawAvatar}`;
    }
    // Otherwise treat as storage path
    return getPostPublicUrl(rawAvatar) || rawAvatar;
  })();

  return {
    id: post.id,
    userId: post.user_id || post.racer_id || post.fan_id || '',
    userName: profile?.name || 'Unknown User',
    userAvatar,
    userType: (post.user_type?.toUpperCase() as 'RACER' | 'FAN' | 'TRACK' | 'SERIES') || 'FAN',
    userVerified: post.user_type === 'racer',
    content: post.content,
    mediaUrls: orderedMedia,
    mediaType,
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
  visibility: 'public' | 'fans_only';
  location?: string;
  eventDate?: string;
}
