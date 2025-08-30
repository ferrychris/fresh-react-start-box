import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

export interface FanPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string; // ISO string
  content: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
}

interface PostsPanelProps {
  posts?: FanPost[];
  onCreatePost?: (payload: { content: string; imageUrl?: string }) => void;
  showComposer?: boolean;
  loading?: boolean;
}

const PostsPanel: React.FC<PostsPanelProps> = ({ posts, onCreatePost, showComposer = false, loading = false }) => {
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const mockPosts: FanPost[] = [
    {
      id: 'p1',
      authorName: 'Racing Fan',
      createdAt: new Date().toISOString(),
      content: 'Stoked for race weekend! Who else is watching?',
      likes: 12,
      comments: 3
    },
    {
      id: 'p2',
      authorName: 'Racing Fan',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      content: "Just tipped my favorite driver. Let's go!",
      likes: 8,
      comments: 1
    }
  ];

  const list = posts && posts.length > 0 ? posts : mockPosts;

  const handleLike = (postId: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl shadow-black/40 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-fedex-orange to-red-500">Grandstand</span>
          <span className="ml-2 text-white">Posts</span>
        </h2>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-fedex-orange/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-fedex-orange rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-fedex-orange/10 rounded-full flex items-center justify-center">
                <span className="text-xl">🏁</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400">Loading posts...</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800">
        {list.map((post) => (
          <li key={post.id} className="p-6 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start gap-4">
              {post.authorAvatar ? (
                <img 
                  src={post.authorAvatar} 
                  alt={post.authorName} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-fedex-orange/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fedex-orange to-red-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {post.authorName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{post.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                  {post.content}
                </p>
                {post.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img src={post.imageUrl} alt="Post" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="mt-4 flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${likedPosts[post.id] ? 'text-fedex-orange' : 'text-gray-400 hover:text-fedex-orange'}`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts[post.id] ? 'fill-fedex-orange' : ''}`} />
                    <span>{(post.likes ?? 0) + (likedPosts[post.id] ? 1 : 0)}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-fedex-purple transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments ?? 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
        </ul>
      )}
      
      {!loading && list.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-2xl">🏁</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-sm text-gray-400">Be the first to share something with the racing community!</p>
        </div>
      )}
    </div>
  );
};

export default PostsPanel;
