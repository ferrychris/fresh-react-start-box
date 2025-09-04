import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Post {
  id: string;
  userId: string;
  userType: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  userName: string;
  userAvatar: string;
  userVerified: boolean;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video';
  carNumber?: string;
  location?: string;
  eventDate?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  timestamp: string;
  createdAt: string;
}

interface VirtualizedPostListProps {
  posts: Post[];
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  loadNextPage: () => Promise<void>;
  renderPost: (post: Post, index: number) => React.ReactNode;
  itemHeight?: number;
  className?: string;
}

export const VirtualizedPostList: React.FC<VirtualizedPostListProps> = ({
  posts,
  hasNextPage,
  isNextPageLoading,
  loadNextPage,
  renderPost,
  itemHeight = 400,
  className = ''
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(10);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - rect.top - 50; // Leave some padding
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate visible items based on scroll position
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    
    const scrollTop = listRef.current.scrollTop;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 5, posts.length);
    
    setVisibleStart(startIndex);
    setVisibleEnd(endIndex);

    // Load more when near the end
    if (hasNextPage && !isNextPageLoading && endIndex >= posts.length - 3) {
      loadNextPage();
    }
  }, [itemHeight, containerHeight, posts.length, hasNextPage, isNextPageLoading, loadNextPage]);

  // Set up scroll listener
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    list.addEventListener('scroll', handleScroll);
    return () => list.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Calculate total height and visible items
  const totalHeight = (hasNextPage ? posts.length + 1 : posts.length) * itemHeight;
  const visiblePosts = posts.slice(visibleStart, visibleEnd);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div
        ref={listRef}
        className="overflow-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700"
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visiblePosts.map((post, index) => {
            const actualIndex = visibleStart + index;
            return (
              <div
                key={post.id}
                style={{
                  position: 'absolute',
                  top: actualIndex * itemHeight,
                  width: '100%',
                  height: itemHeight
                }}
              >
                {renderPost(post, actualIndex)}
              </div>
            );
          })}
          
          {/* Loading indicator */}
          {isNextPageLoading && (
            <div
              style={{
                position: 'absolute',
                top: posts.length * itemHeight,
                width: '100%',
                height: itemHeight
              }}
              className="flex items-center justify-center"
            >
              <div className="text-center py-6">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm">Loading more posts...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedPostList;