// Facebook Sharing Utilities

export interface FacebookShareData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

export const setFacebookMetaTags = (data: FacebookShareData) => {
  // Update or create meta tags for Facebook
  const updateMetaTag = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  // Set all required Facebook meta tags
  updateMetaTag('og:title', data.title);
  updateMetaTag('og:description', data.description);
  updateMetaTag('og:image', data.image);
  updateMetaTag('og:url', data.url);
  updateMetaTag('og:type', data.type);
  updateMetaTag('og:site_name', 'OnlyRaceFans.co');
  updateMetaTag('og:image:width', '1200');
  updateMetaTag('og:image:height', '630');
  updateMetaTag('og:image:type', 'image/jpeg');
  updateMetaTag('og:image:alt', data.title);

  // Also set Twitter meta tags for consistency
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', data.title);
  updateMetaTag('twitter:description', data.description);
  updateMetaTag('twitter:image', data.image);
  updateMetaTag('twitter:url', data.url);

  // Update page title
  document.title = data.title;
};

export const shareToFacebook = (data: FacebookShareData | null) => {
  // Validate data
  if (!data) {
    console.error('No share data provided to shareToFacebook');
    return;
  }

  // Validate required fields
  if (!data.url || !data.title || !data.description) {
    console.error('Missing required fields in share data:', data);
    return;
  }

  // First, set the meta tags
  setFacebookMetaTags(data);

  // Wait a moment for meta tags to be set
  setTimeout(() => {
    const encodedUrl = encodeURIComponent(data.url);
    const encodedQuote = encodeURIComponent(`${data.title}\n\n${data.description}`);
    
    // Use Facebook's sharing URL
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
    
    // Open in popup window
    const popup = window.open(
      facebookUrl,
      'facebook-share-dialog',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );

    // Focus the popup
    if (popup) {
      popup.focus();
    }
  }, 100);
};

export const debugFacebookPreview = (url: string) => {
  // Open Facebook's debugger tool
  const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
  window.open(debugUrl, '_blank');
};

export const refreshFacebookCache = (url: string) => {
  // Force Facebook to refresh its cache
  const refreshUrl = `https://developers.facebook.com/tools/debug/sharing/?q=${encodeURIComponent(url)}`;
  window.open(refreshUrl, '_blank');
};

export const generateShareUrl = (racerName: string, racerId: string, racerBio: string, racerImage: string) => {
  // Validate required parameters
  if (!racerName || !racerId) {
    console.error('Missing required parameters for generateShareUrl:', { racerName, racerId });
    return null;
  }

  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/racer/${racerId}`;
  
  // Ensure we have a proper image URL for sharing
  const finalImage = racerImage && racerImage.trim() !== '' 
    ? racerImage 
    : `https://api.dicebear.com/7.x/initials/svg?seed=${racerName}&backgroundColor=ff6600&textColor=ffffff&size=1200`;
  
  return {
    url: shareUrl,
    title: `${racerName} - OnlyRaceFans.co`,
    description: racerBio || `Support ${racerName} and get exclusive racing content!`,
    image: finalImage,
    type: 'profile'
  };
}; 