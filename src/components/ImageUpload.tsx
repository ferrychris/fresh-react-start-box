import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, User, X, RotateCcw, Check } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  type: 'profile' | 'banner';
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  currentImage,
  onImageChange,
  className = ''
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropper, setShowCropper] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isProfile = type === 'profile';
  const aspectRatio = isProfile ? 1 : 3;
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Initialize crop based on image type
  const initializeCrop = useCallback((imageWidth: number, imageHeight: number): Crop => {
    if (isProfile) {
      const size = Math.min(imageWidth, imageHeight);
      return {
        unit: 'px',
        x: (imageWidth - size) / 2,
        y: (imageHeight - size) / 2,
        width: size,
        height: size,
      };
    } else {
      const width = imageWidth;
      const height = imageWidth / 3;
      return {
        unit: 'px',
        x: 0,
        y: (imageHeight - height) / 2,
        width,
        height,
      };
    }
  }, [isProfile]);

  const handleFileSelect = (file: File) => {
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
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

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const initialCrop = initializeCrop(width, height);
    setCrop(initialCrop);
    setCompletedCrop(initialCrop as PixelCrop);
  };

  const getCroppedImage = useCallback(async (): Promise<string> => {
    if (!completedCrop || !imageRef.current || !canvasRef.current) {
      console.log('⚠️ Missing crop data, using original image');
      return selectedImage || '';
    }

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log('⚠️ Canvas context not available');
      return selectedImage || '';
    }

    console.log('🖼️ Processing image crop...');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to crop size
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // Convert blob to base64 for storage
            const base64 = await blobToBase64(blob);
            console.log('✅ Image converted to base64 successfully');
            resolve(base64);
          } catch (error) {
            console.error('❌ Error converting image to base64:', error);
            resolve(selectedImage || '');
          }
        } else {
          console.log('⚠️ No blob created, using original image');
          resolve(selectedImage || '');
        }
      }, 'image/jpeg', 0.9);
    });
  }, [completedCrop, selectedImage]);

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleCropComplete = async () => {
    setIsUploading(true);
    try {
      const croppedImageUrl = await getCroppedImage();
      onImageChange(croppedImageUrl);
      setShowCropper(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      // Remove any existing capture attribute first
      fileInputRef.current.removeAttribute('capture');
      // Set capture attribute for mobile camera
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      // Remove capture attribute for file selection
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  if (showCropper && selectedImage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Crop Your {isProfile ? 'Profile Photo' : 'Banner Image'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {isProfile 
                ? 'Adjust the crop area to create a square profile photo'
                : 'Adjust the crop area for your banner (3:1 ratio recommended)'
              }
            </p>
          </div>
          
          <div className="p-4 max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-w-full"
            >
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>
          
          <div className="p-4 border-t border-gray-700 flex items-center justify-between">
            <button
              onClick={handleCropCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const img = imageRef.current;
                  if (img) {
                    const initialCrop = initializeCrop(img.naturalWidth, img.naturalHeight);
                    setCrop(initialCrop);
                    setCompletedCrop(initialCrop as PixelCrop);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
              
              <button
                onClick={handleCropComplete}
                disabled={isUploading}
                className="flex items-center space-x-2 px-6 py-2 bg-fedex-orange hover:bg-fedex-orange-dark disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>{isUploading ? 'Processing...' : 'Apply Crop'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className={className}>
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
        className={`
          relative border-2 border-dashed rounded-lg transition-all cursor-pointer
          ${isDragging 
            ? 'border-fedex-orange bg-fedex-orange/10' 
            : 'border-gray-600 hover:border-fedex-orange hover:bg-fedex-orange/5'
          }
          ${isProfile ? 'aspect-square' : 'aspect-[3/1]'}
        `}
        onClick={openFileDialog}
      >
        {currentImage ? (
          <div className="relative w-full h-full">
            <img
              src={currentImage}
              alt={isProfile ? 'Profile photo' : 'Banner image'}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Change Image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {isProfile ? (
              <User className="h-12 w-12 text-gray-400 mb-3" />
            ) : (
              <Camera className="h-12 w-12 text-gray-400 mb-3" />
            )}
            
            <p className="text-gray-300 font-medium mb-2">
              {isProfile ? 'Upload your profile photo' : 'Show your car or team photo'}
            </p>
            
            <p className="text-sm text-gray-400 mb-4">
              Drag & drop or click to browse
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-white font-medium transition-colors"
              >
                Choose File
              </button>
              
              {/* Mobile camera button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCamera();
                }}
                className="sm:hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Live Preview */}
      {currentImage && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Preview:</p>
          <div className="flex items-center space-x-3">
            <img
              src={currentImage}
              alt="Preview"
              className={`${
                isProfile 
                  ? 'w-12 h-12 rounded-full' 
                  : 'w-24 h-8 rounded'
              } object-cover border-2 border-gray-600`}
            />
            <span className="text-sm text-gray-300">
              This is how it will appear on your profile
            </span>
          </div>
        </div>
      )}
    </div>
  );
};