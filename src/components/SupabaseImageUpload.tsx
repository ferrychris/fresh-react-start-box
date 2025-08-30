import React, { useState, useRef } from 'react';
import { Upload, User, Image } from 'lucide-react';
import { supabase, uploadImage, saveImageToAvatarsTable } from '../lib/supabase';

interface SupabaseImageUploadProps {
  type: 'avatar' | 'banner';
  currentImage?: string;
  userId: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
  context?: 'racer' | 'track' | 'series' | 'fan';
  titleOverride?: string;
  descriptionOverride?: string;
  placeholderOverride?: string;
}

export const SupabaseImageUpload: React.FC<SupabaseImageUploadProps> = ({
  type,
  currentImage,
  userId,
  onImageChange,
  className = '',
  context = 'racer',
  titleOverride,
  descriptionOverride,
  placeholderOverride
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAvatar = type === 'avatar';
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Get context-specific text
  const getUploadText = () => {
    if (isAvatar) {
      switch (context) {
        case 'track':
          return {
            title: 'Track Logo',
            description: 'Your track\'s official logo',
            placeholder: 'Track Logo'
          };
        case 'series':
          return {
            title: 'Series Logo',
            description: 'Your series official logo',
            placeholder: 'Series Logo'
          };
        case 'fan':
          return {
            title: 'Profile Photo',
            description: 'Your profile picture',
            placeholder: 'Profile Photo'
          };
        default: // racer
          return {
            title: 'Profile Photo',
            description: 'Your main profile picture',
            placeholder: 'Profile Photo'
          };
      }
    } else {
      switch (context) {
        case 'track':
          return {
            title: 'Track Banner',
            description: 'Showcase your track facility',
            placeholder: 'Track Banner'
          };
        case 'series':
          return {
            title: 'Series Banner',
            description: 'Showcase your series',
            placeholder: 'Series Banner'
          };
        case 'fan':
          return {
            title: 'Cover Photo',
            description: 'Your cover photo',
            placeholder: 'Cover Photo'
          };
        default: // racer
          return {
            title: 'Cover Banner',
            description: 'Showcase your car or team',
            placeholder: 'Banner Photo'
          };
      }
    }
  };

  const baseText = getUploadText();
  const uploadText = {
    title: titleOverride ?? baseText.title,
    description: descriptionOverride ?? baseText.description,
    placeholder: placeholderOverride ?? baseText.placeholder,
  };

  const titleSizeClass = titleOverride ? 'text-xs' : 'text-sm';

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToSupabase(file);
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Error uploading ${type}. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    // Validate userId before proceeding
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required for image upload');
    }

    const folderPath = isAvatar ? `avatars/${userId}` : `banners/${userId}`;
    const { url, error } = await uploadImage(file, 'avatars', folderPath);
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Save to avatars table
    try {
      // First, check if profile exists and create it if it doesn't
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Warning: Failed to check profile:', profileError);
      } else if (!existingProfile) {
        console.log('⚠️ Profile not found, creating basic profile for image upload...');
        // Create a basic profile so we can save the image
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            user_type: 'racer', // Default type
            name: 'User',
            email: 'user@example.com', // This will be updated later
            profile_complete: false
          }]);

        if (createError) {
          console.warn('Warning: Failed to create profile for image upload:', createError);
        } else {
          console.log('✅ Basic profile created for image upload');
        }
      }

      const { error: dbError } = await saveImageToAvatarsTable(
        userId,
        url,
        isAvatar ? 'avatar' : 'banner',
        file.name
      );

      if (dbError) {
        console.warn('Warning: Failed to save to avatars table:', dbError);
        // Don't throw error here as the upload was successful
      }
    } catch (avatarsError) {
      console.warn('Warning: Avatars table not available:', avatarsError);
      // Continue with upload even if avatars table fails
    }

    return url;
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/jpeg,image/jpg,image/png,image/webp" 
        onChange={handleFileInputChange} 
        className="hidden" 
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed transition-all cursor-pointer group overflow-hidden ${
          isAvatar ? 'rounded-2xl aspect-square' : 'rounded-2xl aspect-[3/1]'
        } ${
          isDragging 
            ? 'border-fedex-orange bg-fedex-orange/10 shadow-lg scale-105' 
            : 'border-gray-600 hover:border-fedex-orange hover:bg-fedex-orange/5 hover:shadow-lg hover:scale-102'
        }`}
        onClick={openFileDialog}
      >
        {currentImage ? (
          <div className="relative w-full h-full">
            <img 
              src={currentImage} 
              alt={uploadText.title} 
              className={`w-full h-full object-cover ${
                isAvatar ? 'rounded-2xl' : 'rounded-2xl'
              }`} 
            />
            <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center ${
              isAvatar ? 'rounded-2xl' : 'rounded-2xl'
            }`}>
              <div className="text-center text-white p-4">
                <div className="w-12 h-12 bg-fedex-orange/90 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold mb-1">Change {uploadText.title}</p>
                <p className="text-xs opacity-80">Click or drag new image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-fedex-orange/20 to-fedex-orange/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {isAvatar ? (
                <User className="h-8 w-8 text-fedex-orange" />
              ) : (
                <Image className="h-8 w-8 text-fedex-orange" />
              )}
            </div>
            
            {/* Title */}
            <h3 className={`text-white ${titleSizeClass} font-bold mb-1 text-center leading-tight`}>
              {uploadText.title}
            </h3>
            
            {/* Description */}
            <p className="text-xs text-gray-300 mb-3 text-center max-w-xs leading-relaxed px-2">
              {uploadText.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full max-w-sm mx-auto mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-fedex-orange to-fedex-orange-dark hover:from-fedex-orange-dark hover:to-fedex-orange rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg text-sm"
              >
                <span className="flex items-center justify-center space-x-1 whitespace-nowrap">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Choose File</span>
                </span>
              </button>
              
              {/* Mobile camera button removed: external camera icon is used beside the card */}
            </div>
            
            {/* File Info */}
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1 font-medium">JPG, PNG, WebP • Max 5MB</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {isAvatar ? 'Square format recommended' : 'Wide format recommended (3:1 ratio)'}
              </p>
            </div>
          </div>
        )}
        
        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className={`absolute inset-0 bg-black/80 flex items-center justify-center ${
            isAvatar ? 'rounded-2xl' : 'rounded-2xl'
          }`}>
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-base font-bold text-white">Uploading...</p>
              <p className="text-sm text-gray-300">Please wait</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};