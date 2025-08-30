import React from 'react';
import { shareToFacebook, debugFacebookPreview, refreshFacebookCache, generateShareUrl } from '../utils/facebookSharing';

interface FacebookShareHelperProps {
  racerName: string;
  racerId: string;
  racerImage: string;
  racerBio: string;
}

export const FacebookShareHelper: React.FC<FacebookShareHelperProps> = ({
  racerName,
  racerId,
  racerImage,
  racerBio
}) => {
  // Debug logging
  console.log('FacebookShareHelper props:', { racerName, racerId, racerImage, racerBio });
  
  const shareUrl = `${window.location.origin}/racer/${racerId}`;
  const shareText = `Check out ${racerName} on OnlyRaceFans! 🏁`;
  const shareDescription = racerBio || `Support ${racerName} and get exclusive racing content!`;
  
  // Ensure we have a proper image URL for Facebook sharing
  const shareImage = racerImage && racerImage.trim() !== '' 
    ? racerImage 
    : `https://api.dicebear.com/7.x/initials/svg?seed=${racerName}&backgroundColor=ff6600&textColor=ffffff&size=400`;

  const handleShareToFacebook = () => {
    // Validate data before sharing
    if (!racerName || !racerId) {
      console.error('Missing racer data for sharing:', { racerName, racerId });
      return;
    }

    // Method 1: Try Web Share API first (works on mobile)
    if (navigator.share) {
      navigator.share({
        title: `${racerName} - OnlyRaceFans.co`,
        text: `${shareText}\n\n${shareDescription}`,
        url: shareUrl
      }).catch(() => {
        // Fallback to traditional sharing
        const shareData = generateShareUrl(racerName, racerId, racerBio, racerImage);
        shareToFacebook(shareData);
      });
      return;
    }

    // Method 2: Traditional Facebook sharing with proper meta tags
    const shareData = generateShareUrl(racerName, racerId, racerBio, shareImage);
    if (shareData) {
      shareToFacebook(shareData);
    } else {
      console.error('Failed to generate share data');
    }
  };

  const handleDebugFacebookPreview = () => {
    debugFacebookPreview(shareUrl);
  };

  const handleRefreshFacebookCache = () => {
    refreshFacebookCache(shareUrl);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Facebook Sharing</h3>
        
        {/* Primary Share Button */}
        <button
          onClick={handleShareToFacebook}
          className="w-full flex items-center justify-center space-x-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="font-medium">Share on Facebook</span>
        </button>
        </div>

      {/* Share Info */}
      <div className="bg-gray-800 rounded-lg p-3 text-sm">
        <h4 className="font-medium text-white mb-2">Share Preview:</h4>
        <div className="space-y-2 text-gray-300">
          <div className="flex items-center space-x-3">
            <img 
              src={shareImage} 
              alt={racerName}
              className="w-12 h-12 rounded-full object-cover border-2 border-fedex-orange"
            />
            <div className="flex-1">
              <div className="font-semibold text-white">{racerName} - OnlyRaceFans.co</div>
              <div className="text-sm text-gray-400">{shareDescription.substring(0, 80)}...</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 truncate">{shareUrl}</div>
        </div>
      </div>
    </div>
  );
}; 