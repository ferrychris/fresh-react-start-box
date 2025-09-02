import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  DollarSign, 
  Share2, 
  Globe, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { PostComment } from '@/types';
import type { Post as PostType } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import { getPostLikers, likePost, unlikePost, addCommentToPost, getPostComments, deletePost } from '@/lib/supabase/posts';
import { AuthModal } from '@/components/auth/AuthModal';

// Define a more complete Post type for the component
export type Post = PostType;

interface PostCardProps {
  post: Post & {
    racer_profiles?: {
      id: string;
      username: string;
      profile_photo_url: string;
      car_number?: string;
      racing_class?: string;
      profiles?: {
        id: string;
        name: string;
        user_type: string;
        avatar?: string;
      };
    };
    track?: {
      id: string;
      track_name: string;
      track_logo_url: string;
    };
  };
  onPostUpdate?: () => void;
  onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post: initialPost, onPostUpdate, onPostDeleted }) => {
  const { user } = useUser();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count || 0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const checkLike = async () => {
      if (!user) {
        setIsLiked(false);
        return;
      }
      const { data, error } = await getPostLikers(post.id, user.id);

      if (error) {
        console.error('Error checking post like:', error);
      }
      setIsLiked(!!data);
    };

    checkLike();
    setLikesCount(post.likes_count || 0);
  }, [post.id, user, post.likes_count]);

  const handleLike = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (likeBusy) return; // prevent rapid clicks
    setLikeBusy(true);
    
    const wasLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!wasLiked);
    setLikesCount(prev => prev + (wasLiked ? -1 : 1));
    
    try {
      if (wasLiked) {
        await unlikePost(post.id, user.id);
      } else {
        await likePost(post.id, user.id);
      }

      onPostUpdate?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikesCount(prevCount);
    }
    finally {
      setLikeBusy(false);
    }
  };

  const handleToggleComments = async () => {
    try {
      setShowComments((prev) => !prev);

      // Only fetch when opening for the first time or when we need refresh
      if (!showComments) {
        setCommentsLoading(true);
        const { data: fetchedComments, totalCount, error } = await getPostComments(post.id, 20, 0);
        if (error) {
          console.error('Failed to load comments:', error);
        }
        setComments((fetchedComments || []) as any);
        // Prefer authoritative count from backend
        if (typeof totalCount === 'number' && totalCount >= 0) {
          setCommentsCount(totalCount);
        } else if (Array.isArray(fetchedComments)) {
          setCommentsCount(fetchedComments.length);
        }
      }
    } catch (err) {
      console.error('Error toggling comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!newComment.trim()) return;
    try {
      setCommentsLoading(true);
      const { error } = await addCommentToPost(post.id, user.id, newComment.trim());
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Optimistically increment local count
      setCommentsCount((c) => c + 1);

      // Refresh list and authoritative count
      const { data: refreshed, totalCount } = await getPostComments(post.id, 20, 0);
      setComments((refreshed || []) as any);
      if (typeof totalCount === 'number') setCommentsCount(totalCount);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleTip = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (tipAmount <= 0) return;
    
    alert('Tipping functionality is temporarily disabled.');
    setShowTipModal(false);
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.racer_id) {
      alert('You can only delete your own posts');
      return;
    }
    
    setLoading(true);
    try {
      await deletePost(post.id);

      onPostDeleted?.();
      setShowDeleteConfirm(false);
      setShowMoreMenu(false);
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(`Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const PostMedia: React.FC = () => {
    if (post.post_type === 'video' && post.media_urls.length > 0) {
      return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            src={post.media_urls[0]}
            className="w-full h-48 sm:h-64 object-cover"
            poster={post.media_urls[0] + '#t=0.1'}
            controls
            preload="metadata"
            playsInline
          >
            <source src={post.media_urls[0]} type="video/mp4" />
            <source src={post.media_urls[0]} type="video/webm" />
            <source src={post.media_urls[0]} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if ((post.post_type === 'gallery' || post.post_type === 'photo') && post.media_urls.length > 0) {
      return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          {post.media_urls[currentImageIndex]?.startsWith('data:video/') || 
           post.media_urls[currentImageIndex]?.includes('.mp4') ||
           post.media_urls[currentImageIndex]?.includes('.webm') ||
           post.media_urls[currentImageIndex]?.includes('.ogg') ? (
            <video
              src={post.media_urls[currentImageIndex]}
              className="w-full h-48 sm:h-64 object-cover"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={post.media_urls[currentImageIndex]}
              alt={`Post image ${currentImageIndex + 1}`}
              className="w-full h-48 sm:h-64 object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 100vw, 640px"
            />
          )}
          {post.media_urls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => 
                  prev > 0 ? prev - 1 : post.media_urls.length - 1
                )}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => 
                  prev < post.media_urls.length - 1 ? prev + 1 : 0
                )}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
              <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm text-white">
                {currentImageIndex + 1} / {post.media_urls.length}
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-800/50 transition-colors">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={
                post.racer_profiles?.profile_photo_url || 
                post.racer_profiles?.profiles?.avatar || 
                `https://api.dicebear.com/7.x/initials/svg?seed=${
                  post.racer_profiles?.profiles?.name || 
                  post.racer_profiles?.username || 
                  'User'
                }&backgroundColor=ff6600&textColor=ffffff`
              }
              alt={post.racer_profiles?.profiles?.name || post.racer_profiles?.username || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-white">
                  {post.racer_profiles?.profiles?.name || post.racer_profiles?.username || 'Unknown User'}
                </h4>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {post.racer_profiles && post.racer_profiles?.profiles?.user_type === 'racer' && (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {post.racer_profiles?.profiles?.user_type === 'racer' && (
                    <div className="bg-green-600 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap">
                      <span className="hidden sm:inline">VERIFIED RACER</span>
                      <span className="sm:hidden">RACER</span>
                    </div>
                  )}
                  {post.racer_profiles?.profiles?.user_type === 'fan' && (
                    <div className="bg-purple-600 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap">
                      <span className="hidden sm:inline">RACING FAN</span>
                      <span className="sm:hidden">FAN</span>
                    </div>
                  )}
                  {post.racer_profiles?.car_number && (
                    <div className="bg-red-600 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap">
                      #{post.racer_profiles.car_number}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(post.created_at)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {post.visibility === 'public' ? (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" />
                      <span>Fans Only</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>
            
            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                {user && user.id === post.racer_id && (
                  <>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        // Edit functionality can be added later
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete Post</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    // Report functionality can be added later
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Report Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-white mb-4">Delete Post?</h3>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. Your post will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close menu */}
        {showMoreMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowMoreMenu(false)}
          />
        )}

        {/* Post Content */}
        <div className="mb-4">
          <p
            className="text-gray-100 leading-relaxed whitespace-pre-wrap"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.content}
          </p>
        </div>
      </div>

      {/* Post Media */}
      {post.media_urls.length > 0 && (
        <div className="px-6 pb-4">
          <PostMedia />
        </div>
      )}

      {/* Engagement Stats */}
      {(likesCount > 0 || commentsCount > 0 || post.total_tips > 0) && (
        <div className="px-6 py-2 text-sm text-gray-400 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {likesCount > 0 && (
                <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
              )}
              {commentsCount > 0 && (
                <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
              )}
            </div>
            {post.total_tips > 0 && (
              <span className="text-green-400">${post.total_tips} in tips</span>
            )}
          </div>
        </div>
      )}

      {/* Engagement Bar */}
      <div className="px-6 py-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={likeBusy}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                isLiked
                  ? 'bg-red-500/20 text-red-500'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-red-500'
              } ${likeBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">
                {likesCount}
              </span>
            </button>
            
            <button
              onClick={handleToggleComments}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-fedex-purple transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">{commentsCount}</span>
            </button>
            
            {post.allow_tips && (
              <button
                onClick={() => setShowTipModal(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-green-400 transition-all"
              >
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Tip</span>
              </button>
            )}
          </div>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4">
            <h4 className="text-md font-semibold text-white mb-3">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h4>
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <img
                     src={comment.profiles?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.profiles?.name || 'User'}`}
                     alt={comment.profiles?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm text-white">{comment.profiles?.name || 'User'}</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.comment_text}</p>
                  </div>
                </div>
              ))}
              {commentsLoading && <div className="text-center text-gray-400">Loading...</div>}
              {hasMoreComments && !commentsLoading && (
                <button 
                  onClick={() => setComments([])} // Placeholder for load more
                  className="w-full text-center text-fedex-purple font-semibold py-2"
                >
                  View more comments
                </button>
              )}
            </div>
            
            {user && (
              <div className="flex items-center space-x-3">
                <img
                  src={(user as any).avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Send a Tip</h3>
              <button
                onClick={() => setShowTipModal(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount)}
                    className={`p-3 rounded-lg font-semibold transition-colors ${
                      tipAmount === amount
                        ? 'bg-fedex-orange text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                placeholder="Custom amount"
              />
              
              <button
                onClick={handleTip}
                disabled={loading || tipAmount <= 0}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
              >
                {loading ? 'Sending...' : `Send $${tipAmount} Tip`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};