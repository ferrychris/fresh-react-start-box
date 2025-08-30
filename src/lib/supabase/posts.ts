import { supabase } from './client';
import { DatabasePost, PostComment } from './types';

export const getPostsForRacer = async (racerId: string): Promise<DatabasePost[]> => {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            id, created_at, content, media_url, media_type,
            racer:racers ( id, username, profile_photo_url )
        `)
        .eq('racer_id', racerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts for racer:', error);
        return [];
    }
    return data as unknown as DatabasePost[];
};

// Backward-compatible alias for legacy imports
export const getRacerPosts = getPostsForRacer;

// Fetch recent posts for the fan dashboard (all users/types)
export const getFanPosts = async () => {
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
      console.error('Error fetching fan posts:', error);
      return [] as any[];
    }
    return (data || []) as any[];
  } catch (e) {
    console.error('Unexpected error in getFanPosts:', e);
    return [] as any[];
  }
};

export const getCommentsForPost = async (postId: string): Promise<PostComment[]> => {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            id, post_id, user_id, comment_text, created_at,
            profiles ( name, avatar_url )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments for post:', error);
        return [];
    }
    return data as unknown as PostComment[];
};

// Alias for getCommentsForPost to maintain compatibility with PostCard.tsx
export const getPostComments = getCommentsForPost;

// Add a comment to a post
export const addPostComment = async (postId: string, userId: string, comment: string): Promise<PostComment | null> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        comment_text: comment
      })
      .select(`
        id, post_id, user_id, comment_text, created_at,
        profiles ( name, avatar_url )
      `)
      .single();

    if (error) {
      console.error('Error adding comment to post:', error);
      return null;
    }

    return data as unknown as PostComment;
  } catch (error) {
    console.error('Error in addPostComment:', error);
    return null;
  }
};

// Toggle like status for a post and return the new state (true = liked, false = unliked)
export const togglePostLike = async (postId: string, userId: string): Promise<boolean> => {
  try {
    // Check if the user has already liked the post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'no rows returned' error
      console.error('Error checking post like:', checkError);
      throw checkError;
    }

    // If the post is already liked, unlike it
    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        throw deleteError;
      }

      return false; // Post is now unliked
    } 
    // Otherwise, like the post
    else {
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        throw insertError;
      }

      return true; // Post is now liked
    }
  } catch (error) {
    console.error('Error in togglePostLike:', error);
    throw error;
  }
};

export const createRacerPost = async (post: { racer_id: string; content: string; media_urls: string[]; post_type: string; visibility: string; allow_tips: boolean; }) => {
    const { data, error } = await supabase.from('posts').insert([post]);
    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const createFanPost = async (post: { fan_id: string; content: string; media_urls: string[]; post_type: string; visibility: string; }) => {
    const { data, error } = await supabase.from('posts').insert([post]);
    if (error) {
        throw new Error(error.message);
    }
    return data;
};
