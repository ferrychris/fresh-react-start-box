
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        return 'postimage';
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
        toast.error(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const bucket = getBucketName(type);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      onImageChange(publicUrl);
      setPreview(publicUrl);
      toast.success('Image uploaded successfully!');

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
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
