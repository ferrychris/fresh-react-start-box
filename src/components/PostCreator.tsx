import React, { useState } from 'react';
import { 
  Camera, 
  Video, 
  Type, 
  Image as ImageIcon, 
  Globe, 
  Users, 
  DollarSign, 
  X,
  Upload,
  Plus,
  FileVideo,
  Images
} from 'lucide-react';
import { createRacerPost, createFanPost, uploadImage, uploadVideo, getPublicUrl } from '../lib/supabase';
import { useApp } from '../App';

interface PostCreatorProps {
  racerId: string;
  onPostCreated: () => void;
  isTrack?: boolean;
  isFan?: boolean;
}

export const PostCreator: React.FC<PostCreatorProps> = ({ racerId, onPostCreated, isTrack = false, isFan = false }) => {
  const { user } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<'text' | 'photo' | 'video' | 'gallery'>('text');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'fans_only'>('public');
  const [allowTips, setAllowTips] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 5); // Limit to 5 files for better performance
    const newUrls: string[] = [];
    const newProgress: number[] = [];
    
    newFiles.forEach(file => {
      // Validate file size (100MB limit for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type.startsWith('video/') ? '100MB' : '10MB';
        alert(`File ${file.name} is too large. Maximum size is ${maxSizeMB}.`);
        return;
      }
      
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(`File ${file.name} is not supported. Please upload images or videos only.`);
        return;
      }
      
      // Validate video formats
      if (isVideo) {
        const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        if (!supportedVideoTypes.includes(file.type)) {
          alert(`Video format ${file.type} is not supported. Please use MP4, WebM, OGG, MOV, or AVI.`);
          return;
        }
      }
      
      const url = URL.createObjectURL(file);
      newUrls.push(url);
      newProgress.push(0);
    });
    
    setMediaFiles(prev => [...prev, ...newFiles]);
    setMediaUrls(prev => [...prev, ...newUrls]);
    setUploadProgress(prev => [...prev, ...newProgress]);
    
    // Determine post type based on content
    const totalFiles = mediaFiles.length + newFiles.length;
    const hasVideo = [...mediaFiles, ...newFiles].some(file => file.type.startsWith('video/'));
    
    if (hasVideo && totalFiles === 1) {
      setPostType('video');
    } else if (totalFiles > 1) {
      setPostType('gallery');
    } else if (totalFiles === 1) {
      setPostType('photo');
    }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaUrls[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
    
    const remainingFiles = mediaFiles.length - 1;
    if (remainingFiles === 0) {
      setPostType('text');
    } else if (remainingFiles === 1) {
      const remainingFile = mediaFiles.filter((_, i) => i !== index)[0];
      if (remainingFile?.type.startsWith('video/')) {
        setPostType('video');
      } else {
        setPostType('photo');
      }
    } else {
      setPostType('gallery');
    }
  };

  const simulateUpload = (fileIndex: number) => {
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[fileIndex] = Math.min(newProgress[fileIndex] + 10, 100);
        
        if (newProgress[fileIndex] >= 100) {
          clearInterval(interval);
        }
        
        return newProgress;
      });
    }, 200);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    
    setIsPosting(true);
    try {
      console.log('🚀 Starting post creation...');
      console.log('📊 Post data:', {
        racerId,
        contentLength: content.trim().length,
        mediaCount: mediaFiles.length,
        postType,
        visibility,
        allowTips
      });

      const uploadedUrls: string[] = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const isVideo = file.type.startsWith('video/');

        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[i] = 50; // Simulate progress
          return newProgress;
        });

        const uploadFn = isVideo ? uploadVideo : uploadImage;
        const result = await uploadFn(racerId, file);

        if (!result || !result.path) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const publicUrl = getPublicUrl(result.path);
        if (!publicUrl) {
          throw new Error(`Failed to get public URL for ${file.name}`);
        }

        uploadedUrls.push(publicUrl);

        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[i] = 100;
          return newProgress;
        });
      }

      console.log('📤 Creating post with data:', {
        user_id: racerId,
        content: content.trim(),
        media_urls: uploadedUrls,
        post_type: postType,
        visibility,
        allow_tips: allowTips
      });

      // Create the post based on user type
      if (isFan) {
        await createFanPost({
          fan_id: racerId,
          content: content.trim(),
          media_urls: uploadedUrls,
          post_type: postType,
          visibility: visibility === 'fans_only' ? 'community' : 'public'
        });
      } else if (isTrack) {
        await createRacerPost({
          racer_id: racerId,
          content: content.trim(),
          media_urls: uploadedUrls,
          post_type: postType,
          visibility,
          allow_tips: allowTips
        });
      } else {
        await createRacerPost({
          racer_id: racerId,
          content: content.trim(),
          media_urls: uploadedUrls,
          post_type: postType,
          visibility,
          allow_tips: allowTips
        });
      }

      console.log('✅ Post created successfully!');

      // Reset form
      setContent('');
      setMediaFiles([]);
      setMediaUrls([]);
      setUploadProgress([]);
      setPostType('text');
      setIsExpanded(false);
      setVisibility('public');
      setAllowTips(true);
      
      // Clean up object URLs
      mediaUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      onPostCreated();
      
      // Show success message
      alert(`✅ Post ${visibility === 'public' ? 'published publicly' : isFan ? 'shared with racing community' : 'shared with fans only'}!`);
    } catch (error) {
      console.error('Error creating post:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to create post. ';
      if (error instanceof Error) {
        errorMessage += error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        errorMessage += 'Unknown error occurred.';
        console.error('Unknown error:', error);
      }
      
      alert(errorMessage + '\n\nPlease check the console for more details and try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <FileVideo className="h-4 w-4 text-blue-400" />;
    }
    return <Camera className="h-4 w-4 text-green-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user || 
      (!isTrack && !isFan && user.type !== 'racer') || 
      (isTrack && user.type !== 'track') || 
      (isFan && user.type !== 'fan')) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 mb-6">
      {!isExpanded ? (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
        >
          <img
            src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
            alt={user.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 bg-gray-800 rounded-full px-3 sm:px-4 py-2 sm:py-3 text-gray-400 hover:bg-gray-700 transition-colors text-sm sm:text-base">
            {isTrack ? "What's new at your track?" : 
             isFan ? "Share your racing thoughts..." : 
             "What's happening in your racing world?"}
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{user.name}</h4>
                <p className="text-xs sm:text-sm text-gray-400">
                  {isTrack ? 'Share track update' : 
                   isFan ? 'Share with racing community' : 
                   'Create a post'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </button>
          </div>

          {/* Content Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isTrack ? "Share track news, event updates, or facility improvements..." :
              isFan ? "Share your racing thoughts, track experiences, or support for your favorite racers..." :
              "Share your racing journey, updates, or behind-the-scenes moments..."
            }
            className="w-full p-3 sm:p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange resize-none text-sm sm:text-base"
            rows={3}
          />

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaUrls.map((url, index) => {
                  const file = mediaFiles[index];
                  const isVideo = file?.type.startsWith('video/');
                  const progress = uploadProgress[index] || 0;
                  
                  return (
                    <div key={index} className="relative group">
                      <div className="relative">
                        {isVideo ? (
                          <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <FileVideo className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                              <p className="text-xs text-gray-400">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        
                        {/* Upload Progress */}
                        {isPosting && progress < 100 && (
                          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-xs text-white">{progress}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                      
                      {/* File type indicator */}
                      <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 flex items-center space-x-1">
                        {getFileTypeIcon(file)}
                        <span className="text-xs text-white">
                          {isVideo ? 'Video' : 'Photo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Media Summary */}
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">
                      {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-gray-400">
                      Type: {postType.charAt(0).toUpperCase() + postType.slice(1)}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    Total: {formatFileSize(mediaFiles.reduce((sum, file) => sum + file.size, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Media Upload Options */}
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
            <label className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex-shrink-0">
              <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
              <span className="text-xs sm:text-sm text-white">Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </label>
            
            <label className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex-shrink-0">
              <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              <span className="text-xs sm:text-sm text-white">Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </label>
            
            <label className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex-shrink-0">
              <Images className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
              <span className="text-xs sm:text-sm text-white">Gallery</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </label>
            
            <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
              Max 5 files, 100MB videos, 10MB images
            </div>
          </div>

          {/* Post Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              {/* Visibility */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">Visibility:</span>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'fans_only')}
                  className="bg-gray-700 border border-gray-600 rounded px-2 sm:px-3 py-1 text-white text-xs sm:text-sm min-w-0 flex-1 sm:flex-initial"
                >
                  <option value="public">🌍 Public (Everyone can see)</option>
                  <option value="fans_only">
                    {isTrack ? '👥 Followers Only' : 
                     isFan ? '👥 Racing Community Only' : 
                     '👥 Fans Only (Subscribers only)'}
                  </option>
                </select>
              </div>

              {/* Allow Tips */}
              {!isTrack && !isFan && (
                <label className="flex items-center space-x-1 sm:space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowTips}
                    onChange={(e) => setAllowTips(e.target.checked)}
                    className="w-3 h-3 sm:w-4 sm:h-4 text-fedex-orange bg-gray-700 border-gray-600 rounded focus:ring-fedex-orange flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">Allow tips</span>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </label>
              )}
            </div>

            {/* Post Button */}
            <button
              onClick={handleSubmit}
              disabled={isPosting || (!content.trim() && mediaUrls.length === 0)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isPosting ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  {visibility === 'public' ? <Globe className="h-3 w-3 sm:h-4 sm:w-4" /> : <Users className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span>Post {visibility === 'public' ? 'Publicly' : 
                    isTrack ? 'to Followers' : 
                    isFan ? 'to Racing Community' : 
                    'to Fans'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};