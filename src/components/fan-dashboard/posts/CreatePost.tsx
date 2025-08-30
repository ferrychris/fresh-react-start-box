import React, { useState, useRef } from 'react';
import { X, Image, Video, Globe, Users, MapPin, Calendar, Upload, Trash2 } from 'lucide-react';
import { Post, PostCreationPayload } from './types';
import { createFanPost, supabase } from '../../../lib/supabase';
import { ExtendedUser } from '../../../lib/supabase/types';

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

    setIsSubmitting(true);
    
    try {
      const payload: PostCreationPayload = {
        content: content.trim(),
        mediaFiles: selectedFiles,
        mediaType,
        visibility,
        location: location.trim() || undefined,
        eventDate: eventDate || undefined,
      };

      // Create mock post for immediate UI update
      const newPost: Post = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'You',
        userAvatar: '',
        userType: 'FAN',
        userVerified: false,
        content: content.trim(),
        mediaUrls: [],
        timestamp: new Date().toLocaleDateString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
      };

      onPostCreated(newPost);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Post Content */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in racing?"
              className="w-full bg-transparent text-white placeholder-slate-400 text-lg resize-none border-none outline-none min-h-[120px]"
              maxLength={500}
            />

            {/* Character Count */}
            <div className="text-right text-sm text-slate-400 mb-4">
              {content.length}/500
            </div>

            {/* Media Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location and Event Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:border-slate-600 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Who can see this?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'public'
                      ? 'bg-fedex-orange border-fedex-orange text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span>Everyone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('community')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'community'
                      ? 'bg-fedex-orange border-fedex-orange text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Racing Community</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between">
              {/* Media Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Image className="h-5 w-5" />
                  <span className="text-sm">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Video className="h-5 w-5" />
                  <span className="text-sm">Video</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
                className="px-6 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
