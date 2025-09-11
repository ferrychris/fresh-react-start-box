import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  CheckCircle,
  Crown,
  ArrowBigUp
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { PostComment } from '@/types';
import type { Post as PostType } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import { getPostLikers, likePost, unlikePost, addCommentToPost, getPostComments, deletePost, updatePost, getPostUpvoter, upvotePost, removeUpvote, getPostCounts, deleteCommentFromPost, getRacerBadgeData } from '@/lib/supabase/posts';
// Removed RacerBadges to avoid duplicate racer badge next to the RACER tag
import { createPaymentSession } from '@/lib/supabase/payments'; // Verified path
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { getPostPublicUrl, getFanPostPublicUrl, getPublicUrl, getSignedUrl } from '@/lib/supabase/storage';

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

const getUserTypeIcon = (userType: string) => {
  switch (userType) {
    case 'RACER': return '🏎️';
    case 'TRACK': return '🏁';
    case 'SERIES': return '🏆';
    case 'FAN': return '👥';
    default: return '👤';
  }
};

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
      team_name?: string;
      profiles?: {
        id: string;
        name: string;
        user_type: string;
        avatar?: string;
        is_verified?: boolean;
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
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count || 0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvotesCount, setUpvotesCount] = useState<number>((post as any).upvotes_count || 0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fallbackUrls, setFallbackUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [racerBadgeData, setRacerBadgeData] = useState<{
    is_verified: boolean;
    is_featured: boolean;
    championships: number;
    career_wins: number;
    years_racing: number;
    follower_count: number;
  } | null>(null);

  // Normalize profiles access early for dependent logic
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  // Determine user type (broaden checks so RACER badge always shows for racer posts)
  const userType = (profile?.user_type || '').toLowerCase();
  const postUserType = (post.user_type || '').toString().toLowerCase();
  const isRacer =
    userType === 'racer' ||
    postUserType === 'racer' ||
    !!post.racer_profiles?.id ||
    !!(post as any).racer_id ||
    post.racer_id === post.user_id; // Ensure consistency for racer posts
  const displayUserType = isRacer ? 'RACER' : userType.toUpperCase();

  // Track comment IDs we've already added to avoid duplicates from
  // optimistic updates racing with realtime INSERT events
  const commentIdsRef = useRef<Set<string>>(new Set());
  // Cache user profiles by id to avoid repeated lookups
  const userCacheRef = useRef<Map<string, { name: string; avatar: string }>>(new Map());

  const fetchUserProfile = async (userId: string): Promise<{ name: string; avatar: string; user_type?: string }> => {
    if (!userId) return { name: 'User', avatar: '' };
    const cached = userCacheRef.current.get(userId);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, avatar, user_type')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('Failed to fetch profile for comment user:', error);
      }
      const email = (data?.email as string | undefined) || '';
      const emailName = email ? (email.includes('@') ? email.split('@')[0] : email) : '';
      const result = { name: data?.name || emailName || 'User', avatar: data?.avatar || '', user_type: data?.user_type };
      userCacheRef.current.set(userId, result);
      return result;
    } catch (e) {
      console.warn('Exception fetching comment profile:', e);
      return { name: 'User', avatar: '' };
    }
  };

  // Follow/Unfollow racer state and handlers
  const racerProfileId: string | undefined = post.racer_profiles?.id || (isRacer ? post.user_id : undefined);
  const [isFollowingRacer, setIsFollowingRacer] = useState<boolean>(false);
  const [followBusy, setFollowBusy] = useState<boolean>(false);

  useEffect(() => {
    const checkFollow = async () => {
      try {
        if (!user?.id || !racerProfileId) { setIsFollowingRacer(false); return; }
        const { data, error } = await supabase
          .from('fan_connections')
          .select('racer_id')
          .eq('fan_id', user.id)
          .eq('racer_id', racerProfileId)
          .maybeSingle();
        if (!error) setIsFollowingRacer(!!data);
      } catch {
        // non-fatal
      }
    };
    checkFollow();
  }, [user?.id, racerProfileId]);

  const handleFollowRacer = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!racerProfileId || followBusy) return;
    setFollowBusy(true);
    try {
      const { error } = await supabase
        .from('fan_connections')
        .upsert({
          fan_id: user.id,
          racer_id: racerProfileId,
          is_subscribed: false,
          became_fan_at: new Date().toISOString()
        }, { onConflict: 'fan_id,racer_id' });
      if (error) throw error;
      setIsFollowingRacer(true);
      toast.success('You are now following this racer');
    } catch (e) {
      toast.error('Failed to follow');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleUnfollowRacer = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!racerProfileId || followBusy) return;
    setFollowBusy(true);
    try {
      const { error } = await supabase
        .from('fan_connections')
        .delete()
        .eq('fan_id', user.id)
        .eq('racer_id', racerProfileId);
      if (error) throw error;
      setIsFollowingRacer(false);
      toast.success('Unfollowed racer');
    } catch (e) {
      toast.error('Failed to unfollow');
    } finally {
      setFollowBusy(false);
    }
  };

  // Local author state to allow late backfill for FAN posts (when profiles are omitted on initial fetch)
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [authorUserType, setAuthorUserType] = useState<string | null>(null);
  
  // Check if racer is verified and fetch badge data
  useEffect(() => {
    setIsVerified(!!post.racer_profiles?.profiles?.is_verified);
    
    // Fetch racer badge data if this is a racer post
    const fetchRacerBadges = async () => {
      if (isRacer && racerProfileId) {
        try {
          const badgeData = await getRacerBadgeData(racerProfileId);
          setRacerBadgeData(badgeData);
          console.log('Fetched racer badge data:', badgeData);
        } catch (error) {
          console.error('Error fetching racer badge data:', error);
        }
      }
    };

    fetchRacerBadges();
  }, [post.racer_profiles?.profiles?.is_verified, isRacer, racerProfileId]);

  // Get display name - prefer profile.name -> racer username -> email username -> role-based generic
  const emailUsername = profile?.email?.split('@')[0];
  const racerName = post.racer_profiles?.username || post.racer_profiles?.profiles?.name;
  const profileId = (Array.isArray(post.profiles) ? post.profiles?.[0]?.id : post.profiles?.id) || post.user_id || '';
  const roleGeneric = isRacer ? 'Racer' : 'Racing Fan';
  const displayName = authorName || profile?.name || racerName || emailUsername || roleGeneric;
  
  // Get racer details
  const racingClass = post.racer_profiles?.racing_class;
  const teamName = post.racer_profiles?.team_name;

  // Get avatar URL - check for avatar property
  const avatarUrl = authorAvatar || profile?.avatar || post.racer_profiles?.profile_photo_url || '';

  // Effective racer determination (includes late backfill of author user_type)
  const isRacerEffective = isRacer || (authorUserType === 'racer');

  // Fetch author profile for FAN posts (or when profile is missing) without blocking initial paint
  useEffect(() => {
    // Backfill whenever the flat profile is missing or lacks a name.
    // This covers both fan-authored and racer-authored posts and avoids
    // relying on racer_profiles being present.
    const needsAuthorBackfill = (!profile || !profile?.name);
    const targetUserId = (Array.isArray(post.profiles) ? post.profiles?.[0]?.id : post.profiles?.id) || post.user_id;
    if (!needsAuthorBackfill || !targetUserId) return;

    let cancelled = false;
    (async () => {
      try {
        const cached = userCacheRef.current.get(targetUserId);
        if (cached) {
          if (!cancelled) {
            setAuthorName(cached.name);
            setAuthorAvatar(cached.avatar);
          }
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email, avatar, user_type')
          .eq('id', targetUserId)
          .maybeSingle();
        if (!error && data) {
          const email = (data?.email as string | undefined) || '';
          const emailName = email ? (email.includes('@') ? email.split('@')[0] : email) : '';
          const nm = data.name || emailName || 'User';
          const av = data.avatar || '';
          userCacheRef.current.set(targetUserId, { name: nm, avatar: av });
          if (!cancelled) {
            setAuthorName(nm);
            setAuthorAvatar(av);
            setAuthorUserType((data.user_type as string | undefined) || null);
          }
        }
      } catch (e) {
        // non-fatal
      }
    })();

    return () => { cancelled = true; };
  }, [post.user_id, post.profiles, post.racer_profiles, post.user_type, profile]);

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

  // Navigate to author's profile (racer -> /racer/:id, fan -> /fan/:id)
  const goToAuthorProfile = () => {
    try {
      if (isRacer && post.racer_profiles?.id) {
        navigate(`/racer/${post.racer_profiles.id}`);
        return;
      }
      // Fallback to fan profile using the profile.id if present, else post.user_id
      const profileId = (Array.isArray(post.profiles) ? post.profiles[0]?.id : post.profiles?.id) || post.user_id;
      if (profileId) {
        navigate(`/fan/${profileId}`);
        return;
      }
    } catch (e) {
      console.warn('Failed to navigate to author profile', e);
    }
  };

  // Initialize counts from database on mount
  useEffect(() => {
    const initializeCounts = async () => {
      try {
        // Get actual counts from database
        const counts = await getPostCounts(post.id);
        setLikesCount(counts.likes_count);
        setUpvotesCount(counts.upvotes_count);
        setCommentsCount(counts.comments_count);
        console.log('Initialized counts from database:', counts);
      } catch (error) {
        console.error('Error initializing counts:', error);
        // Fallback to post object counts
        setLikesCount(post.likes_count || 0);
        setUpvotesCount((post as any).upvotes_count || 0);
        setCommentsCount(post.comments_count || 0);
      }
    };

    initializeCounts();
  }, [post.id]);

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
  }, [post.id, user]);

  // Upvote: check user upvote status (count is initialized from database in the main useEffect)
  useEffect(() => {
    const checkUpvote = async () => {
      if (!user) {
        setIsUpvoted(false);
        return;
      }
      const { data, error } = await getPostUpvoter(post.id, user.id);
      if (error) {
        console.error('Error checking post upvote:', error);
      }
      setIsUpvoted(!!data);
    };
    checkUpvote();
  }, [post.id, user]);

  const handleUpvoteToggle = async () => {
    if (!user) { setShowAuthModal(true); return; }
    const wasUpvoted = isUpvoted;
    const prevCount = upvotesCount;
    
    // Optimistic UI update
    setIsUpvoted(!wasUpvoted);
    setUpvotesCount(prev => prev + (wasUpvoted ? -1 : 1));
    
    try {
      let result;
      if (wasUpvoted) {
        result = await removeUpvote(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
        console.log('Post upvote removed successfully - new count:', result.newCount);
      } else {
        result = await upvotePost(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
        console.log('Post upvoted successfully - new count:', result.newCount);
      }

      // Update with actual count from database
      if (typeof result.newCount === 'number') {
        setUpvotesCount(result.newCount);
      }
      
    } catch (e) {
      console.error('Error toggling upvote:', e);
      setIsUpvoted(wasUpvoted);
      setUpvotesCount(prevCount);
      toast.error('Failed to update upvote. Please try again.');
    }
  };

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
          if (updatedPost?.upvotes_count !== undefined) {
            setUpvotesCount(updatedPost.upvotes_count);
          }
          if (updatedPost?.likes_count !== undefined) {
            setLikesCount(updatedPost.likes_count);
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
      let result;
      if (wasLiked) {
        result = await unlikePost(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
        console.log('Post unliked successfully - new count:', result.newCount);
      } else {
        result = await likePost(post.id, user.id);
        if (result.error) {
          throw result.error;
        }
        console.log('Post liked successfully - new count:', result.newCount);
      }

      // Update with actual count from database
      if (typeof result.newCount === 'number') {
        setLikesCount(result.newCount);
      }

      // Call parent update callback
      onPostUpdate?.();
      
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
      const { data: created, error, newCount } = await addCommentToPost(post.id, user.id, newComment.trim());
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Update with actual count from database
      if (typeof newCount === 'number') {
        setCommentsCount(newCount);
        console.log('Comment added successfully - new count:', newCount);
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
        if (onPostDeleted) {
          onPostDeleted(post.id);
        } else {
          // Optimistically hide this card if parent doesn't handle removal
          setIsDeleted(true);
        }
        // Ask parent to refresh lists if it provided a callback
        onPostUpdate?.();
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

  // Normalize media URLs to handle any malformed concatenations (e.g., two URLs jammed together)
  const normalizedMediaUrls = useMemo(() => {
    try {
      let items: string[] = [];
      if (Array.isArray(post.media_urls)) {
        items = post.media_urls as string[];
      } else if (typeof (post as any).media_urls === 'string') {
        const raw = (post as any).media_urls as string;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) items = parsed as string[];
          else if (typeof parsed === 'string') items = [parsed];
        } catch {
          // Not JSON; if it's a single path/url string, wrap it
          if (raw.trim().length > 0) items = [raw.trim()];
        }
      }
      const out: string[] = [];
      for (const raw of items) {
        if (typeof raw !== 'string') continue;
        const matches = raw.match(/https?:\/\/[^\s"']+/g);
        if (matches && matches.length > 0) {
          for (const m of matches) out.push(m);
        } else {
          out.push(raw);
        }
      }
      // Dedupe while preserving order
      const seen = new Set<string>();
      return out.filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
    } catch {
      return Array.isArray(post.media_urls) ? (post.media_urls as string[]) : [];
    }
  }, [post.media_urls]);

  // Resolve storage paths to public URLs using our storage helpers
  const resolvedMediaUrls = useMemo(() => {
    console.log(`[DEBUG] PostCard processing media_urls for post ${post.id}:`, post.media_urls);
    console.log(`[DEBUG] Normalized media URLs:`, normalizedMediaUrls);
    
    const isFan = (post.user_type || '').toString().toLowerCase() === 'fan';
    console.log(`[DEBUG] Post user_type: ${post.user_type}, isFan: ${isFan}`);
    
    // Try all buckets if we have issues with the default one
    const buckets = ['racer-photos', 'postimage', 'new_post'];
    
    const resolved = normalizedMediaUrls
      .map((u) => {
        if (!u || typeof u !== 'string') return '';
        
        // If it's already a data URL (base64), keep as-is
        if (u.startsWith('data:')) {
          console.log(`[DEBUG] Data URL detected, keeping as-is: ${u.substring(0, 50)}...`);
          return u;
        }
        
        // If it's a full Supabase storage URL, regenerate a public URL from bucket/object
        const supa = u.match(/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)(?:\?|$)/i);
        if (/^https?:/i.test(u) && supa && supa[1] && supa[2]) {
          const bucket = supa[1];
          const objectPath = supa[2];
          const regenerated = getPublicUrl(bucket, objectPath) || u;
          console.log(`[DEBUG] Regenerated public URL from storage href: ${u} → ${regenerated}`);
          return regenerated;
        }
        
        // Keep other public/data/blob URLs
        if (/^(https?:|data:|blob:)/i.test(u)) {
          console.log(`[DEBUG] URL already public, keeping as-is: ${u}`);
          return u;
        }
        
        // Otherwise resolve via storage
        const resolver = isFan ? getFanPostPublicUrl : getPostPublicUrl;
        const resolvedUrl = resolver(u) || u;
        console.log(`[DEBUG] Resolved storage path: ${u} → ${resolvedUrl}`);
        return resolvedUrl;
      })
      .filter((u) => typeof u === 'string' && u.length > 0);
      
    console.log(`[DEBUG] Final resolved URLs:`, resolved);
    return resolved;
  }, [normalizedMediaUrls, post.user_type, post.id, post.media_urls]);

  const getEffectiveUrl = (u: string) => fallbackUrls[u] || u;

  const handleMediaError = async (originalUrl: string) => {
    try {
      if (fallbackUrls[originalUrl]) return; // avoid loops

      console.log(`[DEBUG] Media load error, starting signed URL fallback for: ${originalUrl}`);
      const buckets = ['racer-photos', 'postimage', 'new_post'];
      let signed: string | null = null;

      // 1) First try with the original URL/path (this uses resolveBucketAndPath under the hood)
      signed = await getSignedUrl(originalUrl);

      // 2) Build more specific candidates using filename and known folder conventions
      if (!signed) {
        const tryDecodeTwice = (s: string) => {
          try {
            const once = decodeURIComponent(s);
            try { return decodeURIComponent(once); } catch { return once; }
          } catch { return s; }
        };

        // Extract a best-effort filename from the URL or storage path
        let filename = originalUrl;
        try {
          if (/^https?:\/\//i.test(originalUrl)) {
            const u = new URL(originalUrl);
            filename = u.pathname.split('/').pop() || originalUrl;
          } else {
            const parts = originalUrl.split('?')[0].split('#')[0].split('/');
            filename = parts.pop() || originalUrl;
          }
        } catch {
          // keep original
        }
        filename = tryDecodeTwice(filename);

        // Decide folder based on post_type
        const likelyFolder = post.post_type === 'video' ? 'posts/videos' : 'posts/images';
        const userId = (post as any).user_id as string | undefined;

        // Candidate object paths to try
        const pathCandidates: string[] = [];
        // plain filename at bucket root (legacy)
        pathCandidates.push(filename);
        // userId/posts/images|videos/filename (current convention)
        if (userId) pathCandidates.push(`${userId}/${likelyFolder}/${filename}`);
        // also try the other folder just in case post_type is misclassified
        if (userId) {
          const altFolder = likelyFolder.endsWith('images') ? 'posts/videos' : 'posts/images';
          pathCandidates.push(`${userId}/${altFolder}/${filename}`);
        }

        // 3) Try each bucket/path combination
        outer: for (const bucket of buckets) {
          for (const path of pathCandidates) {
            console.log(`[DEBUG] Trying candidate for signed URL → ${bucket}/${path}`);
            signed = await getSignedUrl(bucket, path);
            if (signed) break outer;
          }
        }
      }

      if (signed) {
        setFallbackUrls(prev => ({ ...prev, [originalUrl]: signed }));
        console.log(`[DEBUG] Generated signed URL fallback: ${originalUrl} → ${signed}`);
      } else {
        console.warn('[DEBUG] Failed to generate signed URL for', originalUrl);
      }
    } catch (e) {
      console.warn('[DEBUG] Exception generating signed URL', e);
    }
  };

  const PostMedia: React.FC = () => {
    if (post.post_type === 'video' && resolvedMediaUrls.length > 0) {
      if (isDeleted) return null;

      return (
        <div className="relative -mx-4 lg:-mx-6 mb-4">
          <div className="relative">
            <video
              src={getEffectiveUrl(resolvedMediaUrls[0])}
              className="w-full h-64 lg:h-80 object-cover"
              poster={resolvedMediaUrls[0] + '#t=0.1'}
              controls
              preload="metadata"
              playsInline
              onError={() => handleMediaError(resolvedMediaUrls[0])}
            >
              <source src={getEffectiveUrl(resolvedMediaUrls[0])} type="video/mp4" />
              <source src={getEffectiveUrl(resolvedMediaUrls[0])} type="video/webm" />
              <source src={getEffectiveUrl(resolvedMediaUrls[0])} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );
    }

    if ((post.post_type === 'gallery' || post.post_type === 'photo') && resolvedMediaUrls.length > 0) {
      return (
        <div className="relative -mx-4 lg:-mx-6 mb-4">
          <div className="relative">
            {resolvedMediaUrls[currentImageIndex]?.startsWith('data:video/') || 
             resolvedMediaUrls[currentImageIndex]?.includes('.mp4') ||
             resolvedMediaUrls[currentImageIndex]?.includes('.webm') ||
             resolvedMediaUrls[currentImageIndex]?.includes('.ogg') ? (
              <video
                src={getEffectiveUrl(resolvedMediaUrls[currentImageIndex])}
                className="w-full h-64 lg:h-80 object-cover"
                controls
                preload="metadata"
                onError={() => handleMediaError(resolvedMediaUrls[currentImageIndex])}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={getEffectiveUrl(resolvedMediaUrls[currentImageIndex])}
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full h-64 lg:h-80 object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 100vw, 640px"
                onError={() => handleMediaError(resolvedMediaUrls[currentImageIndex])}
              />
            )}
            {resolvedMediaUrls.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev > 0 ? prev - 1 : resolvedMediaUrls.length - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev < resolvedMediaUrls.length - 1 ? prev + 1 : 0
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
                <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm text-white">
                  {currentImageIndex + 1} / {resolvedMediaUrls.length}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Post Header */}
      <div className="p-4 lg:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-gray-800 hover:border hover:border-orange-500/30 rounded-xl p-3 -m-3 transition-all duration-300 flex-1 group hover:shadow-lg hover:shadow-orange-500/10">
            <img
              src={avatarUrl || dicebearUrl}
              alt={displayName}
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover ring-2 ring-gray-700 group-hover:ring-orange-500 group-hover:ring-2 group-hover:scale-105 transition-all duration-300"
              onClick={goToAuthorProfile}
            />
            <div className="flex-1 text-left">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white group-hover:text-orange-300 transition-colors duration-300 group-hover:drop-shadow-sm">
                  <button
                    type="button"
                    onClick={goToAuthorProfile}
                    className="text-left hover:underline focus:underline focus:outline-none"
                    aria-label={`View ${displayName}'s profile`}
                  >
                    {displayName}
                  </button>
                </span>
                {/* Racer badges removed to prevent duplication with the RACER tag */}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`font-medium ${getUserTypeColor(displayUserType)} group-hover:brightness-110 transition-all duration-300`}>
                  {getUserTypeIcon(displayUserType)} {displayUserType}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            {isRacerEffective && !isOwner && racerProfileId && (
              isFollowingRacer ? (
                <button
                  disabled={followBusy}
                  onClick={handleUnfollowRacer}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-green-500 hover:text-green-400 ${followBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title="Unfollow racer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Fan
                </button>
              ) : (
                <button
                  disabled={followBusy}
                  onClick={handleFollowRacer}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-fedex-orange hover:text-fedex-orange/80 ${followBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Fan
                </button>
              )
            )}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
              <MoreHorizontal className="w-5 h-5" onClick={() => setShowMoreMenu(!showMoreMenu)} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-lg z-10 py-1">
                {isOwner && (
                  <>
                    <button 
                      onClick={() => {
                        setEditedContent(post.content);
                        setEditingPost(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        handleDeletePost();
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-500"
                >
                  Report
                </button>
              </div>
            )}
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
            <p className="text-gray-300 leading-relaxed">{post.content}</p>
          )}
        </div>

      {/* Post Media */}
      {post.media_urls.length > 0 && <PostMedia />}

      {/* Engagement Stats */}
      {(likesCount > 0 || upvotesCount > 0 || commentsCount > 0 || post.total_tips > 0) && (
        <div className="px-4 lg:px-6 py-2 text-sm text-gray-400 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {likesCount > 0 && (
                <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
              )}
              {upvotesCount > 0 && (
                <span>{upvotesCount} {upvotesCount === 1 ? 'upvote' : 'upvotes'}</span>
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

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 px-4 lg:px-6 border-t border-gray-800">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={likeBusy}
            className={`flex items-center space-x-2 transition-all duration-200 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </button>
          <button
            onClick={handleUpvoteToggle}
            className={`flex items-center space-x-2 transition-all duration-200 ${isUpvoted ? 'text-fedex-orange' : 'text-gray-400 hover:text-fedex-orange'}`}
          >
            <ArrowBigUp className={`w-5 h-5 ${isUpvoted ? 'fill-current' : ''}`} />
            <span className="font-medium">{upvotesCount}</span>
          </button>
          <button 
            onClick={handleToggleComments}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{commentsCount}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-all duration-200"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>

        {/* Tip/Subscribe Actions for Racers – temporarily disabled */}
        {/**
         * {isRacerEffective && !isOwner && (
         *   <div className="flex items-center space-x-3">
         *     <div className="flex items-center space-x-2">
         *       <button
         *         onClick={() => alert('Tip coming soon!')}
         *         aria-label="Tip"
         *         className={`w-9 h-9 rounded-full transition-colors duration-200 flex items-center justify-center bg-green-700 cursor-not-allowed opacity-90 text-white`}
         *         disabled
         *         title="Tip – coming soon"
         *       >
         *         <DollarSign className="w-4 h-4" />
         *       </button>
         *       <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 text-green-300/90 bg-green-500/10">Coming soon</span>
         *     </div>
         *     <div className="flex items-center space-x-2">
         *       <button
         *         onClick={() => alert('Join Team coming soon!')}
         *         className="relative px-3 py-1.5 bg-orange-700 cursor-not-allowed opacity-90 text-white rounded-lg transition-colors duration-200 text-sm flex items-center space-x-1 shadow-md"
         *         disabled
         *         title="Join the Team – coming soon"
         *       >
         *         <span className="pointer-events-none absolute -top-1 -right-1 text-yellow-300 animate-ping">✦</span>
         *         <span className="pointer-events-none absolute -bottom-1 -left-1 text-orange-300 animate-pulse">✧</span>
         *         <Crown className="w-3 h-3" />
         *         <span>Join the Team</span>
         *       </button>
         *       <span className="text-[10px] px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-300/90 bg-orange-500/10">Coming soon</span>
         *     </div>
         *   </div>
         * )}
         */}

        {/* Follow Actions for Tracks/Series */}
        {(userType === 'track' || userType === 'series') && !isOwner && (
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Follow</span>
            </button>
          </div>
        )}

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
                    src={comment.user?.avatar || dicebearUrl}
                    alt={comment.user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-white">{comment.user?.name || 'User'}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 text-xs">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth and Subscription Modals */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
        {showSubscribeModal && (
          <SubscriptionModal
            racerId={racerProfileId || ''}
            racerName={displayName}
            onClose={() => setShowSubscribeModal(false)}
            onSuccess={() => setShowSubscribeModal(false)}
          />
        )}
      </div>
    </div>
  </div>
  );
};