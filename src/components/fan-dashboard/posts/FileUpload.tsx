import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  mediaType: 'photo' | 'video';
  isUploading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, mediaType, isUploading = false }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Pass the file to the parent component
    onFileSelect(file);
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const acceptTypes = mediaType === 'photo' 
    ? 'image/jpeg,image/png,image/jpg,image/webp' 
    : 'video/mp4,video/webm,video/ogg,video/quicktime';
  
  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptTypes}
        className="hidden"
        disabled={isUploading}
      />
      
      <div 
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          ${isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'} 
          ${preview ? 'border-green-500' : 'border-gray-300'}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <svg className="animate-spin h-6 w-6 text-fedex-orange mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500">Uploading...</span>
          </div>
        ) : preview ? (
          <div className="relative">
            {mediaType === 'photo' ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
            ) : (
              <video src={preview} controls className="max-h-48 w-full mx-auto rounded" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity rounded">
              <span className="text-white text-sm font-medium">Change {mediaType}</span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Click to upload a {mediaType}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {mediaType === 'photo' ? 'JPG, PNG, WEBP up to 10MB' : 'MP4, WEBM, OGG up to 100MB'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
