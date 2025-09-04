import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SupabaseImageUploadProps {
  type: 'avatar' | 'banner' | 'car' | 'post' | 'logo';
  currentImage?: string;
  userId: string;
  onImageChange: (url: string) => void;
  hidePreview?: boolean;
  maxSize?: number;
  className?: string;
}

export const SupabaseImageUpload = ({
  type,
  currentImage,
  userId,
  onImageChange,
  hidePreview = false,
  maxSize = 5,
  className = "",
}: SupabaseImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const getBucketName = (uploadType: string) => {
    switch (uploadType) {
      case 'avatar':
        return 'avatars';
      case 'banner':
        return 'profilebaner';
      case 'car':
        return 'car-photos';
      case 'post':
        return 'new_post';
      case 'logo':
        return 'avatars';
      default:
        return 'avatars';
    }
  };

  const uploadImage = useCallback(async (file: File) => {
    try {
      setUploading(true);

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({ title: 'File too large', description: `File size must be less than ${maxSize}MB` });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please select an image file' });
        return;
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Authentication required', description: 'Please log in to upload images' });
        return;
      }

      const bucket = getBucketName(type);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${type}_${Date.now()}.${fileExt}`;
      // For 'post' uploads, use a user-scoped storage path to satisfy RLS policies
      const filePath = type === 'post'
        ? `${userId}/posts/images/${fileName}`
        : fileName;

      console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);

      // Upload with better error handling and retry logic
      let uploadResult;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        uploadResult = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'application/octet-stream',
          });

        if (!uploadResult.error) break;
        
        if (attempt === maxRetries) {
          console.error('Upload error after retries:', uploadResult.error);
          toast({ 
            title: 'Upload failed', 
            description: uploadResult.error.message || 'Failed to upload image after multiple attempts'
          });
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      if (!uploadResult || uploadResult.error) {
        console.error('Upload error:', uploadResult?.error);
        toast({ title: 'Upload failed', description: uploadResult?.error?.message || 'Unknown error' });
        return;
      }

      console.log('Upload successful:', uploadResult.data);

      // Get public URL with error handling
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        toast({ title: 'Error', description: 'Failed to generate public URL for uploaded image' });
        return;
      }

      console.log('Public URL:', publicUrl);

      // Verify image loads before updating state
      const img = new Image();
      img.onload = () => {
        onImageChange(publicUrl);
        setPreview(publicUrl);
        toast({ title: 'Success', description: 'Image uploaded successfully!' });
      };
      img.onerror = () => {
        toast({ title: 'Error', description: 'Uploaded image could not be loaded' });
      };
      img.src = publicUrl;

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({ title: 'Unexpected error', description: 'An unexpected error occurred' });
    } finally {
      setUploading(false);
    }
  }, [type, userId, onImageChange, maxSize]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  }, [uploadImage]);

  const removeImage = useCallback(() => {
    setPreview(null);
    onImageChange('');
  }, [onImageChange]);

  const displayImage = preview || currentImage;

  return (
    <div className={`space-y-4 ${className}`}>
      {!hidePreview && displayImage && (
        <div className="relative inline-block">
          <img 
            src={displayImage} 
            alt={`${type} preview`}
            className={`
              ${type === 'avatar' ? 'w-24 h-24 rounded-full object-cover' : ''}
              ${type === 'banner' ? 'w-full h-32 object-cover rounded-lg' : ''}
              ${type === 'car' ? 'w-48 h-32 object-cover rounded-lg' : ''}
              ${type === 'logo' ? 'w-24 h-24 object-contain rounded-lg' : ''}
              ${type === 'post' ? 'w-32 h-32 object-cover rounded-lg' : ''}
            `}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById(`file-${type}-${userId}`)?.click()}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>{uploading ? 'Uploading...' : `Upload ${type}`}</span>
        </Button>
        
        <input
          id={`file-${type}-${userId}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Max file size: {maxSize}MB. Supported formats: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
};

export default SupabaseImageUpload;
