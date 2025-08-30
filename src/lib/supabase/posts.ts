import { supabase } from './client';
import { DatabasePost, PostComment } from './types';

// Get posts for a specific racer from the unified table
export const getPostsForRacer = async (racerId: string): Promise<{ data: DatabasePost[]; error: any | null }> => {
  if (!racerId) {
    console.error('getPostsForRacer called without a valid racerId');
    return { data: [], error: { message: 'Racer ID is required' } };
  }
  
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const { data, error } = await supabase
        .from('racer_posts')
        .select(`
          id,
          created_at,
          updated_at,
          content,
          media_urls,
          post_type,
          visibility,
          likes_count,
          comments_count,
          user_id,
          user_type,
          racer_id,
          total_tips,
          allow_tips
        `)
        .or(`racer_id.eq.${racerId},user_id.eq.${racerId}`)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
          console.warn(`Network error fetching posts for racer, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error fetching posts for racer:', error);
        return { data: [], error };
      }
      
      return { data: data as unknown as DatabasePost[], error: null };
    } catch (err) {
      if (retries < maxRetries - 1) {
        console.warn(`Unexpected error fetching posts for racer, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      console.error('Exception fetching posts for racer:', err);
      return { 
        data: [], 
        error: { message: err instanceof Error ? err.message : 'Unknown error fetching posts' } 
      };
    }
  }
  
  return { data: [], error: { message: 'Maximum retries reached while fetching posts' } };
};

// Backward-compatible alias for legacy imports
export const getRacerPosts = async (racerId: string): Promise<DatabasePost[]> => {
  const { data } = await getPostsForRacer(racerId);
  return data;
};

// Get all posts from the unified table for fan dashboard
export const getFanPosts = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('racer_posts')
      .select(`
        id,
        created_at,
        updated_at,
        content,
        media_urls,
        post_type,
        visibility,
        likes_count,
        comments_count,
        user_id,
        user_type,
        racer_id,
        total_tips,
        allow_tips
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(25);
    
    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching posts:', error);
    return [];
  }
};

// Keyset-paginated posts for fan dashboard
// Cursor format: { created_at: string; id: string }
export const getFanPostsPage = async ({
  limit = 5,
  cursor
}: {
  limit?: number;
  cursor?: { created_at: string; id: string } | null;
}): Promise<{ data: any[]; nextCursor: { created_at: string; id: string } | null; error: any | null }> => {
  try {
    let query = supabase
      .from('racer_posts')
      .select(`
        id,
        created_at,
        updated_at,
        content,
        media_urls,
        post_type,
        visibility,
        likes_count,
        comments_count,
        user_id,
        user_type,
        racer_id,
        total_tips,
        allow_tips
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (cursor?.created_at && cursor?.id) {
      // Keyset pagination: (created_at, id) tuple
      // Fetch rows strictly older than the cursor
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching paginated posts:', error);
      return { data: [], nextCursor: null, error };
    }

    const rows = data || [];
    const last = rows[rows.length - 1];
    const nextCursor = last ? { created_at: last.created_at, id: last.id } : null;

    return { data: rows, nextCursor, error: null };
  } catch (error) {
    console.error('Exception fetching paginated posts:', error);
    return { data: [], nextCursor: null, error };
  }
};

