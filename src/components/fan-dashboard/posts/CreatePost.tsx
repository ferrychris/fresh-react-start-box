import React, { useState, useRef } from 'react';
import { X, Image, Video, Globe, Users, MapPin, Calendar, Upload, Trash2 } from 'lucide-react';
import { Post, PostCreationPayload } from './types';
import { createFanPost } from '../../../lib/supabase';
import { uploadPostImage, uploadPostVideo, getPostPublicUrl } from '../../../lib/supabase/storage';
import { ExtendedUser } from '../../../lib/supabase/types';
import { useUser } from '../../../contexts/UserContext';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

// Make ExtendedUser compatible with User from App context
interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'racer' | 'fan' | 'track' | 'series';
  avatar?: string;
  banner_image?: string;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'community'>('public');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const firstFile = files[0];
    const isVideo = firstFile.type.startsWith('video/');
    const isImage = firstFile.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please select only image or video files');
      return;
    }

    if (isVideo && files.length > 1) {
      alert('Please select only one video file');
      return;
    }

    if (isImage && files.length > 5) {
      alert('Please select up to 5 images');
      return;
    }

    setSelectedFiles(files);
    setMediaType(isVideo ? 'video' : 'photo');
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    if (!user) {
      alert('You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload media files first
      const uploadedUrls: string[] = [];
      
      for (const file of selectedFiles) {
        const isVideo = file.type.startsWith('video/');
        
        let result;
        if (isVideo) {
          result = await uploadPostVideo(user.id, file);
        } else {
          result = await uploadPostImage(user.id, file);
        }
        
        if (result?.path) {
          const publicUrl = getPostPublicUrl(result.path);
          if (publicUrl) {
            uploadedUrls.push(publicUrl);
          }
        }
      }

      // Determine post type
      let postType = 'text';
      if (selectedFiles.length > 0) {
        const hasVideo = selectedFiles.some(file => file.type.startsWith('video/'));
        if (hasVideo) {
          postType = 'video';
        } else {
          postType = selectedFiles.length > 1 ? 'gallery' : 'photo';
        }
      }

      // Create the fan post
      await createFanPost({
        fan_id: user.id,
        content: content.trim(),
        media_urls: uploadedUrls,
        post_type: postType,
        visibility: visibility
      });

      // Create mock post for immediate UI update
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name || 'Fan',
        userAvatar: user.avatar || '',
        userType: 'FAN',
        userVerified: false,
        content: content.trim(),
        mediaUrls: uploadedUrls,
        timestamp: new Date().toLocaleDateString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
      };

      onPostCreated(newPost);
      onClose();
      
      // Reset form
      setContent('');
      setSelectedFiles([]);
      setMediaType(null);
      setLocation('');
      setEventDate('');
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header - Facebook Style */}
        <div className="flex items-center justify-center relative p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-300 text-xl font-semibold">{user?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name || 'User'}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700"
                  >
                    {visibility === 'public' ? (
                      <Globe className="h-3 w-3 text-slate-300" />
                    ) : (
                      <Users className="h-3 w-3 text-slate-300" />
                    )}
                    <span className="text-slate-300">
                      {visibility === 'public' ? 'Public' : 'Racing Community'}
                    </span>
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind about racing?"
              className="w-full bg-transparent text-white placeholder-slate-400 text-base resize-none border-none outline-none min-h-[70px] py-1"
              maxLength={500}
            />

            {/* Media Preview - Facebook Style */}
            {selectedFiles.length > 0 && (
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <div className={`grid ${selectedFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative aspect-video">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Your Post - Facebook Style */}
            <div>
              <div className="flex items-center justify-between py-1 px-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <Image className="h-5 w-5 text-green-500" />
                  </button>
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <Video className="h-5 w-5 text-blue-500" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <MapPin className="h-5 w-5 text-red-500" />
                  </button>
                  <div className="h-6 border-r border-slate-700 mx-1"></div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
                    className="px-4 py-1.5 bg-fedex-orange hover:bg-fedex-orange-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-sm"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
