import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Calendar, MapPin, Users, DollarSign, Crown } from 'lucide-react';
import { getPublicPostsPage, tipPost } from '../../lib/supabase/posts';

interface Post {
  id: string;
  userId: string;
  userType: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  userName: string;
  userAvatar: string;
  userVerified: boolean;
  carNumber?: string;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video';
  location?: string;
  eventDate?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  timestamp: string;
  createdAt: string;
}

interface GrandstandPostsProps {
  showComposer?: boolean;
}

const GrandstandPosts: React.FC<GrandstandPostsProps> = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipping, setTipping] = useState<Record<string, boolean>>({});
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchOnceRef = useRef<boolean>(false);

  // Debounced loading function
  const debouncedLoad = useCallback((fn: () => void, delay: number = 150) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(fn, delay);
  }, []);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ 
        limit: 5, 
        cursor: nextCursor 
      });
      
      if (error) throw error;
      
      const mapped: Post[] = (rows || []).map((r: any): Post => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        const displayName = profile?.name || 'User';
        const avatar = profile?.avatar || profile?.avatar_url || '';
        const userType = (r.user_type || 'fan').toString().toUpperCase();
        return {
          id: r.id,
          userId: r.user_id || r.racer_id || 'unknown',
          userType: ['RACER','TRACK','SERIES','FAN'].includes(userType) ? userType : 'FAN',
          userName: displayName,
          userAvatar: avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
          userVerified: false,
          carNumber: undefined,
          content: r.content || '',
          mediaUrls: r.media_urls || [],
          mediaType: Array.isArray(r.media_urls) && r.media_urls.length > 0 ? (r.post_type === 'video' ? 'video' : 'image') : undefined,
          location: undefined,
          eventDate: undefined,
          likes: r.likes_count ?? 0,
          comments: r.comments_count ?? 0,
          shares: 0,
          isLiked: false,
          timestamp: r.created_at || new Date().toISOString(),
          createdAt: r.created_at || new Date().toISOString(),
        };
      });
      
      setPosts(prevPosts => [...prevPosts, ...mapped]);
      setNextCursor(cursor || null);
      setHasMore(!!cursor && mapped.length > 0);
    } catch (e: any) {
      console.error('Failed to load more posts', e);
      setError(e?.message || 'Failed to load posts');
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, hasMore, loadingMore]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: rows, nextCursor: cursor, error } = await getPublicPostsPage({ limit: 5 });
        if (!isMounted) return;
        
        if (error) throw error;
        
        const mapped: Post[] = (rows || []).map((r: any): Post => {
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          const displayName = profile?.name || 'User';
          const avatar = profile?.avatar || profile?.avatar_url || '';
          const userType = (r.user_type || 'fan').toString().toUpperCase();
          return {
            id: r.id,
            userId: r.user_id || r.racer_id || 'unknown',
            userType: ['RACER','TRACK','SERIES','FAN'].includes(userType) ? userType : 'FAN',
            userName: displayName,
            userAvatar: avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
            userVerified: false,
            carNumber: undefined,
            content: r.content || '',
            mediaUrls: r.media_urls || [],
            mediaType: Array.isArray(r.media_urls) && r.media_urls.length > 0 ? (r.post_type === 'video' ? 'video' : 'image') : undefined,
            location: undefined,
            eventDate: undefined,
            likes: r.likes_count ?? 0,
            comments: r.comments_count ?? 0,
            shares: 0,
            isLiked: false,
            timestamp: r.created_at || new Date().toISOString(),
            createdAt: r.created_at || new Date().toISOString(),
          };
        });
        
        setPosts(mapped);
        setNextCursor(cursor || null);
        setHasMore(!!cursor);
      } catch (e: any) {
        console.error('Failed to load posts', e);
        if (!isMounted) return;
        setError(e?.message || 'Failed to load posts');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Proactive prefetch: after initial load, fetch the next batch once (if available)
  useEffect(() => {
    if (loading) return;
    if (!hasMore) return;
    if (prefetchOnceRef.current) return;
    prefetchOnceRef.current = true;
    // slight delay to allow initial content to paint
    const id = setTimeout(() => {
      if (!loadingMore) {
        loadMore();
      }
    }, 250);
    return () => clearTimeout(id);
  }, [loading, hasMore, loadingMore, loadMore]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          debouncedLoad(() => loadMore());
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasMore, loadMore, debouncedLoad]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleTip = async (postId: string) => {
    if (!postId || tipping[postId]) return;
    setTipping(prev => ({ ...prev, [postId]: true }));
    try {
      const { error } = await tipPost(postId, 500);
      if (error) {
        console.error('Tip failed:', error);
        alert(error.message || 'Failed to tip');
      }
    } catch (e: any) {
      console.error('Exception in tip:', e);
      alert(e?.message || 'Failed to tip');
    } finally {
      setTipping(prev => ({ ...prev, [postId]: false }));
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'RACER': return 'text-orange-500';
      case 'TRACK': return 'text-blue-500';
      case 'SERIES': return 'text-purple-500';
      case 'FAN': return 'text-green-500';
      default: return 'text-slate-500';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'RACER': return '🏎️';
      case 'TRACK': return '🏁';
      case 'SERIES': return '🏆';
      case 'FAN': return '👥';
      default: return '👤';
    }
  };

  const formatRelativeTime = (isoString: string): string => {
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
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-fedex-orange to-red-500">
          Grandstand
        </span>
      </h1>
      
      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-4 border-fedex-orange/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-fedex-orange rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-fedex-orange/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏁</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300">
                {/* Post Header */}
                <div className="p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-gray-800 hover:border hover:border-orange-500/30 rounded-xl p-3 -m-3 transition-all duration-300 flex-1 group hover:shadow-lg hover:shadow-orange-500/10">
                      <img
                        src={post.userAvatar}
                        alt={post.userName}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover ring-2 ring-gray-700 group-hover:ring-orange-500 group-hover:ring-2 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white group-hover:text-orange-300 transition-colors duration-300 group-hover:drop-shadow-sm">
                            {post.userName}
                          </span>
                          {post.userVerified && (
                            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-400 group-hover:scale-110 transition-all duration-300">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          {post.carNumber && (
                            <span className="text-orange-500 text-sm group-hover:text-orange-300 group-hover:font-bold transition-all duration-300">#{post.carNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`font-medium ${getUserTypeColor(post.userType)} group-hover:brightness-110 transition-all duration-300`}>
                            {getUserTypeIcon(post.userType)} {post.userType}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{formatRelativeTime(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed">{post.content}</p>
                    
                    {/* Location and Event Info */}
                    {(post.location || post.eventDate) && (
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                        {post.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        {post.eventDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.eventDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.mediaUrls.length > 0 && (
                    <div className="mb-4 -mx-4 lg:-mx-6">
                      <div className="relative">
                        <img
                          src={post.mediaUrls[0]}
                          alt="Post media"
                          className="w-full h-64 lg:h-80 object-cover"
                        />
                        {post.mediaType === 'video' && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200">
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
                        className={`flex items-center space-x-2 transition-all duration-200 ${
                          post.isLiked 
                            ? 'text-red-500' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-200">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-all duration-200">
                        <Share className="w-5 h-5" />
                        <span className="font-medium">{post.shares}</span>
                      </button>
                    </div>

                    {/* Tip/Subscribe Actions for Racers */}
                    {post.userType === 'RACER' && (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleTip(post.id)}
                          aria-label="Tip"
                          className={`w-9 h-9 rounded-full transition-colors duration-200 flex items-center justify-center ${tipping[post.id] ? 'bg-green-700 cursor-not-allowed opacity-80' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                          disabled={!!tipping[post.id]}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center space-x-1"
                        >
                          <Crown className="w-3 h-3" />
                          <span>Join the Team</span>
                        </button>
                      </div>
                    )}

                    {/* Follow Actions for Tracks/Series */}
                    {(post.userType === 'TRACK' || post.userType === 'SERIES') && (
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Follow</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && posts.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">🏁</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-sm text-gray-400">Be the first to share something with the racing community!</p>
          </div>
        )}
        
        {/* Loading more posts */}
        {loadingMore && (
          <div className="text-center py-6">
            <div className="inline-flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading more posts...</span>
            </div>
          </div>
        )}
        
        {/* Intersection observer sentinel */}
        {hasMore && !loadingMore && posts.length > 0 && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}
        
        {/* No more posts indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">🏁 You've reached the end of the feed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrandstandPosts;