export const getCommentsForPost = async (postId: string): Promise<PostComment[]> => {
  if (!postId) {
    console.error('getCommentsForPost called without a valid postId');
    return [];
  }

  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          user_id,
          comment_text,
          created_at,
          profiles (
            name,
            avatar,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        if (retries < maxRetries && error.message?.includes('Failed to fetch')) {
          console.warn(`Network error fetching comments, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error fetching comments:', error);
        return [];
      }

      return (comments || []).map(comment => {
        try {
          const profiles = comment.profiles as any;
          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.comment_text || '',
            comment_text: comment.comment_text || '',
            created_at: comment.created_at,
            user: {
              name: profiles?.name || 'User',
              avatar: profiles?.avatar || profiles?.avatar_url || ''
            }
          };
        } catch (err) {
          console.error('Error processing comment:', err);
          return {
            id: comment.id || 'unknown',
            post_id: comment.post_id || postId,
            user_id: comment.user_id || 'unknown',
            content: '',
            comment_text: '',
            created_at: comment.created_at || new Date().toISOString(),
            user: {
              name: 'User',
              avatar: ''
            }
          };
        }
      });
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error fetching comments, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      console.error('Error fetching comments:', error);
      return [];
    }
  }
  
  return [];
};

// Alias for getCommentsForPost to maintain compatibility with PostCard.tsx
export const getPostComments = getCommentsForPost;

// Alias for addCommentToPost to maintain compatibility with PostCard.tsx
export const addPostComment = async (postId: string, userId: string, commentText: string): Promise<PostComment | null> => {
  const result = await addCommentToPost(postId, userId, commentText);
  if (result.error) {
    console.error('Error in addPostComment:', result.error);
    throw result.error;
  }
  return result.data;
};

export const addCommentToPost = async (
  postId: string,
  userId: string,
  commentText: string
): Promise<{ data: PostComment | null; error: Error | null }> => {
  if (!postId || !userId || !commentText?.trim()) {
    console.error('addCommentToPost called with invalid parameters', { postId, userId, commentText });
    return { 
      data: null, 
      error: new Error('Missing required parameters: postId, userId, and commentText are required') 
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session when attempting to add comment');
    return { 
      data: null, 
      error: new Error('Authentication required to add comments') 
    };
  }

  if (session.user.id !== userId) {
    console.error('User ID mismatch when adding comment', { sessionUserId: session.user.id, providedUserId: userId });
    return { 
      data: null, 
      error: new Error('You can only add comments as yourself') 
    };
  }

  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          comment_text: commentText
        })
        .select(`
          id,
          post_id,
          user_id,
          comment_text,
          created_at,
          profiles (
            name,
            avatar,
            avatar_url
          )
        `)
        .single();

      if (error) {
        if (retries < maxRetries && error.message?.includes('Failed to fetch')) {
          console.warn(`Network error adding comment, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error adding comment:', error);
        return { data: null, error };
      }

      try {
        const comment: PostComment = {
          id: data.id,
          post_id: data.post_id,
          user_id: data.user_id,
          content: data.comment_text,
          comment_text: data.comment_text,
          created_at: data.created_at,
          user: {
            name: Array.isArray(data.profiles) ? data.profiles[0]?.name : (data.profiles as any)?.name || 'User',
            avatar: Array.isArray(data.profiles) ? (data.profiles[0]?.avatar_url || data.profiles[0]?.avatar) : ((data.profiles as any)?.avatar_url || (data.profiles as any)?.avatar) || ''
          }
        };

        // Increment the comments count for the post in unified table
        try {
          await supabase
            .from('racer_posts')
            .update({ comments_count: supabase.rpc('increment') })
            .eq('id', postId);
        } catch (updateError) {
          console.warn('Failed to update comment count:', updateError);
        }

        return { data: comment, error: null };
      } catch (processingError) {
        console.error('Error processing comment data:', processingError);
        return { 
          data: null, 
          error: new Error('Error processing comment data') 
        };
      }
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error adding comment, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      console.error('Error adding comment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error adding comment') 
      };
    }
  }
  
  return { 
    data: null, 
    error: new Error('Failed to add comment after multiple attempts') 
  };
};

