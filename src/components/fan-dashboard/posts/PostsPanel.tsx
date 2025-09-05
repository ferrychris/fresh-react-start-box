import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Calendar, MapPin, Users, DollarSign, RefreshCw } from 'lucide-react';
import { useUser } from '../../../contexts/UserContext';
import toast from 'react-hot-toast';
import CreatePost from './CreatePost';
import { supabase } from '../../../lib/supabase/client';
import { getFanPostsPage } from '../../../lib/supabase/posts';
import { Post, PostCreationPayload, DatabasePost, transformDbPostToUIPost } from './types';
import LazyImage from '../../LazyImage';

// Cache for storing posts data
const postsCache = new Map<string, {
  data: Post[];
  nextCursor: { created_at: string; id: string } | null;
  timestamp: number;
}>();

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Post interface is now imported from types.ts


interface PostsPanelProps {
  posts?: Post[];
  onCreatePost?: (post: Post, payload?: PostCreationPayload) => void;
  showComposer?: boolean;
  loading?: boolean;
}

const PostsPanel: React.FC<PostsPanelProps> = ({ posts, onCreatePost, showComposer = true, loading = false }) => {
  const [list, setList] = useState<Post[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Pagination state
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prefetch, setPrefetch] = useState<{ data: DatabasePost[]; nextCursor: { created_at: string; id: string } | null } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Helper: prefetch next page in background
  const prefetchNext = useCallback(async (cur: { created_at: string; id: string } | null) => {
    if (!cur) return setPrefetch(null);
    try {
      const { data, nextCursor, error } = await getFanPostsPage({ limit: 5, cursor: cur });
      if (error) throw error;
      setPrefetch({ data: data as unknown as DatabasePost[], nextCursor });
    } catch (e) {
      // Silent fail; we'll fetch on demand
      setPrefetch(null);
    }
  }, []);

  // Update like status for posts based on user's likes in database
  const updateLikeStatus = useCallback(async (posts: Post[]) => {
    if (!user || posts.length === 0) return;
    
    try {
      const postIds = posts.map(p => p.id);
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (error) {
        console.error('Error fetching like status:', error);
        return;
      }
      
      const likedPostIds = new Set(likes?.map(like => like.post_id) || []);
      
      // Update the posts with correct like status
      setList(currentList => 
        currentList.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id)
        }))
      );
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  }, [user]);

  // Load first page - fetch all public posts with better error handling and caching
  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading initial posts...');
      
      // Check cache first
      const cacheKey = 'initial-posts';
      const cachedData = postsCache.get(cacheKey);
      const now = Date.now();
      
      // Use cache if it exists and hasn't expired
      if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRATION) {
        console.log('Using cached posts data');
        setList(cachedData.data);
        setCursor(cachedData.nextCursor);
        setHasMore(!!cachedData.nextCursor);
        
        // Still check likes status as it might have changed
        if (user) {
          await updateLikeStatus(cachedData.data);
        }
        
        // Prefetch next page in background
        prefetchNext(cachedData.nextCursor);
        return;
      }
      
      // Cache miss - fetch from API
      const { data, nextCursor, error } = await getFanPostsPage({ 
        limit: 5, 
        cursor: null,
        cacheKey
      });
      
      if (error) {
        console.error('Error loading posts:', error);
        
        // If it's a database table missing error, show mock data
        if (error.message?.includes('relation "racer_posts" does not exist') || 
            error.message?.includes('table') || 
            error.message?.includes('relation')) {
          console.log('Database table missing, showing mock data');
          const mockPosts = createMockPosts();
          setList(mockPosts);
          setHasMore(false);
          toast.success('Showing sample posts (database not configured)');
          return;
        }
        
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No posts found, creating mock posts');
        const mockPosts = createMockPosts();
        setList(mockPosts);
        setHasMore(false);
        toast.success('Showing sample posts');
        return;
      }

      const transformed = (data as unknown as DatabasePost[]).map(transformDbPostToUIPost);
      console.log(`Loaded ${transformed.length} posts successfully`);
      
      // Update state
      setList(transformed);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
      
      // Update cache
      postsCache.set(cacheKey, {
        data: transformed,
        nextCursor,
        timestamp: now
      });
      
      // Check which posts are liked by the current user
      if (user) {
        await updateLikeStatus(transformed);
      }
      
      // Kick off background prefetch of the next page
      prefetchNext(nextCursor);
    } catch (e) {
      console.error('Error loading posts:', e);
      // Always show mock data as fallback
      const mockPosts = createMockPosts();
      setList(mockPosts);
      setHasMore(false);
      toast.error('Using sample data - database unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [prefetchNext, updateLikeStatus, user]);

  // Create mock posts for when database is unavailable
  const createMockPosts = (): Post[] => {
    return [
      {
        id: 'mock-1',
        userId: 'mock-user-1',
        userName: 'Alex Thunder',
        userAvatar: '',
        userType: 'RACER',
        userVerified: true,
        content: 'Just finished practice at Eldora Speedway! The track is fast tonight and the car is handling perfectly. Ready for the feature race! 🏁',
        mediaUrls: [],
        timestamp: '2h ago',
        likes: 24,
        comments: 5,
        shares: 3,
        isLiked: false,
        carNumber: '23',
        location: 'Eldora Speedway',
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        userId: 'mock-user-2',
        userName: 'Sarah Speed',
        userAvatar: '',
        userType: 'RACER',
        userVerified: true,
        content: 'New wing package is working great! Thanks to the crew for all the hard work this week. Time to show what we can do! 💪',
        mediaUrls: [],
        timestamp: '4h ago',
        likes: 18,
        comments: 3,
        shares: 1,
        isLiked: false,
        carNumber: '47',
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-3',
        userId: 'mock-user-3',
        userName: 'Racing Fan Mike',
        userAvatar: '',
        userType: 'FAN',
        userVerified: false,
        content: 'Can\'t wait for tonight\'s races! The weather is perfect and the lineup looks amazing. Who\'s your pick for the win?',
        mediaUrls: [],
        timestamp: '6h ago',
        likes: 12,
        comments: 8,
        shares: 2,
        isLiked: false,
        updated_at: new Date().toISOString()
      }
    ];
  };

  // Load next page with caching and performance improvements
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      
      // Generate cache key for this page
      const pageCacheKey = cursor ? `posts-${cursor.created_at}-${cursor.id}` : 'posts-initial';
      const cachedPage = postsCache.get(pageCacheKey);
      const now = Date.now();
      
      // Use prefetched data if available (highest priority)
      if (prefetch) {
        const transformed = (prefetch.data as unknown as DatabasePost[]).map(transformDbPostToUIPost);
        
        // Update state
        setList(prev => [...prev, ...transformed]);
        setCursor(prefetch.nextCursor);
        setHasMore(!!prefetch.nextCursor);
        
        // Update cache
        postsCache.set(pageCacheKey, {
          data: transformed,
          nextCursor: prefetch.nextCursor,
          timestamp: now
        });
        
        // Chain next prefetch
        await prefetchNext(prefetch.nextCursor);
        setPrefetch(null);
        
        // Check which posts are liked by the current user
        if (user) {
          await updateLikeStatus(transformed);
        }
      } 
      // Use cache if available and not expired
      else if (cachedPage && (now - cachedPage.timestamp) < CACHE_EXPIRATION) {
        console.log('Using cached page data for pagination');
        
        // Update state with cached data
        setList(prev => [...prev, ...cachedPage.data]);
        setCursor(cachedPage.nextCursor);
        setHasMore(!!cachedPage.nextCursor);
        
        // Still prefetch next page
        await prefetchNext(cachedPage.nextCursor);
        
        // Check which posts are liked by the current user
        if (user) {
          await updateLikeStatus(cachedPage.data);
        }
      } 
      // Fetch from API if no cache or prefetch available
      else {
        const { data, nextCursor, error } = await getFanPostsPage({ 
          limit: 5, 
          cursor,
          cacheKey: pageCacheKey
        });
        
        if (error) throw error;
        
        const transformed = (data as unknown as DatabasePost[]).map(transformDbPostToUIPost);
        
        // Update state
        setList(prev => [...prev, ...transformed]);
        setCursor(nextCursor);
        setHasMore(!!nextCursor);
        
        // Update cache
        postsCache.set(pageCacheKey, {
          data: transformed,
          nextCursor,
          timestamp: now
        });
        
        // Prefetch next page
        await prefetchNext(nextCursor);
        
        // Check which posts are liked by the current user
        if (user) {
          await updateLikeStatus(transformed);
        }
      }
    } catch (e) {
      console.error('Error loading more posts:', e);
      toast.error('Failed to load more posts');
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, prefetch, prefetchNext, user, updateLikeStatus]);

  // Setup IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '400px' });

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [loadMore]);

  // Fetch posts from database or use provided posts
  useEffect(() => {
    if (posts && posts.length > 0) {
      setList(posts);
      setHasMore(false);
    } else {
      loadInitial();
    }
  }, [posts, loadInitial]);

  // Enhanced Realtime: handle post updates, deletions, and new posts
  useEffect(() => {
    // Skip if no user is logged in
    if (!user) return;
    
    console.log('Setting up realtime subscriptions for posts');
    
    // Create a channel for all post-related events
    const channel = supabase
      .channel('racer-posts-realtime')
      // Handle post deletions
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'racer_posts' },
        (payload) => {
          const oldRow = payload.old as { id?: string | number } | null;
          const deletedRaw = oldRow?.id;
          const deletedId = deletedRaw != null ? String(deletedRaw) : undefined;
          if (!deletedId) return;
          
          console.log('Realtime: Post deleted', deletedId);
          setList((prev) => prev.filter((p) => p.id !== deletedId));
          
          // Also remove from cache if present
          for (const [key, value] of postsCache.entries()) {
            if (value.data.some(post => post.id === deletedId)) {
              const updatedCache = {
                ...value,
                data: value.data.filter(post => post.id !== deletedId)
              };
              postsCache.set(key, updatedCache);
            }
          }
        }
      )
      // Handle post updates
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'racer_posts' },
        (payload) => {
          const updatedPost = payload.new as DatabasePost;
          if (!updatedPost?.id) return;
          
          console.log('Realtime: Post updated', updatedPost.id);
          
          // Transform the updated post
          const transformedPost = transformDbPostToUIPost(updatedPost as unknown as DatabasePost);
          
          // Update the post in the current list
          setList(prev => prev.map(post => 
            post.id === transformedPost.id ? { ...post, ...transformedPost } : post
          ));
          
          // Update in cache if present
          for (const [key, value] of postsCache.entries()) {
            if (value.data.some(post => post.id === transformedPost.id)) {
              const updatedCache = {
                ...value,
                data: value.data.map(post => 
                  post.id === transformedPost.id ? { ...post, ...transformedPost } : post
                )
              };
              postsCache.set(key, updatedCache);
            }
          }
        }
      )
      // Handle new posts
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'racer_posts' },
        (payload) => {
          const newPost = payload.new as DatabasePost;
          if (!newPost?.id) return;
          
          // Only add to feed if it's a public post
          if (newPost.visibility !== 'public') return;
          
          console.log('Realtime: New post created', newPost.id);
          
          // Transform the new post
          const transformedPost = transformDbPostToUIPost(newPost as unknown as DatabasePost);
          
          // Add the new post to the top of the list
          setList(prev => [transformedPost, ...prev]);
          
          // Invalidate cache since order has changed
          postsCache.clear();
          
          // Show a toast notification
          toast.success('New post available!');
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreate = (post: Post) => {
    if (onCreatePost) {
      onCreatePost(post);
    }
    // Ensure modal closes after post creation
    setShowCreatePostModal(false);
  };

  // Function to refresh posts from the database (reload first page)
  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      setCursor(null);
      setHasMore(true);
      await loadInitial();
      toast.success('Posts refreshed');
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast.error('Failed to refresh posts');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    // Set loading state for this specific post
    setIsLikeLoading(prev => ({ ...prev, [postId]: true }));
    
    // Store the original list for rollback in case of error
    const originalList = [...list];
    
    // Find the post in the list and make an optimistic update
    const updatedList = list.map(post => {
      if (post.id === postId) {
        // Toggle the like status
        const newIsLiked = !post.isLiked;
        return {
          ...post,
          isLiked: newIsLiked,
          likes: newIsLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    });
    
    // Update UI optimistically
    setList(updatedList);
    
    // Persist the change to the backend
    try {
      const isNowLiked = updatedList.find(p => p.id === postId)?.isLiked;
      if (isNowLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        if (error) throw error;
        
        // Update likes count in racer_posts table
        await supabase
          .from('racer_posts')
          .update({ likes_count: supabase.rpc('increment_post_likes', { post_id: postId }) })
          .eq('id', postId);
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
        
        // Update likes count in racer_posts table
        await supabase
          .from('racer_posts')
          .update({ likes_count: supabase.rpc('decrement_post_likes', { post_id: postId }) })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
      // Revert the optimistic update on error
      setList(originalList);
    } finally {
      setIsLikeLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = (postId: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    // For now, just show a message. Can be expanded to open a comment modal
    toast.success('Comment feature coming soon!');
  };

  const handleShare = async (post: Post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.userName}'s post`,
          text: post.content,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${post.content}\n\n${window.location.href}`);
        toast.success('Post copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share post');
    }
  };

  // Helper functions for user type styling
  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'RACER': return 'text-orange-500';
      case 'TRACK': return 'text-blue-500';
      case 'SERIES': return 'text-purple-500';
      case 'FAN': return 'text-green-500';
      default: return 'text-slate-500';
    }
  };

  const debugCheckRacerPosts = async () => {
    const { data, error } = await supabase
      .from('racer_posts')
      .select('*');
    if (error) throw error;
    return { data };
  };

  return (
    <div className="w-full">
      {showCreatePostModal && (
        <CreatePost 
          onClose={() => {
            setShowCreatePostModal(false);
            console.log('Modal closed');
          }} 
          onPostCreated={handleCreate} 
        />
      )}

      {showComposer && (
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setShowCreatePostModal(true)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-300 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <span className="text-slate-400">+</span>
                </div>
                <span className="text-slate-400">Share your racing thoughts...</span>
              </div>
            </button>
            <button 
              onClick={refreshPosts}
              disabled={isRefreshing}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-300 flex items-center justify-center"
              title="Refresh posts"
            >
              <RefreshCw className={`w-6 h-6 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={async () => {
                const result = await debugCheckRacerPosts();
                console.log('Debug racer posts:', result.data);
                toast.success(`Found ${result.data?.length || 0} racer posts`);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-300 flex items-center justify-center"
              title="Debug racer posts"
            >
              <span className="text-slate-400 text-sm">Debug</span>
            </button>
          </div>
        </div>
      )}

      {(loading || isLoading || isRefreshing) ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fedex-orange"></div>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-slate-400 mb-4">Be the first to share your racing thoughts!</p>
          <button 
            onClick={() => setShowCreatePostModal(true)}
            className="bg-fedex-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all"
          >
            Create a post
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {list.map((post) => (
            <div 
              key={post.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-all overflow-hidden"
            >
              {/* Post Header - Facebook Style */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <LazyImage
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">
                          {post.userName}
                        </span>
                        {post.userVerified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {post.carNumber && (
                          <span className="bg-fedex-orange text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            #{post.carNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-400">
                        <span>{post.timestamp}</span>
                        <span>•</span>
                        <span className={`${getUserTypeColor(post.userType)} font-medium`}>
                          {post.userType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="mt-3">
                  <p className="text-slate-100 text-sm leading-relaxed">{post.content}</p>
                  
                  {/* Location and Event Info */}
                  {(post.location || post.eventDate) && (
                    <div className="flex items-center mt-2 text-xs text-slate-400 space-x-4">
                      {post.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{post.location}</span>
                        </div>
                      )}
                      {post.eventDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Media - Full Width Facebook Style with Enhanced Lazy Loading */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="relative">
                  {post.mediaType === 'video' ? (
                    <div className="w-full max-h-[280px] bg-slate-800 relative">
                      {/* Use preload="metadata" to limit initial bandwidth usage */}
                      <video 
                        src={post.mediaUrls[0]} 
                        controls 
                        className="w-full max-h-[280px] object-cover" 
                        poster={post.mediaUrls[0] + '?poster=true'}
                        preload="metadata"
                        onLoadStart={(e) => {
                          // Limit initial bandwidth usage by seeking to a small time
                          const video = e.target as HTMLVideoElement;
                          if (video.duration) {
                            video.currentTime = Math.min(0.1, video.duration / 10);
                          }
                        }}
                      />
                    </div>
                  ) : post.mediaUrls.length === 1 ? (
                    <LazyImage
                      src={post.mediaUrls[0]}
                      alt="Post media"
                      className="w-full max-h-[280px] object-cover"
                      placeholder={<div className="w-full h-[280px] bg-slate-800 animate-pulse"></div>}
                      threshold={0.1} // Start loading when 10% visible
                    />
                  ) : (
                    <div className={`grid ${post.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-0.5`}>
                      {post.mediaUrls.slice(0, 4).map((url, index) => {
                        // Use IntersectionObserver via LazyImage component
                        return (
                          <div 
                            key={index} 
                            className={`relative ${post.mediaUrls.length === 3 && index === 2 ? 'col-span-2' : ''}`}
                          >
                            <LazyImage
                              src={url}
                              alt={`Post media ${index + 1}`}
                              className="w-full h-[140px] object-cover"
                              placeholder={<div className="w-full h-[140px] bg-slate-800 animate-pulse"></div>}
                              threshold={0.1} // Start loading when 10% visible
                              quality="medium" // Lower quality for grid images
                            />
                            {index === 3 && post.mediaUrls.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">+{post.mediaUrls.length - 4}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Like/Comment Stats */}
              {(post.likes > 0 || post.comments > 0) && (
                <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    {post.likes > 0 && (
                      <span className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <Heart className="w-2.5 h-2.5 text-white fill-current" />
                        </div>
                        <span>{post.likes}</span>
                      </span>
                    )}
                    {post.comments > 0 && (
                      <span>{post.comments} {post.comments === 1 ? 'comment' : 'comments'}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons - Facebook Style */}
              <div className="px-4 py-2 border-t border-slate-800">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={isLikeLoading[post.id]}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      post.isLiked 
                        ? 'text-red-500 hover:bg-slate-800' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    } ${isLikeLoading[post.id] ? 'opacity-50' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''} ${isLikeLoading[post.id] ? 'animate-pulse' : ''}`} />
                    <span>Like</span>
                  </button>
                  <button 
                    onClick={() => handleComment(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                  <button 
                    onClick={() => handleShare(post)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="py-6 flex justify-center items-center text-slate-400">
              {isLoadingMore ? 'Loading more…' : 'Scroll to load more'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostsPanel;
