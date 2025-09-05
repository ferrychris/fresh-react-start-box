import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, DollarSign, Crown, Users } from 'lucide-react';
import { getPublicPostsPage, tipPost } from '../../lib/supabase/posts';

interface Post {
  id: string;
  userId: string;
  userType: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video';
  likes: number;
  comments: number;
  isLiked: boolean;
  timestamp: string;
  createdAt: string;
}

// CRITICAL PERFORMANCE OPTIMIZATIONS FOR SUB-3 SECOND LOAD
const INITIAL_BATCH = 4; // Minimal first load for instant display
const LOAD_MORE_BATCH = 8; // Moderate batch for scrolling
const PREFETCH_DISTANCE = '1200px'; // Aggressive prefetch
const DEBOUNCE_MS = 50; // Ultra-fast response

const FastGrandstand: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Ultra-fast transform with minimal processing
  const transformPost = useCallback((r: any): Post => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const userType = (r.user_type || 'FAN').toString().toUpperCase();
    
    return {
      id: r.id,
      userId: r.user_id || 'unknown',
      userType: ['RACER','TRACK','SERIES','FAN'].includes(userType) ? userType as Post['userType'] : 'FAN',
      userName: profile?.name || 'User',
      userAvatar: profile?.avatar || '/placeholder.svg',
      content: r.content || '',
      mediaUrls: r.media_urls || [],
      mediaType: r.media_urls?.length > 0 ? (r.post_type === 'video' ? 'video' : 'image') : undefined,
      likes: r.likes_count ?? 0,
      comments: r.comments_count ?? 0,
      isLiked: false,
      timestamp: r.created_at || new Date().toISOString(),
      createdAt: r.created_at || new Date().toISOString(),
    };
  }, []);

  // CRITICAL: Immediate first paint with minimal data
  const loadInitial = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ 
        limit: INITIAL_BATCH 
      });
      
      const loadTime = performance.now() - startTime;
      console.log(`🏁 Initial load: ${loadTime.toFixed(2)}ms`);
      
      if (error) throw error;
      
      const mapped = (rows || []).map(transformPost);
      
      setPosts(mapped);
      setNextCursor(cursor || null);
      setHasMore(!!cursor);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError('Failed to load posts');
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [transformPost]);

  // Optimized incremental loading
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ 
        limit: LOAD_MORE_BATCH,
        cursor: nextCursor 
      });
      
      if (error) throw error;
      
      const mapped = (rows || []).map(transformPost);
      
      setPosts(prev => [...prev, ...mapped]);
      setNextCursor(cursor || null);
      setHasMore(!!cursor && mapped.length > 0);
    } catch (e: any) {
      console.error('Load more failed:', e);
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [nextCursor, hasMore, loadingMore, loading, transformPost]);

  // Immediate load on mount
  useEffect(() => {
    loadInitial();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadInitial]);

  // Ultra-aggressive infinite scroll
  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !isLoadingRef.current) {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          loadingTimeoutRef.current = setTimeout(loadMore, DEBOUNCE_MS);
        }
      },
      { rootMargin: PREFETCH_DISTANCE }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  // Optimized handlers with minimal state updates
  const handleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  }, []);

  const handleTip = useCallback(async (postId: string) => {
    try {
      const { error } = await tipPost(postId, 500);
      if (error) {
        console.error('Tip failed:', error);
      }
    } catch (e: any) {
      console.error('Exception in tip:', e);
    }
  }, []);

  // Memoized utility functions
  const getUserTypeColor = useMemo(() => (userType: string) => {
    switch (userType) {
      case 'RACER': return 'text-orange-500';
      case 'TRACK': return 'text-blue-500';
      case 'SERIES': return 'text-purple-500';
      case 'FAN': return 'text-green-500';
      default: return 'text-slate-500';
    }
  }, []);

  const getUserTypeIcon = useMemo(() => (userType: string) => {
    switch (userType) {
      case 'RACER': return '🏎️';
      case 'TRACK': return '🏁';
      case 'SERIES': return '🏆';
      case 'FAN': return '👥';
      default: return '👤';
    }
  }, []);

  const formatRelativeTime = useCallback((isoString: string): string => {
    if (!isoString) return 'now';
    const then = new Date(isoString).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));
    if (diffSec < 60) return 'now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }, []);

  // Minimal loading state for fastest render
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          Grandstand
        </h1>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-900 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Grandstand</h1>
        <div className="p-8 text-center text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
        Grandstand
      </h1>
      
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-700"
                  loading="lazy"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{post.userName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`font-medium ${getUserTypeColor(post.userType)}`}>
                      {getUserTypeIcon(post.userType)} {post.userType}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-300 leading-relaxed">{post.content}</p>
              </div>

              {/* Media */}
              {post.mediaUrls.length > 0 && (
                <div className="mb-4 -mx-6">
                  <div className="relative">
                    <img
                      src={post.mediaUrls[0]}
                      alt="Post media"
                      className="w-full h-64 lg:h-80 object-cover"
                      loading="lazy"
                    />
                    {post.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-gray-900 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                </div>

                {post.userType === 'RACER' && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleTip(post.id)}
                      className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Join</span>
                    </button>
                  </div>
                )}

                {(post.userType === 'TRACK' || post.userType === 'SERIES') && (
                  <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Follow</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        
        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">🏁</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-sm text-gray-400">Be the first to share something!</p>
          </div>
        )}
        
        {/* Loading indicator */}
        {loadingMore && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
        
        {/* Sentinel for infinite scroll */}
        {hasMore && !loadingMore && posts.length > 0 && (
          <div ref={sentinelRef} className="h-4" />
        )}
        
        {/* End indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">🏁 End of feed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FastGrandstand;