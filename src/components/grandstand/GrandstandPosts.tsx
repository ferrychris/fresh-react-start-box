import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Calendar, MapPin, Users, DollarSign, Crown } from 'lucide-react';

interface Post {
  id: string;
  userId: string;
  userType: 'RACER' | 'TRACK' | 'SERIES' | 'FAN';
  userName: string;
  userAvatar: string;
  userVerified: boolean;
  carNumber?: string;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video';
  location?: string;
  eventDate?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  timestamp: string;
  createdAt: string;
}

interface GrandstandPostsProps {
  showComposer?: boolean;
}

const mockPosts: Post[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    userType: 'RACER',
    userName: 'Jake Johnson',
    userAvatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    userVerified: true,
    carNumber: '23',
    content: 'Just finished qualifying for tomorrow\'s Charlotte 400! P3 starting position - feeling good about our chances. The car is handling perfectly and the team has been working overtime. Ready to put on a show for all the fans! 🏁',
    mediaUrls: ['https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2'],
    mediaType: 'image',
    location: 'Charlotte Motor Speedway',
    eventDate: '2024-02-15',
    likes: 247,
    comments: 18,
    shares: 12,
    isLiked: false,
    timestamp: '2 hours ago',
    createdAt: '2024-02-14T16:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    userType: 'RACER',
    userName: 'Sarah Martinez',
    userAvatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    userVerified: true,
    carNumber: '7',
    content: 'Behind the scenes at the shop! Working on some suspension adjustments for this weekend. The sprint car is looking fast and I can\'t wait to get back on the dirt. Thanks to all my subscribers for the support - it means everything! 💪',
    mediaUrls: ['https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2'],
    mediaType: 'image',
    likes: 189,
    comments: 24,
    shares: 8,
    isLiked: true,
    timestamp: '4 hours ago',
    createdAt: '2024-02-14T14:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    userId: '550e8400-e29b-41d4-a716-446655440007',
    userType: 'TRACK',
    userName: 'Charlotte Motor Speedway',
    userAvatar: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    userVerified: true,
    content: 'RACE DAY TOMORROW! 🏁 The Charlotte 400 Late Model Championship race starts at 7 PM. Gates open at 5 PM. Don\'t miss what promises to be an incredible night of racing! Tickets still available at the gate.',
    mediaUrls: ['https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2'],
    mediaType: 'image',
    location: 'Charlotte Motor Speedway',
    eventDate: '2024-02-15',
    likes: 156,
    comments: 31,
    shares: 22,
    isLiked: false,
    timestamp: '6 hours ago',
    createdAt: '2024-02-14T12:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    userType: 'FAN',
    userName: 'Racing Fan',
    userAvatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    userVerified: false,
    content: 'Can\'t wait for the Charlotte 400 tomorrow! 🏁 Been following Jake Johnson all season and he\'s been absolutely crushing it. That P3 qualifying position has me so hyped! Going to be cheering loud from the stands. Let\'s go #23! 🏎️💨 #Charlotte400 #LateModel #TeamJake',
    mediaUrls: ['https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2'],
    mediaType: 'image',
    location: 'Charlotte Motor Speedway',
    likes: 34,
    comments: 8,
    shares: 3,
    isLiked: false,
    timestamp: '1 hour ago',
    createdAt: '2024-02-14T17:00:00Z'
  }
];

const GrandstandPosts: React.FC<GrandstandPostsProps> = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading] = useState(false);

  // We're using mock data for now, but this would be replaced with a real API call
  // useEffect(() => {
  //   loadPosts();
  // }, []);

  // Post creation would be implemented here in the future when integrating with Supabase

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'RACER': return 'text-orange-500';
      case 'TRACK': return 'text-blue-500';
      case 'SERIES': return 'text-purple-500';
      case 'FAN': return 'text-green-500';
      default: return 'text-slate-500';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'RACER': return '🏎️';
      case 'TRACK': return '🏁';
      case 'SERIES': return '🏆';
      case 'FAN': return '👥';
      default: return '👤';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-fedex-orange to-red-500">
          Grandstand
        </span>
      </h1>
      
      {/* Feed */}
      <div className="space-y-6">
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
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300">
                {/* Post Header */}
                <div className="p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-gray-800 hover:border hover:border-orange-500/30 rounded-xl p-3 -m-3 transition-all duration-300 flex-1 group hover:shadow-lg hover:shadow-orange-500/10">
                      <img
                        src={post.userAvatar}
                        alt={post.userName}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover ring-2 ring-gray-700 group-hover:ring-orange-500 group-hover:ring-2 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white group-hover:text-orange-300 transition-colors duration-300 group-hover:drop-shadow-sm">
                            {post.userName}
                          </span>
                          {post.userVerified && (
                            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-400 group-hover:scale-110 transition-all duration-300">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          {post.carNumber && (
                            <span className="text-orange-500 text-sm group-hover:text-orange-300 group-hover:font-bold transition-all duration-300">#{post.carNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`font-medium ${getUserTypeColor(post.userType)} group-hover:brightness-110 transition-all duration-300`}>
                            {getUserTypeIcon(post.userType)} {post.userType}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed">{post.content}</p>
                    
                    {/* Location and Event Info */}
                    {(post.location || post.eventDate) && (
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                        {post.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        {post.eventDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.eventDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.mediaUrls.length > 0 && (
                    <div className="mb-4 -mx-4 lg:-mx-6">
                      <div className="relative">
                        <img
                          src={post.mediaUrls[0]}
                          alt="Post media"
                          className="w-full h-64 lg:h-80 object-cover"
                        />
                        {post.mediaType === 'video' && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200">
                              <Play className="w-8 h-8 text-gray-900 ml-1" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-all duration-200 ${
                          post.isLiked 
                            ? 'text-red-500' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-200">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-all duration-200">
                        <Share className="w-5 h-5" />
                        <span className="font-medium">{post.shares}</span>
                      </button>
                    </div>

                    {/* Tip/Subscribe Actions for Racers */}
                    {post.userType === 'RACER' && (
                      <div className="flex items-center space-x-2">
                        <button 
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm flex items-center space-x-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Tip $5</span>
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center space-x-1"
                        >
                          <Crown className="w-3 h-3" />
                          <span>Join the Team</span>
                        </button>
                      </div>
                    )}

                    {/* Follow Actions for Tracks/Series */}
                    {(post.userType === 'TRACK' || post.userType === 'SERIES') && (
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Follow</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && posts.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">🏁</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-sm text-gray-400">Be the first to share something with the racing community!</p>
          </div>
        )}
        
        {/* Load More */}
        {posts.length > 0 && (
          <div className="text-center py-4">
            <button className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-all duration-200">
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrandstandPosts;
