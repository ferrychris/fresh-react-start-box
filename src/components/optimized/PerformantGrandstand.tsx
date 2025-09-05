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

// Critical optimizations for sub-3 second load times
const BATCH_SIZE = 6; // Reduced for faster initial load
const PREFETCH_THRESHOLD = 0.8; // Prefetch when 80% scrolled
const DEBOUNCE_DELAY = 100; // Reduced debounce

const PerformantGrandstand: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optimized transform with memoization
  const transformPost = useCallback((r: any): Post => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const userType = (r.user_type || 'fan').toString().toUpperCase();
    
    return {
      id: r.id,
      userId: r.user_id || 'unknown',
      userType: ['RACER','TRACK','SERIES','FAN'].includes(userType) ? userType as Post['userType'] : 'FAN',
      userName: profile?.name || 'User',
      userAvatar: profile?.avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
      content: r.content || '',
      mediaUrls: r.media_urls || [],
      mediaType: Array.isArray(r.media_urls) && r.media_urls.length > 0 ? (r.post_type === 'video' ? 'video' : 'image') : undefined,
      likes: r.likes_count ?? 0,
      comments: r.comments_count ?? 0,
      isLiked: false,
      timestamp: r.created_at || new Date().toISOString(),
      createdAt: r.created_at || new Date().toISOString(),
    };
  }, []);

  // Critical path loading - immediate first batch
  const loadInitial = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ 
        limit: BATCH_SIZE 
      });
      
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
    }
  }, [transformPost]);

  // Optimized incremental loading
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    
    setLoadingMore(true);
    try {
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ 
        limit: BATCH_SIZE,
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
    }
  }, [nextCursor, hasMore, loadingMore, loading, transformPost]);

  // Critical: Load immediately on mount
  useEffect(() => {
    loadInitial();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadInitial]);

  // Aggressive prefetching with intersection observer
  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          // Debounced loading
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          loadingTimeoutRef.current = setTimeout(loadMore, DEBOUNCE_DELAY);
        }
      },
      { rootMargin: '800px' } // Aggressive prefetch distance
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  // Optimized handlers
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
    if (!isoString) return 'just now';
    const then = new Date(isoString).getTime();
    const now = Date.now();
    if (Number.isNaN(then)) return 'just now';
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));
    if (diffSec < 60) return 'just now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }, []);

  // Critical loading state - minimal UI for fastest render
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
            Grandstand
          </span>
        </h1>
        <div className="p-8 text-center">
          <div className="w-8 h-8 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 mt-2">Loading posts...</p>
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
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          Grandstand
        </span>
      </h1>
      
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors duration-200">
            {/* Post Header - Optimized for critical rendering */}
            <div className="p-4 lg:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <img
                    src={post.userAvatar}
                    alt={post.userName}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover ring-2 ring-gray-700"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">
                        {post.userName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={`font-medium ${getUserTypeColor(post.userType)}`}>
                        {getUserTypeIcon(post.userType)} {post.userType}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{formatRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-300 leading-relaxed">{post.content}</p>
              </div>

              {/* Media - Lazy loaded */}
              {post.mediaUrls.length > 0 && (
                <div className="mb-4 -mx-4 lg:-mx-6">
                  <div className="relative">
                    <img
                      src={post.mediaUrls[0]}
                      alt="Post media"
                      className="w-full h-64 lg:h-80 object-cover"
                      loading="lazy"
                    />
                    {post.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                          <Play className="w-8 h-8 text-gray-900 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.isLiked 
                        ? 'text-red-500' 
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                </div>

                {/* Action buttons for different user types */}
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
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
        
        {/* Intersection observer sentinel */}
        {hasMore && !loadingMore && posts.length > 0 && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}
        
        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">🏁 You've reached the end</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformantGrandstand;