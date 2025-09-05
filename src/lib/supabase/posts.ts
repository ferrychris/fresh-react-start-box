import { supabase } from './client';
import { DatabasePost, PostComment } from './types';
import { getPostPublicUrl, getFanPostPublicUrl } from './storage';

// Get posts for a specific racer from the unified table
export const getPostsForRacer = async (racerId: string): Promise<{ data: DatabasePost[]; error: unknown | null }> => {
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
          allow_tips,
          profiles!racer_posts_user_id_fkey (
            id,
            name,
            email,
            avatar,
            user_type
          ),
          racer_profiles!racer_posts_racer_id_fkey (
            id,
            username,
            profile_photo_url
          )
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
      
      // Normalize media_urls to public URLs (handles legacy stored paths)
      const mapped: DatabasePost[] = (data as DatabasePost[]).map((row) => {
        const urls = Array.isArray(row.media_urls)
          ? row.media_urls.map((u: string) => {
              if (typeof u !== 'string') return u;
              // Leave already-public URLs AND data URIs untouched
              if (/^(https?:|data:)/i.test(u)) return u;
              const pub = row.user_type === 'fan' ? getFanPostPublicUrl(u) : getPostPublicUrl(u);
              return pub || u;
            })
          : [];
        return { ...row, media_urls: urls } as DatabasePost;
      });
      return { data: mapped, error: null };
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

// Edit a comment's text. Verifies the user owns the comment and belongs to the same post.
export const updateCommentOnPost = async (
  postId: string,
  commentId: string,
  userId: string,
  newText: string
): Promise<{ data: PostComment | null; error: Error | null }> => {
  if (!postId || !commentId || !userId || !newText?.trim()) {
    return { data: null, error: new Error('Post ID, Comment ID, User ID and new text are required') };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: new Error('Authentication required to edit comments') };
  if (session.user.id !== userId) return { data: null, error: new Error('You can only edit your own comments') };

  try {
    // Verify ownership and post match
    const { data: existing, error: fetchErr } = await supabase
      .from('post_comments')
      .select('id, user_id, post_id')
      .eq('id', commentId)
      .maybeSingle();
    if (fetchErr) return { data: null, error: new Error(fetchErr.message) };
    if (!existing || existing.post_id !== postId) return { data: null, error: new Error('Comment not found') };
    if (existing.user_id !== session.user.id) return { data: null, error: new Error('You can only edit your own comments') };

    const { data, error } = await supabase
      .from('post_comments')
      .update({ comment_text: newText })
      .eq('id', commentId)
      .select(`
        id,
        post_id,
        user_id,
        comment_text,
        created_at,
        profiles!post_comments_user_id_fkey (name, email, avatar)
      `)
      .maybeSingle();
    if (error) return { data: null, error };
    if (!data) return { data: null, error: new Error('Failed to update comment') };

    const prof = Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles;
    const email: string | undefined = prof?.email;
    const emailName = email ? (email.includes('@') ? email.split('@')[0] : email) : '';

    const mapped: PostComment = {
      id: String((data as any).id),
      post_id: String((data as any).post_id),
      user_id: String((data as any).user_id),
      content: String((data as any).comment_text || ''),
      created_at: String((data as any).created_at),
      user: {
        name: (prof?.name || emailName || 'User'),
        avatar: (prof?.avatar || '')
      }
    };

    return { data: mapped, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
};

// Backward-compatible alias for legacy imports
export const getRacerPosts = async (racerId: string): Promise<DatabasePost[]> => {
  const { data } = await getPostsForRacer(racerId);
  return data;
};

// Get all public posts from both fans and racers for public feeds
export const getAllPublicPosts = async (): Promise<DatabasePost[]> => {
  let retries = 0;
  const maxRetries = 3;
  const limit = 50; // prevent full-table scans from timing out

  while (retries <= maxRetries) {
    try {
      const { data, error } = await supabase
        .from('racer_posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          updated_at,
          post_type,
          visibility,
          likes_count,
          comments_count,
          total_tips,
          allow_tips,
          user_id,
          user_type,
          racer_id,
          profiles!racer_posts_user_id_fkey (
            id,
            name,
            email,
            user_type,
            avatar
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching public posts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const mapped: DatabasePost[] = (data as DatabasePost[]).map((row) => {
          const urls = Array.isArray(row.media_urls)
            ? row.media_urls.map((u: string) => {
                if (typeof u !== 'string') return u;
                // Leave already-public URLs AND data URIs untouched
                if (/^(https?:|data:)/i.test(u)) return u;
                const pub = row.user_type === 'fan' ? getFanPostPublicUrl(u) : getPostPublicUrl(u);
                return pub || u;
              })
            : [];
          return { ...row, media_urls: urls } as DatabasePost;
        });
        return mapped;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching public posts (attempt ${retries + 1}):`, error);
      retries++;
      if (retries > maxRetries) {
        console.error('Max retries reached for fetching public posts');
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  return [];
};

// Get posts for a specific fan (their own posts)
export const getPostsForFan = async (fanId: string): Promise<DatabasePost[]> => {
  if (!fanId) {
    console.error('getPostsForFan called without a valid fanId');
    return [];
  }

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      const { data, error } = await supabase
        .from('racer_posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          updated_at,
          post_type,
          visibility,
          likes_count,
          comments_count,
          total_tips,
          allow_tips,
          user_id,
          user_type,
          racer_id,
          profiles!racer_posts_user_id_fkey (
            id,
            name,
            email,
            user_type,
            avatar
          )
        `)
        .eq('user_id', fanId)
        .eq('user_type', 'fan')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('Failed to fetch') && retries < maxRetries) {
          console.warn(`Network error fetching posts for fan, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        console.error('Error fetching posts for fan:', error);
        return [];
      }

      const mapped: DatabasePost[] = ((data || []) as DatabasePost[]).map((row) => {
        const urls = Array.isArray(row.media_urls)
          ? row.media_urls.map((u: string) => {
              if (typeof u !== 'string') return u;
              // Leave already-public URLs AND data URIs untouched
              if (/^(https?:|data:)/i.test(u)) return u;
              const pub = row.user_type === 'fan' ? getFanPostPublicUrl(u) : getPostPublicUrl(u);
              return pub || u;
            })
          : [];
        return { ...row, media_urls: urls } as DatabasePost;
      });
      return mapped;
    } catch (err) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error fetching posts for fan, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      console.error('Exception fetching posts for fan:', err);
      return [];
    }
  }

  return [];
};

// Keyset-paginated posts for fan dashboard
// Cursor format: { created_at: string; id: string }
export const getFanPostsPage = async ({
  limit = 12,
  cursor
}: {
  limit?: number;
  cursor?: { created_at: string; id: string } | null;
}): Promise<{ data: DatabasePost[]; nextCursor: { created_at: string; id: string } | null; error: any | null }> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      // Fetch all posts with conditional profile joins based on user_type
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
          allow_tips,
          profiles!racer_posts_user_id_fkey (id, name, email, avatar, user_type),
          racer_profiles!racer_posts_racer_id_fkey (id, username, profile_photo_url, car_number, team_name)
        `)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

      if (cursor?.created_at && cursor?.id) {
        // Proper keyset pagination: (created_at < cursor.created_at)
        // OR (created_at = cursor.created_at AND id < cursor.id)
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error in getFanPostsPage:', error);
        
        if (error.message?.includes('Failed to fetch') && retries < maxRetries) {
          console.warn(`Network error fetching paginated posts, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        return { data: [], nextCursor: null, error };
      }

      const rows = data || [];
      console.log(`Fetched ${rows.length} posts from database (all posts)`);
      
      // Generate next cursor from the last item
      const last = rows[rows.length - 1];
      const nextCursor = (last && rows.length === limit) ? { created_at: last.created_at, id: last.id } : null;

      const mapped: DatabasePost[] = (rows as DatabasePost[]).map((row) => {
        const urls = Array.isArray(row.media_urls)
          ? row.media_urls.map((u: string) => {
              if (typeof u !== 'string') return u;
              // Leave already-public URLs AND data URIs untouched
              if (/^(https?:|data:)/i.test(u)) return u;
              const pub = row.user_type === 'fan' ? getFanPostPublicUrl(u) : getPostPublicUrl(u);
              return pub || u;
            })
          : [];
        return { ...row, media_urls: urls } as DatabasePost;
      });
      return { data: mapped, nextCursor, error: null };
    } catch (error) {
      console.error('Exception in getFanPostsPage:', error);
      
      if (retries < maxRetries) {
        console.warn(`Unexpected error fetching paginated posts, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      return { data: [], nextCursor: null, error };
    }
  }
  
  return { data: [], nextCursor: null, error: { message: 'Failed to fetch paginated posts after multiple attempts' } };
};

// Optimized: public feed with minimal join and reduced columns
export const getPublicPostsPage = async ({
  limit = 12,
  cursor,
  includeProfiles = true
}: {
  limit?: number;
  cursor?: { created_at: string; id: string } | null;
  includeProfiles?: boolean;
}): Promise<{ data: DatabasePost[]; nextCursor: { created_at: string; id: string } | null; error: any | null }> => {
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      // Build the base selector once
      const baseCore = `
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
          allow_tips,
          racer_profiles!racer_posts_racer_id_fkey (id, username, profile_photo_url)
        `;
      const baseSelect = includeProfiles
        ? `${baseCore}, profiles!racer_posts_user_id_fkey (id, name, avatar, user_type)`
        : baseCore;

      let rows: any[] = [];

      if (cursor?.created_at && cursor?.id) {
        // Avoid OR which can defeat index usage; do two sequential keyset queries.
        // 1) Strictly earlier timestamps
        const { data: part1, error: err1 } = await supabase
          .from('racer_posts')
          .select(baseSelect)
          .eq('visibility', 'public')
          .lt('created_at', cursor.created_at)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);
        if (err1) {
          if (err1.message?.includes('Failed to fetch') && retries < maxRetries) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { data: [], nextCursor: null, error: err1 };
        }

        rows = part1 || [];

        if (rows.length < limit) {
          // 2) Same timestamp but lower id to break ties
          const remaining = limit - rows.length;
          const { data: part2, error: err2 } = await supabase
            .from('racer_posts')
            .select(baseSelect)
            .eq('visibility', 'public')
            .eq('created_at', cursor.created_at)
            .lt('id', cursor.id)
            .order('id', { ascending: false })
            .limit(remaining);
          if (err2) {
            if (err2.message?.includes('Failed to fetch') && retries < maxRetries) {
              retries++;
              await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
              continue;
            }
            return { data: [], nextCursor: null, error: err2 };
          }
          if (part2 && part2.length) {
            rows = [...rows, ...part2];
          }
        }
      } else {
        // First page
        const { data, error } = await supabase
          .from('racer_posts')
          .select(baseSelect)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);
        if (error) {
          if (error.message?.includes('Failed to fetch') && retries < maxRetries) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { data: [], nextCursor: null, error };
        }
        rows = data || [];
      }

      const last = rows[rows.length - 1];
      const nextCursor = (last && rows.length === limit) ? { created_at: last.created_at, id: last.id } : null;

      const mapped: DatabasePost[] = (rows as DatabasePost[]).map((row) => {
        const urls = Array.isArray(row.media_urls)
          ? row.media_urls.map((u: string) => {
              if (typeof u !== 'string') return u;
              if (/^(https?:|data:)/i.test(u)) return u;
              const pub = row.user_type === 'fan' ? getFanPostPublicUrl(u) : getPostPublicUrl(u);
              return pub || u;
            })
          : [];
        return { ...row, media_urls: urls } as DatabasePost;
      });

      return { data: mapped, nextCursor, error: null };
    } catch (error: any) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        continue;
      }
      return { data: [], nextCursor: null, error };
    }
  }

  return { data: [], nextCursor: null, error: { message: 'Failed to fetch public posts after multiple attempts' } };
};

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles?: any; // Define a proper type if needed
  user?: {
    name: string;
    avatar: string;
  };
}

