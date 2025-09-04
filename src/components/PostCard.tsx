import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  X,
  Send,
  UserPlus
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { PostComment } from '@/types';
import type { Post as PostType } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import { getPostLikers, likePost, unlikePost, addCommentToPost, getPostComments, deletePost, updatePost } from '@/lib/supabase/posts';
import { createPaymentSession } from '@/lib/supabase/payments'; // Verified path
import { AuthModal } from '@/components/auth/AuthModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post: initialPost, onPostUpdate, onPostDeleted, onPostUpdated }) => {
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
  const [editingPost, setEditingPost] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Track comment IDs we've already added to avoid duplicates from
  // optimistic updates racing with realtime INSERT events
  const commentIdsRef = useRef<Set<string>>(new Set());
  // Cache user profiles by id to avoid repeated lookups
  const userCacheRef = useRef<Map<string, { name: string; avatar: string }>>(new Map());

  const fetchUserProfile = async (userId: string): Promise<{ name: string; avatar: string }> => {
    if (!userId) return { name: 'User', avatar: '' };
    const cached = userCacheRef.current.get(userId);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, avatar')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('Failed to fetch profile for comment user:', error);
      }
      const email = (data?.email as string | undefined) || '';
      const emailName = email ? (email.includes('@') ? email.split('@')[0] : email) : '';
      const result = { name: data?.name || emailName || 'User', avatar: data?.avatar || '' };
      userCacheRef.current.set(userId, result);
      return result;
    } catch (e) {
      console.warn('Exception fetching comment profile:', e);
      return { name: 'User', avatar: '' };
    }
  };

  // Normalize profiles access
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

  // Determine user type
  const userType = (profile?.user_type || '').toLowerCase();
  const isRacer = userType === 'racer';

  // Get display name - improved racer name fetching
  const emailUsername = profile?.email?.split('@')[0];
  const racerName = post.racer_profiles?.username || post.racer_profiles?.profiles?.name;
  const displayName = profile?.name || racerName || emailUsername || (isRacer ? 'Racer' : 'User');

  // Get avatar URL - check for avatar property
  const avatarUrl = profile?.avatar || '';

  // Check if current user is the post owner
  const isOwner = user?.id === post.user_id;

  // Generate initials as fallback
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const dicebearUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}`;

  // Simple UUID v4 validation (accepts lowercase/uppercase)
  const isValidUUID = (value: string | undefined | null): value is string => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

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

  // Realtime: listen for comments INSERT/DELETE for this post and racer_posts updates
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${post.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` },
        async (payload) => {
          const c = payload.new as any;
          const cid = c?.id != null ? String(c.id) : undefined;
          if (cid && !commentIdsRef.current.has(cid)) {
            commentIdsRef.current.add(cid);
            const profile = await fetchUserProfile(String(c.user_id));
            setComments(prev => [{
              id: cid,
              post_id: c.post_id,
              user_id: c.user_id,
              content: c.comment_text ?? c.content ?? '',
              created_at: c.created_at,
              user: {
                id: c.user_id,
                name: profile.name,
                avatar: profile.avatar,
                user_type: 'fan'
              }
            }, ...prev]);
            // Don't manually increment here as the database trigger handles it
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` },
        (payload) => {
          const oldRow = payload.old as any;
          const deletedIdRaw = oldRow?.id as string | number | undefined;
          const deletedId = deletedIdRaw != null ? String(deletedIdRaw) : undefined;
          if (deletedId) {
            commentIdsRef.current.delete(deletedId);
            setComments(prev => prev.filter(c => c.id !== deletedId));
            // Don't manually decrement here as the database trigger handles it
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'racer_posts', filter: `id=eq.${post.id}` },
        (payload) => {
          const updatedPost = payload.new as any;
          if (updatedPost?.comments_count !== undefined) {
            setCommentsCount(updatedPost.comments_count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const handleLike = async () => {
    if (!user) { 
      setShowAuthModal(true); 
      return; 
    }
    if (likeBusy) return; // prevent rapid clicks
    setLikeBusy(true);
    
    const wasLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!wasLiked);
    setLikesCount(prev => prev + (wasLiked ? -1 : 1));
    
    try {
      if (wasLiked) {
        const result = await unlikePost(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
      } else {
        const result = await likePost(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
      }

      // Call parent update callback
      onPostUpdate?.();
      
      // Show success feedback
      if (wasLiked) {
        console.log('Post unliked successfully');
      } else {
        console.log('Post liked successfully');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikesCount(prevCount);
      
      // Show error feedback
      toast.error('Failed to update like. Please try again.');
    } finally {
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
        // Initialize the ID set and state with fetched comments (dedup by id)
        const normalized = (fetchedComments ?? []).map(c => ({
          ...c,
          id: c.id != null ? String(c.id) : c.id
        }));
        const seen = new Set<string>();
        const unique = normalized.filter(c => {
          const cid = String(c.id);
          if (seen.has(cid)) return false;
          seen.add(cid);
          return true;
        });
        commentIdsRef.current = new Set(unique.map(c => String(c.id)));
        setComments(unique);
        // Don't let a stale backend count overwrite our newer local count.
        // Use the max of current and fetched counts.
        const fetchedCount = typeof totalCount === 'number' && totalCount >= 0
          ? totalCount
          : Array.isArray(fetchedComments) ? fetchedComments.length : 0;
        setCommentsCount(prev => Math.max(prev, fetchedCount));
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
      const { data: created, error } = await addCommentToPost(post.id, user.id, newComment.trim());
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Optimistically update UI only if not already present
      if (created && created.id) {
        const cid = String(created.id);
        if (!commentIdsRef.current.has(cid)) {
          commentIdsRef.current.add(cid);
        setComments(prev => [
          {
            id: cid,
            post_id: created.post_id,
            user_id: created.user_id,
            content: created.content,
            created_at: created.created_at,
            user: created.user
          },
          ...prev
        ]);
        setCommentsCount((c) => c + 1);
        }
      }
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
    
    setLoading(true);
    try {
      const { success, checkoutUrl } = await createPaymentSession({
        amount: tipAmount,
        postId: post.id,
        userId: user.id,
        racerId: post.user_id,
        description: `Tip for ${post.racer_profiles?.username || 'racer'}'s post`,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      });
      
      if (success && checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        if (!isValidUUID(post.id)) {
          toast.error('This post has an invalid ID and cannot be deleted. Please refresh.');
          return;
        }
        await deletePost(post.id);
        onPostDeleted?.(post.id);
        toast.success('Post deleted successfully');
      } catch (error) {
        toast.error('Failed to delete post');
        console.error('Delete error:', error);
      }
    }
  };

  const handleEditPost = async () => {
    try {
      await updatePost(post.id, editedContent);
      setPost({...post, content: editedContent});
      setEditingPost(false);
      toast.success('Post updated successfully');
      onPostUpdated?.(post);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.racer_profiles?.username || 'Racer'}`,
          text: post.content,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (err: unknown) {
      console.error('Share failed:', err);
      toast.error('Failed to share');
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
              src={avatarUrl || dicebearUrl}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold flex items-center gap-2">
                  {/* Display name first */}
                  <span>{displayName}</span>

                  {/* Then user type chip */}
                  {isRacer ? (
                    <div className="bg-fedex-orange text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap">
                      RACER
                    </div>
                  ) : userType === 'fan' ? (
                    <div className="bg-purple-600 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap">
                      <span className="hidden sm:inline">RACING FAN</span>
                      <span className="sm:hidden">FAN</span>
                    </div>
                  ) : null}
                </h4>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {/* Remove duplicate tag chips here to avoid repeated badges */}
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
          <div className="relative flex items-center gap-2">
            {isRacer && !isOwner && (
              <button
                onClick={() => {
                  if (!user) { setShowAuthModal(true); return; }
                  toast.success('You are now a fan! (placeholder)');
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-fedex-orange text-fedex-orange hover:bg-fedex-orange/10 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Become a Fan
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                className="w-auto bg-transparent border-0 shadow-none p-1 text-right min-w-[120px]"
              >
                {isOwner && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => {
                        setEditedContent(post.content);
                        setEditingPost(true);
                      }}
                      className="cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent px-2 py-1 text-gray-300 hover:text-green-500 flex justify-end font-semibold"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeletePost}
                      className="cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent px-2 py-1 text-gray-300 hover:text-red-500 flex justify-end font-semibold"
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => setShowAuthModal(true)}
                  className="cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent px-2 py-1 text-gray-300 hover:text-red-500 flex justify-end font-semibold"
                >
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {editingPost ? (
            <div className="mt-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-transparent border border-gray-700 rounded-lg p-3"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEditPost}
                  className="px-3 py-1 rounded-lg text-sm text-gray-300 hover:text-fedex-orange transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPost(false)}
                  className="px-3 py-1 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2">{post.content}</p>
          )}
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
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-fedex-orange hover:text-fedex-orange/80 transition-colors"
              >
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Tip</span>
              </button>
            )}
          </div>
          
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Share post"
          >
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
              {Array.from(new Map(comments.map(c => [c.id, c])).values()).map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 mt-3">
                  <img
                    src={comment.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.name || 'User'}`}
                    alt={comment.user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{comment.user.name}</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
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
              <div className="relative mt-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-fedex-orange focus:border-fedex-orange transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${newComment.trim() ? 'text-fedex-orange hover:bg-fedex-orange/10' : 'text-gray-500'}`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-xs w-full">
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
                    className={`p-2 rounded-xl font-semibold transition-colors ${
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
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                placeholder="Custom amount"
              />
              
              <button
                onClick={handleTip}
                disabled={loading || tipAmount <= 0}
                className="w-full px-4 py-3 !bg-fedex-orange hover:!bg-fedex-orange/90 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors"
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