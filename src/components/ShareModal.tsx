import React, { useState } from 'react';
import { X, Copy, Link, Facebook, Twitter, MessageCircle, Send, Mail, Check, Instagram } from 'lucide-react';
import { FacebookShareHelper } from './FacebookShareHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  racerName: string;
  racerId: string;
  racerImage: string;
  racerBio: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  racerName,
  racerId,
  racerImage,
  racerBio
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'embed'>('share');

  // Debug logging
  console.log('ShareModal props:', { racerName, racerId, racerImage, racerBio });

  const shareUrl = `${window.location.origin}/racer/${racerId}`;
  const shareText = `Check out ${racerName} on OnlyRaceFans! 🏁`;
  const shareDescription = racerBio || `Support ${racerName} and get exclusive racing content!`;
  
  // Use the racer's actual profile picture for sharing
  const shareImage = racerImage && racerImage.trim() !== '' && !racerImage.includes('undefined')
    ? racerImage 
    : `https://api.dicebear.com/7.x/initials/svg?seed=${racerName}&backgroundColor=ff6600&textColor=ffffff&size=1200`;
  
  console.log('📸 Share image URL:', shareImage);
  console.log('📋 Share data:', { racerName, racerId, racerImage, racerBio });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToSocial = async (platform: string) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedDescription = encodeURIComponent(shareDescription);

    switch (platform) {
      case 'facebook':
        // Use Facebook's Web Share API first, fallback to sharer.php
        if (navigator.share) {
          navigator.share({
            title: `${racerName} - OnlyRaceFans.co`,
            text: `${shareText}\n\n${shareDescription}`,
            url: shareUrl
          }).catch(() => {
            // Fallback to traditional Facebook sharing
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(`${shareText}\n\n${shareDescription}`)}`;
            window.open(facebookUrl, '_blank', 'width=600,height=400');
          });
          return;
        } else {
          // Traditional Facebook sharing for browsers without Web Share API
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(`${shareText}\n\n${shareDescription}`)}`;
          url = facebookUrl;
        }
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we'll copy the link to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return; // Don't open a new window for Instagram
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Check out ${racerName} on OnlyRaceFans`)}&body=${encodeURIComponent(`${shareText}\n\n${shareDescription}\n\n${shareUrl}`)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const generateEmbedCode = () => {
    return `<iframe src="${shareUrl}" width="400" height="600" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyEmbedCode = async () => {
    const embedCode = generateEmbedCode();
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = embedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-scroll animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-fedex-orange to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🚀</span>
            </div>
            <h2 className="text-xl font-bold text-white">Share {racerName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors hover:scale-110 transform duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'text-fedex-orange border-b-2 border-fedex-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Share
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'embed'
                ? 'text-fedex-orange border-b-2 border-fedex-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Embed
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {activeTab === 'share' ? (
            <div className="space-y-6">
              {/* Copy Link */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Copy Link</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-fedex-orange hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  >
                    {copied ? <Check className="h-4 w-4 animate-pulse" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied! ✨' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Facebook Sharing Helper */}
              <FacebookShareHelper
                racerName={racerName}
                racerId={racerId}
                racerImage={racerImage}
                racerBio={racerBio}
              />

              {/* Share Preview */}
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

              {/* Other Social Media */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Share on Other Platforms</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex items-center space-x-3 p-3 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="font-medium">Twitter</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('instagram')}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="font-medium">Instagram</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="flex items-center space-x-3 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('telegram')}
                    className="flex items-center space-x-3 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-5 w-5" />
                    <span className="font-medium">Telegram</span>
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Share via Email</h3>
                <button
                  onClick={() => shareToSocial('email')}
                  className="w-full flex items-center justify-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
                >
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Send Email 📧</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Embed Code</h3>
              <p className="text-sm text-gray-400">
                Copy this code to embed {racerName}'s profile on your website:
              </p>
              <div className="space-y-3">
                <textarea
                  value={generateEmbedCode()}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                />
                <button
                  onClick={copyEmbedCode}
                  className="w-full px-4 py-2 bg-fedex-orange hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 transform shadow-lg hover:shadow-xl"
                >
                  {copied ? <Check className="h-4 w-4 animate-pulse" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied! ✨' : 'Copy Embed Code'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};