export const getPostComments = async (postId: string, limit: number = 10, offset: number = 0): Promise<{ data: Comment[] | null; totalCount: number; error: any }> => {
  if (!postId) {
    console.error('getPostComments called without a valid postId');
    return { data: null, totalCount: 0, error: { message: 'Post ID is required' } };
  }

  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      // Fetch page of comments
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          user_id,
          comment_text,
          created_at,
          profiles!post_comments_user_id_fkey (
            name,
            email,
            avatar,
            user_type
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (retries < maxRetries && error.message?.includes('Failed to fetch')) {
          console.warn(`Network error fetching comments, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error fetching comments:', error);
        return { data: null, totalCount: 0, error };
      }

      // Fetch total count (head request)
      let totalCount = 0;
      try {
        const { count, error: countErr } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        if (countErr) {
          console.warn('Failed to fetch total comment count:', countErr);
        } else {
          totalCount = count || 0;
        }
      } catch (countEx) {
        console.warn('Exception while counting comments:', countEx);
      }

      return { data: (comments || []).map(comment => {
        try {
          const profiles = comment.profiles as any;
          const prof = Array.isArray(profiles) ? profiles[0] : profiles;
          let emailUsername = '';
          if (prof && typeof prof === 'object' && 'email' in prof) {
            const e = (prof as { email?: string }).email;
            if (typeof e === 'string' && e.length > 0) {
              emailUsername = e.includes('@') ? e.split('@')[0] : e;
            }
          }
          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.comment_text || '',
            created_at: comment.created_at,
            user: {
              name: (prof?.name || emailUsername || 'User'),
              avatar: (prof?.avatar || '')
            }
          };
        } catch (err) {
          console.error('Error processing comment:', err);
          return {
            id: comment.id || 'unknown',
            post_id: comment.post_id || postId,
            user_id: comment.user_id || 'unknown',
            content: '',
            created_at: comment.created_at || new Date().toISOString(),
            user: {
              name: 'User',
              avatar: ''
            }
          };
        }
      }), totalCount, error: null };
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error fetching comments, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      
      console.error('Error fetching comments:', error);
      return { data: null, totalCount: 0, error };
    }
  }
  
  return { data: null, totalCount: 0, error: { message: 'Failed to fetch comments after multiple attempts' } };
};

export const addCommentToPost = async (
  postId: string,
  userId: string,
  commentText: string
): Promise<{ data: Comment | null; error: Error | null }> => {
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
          profiles!post_comments_user_id_fkey (
            name,
            email,
            avatar
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

      if (!data) {
        throw new Error('Failed to add comment: No data returned.');
      }

      // The database trigger will automatically handle comment count updates
      // No manual intervention needed here as the trigger function handles it
      console.log('Comment added successfully, database trigger will update comment count');

      // Map the returned data to the PostComment type
      const mappedComment: Comment = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.comment_text,
        created_at: data.created_at,
        user: {
          name: (() => {
            const prof = Array.isArray(data.profiles) ? data.profiles[0] : (data.profiles as any);
            const email = prof?.email as string | undefined;
            const emailName = email ? (email.includes('@') ? email.split('@')[0] : email) : '';
            return (prof?.name || emailName || 'User');
          })(),
          avatar: (() => {
            const prof = Array.isArray(data.profiles) ? data.profiles[0] : (data.profiles as any);
            return prof?.avatar || '';
          })()
        }
      };

      return { data: mappedComment, error: null };
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

// Delete a single comment and decrement the post's comment count by 1.
export const deleteCommentFromPost = async (
  postId: string,
  commentId: string
): Promise<{ success: boolean; error: Error | null }> => {
  if (!postId || !commentId) {
    return { success: false, error: new Error('Post ID and Comment ID are required') };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: new Error('Authentication required to delete comments') };
  }

  let retries = 0;
  const maxRetries = 3;
  while (retries <= maxRetries) {
    try {
      // Ensure the current user owns the comment
      const { data: existing, error: fetchErr } = await supabase
        .from('post_comments')
        .select('id, user_id, post_id')
        .eq('id', commentId)
        .maybeSingle();

      if (fetchErr) {
        if (fetchErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(fetchErr.message) };
      }

      if (!existing || existing.post_id !== postId) {
        return { success: false, error: new Error('Comment not found') };
      }
      if (existing.user_id !== session.user.id) {
        return { success: false, error: new Error('You can only delete your own comments') };
      }

      // Delete the comment
      const { error: delErr } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      if (delErr) {
        if (delErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(delErr.message) };
      }

      // Decrement the cached comment count on the post
      try {
        const { data: currentPost, error: fetchPostErr } = await supabase
          .from('racer_posts')
          .select('id, comments_count, comment_count')
          .eq('id', postId)
          .maybeSingle();
        if (fetchPostErr) {
          console.warn('Failed to fetch post for decrementing comment count:', fetchPostErr);
        } else if (currentPost) {
          const hasPlural = typeof (currentPost as any).comments_count === 'number';
          const hasSingular = typeof (currentPost as any).comment_count === 'number';
          if (hasPlural) {
            const cur = (currentPost as any).comments_count || 0;
            const newVal = cur > 0 ? cur - 1 : 0;
            const { error: updErr } = await supabase
              .from('racer_posts')
              .update({ comments_count: newVal })
              .eq('id', postId);
            if (updErr) console.warn('Failed to decrement comments_count:', updErr);
          } else if (hasSingular) {
            const cur = (currentPost as any).comment_count || 0;
            const newVal = cur > 0 ? cur - 1 : 0;
            const { error: updErr2 } = await supabase
              .from('racer_posts')
              .update({ comment_count: newVal })
              .eq('id', postId);
            if (updErr2) console.warn('Failed to decrement comment_count:', updErr2);
          } else {
            console.warn('No comments_count/comment_count column found on racer_posts');
          }
        }
      } catch (decErr) {
        console.warn('Exception while decrementing comment count:', decErr);
      }

      return { success: true, error: null };
    } catch (err) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        continue;
      }
      return { success: false, error: err instanceof Error ? err : new Error('Unknown error deleting comment') };
    }
  }

  return { success: false, error: new Error('Failed to delete comment after multiple attempts') };
};

export const togglePostLike = async (
  postId: string, 
  userId: string
): Promise<{ liked: boolean; likesCount: number | null; error: Error | null }> => {
  if (!postId || !userId) {
    console.error('togglePostLike called with invalid parameters', { postId, userId });
    return { 
      liked: false, 
      likesCount: null,
      error: new Error('Missing required parameters: postId and userId are required') 
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session when attempting to toggle like');
    return { 
      liked: false, 
      likesCount: null,
      error: new Error('Authentication required to like posts') 
    };
  }

  if (session.user.id !== userId) {
    console.error('User ID mismatch when toggling like', { sessionUserId: session.user.id, providedUserId: userId });
    return { 
      liked: false, 
      likesCount: null,
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
        .limit(1) // Ensure we only get one record, even if duplicates exist
        .maybeSingle(); // Returns null instead of error if no like is found
 
      if (checkError) {
        if (checkError.message?.includes('Failed to fetch') && retries < maxRetries) {
          console.warn(`Network error checking like status, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        console.error('Error checking like status:', checkError);
        return { liked: false, likesCount: null, error: new Error(checkError.message) };
      }

      let liked = false;
      
      if (existingLike) {
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) {
          if (unlikeError.message?.includes('Failed to fetch') && retries < maxRetries) {
            console.warn(`Network error unliking post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
          
          console.error('Error unliking post:', unlikeError);
          return { liked: false, likesCount: null, error: new Error(unlikeError.message) };
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
          if (likeError.message?.includes('Failed to fetch') && retries < maxRetries) {
            console.warn(`Network error liking post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
          
          console.error('Error liking post:', likeError);
          return { liked: false, likesCount: null, error: new Error(likeError.message) };
        }
        
        liked = true;
      }

      // Update the likes count via RPC on the server and get the new count
      let newLikesCount: number | null = null;
      try {
        const rpcName = liked ? 'increment_post_likes' : 'decrement_post_likes';
        const { data, error: rpcError } = await supabase.rpc(rpcName, { post_id_param: postId });

        if (rpcError) {
          console.warn('Failed to update like count via RPC:', rpcError);
        } else {
          newLikesCount = data;
        }
      } catch (updateError) {
        console.warn('Exception during RPC call for like count:', updateError);
      }

      return { liked, likesCount: newLikesCount, error: null };
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
        likesCount: null,
        error: error instanceof Error ? error : new Error('Unknown error toggling like') 
      };
    }
  }
  
  return { 
    liked: false, 
    likesCount: null,
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
}): Promise<{ data: DatabasePost | null; error: any | null }> => {
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
    
    return { data: data[0] as DatabasePost, error: null };
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
}): Promise<{ data: DatabasePost | null; error: any | null }> => {
  try {
    // Check environment variables first
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured');
      return { 
        data: null, 
        error: { message: 'Database configuration error. Please check environment variables.' } 
      };
    }

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { data: null, error: { message: 'Authentication error: ' + sessionError.message } };
    }
    
    if (!session) {
      return { data: null, error: { message: 'Authentication required to create posts' } };
    }
    
    if (session.user.id !== post.fan_id) {
      return { data: null, error: { message: 'Unauthorized: You can only create posts for yourself' } };
    }

    // Validate required fields
    if (!post.content?.trim()) {
      return { data: null, error: { message: 'Post content is required' } };
    }

    // Sanitize visibility to match DB enum and calculate payload size
    const rawVisibility = post.visibility;
    let visibilityValue = rawVisibility === 'community' ? 'fans_only' : (rawVisibility || 'public');
    if (!['public', 'fans_only'].includes(visibilityValue)) {
      console.warn('Unsupported visibility provided, defaulting to public:', rawVisibility);
      visibilityValue = 'public';
    }

    // Calculate payload size to detect QUIC issues
    const payloadSize = JSON.stringify({
      content: post.content,
      media_urls: post.media_urls || [],
      post_type: post.post_type || 'text',
      visibility: visibilityValue,
      user_id: post.fan_id,
      user_type: 'fan',
      allow_tips: false,
      total_tips: 0
    }).length;

    console.log('Creating fan post with data:', {
      content: post.content.substring(0, 50) + '...',
      media_urls_count: post.media_urls?.length || 0,
      post_type: post.post_type,
      visibility: post.visibility,
      user_id: post.fan_id,
      payload_size_bytes: payloadSize
    });

    // If payload > 1MB, use chunked approach to avoid QUIC protocol errors
    if (payloadSize > 1024 * 1024) {
      console.warn('Large payload detected, using chunked upload approach');
      return await createLargePost(post);
    }
    
    const { data, error } = await supabase.from('racer_posts').insert([{
      content: post.content,
      media_urls: post.media_urls || [],
      post_type: post.post_type || 'text',
      visibility: visibilityValue,
      user_id: post.fan_id,
      user_type: 'fan',
      allow_tips: false,
      total_tips: 0
    }]).select();
    
    if (error) {
      console.error('Supabase error creating fan post:', error);
      
      // Handle QUIC protocol errors specifically
      if (error.message?.includes('ERR_QUIC_PROTOCOL_ERROR') || 
          error.message?.includes('QUIC') ||
          error.code === 'NETWORK_ERROR') {
        console.warn('QUIC protocol error detected, retrying with chunked approach');
        return await createLargePost(post);
      }
      
      // Provide more specific error messages
      if (error.code === 'PGRST301') {
        return { data: null, error: { message: 'Database connection failed. Please try again.' } };
      } else if (error.code === '42501') {
        return { data: null, error: { message: 'Permission denied. Please check your account permissions.' } };
      } else if (error.message?.includes('Failed to fetch')) {
        return { data: null, error: { message: 'Network error. Please check your internet connection and try again.' } };
      }
      
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.error('No data returned from insert operation');
      return { data: null, error: { message: 'Post creation failed - no data returned' } };
    }
    
    console.log('Fan post created successfully:', data[0].id);
    return { data: data[0] as DatabasePost, error: null };
  } catch (error) {
    console.error('Exception creating fan post:', error);
    
    // Handle specific network errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        return { 
          data: null, 
          error: { message: 'Network connection failed. Please check your internet connection and try again.' } 
        };
      } else if (error.message.includes('NetworkError')) {
        return { 
          data: null, 
          error: { message: 'Network error occurred. Please try again.' } 
        };
      }
    }
    
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error creating fan post' } 
    };
  }
};

