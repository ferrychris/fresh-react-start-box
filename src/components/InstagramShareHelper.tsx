import React, { useState } from 'react';
import { Instagram, Copy, ExternalLink, Hash, Check } from 'lucide-react';

interface InstagramShareHelperProps {
  racerName: string;
  racerId: string;
  racerImage: string;
  racerBio: string;
}

export const InstagramShareHelper: React.FC<InstagramShareHelperProps> = ({
  racerName,
  racerId,
  racerImage,
  racerBio
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string>('');

  const shareUrl = `${window.location.origin}/racer/${racerId}`;
  const shareText = `Check out ${racerName} on OnlyRaceFans! 🏁`;
  const shareDescription = racerBio || `Support ${racerName} and get exclusive racing content!`;

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedItem(itemName);
      setTimeout(() => {
        setCopied(false);
        setCopiedItem('');
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setCopiedItem(itemName);
      setTimeout(() => {
        setCopied(false);
        setCopiedItem('');
      }, 2000);
    }
  };

  const openInstagram = () => {
    // Try to open Instagram app or website
    const instagramUrl = 'https://www.instagram.com/';
    window.open(instagramUrl, '_blank');
  };

  const copyLinkForBio = () => {
    const instagramText = `${shareText}\n\n${shareUrl}`;
    copyToClipboard(instagramText, 'link');
  };

  const copyHashtags = () => {
    const hashtags = '#OnlyRaceFans #Racing #Motorsport #Racer #RacingLife #Speed #RaceDay #MotorsportLife #RacingCommunity #RaceFans';
    copyToClipboard(hashtags, 'hashtags');
  };

  const copyFullPost = () => {
    const fullPost = `${shareText}\n\n${shareDescription}\n\n${shareUrl}\n\n#OnlyRaceFans #Racing #Motorsport #Racer #RacingLife #Speed #RaceDay #MotorsportLife #RacingCommunity #RaceFans`;
    copyToClipboard(fullPost, 'post');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Instagram Sharing</h3>
        
        {/* Primary Instagram Button */}
        <button
          onClick={openInstagram}
          className="w-full flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors"
        >
          <Instagram className="h-5 w-5" />
          <span className="font-medium">Open Instagram</span>
        </button>

        {/* Instagram Sharing Options */}
        <div className="space-y-2">
          <button
            onClick={copyLinkForBio}
            className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Copy className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Link for Bio</span>
            </div>
            {copied && copiedItem === 'link' && <Check className="h-4 w-4 text-green-400" />}
          </button>

          <button
            onClick={copyFullPost}
            className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Copy className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Full Post</span>
            </div>
            {copied && copiedItem === 'post' && <Check className="h-4 w-4 text-green-400" />}
          </button>

          <button
            onClick={copyHashtags}
            className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Hashtags</span>
            </div>
            {copied && copiedItem === 'hashtags' && <Check className="h-4 w-4 text-green-400" />}
          </button>
        </div>
      </div>

      {/* Instagram Tips */}
      <div className="bg-gray-800 rounded-lg p-3 text-sm">
        <h4 className="font-medium text-white mb-2">Instagram Tips:</h4>
        <div className="space-y-1 text-gray-300 text-xs">
          <div>• Add the link to your Instagram bio</div>
          <div>• Use the hashtags in your posts</div>
          <div>• Tag @onlyracefans in your stories</div>
          <div>• Share racing content with the community</div>
        </div>
      </div>

      {/* Share Preview */}
      <div className="bg-gray-800 rounded-lg p-3 text-sm">
        <h4 className="font-medium text-white mb-2">Share Preview:</h4>
        <div className="space-y-1 text-gray-300">
          <div><strong>Text:</strong> {shareText}</div>
          <div><strong>URL:</strong> {shareUrl}</div>
          <div><strong>Hashtags:</strong> #OnlyRaceFans #Racing #Motorsport</div>
        </div>
      </div>
    </div>
  );
}; 