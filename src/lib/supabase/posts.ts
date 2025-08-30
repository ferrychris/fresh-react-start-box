import { supabase } from './client';
import { DatabasePost, PostComment } from './types';

export const getPostsForRacer = async (racerId: string): Promise<{ data: DatabasePost[]; error: any | null }> => {
    // Validate required fields
    if (!racerId) {
        console.error('getPostsForRacer called without a valid racerId');
        return { data: [], error: { message: 'Racer ID is required' } };
    }
    
    // Add retry logic for network issues
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id, created_at, content, media_url, media_type,
                    racer:racers ( id, username, profile_photo_url )
                `)
                .eq('racer_id', racerId)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
                    console.warn(`Network error fetching posts for racer, retrying... (${retries + 1}/${maxRetries})`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
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
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
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

export const getFanPosts = async (): Promise<any[]> => {
  // Check if we have a valid session first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('No active session found when fetching posts');
    // Continue anyway as posts might be public
  }

  // Implement retry logic
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      // Fetch fan posts with profile data
      const { data: fanPosts, error: fanError } = await supabase
        .from('fan_posts')
        .select(`
          id,
          created_at,
          content,
          media_urls,
          post_type,
          likes_count,
          comments_count,
          fan_id
        `)
        .order('created_at', { ascending: false })
        .limit(25);

      // Fetch racer posts with profile data  
      const { data: racerPosts, error: racerError } = await supabase
        .from('racer_posts')
        .select(`
          id,
          created_at,
          content,
          media_urls,
          post_type,
          likes_count,
          comments_count,
          racer_id,
          total_tips,
          allow_tips
        `)
        .order('created_at', { ascending: false })
        .limit(25);

      // If both queries fail, retry or return empty array
      if (fanError && racerError) {
        if (retries < maxRetries && 
            ((fanError.message?.includes('Failed to fetch') || racerError.message?.includes('Failed to fetch')))) {
          console.warn(`Network error fetching posts, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error fetching posts:', fanError, racerError);
        return [];
      }

      // Get user profiles for author information with error handling
      const fanIds = (fanPosts || []).map(post => post.fan_id).filter(Boolean);
      const racerIds = (racerPosts || []).map(post => post.racer_id).filter(Boolean);
      
      let fanProfiles = [];
      let racerProfiles = [];
      
      if (fanIds.length > 0) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, avatar, user_type')
          .in('id', fanIds);
          
        if (error) {
          console.error('Error fetching fan profiles:', error);
        } else {
          fanProfiles = profiles || [];
        }
      }
        
      if (racerIds.length > 0) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, avatar, user_type')
          .in('id', racerIds);
          
        if (error) {
          console.error('Error fetching racer profiles:', error);
        } else {
          racerProfiles = profiles || [];
        }
      }

      // Create lookup maps with null checks
      const fanProfileMap = (fanProfiles || []).reduce((acc, profile) => {
        if (profile && profile.id) {
          acc[profile.id] = profile;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const racerProfileMap = (racerProfiles || []).reduce((acc, profile) => {
        if (profile && profile.id) {
          acc[profile.id] = profile;
        }
        return acc;
      }, {} as Record<string, any>);

      // Combine and sort posts by creation date with defensive coding
      const allPosts = [
        ...(fanPosts || []).map(post => ({
          ...post,
          author_type: 'fan' as const,
          author: {
            name: post.fan_id && fanProfileMap[post.fan_id]?.name || 'Fan User',
            avatar: post.fan_id && fanProfileMap[post.fan_id]?.avatar || '',
            user_type: 'fan'
          }
        })),
        ...(racerPosts || []).map(post => ({
          ...post,
          author_type: 'racer' as const,
          author: {
            name: post.racer_id && racerProfileMap[post.racer_id]?.name || 'Racer',
            avatar: post.racer_id && racerProfileMap[post.racer_id]?.avatar || '',
            user_type: 'racer'
          }
        }))
      ]
      .filter(post => post !== null && typeof post === 'object')
      .sort((a, b) => {
        // Defensive date comparison
        try {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        } catch (e) {
          return 0;
        }
      })
      .slice(0, 50);

      return allPosts;
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error fetching posts, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
        continue;
      }
      
      console.error('Error fetching posts:', error);
      return [];
    }
  }
  
  return []; // Fallback if all retries fail
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
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error fetching comments:', error);
        return [];
      }

      // Process comments with defensive coding
      return (comments || []).map(comment => {
        try {
          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.comment_text || '',
            comment_text: comment.comment_text || '',
            created_at: comment.created_at,
            user: {
              name: comment.profiles?.name || 'User',
              avatar: comment.profiles?.avatar_url || comment.profiles?.avatar || ''
            }
          };
        } catch (err) {
          console.error('Error processing comment:', err);
          // Return a minimal valid comment object if processing fails
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
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
        continue;
      }
      
      console.error('Error fetching comments:', error);
      return [];
    }
  }
  
  return []; // Fallback if all retries fail
};

