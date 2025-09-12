import { supabase } from './client';
import { PostComment } from './types';
import type { Post } from '@/types';

// Create a racer post
export const createRacerPost = async (payload: {
  racer_id: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  visibility: 'public' | 'fans_only';
  allow_tips: boolean;
}) => {
  try {
    console.log('[DEBUG] createRacerPost payload:', payload);
    
    const { data, error } = await supabase
      .from('racer_posts')
      .insert({
        user_id: payload.racer_id,
        racer_id: payload.racer_id,
        content: payload.content,
        media_urls: payload.media_urls,
        post_type: payload.post_type,
        visibility: payload.visibility,
        allow_tips: payload.allow_tips,
        user_type: 'racer',
        likes_count: 0,
        comments_count: 0,
        upvotes_count: 0,
        total_tips: 0
      })
      .select('*')
      .single();

    if (error) {
      console.error('[DEBUG] createRacerPost error:', error);
      return { data: null, error };
    }

    console.log('[DEBUG] createRacerPost success:', data);
    return { data, error: null };
  } catch (e) {
    console.error('[DEBUG] createRacerPost exception:', e);
    return { data: null, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

// Create a fan post
export const createFanPost = async (payload: {
  fan_id: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  visibility: 'public' | 'fans_only';
}) => {
  try {
    console.log('[DEBUG] createFanPost payload:', payload);
    
    const { data, error } = await supabase
      .from('racer_posts')
      .insert({
        user_id: payload.fan_id,
        content: payload.content,
        media_urls: payload.media_urls,
        post_type: payload.post_type,
        visibility: payload.visibility,
        allow_tips: false,
        user_type: 'fan',
        likes_count: 0,
        comments_count: 0,
        upvotes_count: 0,
        total_tips: 0
      })
      .select('*')
      .single();

    if (error) {
      console.error('[DEBUG] createFanPost error:', error);
      return { data: null, error };
    }

    console.log('[DEBUG] createFanPost success:', data);
    return { data, error: null };
  } catch (e) {
    console.error('[DEBUG] createFanPost exception:', e);
    return { data: null, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

// Get public posts with pagination
export const getPublicPostsPage = async (options: {
  limit?: number;
  cursor?: { created_at: string; id: string } | null;
  includeProfiles?: boolean;
} = {}) => {
  try {
    const { limit = 12, cursor, includeProfiles = true } = options;
    
    // Build a minimal select by default to reduce payload and latency.
    const baseColumns = [
      'id',
      'user_id',
      'racer_id',
      'content',
      'media_urls',
      'post_type',
      'visibility',
      'user_type',
      'likes_count',
      'comments_count',
      'upvotes_count',
      'created_at',
      'updated_at',
      'total_tips',
      'allow_tips',
    ].join(',');

    const profileColumns = `
      profiles!racer_posts_user_id_fkey (
        id,
        name,
        email,
        avatar,
        user_type,
        is_verified
      ),
      racer_profiles!racer_posts_racer_id_fkey (
        id,
        username,
        profile_photo_url,
        car_number,
        racing_class,
        team_name
      )
    `;

    let query = supabase
      .from('racer_posts')
      .select(
        includeProfiles ? `${baseColumns}, ${profileColumns}` : baseColumns
      )
      .eq('visibility', 'public')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor.created_at);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DEBUG] getPublicPostsPage error:', error);
      return { data: null, nextCursor: null, error };
    }

    // Normalize media_urls to array of strings
    const normalized = (data || []).map((row: any) => {
      let media: string[] = [];
      const raw = (row as any).media_urls;
      if (Array.isArray(raw)) media = raw as string[];
      else if (typeof raw === 'string') {
        try { media = JSON.parse(raw); } catch { media = []; }
      }
      return { ...row, media_urls: media };
    });

    const nextCursor = normalized && normalized.length === limit && normalized.length > 0
      ? { created_at: normalized[normalized.length - 1].created_at, id: normalized[normalized.length - 1].id }
      : null;

    console.log('[DEBUG] getPublicPostsPage success:', { count: normalized?.length, nextCursor });
    return { data: normalized || [], nextCursor, error: null };
  } catch (e) {
    console.error('[DEBUG] getPublicPostsPage exception:', e);
    return { data: null, nextCursor: null, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

// Get all public posts (legacy function)
export const getAllPublicPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('racer_posts')
      .select(`
        *,
        profiles!racer_posts_user_id_fkey (
          id,
          name,
          email,
          avatar,
          user_type,
          is_verified
        ),
        racer_profiles!racer_posts_racer_id_fkey (
          id,
          username,
          profile_photo_url,
          car_number,
          racing_class,
          team_name
        )
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] getAllPublicPosts error:', error);
      return null;
    }

    const normalized = (data || []).map((row: any) => {
      let media: string[] = [];
      const raw = (row as any).media_urls;
      if (Array.isArray(raw)) media = raw as string[];
      else if (typeof raw === 'string') {
        try { media = JSON.parse(raw); } catch { media = []; }
      }
      return { ...row, media_urls: media };
    });

    return normalized || [];
  } catch (e) {
    console.error('[DEBUG] getAllPublicPosts exception:', e);
    return null;
  }
};

// Get posts for a specific fan
export const getPostsForFan = async (fanId: string) => {
  try {
    const { data, error } = await supabase
      .from('racer_posts')
      .select(`
        *,
        profiles!racer_posts_user_id_fkey (
          id,
          name,
          email,
          avatar,
          user_type
        )
      `)
      .eq('user_id', fanId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] getPostsForFan error:', error);
      return null;
    }

    const normalized = (data || []).map((row: any) => {
      let media: string[] = [];
      const raw = (row as any).media_urls;
      if (Array.isArray(raw)) media = raw as string[];
      else if (typeof raw === 'string') {
        try { media = JSON.parse(raw); } catch { media = []; }
      }
      return { ...row, media_urls: media };
    });

    return normalized || [];
  } catch (e) {
    console.error('[DEBUG] getPostsForFan exception:', e);
    return null;
  }
};

// Like/Unlike functions
export const getPostLikers = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
};

export const likePost = async (postId: string, userId: string) => {
  try {
    // Insert like
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      return { error: insertError, newCount: null };
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId);

    return { error: countError, newCount: count };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' }, newCount: null };
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    // Remove like
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      return { error: deleteError, newCount: null };
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId);

    return { error: countError, newCount: count };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' }, newCount: null };
  }
};

// Upvote functions
export const getPostUpvoter = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('post_upvotes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
};

export const upvotePost = async (postId: string, userId: string) => {
  try {
    // Insert upvote
    const { error: insertError } = await supabase
      .from('post_upvotes')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      return { error: insertError, newCount: null };
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('post_upvotes')
      .select('post_id', { count: 'exact' })
      .eq('post_id', postId);

    return { error: countError, newCount: count };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' }, newCount: null };
  }
};

export const removeUpvote = async (postId: string, userId: string) => {
  try {
    // Remove upvote
    const { error: deleteError } = await supabase
      .from('post_upvotes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      return { error: deleteError, newCount: null };
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('post_upvotes')
      .select('post_id', { count: 'exact' })
      .eq('post_id', postId);

    return { error: countError, newCount: count };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' }, newCount: null };
  }
};

// Comment functions
export const getPostComments = async (postId: string, limit: number = 20, offset: number = 0) => {
  try {
    const { data, error, count } = await supabase
      .from('post_comments')
      .select(`
        id,
        post_id,
        user_id,
        comment_text,
        created_at,
        profiles!post_comments_user_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `, { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: null, totalCount: 0, error };
    }

    const comments: PostComment[] = (data || []).map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.comment_text || '',
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        name: comment.profiles?.name || 'User',
        avatar: comment.profiles?.avatar || '',
        user_type: 'fan'
      }
    }));

    return { data: comments, totalCount: count || 0, error: null };
  } catch (e) {
    return { data: null, totalCount: 0, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

export const addCommentToPost = async (postId: string, userId: string, content: string) => {
  try {
    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        comment_text: content
      })
      .select(`
        id,
        post_id,
        user_id,
        comment_text,
        created_at,
        profiles!post_comments_user_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `)
      .single();

    if (insertError) {
      return { data: null, error: insertError, newCount: null };
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact' })
      .eq('post_id', postId);

    const formattedComment: PostComment = {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.comment_text || '',
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        name: comment.profiles?.name || 'User',
        avatar: comment.profiles?.avatar || '',
        user_type: 'fan'
      }
    };

    return { data: formattedComment, error: countError, newCount: count };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : 'Unknown error' }, newCount: null };
  }
};

export const deleteCommentFromPost = async (commentId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    return { error };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

export const updateComment = async (commentId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .update({ comment_text: content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select('*')
      .single();

    return { data, error };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' }, data: null };
  }
};

// Post management functions
export const deletePost = async (postId: string) => {
  try {
    const { error } = await supabase
      .from('racer_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

export const updatePost = async (postId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('racer_posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .select('*')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

// Get post counts
export const getPostCounts = async (postId: string) => {
  try {
    const [likesResult, upvotesResult, commentsResult] = await Promise.all([
      supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_upvotes').select('post_id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_comments').select('id', { count: 'exact' }).eq('post_id', postId)
    ]);

    return {
      likes_count: likesResult.count || 0,
      upvotes_count: upvotesResult.count || 0,
      comments_count: commentsResult.count || 0
    };
  } catch (e) {
    console.error('Error getting post counts:', e);
    return {
      likes_count: 0,
      upvotes_count: 0,
      comments_count: 0
    };
  }
};

// Get racer badge data
export const getRacerBadgeData = async (racerId: string) => {
  try {
    const { data, error } = await supabase
      .from('racer_profiles')
      .select(`
        id,
        championships,
        career_wins,
        years_racing,
        is_featured,
        profiles!racer_profiles_id_fkey (
          is_verified
        )
      `)
      .eq('id', racerId)
      .single();

    if (error) {
      console.error('Error fetching racer badge data:', error);
      return {
        is_verified: false,
        is_featured: false,
        championships: 0,
        career_wins: 0,
        years_racing: 0,
        follower_count: 0
      };
    }

    // Get follower count
    const { count: followerCount } = await supabase
      .from('fan_connections')
      .select('id', { count: 'exact' })
      .eq('racer_id', racerId);

    return {
      is_verified: data.profiles?.is_verified || false,
      is_featured: data.is_featured || false,
      championships: data.championships || 0,
      career_wins: data.career_wins || 0,
      years_racing: data.years_racing || 0,
      follower_count: followerCount || 0
    };
  } catch (e) {
    console.error('Error in getRacerBadgeData:', e);
    return {
      is_verified: false,
      is_featured: false,
      championships: 0,
      career_wins: 0,
      years_racing: 0,
      follower_count: 0
    };
  }
};

// Tip post function
export const tipPost = async (postId: string, amountCents: number) => {
  try {
    // This would integrate with payment processing
    // For now, just return success
    console.log(`Tipping post ${postId} with ${amountCents} cents`);
    return { error: null };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unknown error' } };
  }
};