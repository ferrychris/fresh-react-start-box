import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Video, Globe, Users, MapPin, Calendar, Upload, Trash2, Smile } from 'lucide-react';
import { Post, PostCreationPayload } from './types';
import { createFanPost } from '../../../lib/supabase';
import {
  uploadPostImage,
  uploadPostVideo,
  getPostPublicUrl,
  uploadFanPostImage,
  uploadFanPostVideo,
  getFanPostPublicUrl,
} from '../../../lib/supabase/storage';
import { ExtendedUser } from '../../../lib/supabase/types';
import { useUser } from '../../../contexts/UserContext';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  autoOpen?: 'media' | 'feeling' | null;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated, autoOpen = null }) => {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'community'>('public');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; label: string } | null>(null);

  useEffect(() => {
    if (autoOpen === 'media') {
      // Slight delay to allow modal to render
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 0);
    } else if (autoOpen === 'feeling') {
      setShowFeelingPicker(true);
    }
  }, [autoOpen]);

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
      let uploadError = false;

      for (const file of selectedFiles) {
        const isVideo = file.type.startsWith('video/');
        const isFan = user?.user_type === 'fan';

        let result;
        if (isVideo) {
          result = isFan ? await uploadFanPostVideo(user.id, file) : await uploadPostVideo(user.id, file);
        } else {
          result = isFan ? await uploadFanPostImage(user.id, file) : await uploadPostImage(user.id, file);
        }

        if (result?.error) {
          console.error('Error uploading file:', result.error);
          alert(`Error uploading ${isVideo ? 'video' : 'image'}: ${result.error.message || 'Unknown error'}`);
          uploadError = true;
          break;
        }

        if (result?.path) {
          const publicUrl = (isFan ? getFanPostPublicUrl : getPostPublicUrl)(result.path);
          if (publicUrl) {
            uploadedUrls.push(publicUrl);
          }
        }
      }

      if (uploadError) {
        setIsSubmitting(false);
        return;
      }

      // Determine post type
      let postType = 'text';
      if (selectedFiles.length > 0) {
        const hasVideo = selectedFiles.some((file) => file.type.startsWith('video/'));
        if (hasVideo) {
          postType = 'video';
        } else {
          postType = selectedFiles.length > 1 ? 'gallery' : 'photo';
        }
      }

      const composedContent = (() => {
        if (selectedFeeling) {
          return `is feeling ${selectedFeeling.label} ${selectedFeeling.emoji}${content.trim() ? ' — ' + content.trim() : ''}`;
        }
        return content.trim();
      })();

      // Create the fan post
      const { error: postError } = await createFanPost({
        fan_id: user.id,
        content: composedContent,
        media_urls: uploadedUrls,
        post_type: postType,
        visibility: visibility,
      });

      if (postError) {
        console.error('Error creating post:', postError);
        alert(`Failed to create post: ${postError.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }

      // Create mock post for immediate UI update
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name || 'Fan',
        userAvatar: user.avatar || '',
        userType: 'FAN',
        userVerified: false,
        content: composedContent,
        mediaUrls: uploadedUrls,
        timestamp: new Date().toLocaleDateString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        updated_at: new Date().toISOString(),
      };

      onPostCreated(newPost);
      onClose();

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setMediaType(null);
      setLocation('');
      setEventDate('');
      setSelectedFeeling(null);
      setShowFeelingPicker(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 pt-16">
      <div className="bg-slate-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-300 text-xl font-semibold">{user?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
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
                {selectedFeeling && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                    <span className="mr-1">{selectedFeeling.emoji}</span>
                    <span>feeling {selectedFeeling.label}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeling(null)}
                      className="ml-2 text-slate-400 hover:text-white"
                      aria-label="Clear feeling"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
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
              <div className="relative flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300 text-sm font-medium">Add to your post</span>
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    title="Photo/Video"
                  >
                    <Image className="h-5 w-5 text-green-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeelingPicker((s) => !s)}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    title="Feeling/Activity"
                  >
                    <Smile className="h-5 w-5 text-yellow-400" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    title="Tag location"
                  >
                    <MapPin className="h-5 w-5 text-red-500" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
                  className="px-6 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-sm"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>

                {/* Feeling Picker */}
                {showFeelingPicker && (
                  <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-slate-300 text-sm mb-2">How are you feeling?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { emoji: '😊', label: 'happy' },
                        { emoji: '😢', label: 'sad' },
                        { emoji: '😡', label: 'angry' },
                        { emoji: '😴', label: 'sleepy' },
                        { emoji: '🤩', label: 'excited' },
                        { emoji: '🤒', label: 'sick' },
                      ].map((f) => (
                        <button
                          key={f.label}
                          type="button"
                          onClick={() => {
                            setSelectedFeeling(f);
                            setShowFeelingPicker(false);
                          }}
                          className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
                            selectedFeeling?.label === f.label ? 'bg-slate-700 border-slate-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-lg">{f.emoji}</span>
                          <span className="text-slate-300 capitalize text-sm">{f.label}</span>
                        </button>
                      ))}
                    </div>
                    {selectedFeeling && (
                      <div className="mt-2 text-slate-400 text-sm">
                        Selected: <span className="text-slate-200">{selectedFeeling.emoji} feeling {selectedFeeling.label}</span>
                      </div>
                    )}
                  </div>
                )}
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