// Alias for getCommentsForPost to maintain compatibility with PostCard.tsx
export const getPostComments = getCommentsForPost;

export const addCommentToPost = async (
  postId: string,
  userId: string,
  commentText: string
): Promise<{ data: PostComment | null; error: Error | null }> => {
  // Input validation
  if (!postId || !userId || !commentText?.trim()) {
    console.error('addCommentToPost called with invalid parameters', { postId, userId, commentText });
    return { 
      data: null, 
      error: new Error('Missing required parameters: postId, userId, and commentText are required') 
    };
  }

  // Check if we have a valid session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session when attempting to add comment');
    return { 
      data: null, 
      error: new Error('Authentication required to add comments') 
    };
  }

  // Verify the user is adding a comment as themselves
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
      // Add the comment
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
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error adding comment:', error);
        return { data: null, error };
      }

      // Process the returned comment with defensive coding
      try {
        const comment: PostComment = {
          id: data.id,
          post_id: data.post_id,
          user_id: data.user_id,
          content: data.comment_text,
          comment_text: data.comment_text,
          created_at: data.created_at,
          user: {
            name: data.profiles?.name || 'User',
            avatar: data.profiles?.avatar_url || data.profiles?.avatar || ''
          }
        };

        // Increment the comments count for the post
        try {
          // Determine if it's a fan post or racer post
          const { data: fanPost } = await supabase
            .from('fan_posts')
            .select('id')
            .eq('id', postId)
            .single();

          if (fanPost) {
            await supabase
              .from('fan_posts')
              .update({ comments_count: supabase.rpc('increment') })
              .eq('id', postId);
          } else {
            await supabase
              .from('racer_posts')
              .update({ comments_count: supabase.rpc('increment') })
              .eq('id', postId);
          }
        } catch (updateError) {
          // Log but don't fail the operation if comment count update fails
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
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
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
  // Input validation
  if (!postId || !userId) {
    console.error('togglePostLike called with invalid parameters', { postId, userId });
    return { 
      liked: false, 
      error: new Error('Missing required parameters: postId and userId are required') 
    };
  }

  // Check if we have a valid session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session when attempting to toggle like');
    return { 
      liked: false, 
      error: new Error('Authentication required to like posts') 
    };
  }

  // Verify the user is liking as themselves
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
      // Check if the user has already liked the post
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
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error checking like status:', checkError);
        return { liked: false, error: new Error(checkError.message) };
      }

      let liked = false;
      
      // If like exists, remove it (unlike)
      if (existingLike) {
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) {
          if (retries < maxRetries && unlikeError.message?.includes('Failed to fetch')) {
            console.warn(`Network error unliking post, retrying... (${retries + 1}/${maxRetries})`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
            continue;
          }
          
          console.error('Error unliking post:', unlikeError);
          return { liked: false, error: new Error(unlikeError.message) };
        }
        
        liked = false;
      } 
      // Otherwise, add a new like
      else {
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
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
            continue;
          }
          
          console.error('Error liking post:', likeError);
          return { liked: false, error: new Error(likeError.message) };
        }
        
        liked = true;
      }

      // Update the likes count on the post
      try {
        // Determine if it's a fan post or racer post
        const { data: fanPost } = await supabase
          .from('fan_posts')
          .select('id')
          .eq('id', postId)
          .single();

        if (fanPost) {
          await supabase
            .from('fan_posts')
            .update({ 
              likes_count: supabase.rpc(liked ? 'increment' : 'decrement') 
            })
            .eq('id', postId);
        } else {
          await supabase
            .from('racer_posts')
            .update({ 
              likes_count: supabase.rpc(liked ? 'increment' : 'decrement') 
            })
            .eq('id', postId);
        }
      } catch (updateError) {
        // Log but don't fail the operation if like count update fails
        console.warn('Failed to update like count:', updateError);
      }

      return { liked, error: null };
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`Unexpected error toggling like, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
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

export const createRacerPost = async (post: { 
  racer_id: string; 
  content: string; 
  media_urls: string[]; 
  post_type: string; 
  visibility: string; 
  allow_tips: boolean; 
}): Promise<{ data: any | null; error: any | null }> => {
    try {
        // Validate required fields
        if (!post.racer_id) {
            return { data: null, error: { message: 'Racer ID is required' } };
        }
        
        // Check if we have a valid session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { data: null, error: { message: 'Authentication required to create posts' } };
        }
        
        // Ensure the authenticated user matches the racer_id
        if (session.user.id !== post.racer_id) {
            return { data: null, error: { message: 'You can only create posts for your own account' } };
        }
        
        // Create the post with retry logic
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                const { data, error } = await supabase.from('racer_posts').insert([post]).select();
                
                if (error) {
                    if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
                        console.warn(`Network error creating racer post, retrying... (${retries + 1}/${maxRetries})`);
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
                        continue;
                    }
                    
                    console.error('Error creating racer post:', error);
                    return { data: null, error };
                }
                
                return { data, error: null };
            } catch (err) {
                if (retries < maxRetries - 1) {
                    console.warn(`Unexpected error creating racer post, retrying... (${retries + 1}/${maxRetries})`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
                    continue;
                }
                
                console.error('Exception creating racer post:', err);
                return { 
                  data: null, 
                  error: { message: err instanceof Error ? err.message : 'Unknown error creating racer post' } 
                };
            }
        }
        
        return { data: null, error: { message: 'Maximum retries reached while creating racer post' } };
    } catch (err) {
        console.error('Unhandled exception in createRacerPost:', err);
        return { 
          data: null, 
          error: { message: err instanceof Error ? err.message : 'Unknown error creating racer post' } 
        };
    }
};

export const createFanPost = async (post: { fan_id: string; content: string; media_urls: string[]; post_type: string; visibility: string; }) => {
    try {
        // Validate required fields
        if (!post.fan_id) {
            return { error: { message: 'Fan ID is required' } };
        }
        
        // Check if we have a valid session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { error: { message: 'Authentication required to create posts' } };
        }
        
        // Ensure the authenticated user matches the fan_id
        if (session.user.id !== post.fan_id) {
            return { error: { message: 'You can only create posts for your own account' } };
        }
        
        // Create the post with retry logic
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                const { data, error } = await supabase.from('fan_posts').insert([post]);
                
                if (error) {
                    if (error.message?.includes('Failed to fetch') && retries < maxRetries - 1) {
                        console.warn(`Network error creating post, retrying... (${retries + 1}/${maxRetries})`);
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                        continue;
                    }
                    
                    console.error('Error creating fan post:', error);
                    return { error };
                }
                
                return { data, error: null };
            } catch (err) {
                if (retries < maxRetries - 1) {
                    console.warn(`Unexpected error creating post, retrying... (${retries + 1}/${maxRetries})`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                    continue;
                }
                
                console.error('Exception creating fan post:', err);
                return { error: { message: err instanceof Error ? err.message : 'Unknown error creating post' } };
            }
        }
        
        return { error: { message: 'Maximum retries reached while creating post' } };
    } catch (err) {
        console.error('Unhandled exception in createFanPost:', err);
        return { error: { message: err instanceof Error ? err.message : 'Unknown error creating post' } };
    }
};
