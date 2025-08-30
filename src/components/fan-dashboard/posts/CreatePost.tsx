import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Video, Send, MapPin, Calendar } from 'lucide-react';
import { useUser, User } from '../../../contexts/UserContext';
import { Post, PostCreationPayload } from './types';

// Extended User interface to include properties used in this component
interface ExtendedUser extends User {
  role?: string;
  user_type?: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  avatar?: string;
  verified?: boolean;
  trackName?: string;
  seriesName?: string;
  carNumber?: string;
}

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: (post: Post, payload?: PostCreationPayload) => void;
}

// PostCreationPayload is now imported from types.ts

// File upload is handled in indexpost.tsx

const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  const { user: baseUser } = useUser();
  // Cast to extended user type
  const user = baseUser as ExtendedUser | null;
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file types
      const validFiles = newFiles.filter(file => {
        if (type === 'image') {
          return file.type.startsWith('image/');
        } else {
          return file.type.startsWith('video/');
        }
      });
      
      if (validFiles.length !== newFiles.length) {
        alert(`Some files were skipped. Please select only ${type} files.`);
      }
      
      // Add to existing files (allow multiple)
      setMediaFiles(prev => [...prev, ...validFiles]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);

    try {
      // Determine media type based on files
      let mediaType: 'photo' | 'video' | null = null;
      if (mediaFiles.length > 0) {
        // Check if all files are of the same type
        const isAllImages = mediaFiles.every(file => file.type.startsWith('image/'));
        const isAllVideos = mediaFiles.every(file => file.type.startsWith('video/'));
        
        if (isAllImages) {
          mediaType = 'photo';
        } else if (isAllVideos) {
          mediaType = 'video';
        } else {
          // Mixed content - default to photo
          mediaType = 'photo';
        }
      }

      // Create payload for post creation with all necessary data for upload
      const payload: PostCreationPayload = {
        content: content.trim(),
        mediaFiles: mediaFiles,
        mediaType: mediaType,
        visibility: 'public', // Default to public
        location: location.trim() || undefined,
        eventDate: eventDate || undefined
      };

      // Create post object for preview in the UI
      const newPost: Post = {
        id: `post-${Date.now()}`,
        userId: user?.id || '',
        userType: (user?.role || user?.user_type || '') as 'RACER' | 'TRACK' | 'SERIES' | 'FAN',
        userName: user?.name || user?.trackName || user?.seriesName || '',
        userAvatar: user?.avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
        userVerified: user?.verified || false,
        content: content.trim(),
        mediaUrls: [], // Will be populated after upload
        mediaType: mediaType === 'photo' ? 'image' : mediaType === 'video' ? 'video' : undefined,
        carNumber: user?.carNumber,
        location: location.trim() || undefined,
        eventDate: eventDate || undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        timestamp: 'now'
      };

      // Pass both the post preview and the payload to the parent component
      // The post preview is for UI display, while the payload contains the actual data for upload
      onPostCreated(newPost, payload);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getPlaceholderText = () => {
    const userRole = user?.role || user?.user_type;
    switch (userRole) {
      case 'RACER':
        return "Share your racing updates, behind-the-scenes moments, or upcoming races...";
      case 'TRACK':
        return "Announce upcoming events, track updates, or facility news...";
      case 'SERIES':
        return "Share championship updates, race results, or series announcements...";
      case 'FAN':
        return "Share your thoughts about racing, support your favorite drivers...";
      default:
        return "What's happening in racing?";
    }
  };

  const getUserTypeColor = () => {
    const userRole = user?.role || user?.user_type;
    switch (userRole) {
      case 'RACER': return 'text-orange-500';
      case 'TRACK': return 'text-blue-500';
      case 'SERIES': return 'text-purple-500';
      case 'FAN': return 'text-green-500';
      default: return 'text-slate-500';
    }
  };

  const getUserTypeLabel = () => {
    const userRole = user?.role || user?.user_type;
    switch (userRole) {
      case 'RACER': return 'Racer';
      case 'TRACK': return 'Track';
      case 'SERIES': return 'Series';
      case 'FAN': return 'Fan';
      default: return 'User';
    }
  };

  // Handle ESC key press and click outside to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleClickOutside);

    // Focus trap and prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 lg:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user.avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2'}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white text-sm">
                  {user.name || user.trackName || user.seriesName}
                </span>
                {user.verified && (
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium ${getUserTypeColor()}`}>
                {getUserTypeLabel()}
                {(user?.role === 'RACER' || user?.user_type === 'RACER') && user?.carNumber && ` #${user.carNumber}`}
              </span>
            </div>
          </div>

          {/* Content Input */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholderText()}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm transition-all duration-200"
              rows={3}
              maxLength={2000}
            />
            <div className="flex justify-end items-center mt-2">
              <span className="text-xs text-slate-500">
                {content.length}/2000 characters
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 cursor-pointer border border-slate-700 hover:border-slate-600">
                <Image className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleMediaUpload(e, 'image')}
                  className="hidden"
                />
              </label>
              <label className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 cursor-pointer border border-slate-700 hover:border-slate-600">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Add Videos</span>
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => handleMediaUpload(e, 'video')}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-xs font-medium">
                    {mediaFiles.length} file{mediaFiles.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setMediaFiles([])}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Clear all
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="flex items-center space-x-2 p-2 bg-slate-700 rounded-lg">
                        <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center flex-shrink-0">
                          {file.type.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs truncate">{file.name}</p>
                          <p className="text-slate-400 text-xs">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-sm font-medium">Uploading files...</span>
                  <span className="text-blue-400 text-sm">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Fields */}

          {/* Track/Series Specific Fields */}
          {((user?.role === 'TRACK' || user?.role === 'SERIES') || (user?.user_type === 'TRACK' || user?.user_type === 'SERIES')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 text-sm"
                    placeholder="Charlotte Motor Speedway"
                  />
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Event Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 hover:text-white transition-all duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting || isUploading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>
                {isUploading ? 'Uploading...' : isSubmitting ? 'Posting...' : 'Post'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;