// Chunked upload for large posts to avoid QUIC protocol errors
const createLargePost = async (post: { 
  fan_id: string; 
  content: string; 
  media_urls: string[]; 
  post_type: string; 
  visibility: string; 
}): Promise<{ data: DatabasePost | null; error: any | null }> => {
  try {
    // Sanitize visibility to align with DB enum
    const rawVisibility = post.visibility;
    let visibilityValue = rawVisibility === 'community' ? 'fans_only' : (rawVisibility || 'public');
    if (!['public', 'fans_only'].includes(visibilityValue)) {
      console.warn('Unsupported visibility provided in createLargePost, defaulting to public:', rawVisibility);
      visibilityValue = 'public';
    }

    // Step 1: Create post without media_urls
    const { data: postData, error: postError } = await supabase.from('racer_posts').insert([{
      content: post.content,
      media_urls: [], // Empty initially
      post_type: post.post_type || 'text',
      visibility: visibilityValue,
      user_id: post.fan_id,
      user_type: 'fan',
      allow_tips: false,
      total_tips: 0
    }]).select();

    if (postError || !postData?.[0]) {
      return { data: null, error: postError };
    }

    const createdPost = postData[0];

    // Step 2: Update with media_urls in smaller chunks
    if (post.media_urls?.length > 0) {
      const { error: updateError } = await supabase
        .from('racer_posts')
        .update({ media_urls: post.media_urls })
        .eq('id', createdPost.id);

      if (updateError) {
        console.error('Failed to update media_urls:', updateError);
        // Post created but media failed - return partial success
        return { 
          data: createdPost as DatabasePost, 
          error: { message: 'Post created but media upload failed. Please try uploading media separately.' }
        };
      }
    }

    console.log('Large post created successfully via chunked approach:', createdPost.id);
    return { data: { ...createdPost, media_urls: post.media_urls } as DatabasePost, error: null };
  } catch (error) {
    console.error('Exception in chunked upload:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Chunked upload failed' } 
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
      // Try racer_posts first
      const { data: racerPost, error: fetchRacerErr } = await supabase
        .from('racer_posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();

      if (fetchRacerErr && !fetchRacerErr.message?.includes('No rows')) {
        if (fetchRacerErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(fetchRacerErr.message) };
      }

      if (racerPost) {
        if (racerPost.user_id !== userId) {
          return { success: false, error: new Error('You can only delete your own posts') };
        }

        // Clean up shared dependent rows
        try {
          await supabase.from('post_likes').delete().eq('post_id', postId);
        } catch (error) {
          console.warn('Error deleting post likes:', error);
        }
        try {
          await supabase.from('post_comments').delete().eq('post_id', postId);
        } catch (error) {
          console.warn('Error deleting post comments:', error);
        }

        const { error: delRacerErr } = await supabase
          .from('racer_posts')
          .delete()
          .eq('id', postId);

        if (delRacerErr) {
          if (delRacerErr.message?.includes('Failed to fetch') && retries < maxRetries) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { success: false, error: new Error(delRacerErr.message) };
        }

        return { success: true, error: null };
      }

      // If not a racer post, try fan_posts
      const { data: fanPost, error: fetchFanErr } = await supabase
        .from('fan_posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();

      if (fetchFanErr) {
        if (fetchFanErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(fetchFanErr.message) };
      }

      if (!fanPost) {
        return { success: false, error: new Error('Post not found') };
      }

      if (fanPost.user_id !== userId) {
        return { success: false, error: new Error('You can only delete your own posts') };
      }

      // Clean up shared dependent rows
      try {
        await supabase.from('post_likes').delete().eq('post_id', postId);
      } catch (error) {
        console.warn('Error deleting post likes:', error);
      }
      try {
        await supabase.from('post_comments').delete().eq('post_id', postId);
      } catch (error) {
        console.warn('Error deleting post comments:', error);
      }

      const { error: delFanErr } = await supabase
        .from('fan_posts')
        .delete()
        .eq('id', postId);

      if (delFanErr) {
        if (delFanErr.message?.includes('Failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { success: false, error: new Error(delFanErr.message) };
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

// Alias for backward compatibility
export const deletePost = async (postId: string): Promise<void> => {
  const { success, error } = await deletePostById(postId);
  if (error) {
    throw error;
  }
};

export const tipPost = async (
  postId: string,
  amountCents: number = 500
): Promise<{ data: { total_tips: number } | null; error: any | null }> => {
  try {
    // 1) Validate input
    if (!postId) {
      return { data: null, error: { message: 'Post ID is required' } };
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { data: null, error: { message: 'Tip amount must be a positive number (in cents)' } };
    }

    // 2) Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'Authentication required to tip' } };
    }

    // 3) Fetch current post to verify allow_tips and read current total_tips
    let retries = 0;
    const maxRetries = 3;
    while (retries <= maxRetries) {
      try {
        const { data: post, error: fetchErr } = await supabase
          .from('racer_posts')
          .select('id, allow_tips, total_tips')
          .eq('id', postId)
          .maybeSingle();

        if (fetchErr) {
          if (fetchErr.message?.includes('Failed to fetch') && retries < maxRetries) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { data: null, error: fetchErr };
        }

        if (!post) {
          return { data: null, error: { message: 'Post not found' } };
        }

        if (post.allow_tips === false) {
          return { data: null, error: { message: 'Tipping is disabled for this post' } };
        }

        const newTotal = (post.total_tips || 0) + amountCents;

        // 4) Update total_tips
        const { error: updateErr } = await supabase
          .from('racer_posts')
          .update({ total_tips: newTotal })
          .eq('id', postId);

        if (updateErr) {
          if (updateErr.message?.includes('Failed to fetch') && retries < maxRetries) {
            retries++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          return { data: null, error: updateErr };
        }

        return { data: { total_tips: newTotal }, error: null };
      } catch (err) {
        if (retries < maxRetries) {
          retries++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          continue;
        }
        return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error tipping post' } };
      }
    }

    return { data: null, error: { message: 'Failed to tip after multiple attempts' } };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error in tipPost' } };
  }
};

// Checks if a user has liked a post.
export const getPostLikers = async (postId: string, userId: string): Promise<{ data: { user_id: string } | null; error: any | null }> => {
  if (!postId || !userId) {
    console.error('getPostLikers called with invalid parameters');
    return { data: null, error: { message: 'Post ID and User ID are required' } };
  }

  return await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
};

// Adds a like to a post for a user.
export const likePost = async (postId: string, userId: string): Promise<{ error: any | null }> => {
  try {
    // First check if the like already exists to prevent duplicates
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Like already exists, no need to add again
      return { error: null };
    }

    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    
    if (error) {
      console.error('Error adding like:', error);
      throw error;
    }

    // Increment the likes count on the post using database function
    try {
      await supabase.rpc('increment_post_likes', { post_id_param: postId });
    } catch (rpcError) {
      console.warn('Failed to increment like count via RPC:', rpcError);
    }

    return { error: null };
  } catch (error) {
    console.error('Error in likePost:', error);
    return { error };
  }
};

// Removes a like from a post for a user.
export const unlikePost = async (postId: string, userId: string): Promise<{ error: any | null }> => {
  try {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .match({ post_id: postId, user_id: userId });
    
    if (error) {
      console.error('Error removing like:', error);
      throw error;
    }

    // Decrement the likes count on the post using database function
    try {
      await supabase.rpc('decrement_post_likes', { post_id_param: postId });
    } catch (rpcError) {
      console.warn('Failed to decrement like count via RPC:', rpcError);
    }

    return { error: null };
  } catch (error) {
    console.error('Error in unlikePost:', error);
    return { error };
  }
};

export const updatePost = async (postId: string, content: string): Promise<{ data: { id: string; content: string } | null; error: any | null }> => {
  const { error } = await supabase
    .from('racer_posts')
    .update({ content })
    .eq('id', postId);

  if (error) throw error;
  return { data: { id: postId, content }, error: null };
};

export const getAllPosts = async (): Promise<DatabasePost[]> => {
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      const { data, error } = await supabase
        .from('racer_posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          likes_count,
          visibility,
          profiles:user_id (
            id,
            name,
            avatar,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all posts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('Fetched all posts:', data);
        return data as DatabasePost[];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching posts (attempt ${retries + 1}):`, error);
      retries++;
      if (retries > maxRetries) {
        console.error('Max retries reached for fetching posts');
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  return [];
};

export const debugCheckRacerPosts = async (): Promise<{data: DatabasePost[] | null; error: any | null}> => {
  const { data, error } = await supabase
    .from('racer_posts')
    .select('id, user_type, visibility, likes_count, comments_count')
    .eq('user_type', 'racer')
    .limit(5);

  console.log('Racer posts:', data);
  return { data: data as DatabasePost[], error };
};