import { supabase } from '@/lib/supabase';

export interface PostCountStatus {
  postId: string;
  storedCounts: {
    likes: number;
    upvotes: number;
    comments: number;
  };
  actualCounts: {
    likes: number;
    upvotes: number;
    comments: number;
  };
  isSync: boolean;
}

/**
 * Debug utility to check if post counts are synchronized with actual data
 */
export const checkPostCountSync = async (postId: string): Promise<PostCountStatus> => {
  try {
    // Get stored counts from racer_posts
    const { data: post, error: postError } = await supabase
      .from('racer_posts')
      .select('id, likes_count, upvotes_count, comments_count')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    // Get actual counts from related tables
    const [likesResult, upvotesResult, commentsResult] = await Promise.all([
      supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_upvotes').select('post_id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_comments').select('id', { count: 'exact' }).eq('post_id', postId)
    ]);

    const actualLikes = likesResult.count || 0;
    const actualUpvotes = upvotesResult.count || 0;
    const actualComments = commentsResult.count || 0;

    const storedCounts = {
      likes: post.likes_count || 0,
      upvotes: post.upvotes_count || 0,
      comments: post.comments_count || 0
    };

    const actualCounts = {
      likes: actualLikes,
      upvotes: actualUpvotes,
      comments: actualComments
    };

    const isSync = 
      storedCounts.likes === actualCounts.likes &&
      storedCounts.upvotes === actualCounts.upvotes &&
      storedCounts.comments === actualCounts.comments;

    return {
      postId,
      storedCounts,
      actualCounts,
      isSync
    };
  } catch (error) {
    console.error('Error checking post count sync:', error);
    throw error;
  }
};

/**
 * Fix counts for a specific post by calling the database function
 */
export const fixPostCounts = async (postId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('refresh_post_counts_for_post', {
      target_post_id: postId
    });

    if (error) throw error;
    console.log(`Fixed counts for post ${postId}`);
  } catch (error) {
    console.error('Error fixing post counts:', error);
    throw error;
  }
};

/**
 * Check all posts for count synchronization issues
 */
export const checkAllPostCounts = async (limit: number = 10): Promise<PostCountStatus[]> => {
  try {
    const { data: posts, error } = await supabase
      .from('racer_posts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const results = await Promise.all(
      posts.map(post => checkPostCountSync(post.id))
    );

    return results;
  } catch (error) {
    console.error('Error checking all post counts:', error);
    throw error;
  }
};

/**
 * Log count status to console for debugging
 */
export const logPostCountStatus = (status: PostCountStatus): void => {
  console.group(`Post Count Status: ${status.postId}`);
  console.log('Synchronized:', status.isSync ? '✅' : '❌');
  console.table({
    'Stored Counts': status.storedCounts,
    'Actual Counts': status.actualCounts
  });
  
  if (!status.isSync) {
    console.warn('Count mismatch detected! Consider running fixPostCounts()');
  }
  console.groupEnd();
};