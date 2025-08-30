import { useEffect } from 'react';

interface DynamicMetaTagsProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

export const DynamicMetaTags: React.FC<DynamicMetaTagsProps> = ({
  title,
  description,
  image,
  url,
  type = 'website'
}) => {
  useEffect(() => {
    console.log('🔍 Setting meta tags:', { title, description, image, url, type });
    
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
      console.log(`✅ Set ${property}: ${content}`);
    };

    // Update or create meta tags by name (for some social platforms)
    const updateMetaTagByName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
      console.log(`✅ Set name ${name}: ${content}`);
    };

    // Ensure we have a valid image URL
    const finalImage = image && image.trim() !== '' && !image.includes('undefined') 
      ? image 
      : 'https://onlyracefans.co/onlyracefans-logo.png';
    
    console.log('🖼️ Final image URL:', finalImage);
    
    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', finalImage);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'OnlyRaceFans.co');
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:type', finalImage.includes('.png') ? 'image/png' : 'image/jpeg');
    updateMetaTag('og:image:alt', title);

    // Update Twitter tags
    updateMetaTagByName('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', finalImage);
    updateMetaTag('twitter:url', url);

    // Update page title
    document.title = title;
    
    console.log('✅ All meta tags updated successfully');

    // Cleanup function to restore original meta tags
    return () => {
      // Restore default meta tags
      updateMetaTag('og:title', 'OnlyRaceFans.co - Full Racing Content Platform');
      updateMetaTag('og:description', 'Support your favorite racers and get exclusive access to their journey. Join the fastest-growing racing community platform.');
      updateMetaTag('og:image', 'https://onlyracefans.co/onlyracefans-logo.png');
      updateMetaTag('og:url', 'https://onlyracefans.co/');
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:site_name', 'OnlyRaceFans.co');
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/jpeg');
      updateMetaTag('og:image:alt', 'OnlyRaceFans.co - Full Racing Content Platform');

      updateMetaTag('twitter:title', 'OnlyRaceFans.co - Full Racing Content Platform');
      updateMetaTag('twitter:description', 'Support your favorite racers and get exclusive access to their journey. Join the fastest-growing racing community platform.');
      updateMetaTag('twitter:image', 'https://onlyracefans.co/onlyracefans-logo.png');
      updateMetaTag('twitter:url', 'https://onlyracefans.co/');

      document.title = 'OnlyRaceFans.co - Full Racing Content Platform';
    };
  }, [title, description, image, url, type]);

  return null; // This component doesn't render anything
}; 