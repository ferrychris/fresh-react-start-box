import React, { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Calendar, MapPin, Users, DollarSign, RefreshCw } from 'lucide-react';
import { useUser } from '../../../contexts/UserContext';
import toast from 'react-hot-toast';
import CreatePost from './CreatePost';
import { supabase, getFanPosts } from '../../../lib/supabase';
import { Post, PostCreationPayload, DatabasePost, transformDbPostToUIPost } from './types'; // Import shared types

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

  // Mock posts data for development - wrapped in useMemo to avoid dependency array issues
  const mockPosts = useMemo((): Post[] => [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      userId: '550e8400-e29b-41d4-a716-446655440002',
      userType: 'RACER',
      userName: 'Jake Johnson',
      userAvatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
      userVerified: true,
      carNumber: '23',
      content: 'Just finished qualifying for tomorrow\'s Charlotte 400! P3 starting position - feeling good about our chances. The car is handling perfectly and the team has been working overtime. Ready to put on a show for all the fans! 🏁',
      mediaUrls: ['https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2'],
      mediaType: 'image',
      location: 'Charlotte Motor Speedway',
      eventDate: '2024-02-15',
      likes: 247,
      comments: 18,
      shares: 12,
      isLiked: false,
      timestamp: '2 hours ago'
    },
    {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      userId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
      userName: 'Monaco Grand Prix',
      userAvatar: 'https://i.imgur.com/7mMrwrK.jpg',
      userType: 'TRACK',
      userVerified: true,
      content: 'Preparations are underway for the most glamorous race of the season! 🏎️ #MonacoGP',
      mediaUrls: ['https://i.imgur.com/XzSdKrL.jpg'],
      mediaType: 'image',
      timestamp: '1 day ago',
      likes: 856,
      comments: 42,
      shares: 21,
      isLiked: true,
      location: 'Monte Carlo, Monaco',
      eventDate: '2023-05-28'
    },
    {
      id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01',
      userId: 'd4e5f6a7-b8c9-0123-4567-890abcdef012',
      userName: 'Formula 1',
      userAvatar: 'https://i.imgur.com/QmHPGVW.jpg',
      userType: 'SERIES',
      userVerified: true,
      content: 'The championship battle heats up as we head to Barcelona! Who\'s your pick for the win?',
      mediaUrls: ['https://i.imgur.com/vQ8hFaH.mp4'],
      mediaType: 'video',
      timestamp: '3 days ago',
      likes: 2453,
      comments: 312,
      shares: 98,
      isLiked: false
    },
    {
      id: 'e5f6a7b8-c9d0-1234-5678-90abcdef0123',
      userId: 'f6a7b8c9-d0e1-2345-6789-0abcdef01234',
      userName: 'F1 Enthusiast',
      userAvatar: 'https://i.imgur.com/JxU3Z5I.jpg',
      userType: 'FAN',
      userVerified: false,
      content: 'Just got my tickets for the US Grand Prix! Anyone else going to be in Austin?',
      mediaUrls: [],
      timestamp: '5 days ago',
      likes: 124,
      comments: 43,
      shares: 5,
      isLiked: false,
      location: 'Austin, Texas',
      eventDate: '2023-10-22'
    }
  ], []);

  // Fetch posts from database or use provided posts
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setIsLoading(true);
        // Fetch recent posts using the modular getFanPosts function
        const allDbPosts = await getFanPosts();
        
        const transformedPosts = allDbPosts.map(transformDbPostToUIPost);
        
        const sortedPosts = transformedPosts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        if (sortedPosts.length > 0) {
          setList(sortedPosts);
        } else {
          setList(mockPosts); // Fallback to mock data
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
        setList(mockPosts); // Fallback to mock data on error
      } finally {
        setIsLoading(false);
      }
    };
    
    if (posts && posts.length > 0) {
      setList(posts);
    } else {
      fetchAllPosts();
    }
  }, [posts, mockPosts]);

  const handleCreate = (post: Post) => {
    if (onCreatePost) {
      onCreatePost(post);
    }
    // Ensure modal closes after post creation
    setShowCreatePostModal(false);
  };

  // Function to refresh posts from the database
  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, created_at, content, media_urls, post_type, likes_count, comments_count,
          fan_id, racer_id,
          profiles ( name, avatar, user_type ),
          racer:racers ( id, username, profile_photo_url )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error refreshing posts:', error);
      }
      const allDbPosts: DatabasePost[] = (data as unknown as DatabasePost[]) || [];
      
      const transformedPosts = allDbPosts.map(transformDbPostToUIPost);
      
      const sortedPosts = transformedPosts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      if (sortedPosts.length > 0) {
        setList(sortedPosts);
        toast.success('Posts refreshed');
      } else {
        toast('No new posts found.');
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast.error('Failed to refresh posts');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
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
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
      toast.success('Like updated successfully');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
      // Revert the optimistic update on error
      setList(originalList);
    } finally {
      setIsLikeLoading(prev => ({ ...prev, [postId]: false }));
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
        <div className="p-4 lg:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {list.map((post) => (
              <div 
                key={post.id} 
                className={`bg-gray-900 rounded-xl border ${activePostId === post.id ? 'border-fedex-orange' : 'border-gray-800'} overflow-hidden hover:border-gray-700 transition-all duration-300`}
                onMouseEnter={() => setActivePostId(post.id)}
                onMouseLeave={() => setActivePostId(null)}
              >
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <img
                        src={post.userAvatar}
                        alt={post.userName}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                      <div>
                        <div className="flex items-center">
                          <span className="font-semibold text-white mr-1">
                            {post.userName}
                          </span>
                          {post.userVerified && (
                            <div className="text-orange-500 text-xs ml-1">✓</div>
                          )}
                          {post.carNumber && (
                            <span className="text-orange-500 text-sm ml-1">#{post.carNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center text-xs">
                          <span className={`${getUserTypeColor(post.userType)}`}>
                            {post.userType}
                          </span>
                          <span className="text-gray-500 mx-1">•</span>
                          <span className="text-gray-400">{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-2">
                    <p className="text-gray-300 text-sm">{post.content}</p>
                    
                    {/* Location and Event Info */}
                    {(post.location || post.eventDate) && (
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        {post.location && (
                          <div className="flex items-center mr-3">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        {post.eventDate && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(post.eventDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mb-2 -mx-4 relative">
                      {post.mediaType === 'video' ? (
                        <video 
                          src={post.mediaUrls[0]} 
                          controls 
                          className="w-full" 
                          poster={post.mediaUrls[0] + '?poster=true'}
                        />
                      ) : post.mediaUrls.length === 1 ? (
                        <img
                          src={post.mediaUrls[0]}
                          alt="Post media"
                          className="w-full object-cover max-h-[500px]"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                          }}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {post.mediaUrls.slice(0, 4).map((url, index) => (
                            <div 
                              key={index} 
                              className={`${index >= 2 ? 'mt-1' : ''} relative ${post.mediaUrls.length === 3 && index === 2 ? 'col-span-2' : ''}`}
                            >
                              <img
                                src={url}
                                alt={`Post media ${index + 1}`}
                                className="w-full object-cover h-[250px]"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                                }}
                              />
                              {index === 3 && post.mediaUrls.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">+{post.mediaUrls.length - 4} more</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={isLikeLoading[post.id]}
                        className={`flex items-center space-x-1 text-sm ${
                          post.isLiked 
                            ? 'text-red-500' 
                            : activePostId === post.id ? 'text-white' : 'text-gray-400'
                        } ${isLikeLoading[post.id] ? 'opacity-50' : ''} transition-all duration-200 hover:scale-110`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''} ${isLikeLoading[post.id] ? 'animate-pulse' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <button className={`flex items-center space-x-1 text-sm ${activePostId === post.id ? 'text-white' : 'text-gray-400'} transition-all duration-200 hover:scale-110`}>
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className={`flex items-center space-x-1 text-sm ${activePostId === post.id ? 'text-white' : 'text-gray-400'} transition-all duration-200 hover:scale-110`}>
                        <Share className="w-4 h-4" />
                        <span>{post.shares}</span>
                      </button>
                    </div>

                    {/* Tip/Subscribe Actions for Racers */}
                    {post.userType === 'RACER' && (
                      <div className="flex items-center space-x-2">
                        <button 
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>Tip $5</span>
                        </button>
                        <button 
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex items-center"
                        >
                          <span>Join the Team</span>
                        </button>
                      </div>
                    )}

                    {/* Follow Actions for Tracks/Series */}
                    {(post.userType === 'TRACK' || post.userType === 'SERIES') && (
                      <div className="flex items-center space-x-2">
                        <button className="px-2 py-1 bg-orange-500 text-white rounded text-xs flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>Follow</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsPanel;
