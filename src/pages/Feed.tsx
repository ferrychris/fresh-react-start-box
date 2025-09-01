import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  DollarSign, 
  Share2, 
  Filter, 
  Search,
  MapPin,
  Calendar,
  Trophy,
  Play,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Flag,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { raceClasses } from '../data/raceClasses';
import { PostCard } from '../components/PostCard';
import { getRacerPosts, supabase } from '../lib/supabase';
import { PostCreator } from '../components/PostCreator';
import { LiveStreamIndicator } from '../components/LiveStreamIndicator';

const PAGE_SIZE = 5;

interface Post {
  id: string;
  racerId: string;
  racer: {
    id: string;
    name: string;
    profilePicture: string;
    carNumber: string;
    class: string;
    isVerified?: boolean;
  };
  type: 'text' | 'photo' | 'video' | 'gallery';
  content: string;
  media?: string[];
  videoUrl?: string;
  videoDuration?: string;
  visibility: 'public' | 'subscribers';
  timestamp: string;
  location?: string;
  trackName?: string;
  eventName?: string;
  tags: string[];
  likes: number;
  comments: number;
  tips: number;
  isLiked: boolean;
  isFollowing: boolean;
  hasComments?: boolean;
}

export const Feed: React.FC = () => {
  const { user, racers } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingPopup, setShowLoadingPopup] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'liked' | 'tipped'>('recent');
  const [filterClass, setFilterClass] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);
  const [realPosts, setRealPosts] = useState<any[]>([]);
  const [fanPosts, setFanPosts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Load posts immediately without loading state
    loadPublicPosts(false);
    loadFanPosts();
    
    // Hide loading popup after 3 seconds regardless of data load status
    const popupTimer = setTimeout(() => {
      setShowLoadingPopup(false);
    }, 3000);
    
    return () => clearTimeout(popupTimer);
  }, []);

  const loadPublicPosts = async (append: boolean) => {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - using empty posts array');
        if (!append) setRealPosts([]);
        return;
      }

      if (append) setIsLoadingMore(true);
      const offset = append ? realPosts.length : 0;

      const { data, error } = await supabase
        .from('racer_posts')
        .select(`
          *,
          racer_profiles!inner(
            id,
            username,
            profile_photo_url,
            car_number,
            racing_class,
            profiles!inner(
              id,
              name,
              avatar
            )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (error) {
        console.error('Error with racer_posts query:', error);
        if (!append) setRealPosts([]);
        return;
      } else {
        const newItems = data || [];
        console.log('Loaded posts:', newItems.length, 'append:', append, 'offset:', offset);
        if (append) {
          setRealPosts(prev => [...prev, ...newItems]);
        } else {
          setRealPosts(newItems);
        }
        // if fewer than PAGE_SIZE, no more to load
        if (newItems.length < PAGE_SIZE) setHasMore(false);
        // Hide loading popup once posts are loaded
        setShowLoadingPopup(false);
      }
    } catch (error) {
      console.error('Error loading public posts:', error);
      // Set empty array on any error to prevent crashes
      if (!append) setRealPosts([]);
      // Hide loading popup even on error
      setShowLoadingPopup(false);
    }
    setLoading(false);
    setIsLoadingMore(false);
  };

  const loadFanPosts = async () => {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - using empty fan posts array');
        setFanPosts([]);
        return;
      }

      const { data, error } = await supabase
        .from('fan_posts')
        .select(`
          *,
          profiles(
            id,
            name,
            avatar
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      
      if (error) {
        // Handle specific database errors gracefully
        if (error.code === 'PGRST002' || error.message?.includes('schema cache') || error.message?.includes('Failed to fetch') || error.code === '57014') {
          console.warn('⚠️ Database temporarily unavailable - using empty fan posts array');
          setFanPosts([]);
          return;
        }
        console.error('Error with fan_posts query:', error);
        setFanPosts([]);
        return;
      } else {
        console.log('Loaded fan posts:', data?.length || 0);
        setFanPosts(data || []);
      }
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error loading fan posts - database may be unavailable');
      } else {
        console.error('Error loading fan posts:', error);
      }
      setFanPosts([]);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (feedRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 800 && !loading && !isLoadingMore && hasMore) {
          // Load next batch
          loadPublicPosts(true);
        }
      }
    };

    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener('scroll', handleScroll);
      return () => feedElement.removeEventListener('scroll', handleScroll);
    }
  }, [loading, isLoadingMore, hasMore, realPosts.length]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleFollow = (racerId: string) => {
    setPosts(posts.map(post => 
      post.racerId === racerId 
        ? { ...post, isFollowing: !post.isFollowing }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    if (newComment.trim()) {
      // Add comment logic here
      setNewComment('');
      setShowComments(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesClass = filterClass === 'all' || post.racer.class.toLowerCase().includes(filterClass.toLowerCase());
    const matchesLocation = filterLocation === 'all' || post.location?.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.racer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesClass && matchesLocation && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'liked':
        return b.likes - a.likes;
      case 'tipped':
        return b.tips - a.tips;
      default:
        return 0; // Keep original order for 'recent'
    }
  });

  // Only show posts from racers with published profiles
  const publishedPosts = sortedPosts.filter(post => 
    racers.find(r => r.id === post.racerId) && // Just check if racer exists
    (post.visibility === 'public' || (user && post.racerId === user.id))
  );

  const PostMedia: React.FC<{ post: Post }> = ({ post }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (post.type === 'video') {
      return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={post.videoUrl}
            alt="Video thumbnail"
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-16 h-16 bg-fedex-orange/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <Play className="h-8 w-8 ml-1 text-white" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm text-white">
            {post.videoDuration}
          </div>
        </div>
      );
    }

    if (post.type === 'gallery' && post.media) {
      return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={post.media[currentImageIndex]}
            alt={`Gallery image ${currentImageIndex + 1}`}
            className="w-full h-64 sm:h-80 object-cover"
          />
          {post.media.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : post.media!.length - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => prev < post.media!.length - 1 ? prev + 1 : 0)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
              <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm text-white">
                {currentImageIndex + 1} / {post.media.length}
              </div>
            </>
          )}
        </div>
      );
    }

    if (post.type === 'photo' && post.media) {
      return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={post.media[0]}
            alt="Post image"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Loading Popup */}
      {showLoadingPopup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-700/50">
            <div className="text-center">
              {/* Racing-themed loading animation */}
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-fedex-orange/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-fedex-orange rounded-full animate-spin"></div>
                  <div className="absolute inset-2 bg-fedex-orange/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏁</span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Loading Racing Feed</h3>
              <p className="text-gray-400 mb-4">
                Please wait while we load the latest racing content...
              </p>
              
              {/* Progress dots */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-fedex-orange rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-fedex-orange rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-fedex-orange rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-bold">Racing Feed</h1>
            {realPosts.length === 0 && !showLoadingPopup && (
              <div className="text-sm text-gray-400 animate-pulse">
                Give the feed a moment to load...
              </div>
            )}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 md:px-3 py-1 md:py-2 text-white text-xs md:text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="liked">Most Liked</option>
                <option value="tipped">Most Tipped</option>
              </select>
              <button className="p-1 md:p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
        </div>
      </div>

      {/* Feed Content */}
      <div ref={feedRef} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Fan Post Creator */}
        {user && user.type === 'fan' && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <PostCreator
              racerId={user.id} 
              onPostCreated={loadPublicPosts}
              isFan={true}
            />
          </div>
        )}

        {/* Show loading only if we have no posts at all */}
        {realPosts.length === 0 && fanPosts.length === 0 && loading && !showLoadingPopup ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-800 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-4" />
                <div className="h-64 bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (realPosts.length > 0 || fanPosts.length > 0) ? (
          /* Show all posts combined and sorted by date */
          [...realPosts, ...fanPosts]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onPostUpdate={loadPublicPosts}
              onPostDeleted={loadPublicPosts}
            />
            ))
        ) : (
          /* Legacy posts for backward compatibility */
          publishedPosts.map(post => (
            <div key={post.id} className="bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-800/50 transition-colors">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Link to={`/racer/${post.racerId}`}>
                      <img
                        src={post.racer.profilePicture}
                        alt={post.racer.name}
                        className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-red-500 transition-all"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link 
                          to={`/racer/${post.racerId}`}
                          className="font-semibold hover:text-red-400 transition-colors"
                        >
                          {post.racer.name}
                        </Link>
                        {post.racer.isVerified && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        <div className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                          VERIFIED RACER
                        </div>
                        <div className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                          #{post.racer.carNumber}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <span>{post.racer.class}</span>
                        <span>•</span>
                        <span>{post.timestamp}</span>
                        {post.visibility === 'subscribers' && (
                          <>
                            <span>•</span>
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Zap className="h-3 w-3" />
                              <span className="text-xs">Subscribers Only</span>
                            </div>
                          </>
                        )}
                      </div>
                      {(post.location || post.trackName || post.eventName) && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                          {post.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{post.location}</span>
                            </div>
                          )}
                          {post.trackName && (
                            <>
                              <span>•</span>
                              <span>{post.trackName}</span>
                            </>
                          )}
                          {post.eventName && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{post.eventName}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!post.isFollowing && (
                      <button
                        onClick={() => handleFollow(post.racerId)}
                        className="px-3 py-1 bg-fedex-orange hover:bg-fedex-orange-dark rounded-full text-sm font-semibold transition-colors flex items-center space-x-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-100 leading-relaxed">{post.content}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map(tag => (
                        <button
                          key={tag}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Post Media */}
              {(post.type === 'photo' || post.type === 'video' || post.type === 'gallery') && (
                <div className="px-6 pb-4">
                  <PostMedia post={post} />
                </div>
              )}

              {/* Engagement Bar */}
              <div className="px-6 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                        post.isLiked 
                          ? 'bg-fedex-orange/20 text-fedex-orange' 
                          : 'hover:bg-gray-800 text-gray-400 hover:text-fedex-orange'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-semibold">{post.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-fedex-purple transition-all"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-semibold">{post.comments}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-green-400 transition-all">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-semibold">{post.tips}</span>
                    </button>
                  </div>
                  
                  <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Comments Section */}
                {showComments === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="space-y-3 mb-4">
                      {/* Mock comments */}
                      <div className="flex items-start space-x-3">
                        <img
                          src="https://api.dicebear.com/7.x/initials/svg?seed=Fan1"
                          alt="Commenter"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 bg-gray-800 rounded-lg p-3">
                          <div className="font-semibold text-sm mb-1">Racing Fan #1</div>
                          <p className="text-sm text-gray-300">Great run! Can't wait to see you at the track tomorrow! 🏁</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <img
                          src="https://api.dicebear.com/7.x/initials/svg?seed=Fan2"
                          alt="Commenter"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 bg-gray-800 rounded-lg p-3">
                          <div className="font-semibold text-sm mb-1">Speed Enthusiast</div>
                          <p className="text-sm text-gray-300">That setup looks perfect! Good luck with the race!</p>
                        </div>
                      </div>
                    </div>
                    
                    {user && (
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 flex space-x-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-purple"
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Load More */}
        {(loading || isLoadingMore) && realPosts.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading more posts...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && realPosts.length === 0 && publishedPosts.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterClass !== 'all' || filterLocation !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to share something with the racing community!'
              }
            </p>
            {user?.type === 'racer' && (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
              >
                Create Your First Post
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;