export const togglePostLike = async (
  postId: string, 
  userId: string
): Promise<{ liked: boolean; error: Error | null }> => {
  if (!postId || !userId) {
    console.error('togglePostLike called with invalid parameters', { postId, userId });
    return { 
      liked: false, 
      error: new Error('Missing required parameters: postId and userId are required') 
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session when attempting to toggle like');
    return { 
      liked: false, 
      error: new Error('Authentication required to like posts') 
    };
  }

  if (session.user.id !== userId) {
    console.error('User ID mismatch when toggling like', { sessionUserId: session.user.id, providedUserId: userId });
    return { 
      liked: false, 
      error: new Error('You can only like posts as yourself') 
    };
  }

  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      const { data: existingLike, error: checkError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (checkError && !checkError.message.includes('No rows found')) {
        if (retries < maxRetries && checkError.message?.includes('Failed to fetch')) {
          console.warn(`Network error checking like status, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error checking like status:', checkError);
        return { liked: false, error: new Error(checkError.message) };
      }

      let liked = false;
      
      if (existingLike) {
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) {
          if (retries < maxRetries && unlikeError.message?.includes('Failed to fetch')) {
            console.warn(`Network error unliking post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
          
          console.error('Error unliking post:', unlikeError);
          return { liked: false, error: new Error(unlikeError.message) };
        }
        
        liked = false;
      } else {
        const { error: likeError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId
          });

        if (likeError) {
          if (retries < maxRetries && likeError.message?.includes('Failed to fetch')) {
            console.warn(`Network error liking post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
          
          console.error('Error liking post:', likeError);
          return { liked: false, error: new Error(likeError.message) };
        }
        
        liked = true;
      }

      // Update the likes count on the unified post table
      try {
        await supabase
          .from('racer_posts')
          .update({ 
            likes_count: supabase.rpc(liked ? 'increment_post_likes' : 'decrement_post_likes', { post_id: postId })
          })
          .eq('id', postId);
      } catch (updateError) {
        console.warn('Failed to update like count:', updateError);
      }

      return { liked, error: null };
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error toggling like, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      console.error('Error toggling post like:', error);
      return { 
        liked: false, 
        error: error instanceof Error ? error : new Error('Unknown error toggling like') 
      };
    }
  }
  
  return { 
    liked: false, 
    error: new Error('Failed to toggle like after multiple attempts') 
  };
};

// Backward compatibility wrapper for the old togglePostLike function signature
export const togglePostLikeOld = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const result = await togglePostLike(postId, userId);
    if (result.error) {
      console.error('Error in togglePostLikeOld:', result.error);
      throw result.error;
    }
    return result.liked;
  } catch (error) {
    console.error('Error in togglePostLikeOld:', error);
    throw error;
  }
};

// Update createRacerPost to use unified table
export const createRacerPost = async (post: { 
  racer_id: string; 
  content: string; 
  media_urls: string[]; 
  post_type: string; 
  visibility: string; 
  allow_tips: boolean; 
}): Promise<{ data: any | null; error: any | null }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required to create posts' } };
    }
    
    if (session.user.id !== post.racer_id) {
      return { data: null, error: { message: 'Unauthorized: You can only create posts for yourself' } };
    }
    
    const { data, error } = await supabase.from('racer_posts').insert([{
      ...post,
      user_id: post.racer_id,
      user_type: 'racer'
    }]).select();
    
    if (error) {
      console.error('Error creating racer post:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception creating racer post:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error creating racer post' } 
    };
  }
};

// Update createFanPost to use unified table
export const createFanPost = async (post: { 
  fan_id: string; 
  content: string; 
  media_urls: string[]; 
  post_type: string; 
  visibility: string; 
}): Promise<{ data: any | null; error: any | null }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required to create posts' } };
    }
    
    if (session.user.id !== post.fan_id) {
      return { data: null, error: { message: 'Unauthorized: You can only create posts for yourself' } };
    }
    
    const { data, error } = await supabase.from('racer_posts').insert([{
      content: post.content,
      media_urls: post.media_urls,
      post_type: post.post_type,
      visibility: post.visibility,
      user_id: post.fan_id,
      user_type: 'fan',
      allow_tips: false,
      total_tips: 0
    }]).select();
    
    if (error) {
      console.error('Error creating fan post:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception creating fan post:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error creating fan post' } 
    };
  }
};

export const deletePostById = async (
  postId: string
): Promise<{ success: boolean; error: Error | null }> => {
  if (!postId) {
    return { success: false, error: new Error('Post ID is required') };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: new Error('Authentication required to delete posts') };
  }

  const userId = session.user.id;
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      // Verify the post exists and is owned by the current user
      const { data: post, error: fetchErr } = await supabase
        .from('racer_posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();

      if (fetchErr) {
        if (fetchErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(fetchErr.message) };
      }

      if (!post) {
        return { success: false, error: new Error('Post not found') };
      }

      if (post.user_id !== userId) {
        return { success: false, error: new Error('You can only delete your own posts') };
      }

      // Optionally clean up dependent rows if cascade is not configured
      try {
        await supabase.from('post_likes').delete().eq('post_id', postId);
      } catch {}
      try {
        await supabase.from('post_comments').delete().eq('post_id', postId);
      } catch {}

      const { error: delErr } = await supabase
        .from('racer_posts')
        .delete()
        .eq('id', postId);

      if (delErr) {
        if (delErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(delErr.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        continue;
      }
      return { success: false, error: err instanceof Error ? err : new Error('Unknown error deleting post') };
    }
  }

  return { success: false, error: new Error('Failed to delete post after multiple attempts') };
};