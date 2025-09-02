import React, { useState, useEffect } from 'react'
import LeaderBoard from './LeaderBoard'
import { CreatePost } from './CreatePost'
import PostsPanel from './PostsPanel'
import { Post, PostCreationPayload, transformDbPostToUIPost } from './types'
import { supabase } from '../../../lib/supabase/client'
import { getAllPublicPosts, createFanPost } from '../../../lib/supabase/posts'
import { uploadPostImage, uploadPostVideo, getPostPublicUrl } from '../../../lib/supabase/storage'
import { useUser } from '../../../contexts/UserContext'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Image, Video, MapPin } from 'lucide-react';

const IndexPost: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const { user } = useUser()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!supabase) {
        throw new Error('Database not configured')
      }
      
      const data = await getAllPublicPosts()
      
      if (!data || data.length === 0) {
        console.log('No fan posts found, showing empty state')
        setPosts([])
        return
      }
      
      // Safely transform posts with error handling for each post
      const transformedPosts: Post[] = data
        .map(post => {
          try {
            return transformDbPostToUIPost(post)
          } catch (transformError) {
            console.error('Error transforming post:', transformError, post)
            return null
          }
        })
        .filter((post): post is Post => post !== null)
      
      setPosts(transformedPosts)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error fetching posts:', err)
      setError(errorMessage || 'Failed to load posts')
      // Set empty posts array on error to avoid undefined state
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (payload: PostCreationPayload) => {
    if (!user?.id) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Initialize media URLs array
      const mediaUrls: string[] = [];
      
      // Upload media files if provided
      if (payload.mediaFiles.length > 0 && payload.mediaType) {
        try {
          for (const file of payload.mediaFiles) {
            const result = payload.mediaType === 'video'
              ? await uploadPostVideo(user.id, file)
              : await uploadPostImage(user.id, file);

            // Handle helper error shape
            if ((result as any)?.error) {
              const err = (result as any).error;
              console.error('Error uploading media:', err);
              toast.error(`Failed to upload media: ${err?.message || 'Unknown error'}`);
              continue;
            }

            const path = (result as any)?.path || (result as any)?.data?.path || (result as any)?.fullPath || (result as any)?.Key;
            if (!path) {
              console.error('Upload returned without a path:', result);
              toast.error('Failed to determine uploaded media path');
              continue;
            }

            const mediaUrl = getPostPublicUrl(path);
            if (!mediaUrl) {
              console.error('Failed to get public URL for path:', path);
              toast.error('Failed to get public URL for uploaded media');
              continue;
            }

            mediaUrls.push(mediaUrl);
          }

          if (mediaUrls.length > 0) {
            toast.success(`${mediaUrls.length} file${mediaUrls.length > 1 ? 's' : ''} uploaded successfully`);
          } else {
            toast.error('No files were uploaded successfully');
            return;
          }
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          toast.error(`Failed to upload media: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          return;
        }
      }
      
      // Determine post type based on media files
      let postType: 'text' | 'photo' | 'video' | 'gallery' = 'text';
      
      if (mediaUrls.length > 0) {
        if (payload.mediaType === 'photo') {
          postType = mediaUrls.length > 1 ? 'gallery' : 'photo';
        } else if (payload.mediaType === 'video') {
          postType = 'video';
        }
      }
      
      // Create the post
      const newPost = await createFanPost({
        content: payload.content,
        fan_id: user.id, // Use fan_id instead of user_id to match the expected type
        media_urls: mediaUrls,
        post_type: postType,
        visibility: payload.visibility,
      });
      
      if (newPost) {
        // Create a Post object from the newly created post
        const newUiPost: Post = {
          id: (newPost as any).id || Date.now().toString(),
          userId: user.id,
          userType: 'FAN',
          userName: user.name || 'Fan',
          userAvatar: user.avatar || '',
          userVerified: false,
          content: payload.content,
          mediaUrls: mediaUrls,
          mediaType: postType === 'photo' ? 'image' : postType === 'video' ? 'video' : postType === 'gallery' ? 'gallery' : undefined,
          timestamp: new Date().toLocaleString(),
          updated_at: new Date().toISOString(),
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
        };
        
        // Add the new post to the beginning of the posts list
        setPosts([newUiPost, ...posts]);
        
        // Close the modal after successful post creation
        setShowCreatePostModal(false);
        
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Create Post Modal */}
      {showCreatePostModal && (
        <CreatePost 
          onClose={() => setShowCreatePostModal(false)} 
          onPostCreated={(post) => {
            // The post from CreatePost is already in the correct format
            setPosts([post, ...posts]);
          }} 
        />
      )}
      
      {/* Right-side LeaderBoard (fixed position) */}
      <div className="hidden lg:block lg:absolute lg:right-0 lg:top-0 lg:w-72 xl:w-80">
        <div className="sticky top-4">
          <LeaderBoard />
        </div>
      </div>
      
      {/* Main content with right margin to make space for LeaderBoard */}
      <div className="lg:mr-80 xl:mr-96 space-y-6">
        {/* Create Post Button */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-300 text-left cursor-pointer" onClick={() => setShowCreatePostModal(true)}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <span className="text-slate-400">+</span>
                </div>
              )}
            </div>
            <span className="text-slate-400">Share your racing thoughts...</span>
          </div>
        </div>
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
            <button 
              onClick={fetchPosts}
              className="ml-2 underline hover:text-red-400"
            >
              Retry
            </button>
          </div>
        )}
        <PostsPanel 
          posts={posts}
          showComposer={false} 
          onCreatePost={(post: Post, payload?: PostCreationPayload) => {
            // If payload is provided from CreatePost component, use it directly
            if (payload) {
              handleCreatePost(payload);
              return;
            }
            
            // Otherwise, create a payload from the Post object (backward compatibility)
            const newPayload: PostCreationPayload = {
              content: post.content,
              mediaFiles: [],
              mediaType: null,
              visibility: 'public' // Default visibility
            };
            handleCreatePost(newPayload);
          }}
          loading={loading}
        />
      </div>
      
      {/* Mobile LeaderBoard (shown below posts on small screens) */}
      <div className="mt-6 lg:hidden">
        <LeaderBoard />
      </div>
    </div>
  )
}

export default IndexPost
