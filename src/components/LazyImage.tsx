import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'https://placehold.co/400x300/1e293b/475569?text=Loading...',
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setError(true);
    setIsLoaded(false);
    if (onError) {
      onError(e);
    }
  };

  // Sanitize/normalize the incoming src
  const safeSrc = (() => {
    if (!src) return '';
    // Already safe schemes
    if (/^(https?:|data:|blob:)/i.test(src)) return src;

    // Looks like raw base64 (no slash, valid base64 charset), wrap as PNG data URL
    const base64Re = /^[A-Za-z0-9+/=]+$/;
    if (!/\//.test(src) && base64Re.test(src) && src.length % 4 === 0) {
      return `data:image/png;base64,${src}`;
    }

    // Try to detect obviously invalid URLs early
    try {
      // Will throw on invalid absolute URLs; relative ones will throw here, which we consider not safe
      // We only allow absolute http(s), data, blob above
      // eslint-disable-next-line no-new
      new URL(src);
      return src;
    } catch {
      return '';
    }
  })();

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isInView && (
        <img
          src={placeholder}
          alt="Loading..."
          className={`w-full h-full object-cover ${className}`}
        />
      )}
      
      {isInView && (
        <>
          {(!isLoaded || error || !safeSrc) && (
            <img
              src={placeholder}
              alt="Loading..."
              className={`absolute inset-0 w-full h-full object-cover ${className}`}
            />
          )}
          {!error && safeSrc && (
            <img
              src={safeSrc}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } ${className}`}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LazyImage;