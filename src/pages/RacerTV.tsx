import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Share2, Users, Eye, Filter, Search } from 'lucide-react';
import { useApp } from '../App';
import { raceClasses } from '../data/raceClasses';

export const RacerTV: React.FC = () => {
  const { racers } = useApp();
  const [filter, setFilter] = useState('trending');
  const [searchTerm, setSearchTerm] = useState('');

  const videos = [
    {
      id: 1,
      racer: racers[0],
      title: 'Epic Sprint Car Battle at Knoxville',
      thumbnail: 'https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800',
      duration: '4:32',
      views: 15243,
      likes: 2847,
      comments: 156,
      timestamp: '2 hours ago',
      isLive: false,
      hashtags: ['#sprintcar', '#knoxville', '#racing']
    },
    {
      id: 2,
      racer: racers[1],
      title: 'LIVE: Drag Strip Action',
      thumbnail: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
      duration: 'LIVE',
      views: 892,
      likes: 234,
      comments: 45,
      timestamp: 'Live now',
      isLive: true,
      hashtags: ['#dragracing', '#live', '#speed']
    },
    {
      id: 3,
      racer: racers[2],
      title: 'Behind the Scenes: Car Setup',
      thumbnail: 'https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800',
      duration: '2:15',
      views: 5432,
      likes: 987,
      comments: 67,
      timestamp: '6 hours ago',
      isLive: false,
      hashtags: ['#behindthescenes', '#setup', '#tips']
    }
  ];

  const liveStreams = racers.filter(r => r.isLive).slice(0, 3);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-red-900 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
              RacerTV
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Watch exclusive racing content, live streams, and behind-the-scenes footage
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos, racers, hashtags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
            >
              <option value="trending">Trending</option>
              <option value="latest">Latest</option>
              <option value="live">Live Now</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Live Streams Section */}
        {liveStreams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse" />
                Live Now
              </h2>
              <button className="text-red-400 hover:text-red-300 transition-colors">
                View All Live
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveStreams.map(racer => (
                <div key={racer.id} className="bg-gray-900 rounded-xl overflow-hidden group hover:bg-gray-800 transition-all">
                  <div className="relative">
                    <img
                      src={racer.profilePicture}
                      alt={racer.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm">
                      {Math.floor(Math.random() * 500) + 100} watching
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="h-8 w-8 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{racer.name}</h3>
                    <p className="text-sm text-gray-400">Live from {racer.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold capitalize">{filter} Videos</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option>All Classes</option>
                  {raceClasses.slice(0, 10).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {videos.map(video => (
                <div key={video.id} className="bg-gray-900 rounded-xl overflow-hidden group hover:bg-gray-800 transition-all">
                  <div className="md:flex">
                    <div className="relative md:w-80 md:flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      {video.isLive ? (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                          LIVE
                        </div>
                      ) : (
                        <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm">
                          {video.duration}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                          <Play className="h-8 w-8 ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={video.racer.profilePicture}
                            alt={video.racer.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold">{video.racer.name}</h4>
                            <p className="text-sm text-gray-400">#{video.racer.carNumber} • {video.racer.class}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">{video.timestamp}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-3">{video.title}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {video.hashtags.map(tag => (
                          <span key={tag} className="text-sm text-red-400 hover:text-red-300 cursor-pointer">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-6 text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{video.views.toLocaleString()}</span>
                          </div>
                          <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span>{video.likes.toLocaleString()}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span>{video.comments}</span>
                          </button>
                        </div>
                        <button className="hover:text-white transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Hashtags */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
              <div className="space-y-2">
                {[
                  { tag: '#sprintcar', count: '2.3K videos' },
                  { tag: '#dragracing', count: '1.8K videos' },
                  { tag: '#live', count: '892 videos' },
                  { tag: '#behindthescenes', count: '654 videos' },
                  { tag: '#tips', count: '432 videos' }
                ].map(topic => (
                  <button
                    key={topic.tag}
                    className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-semibold text-red-400">{topic.tag}</div>
                    <div className="text-sm text-gray-400">{topic.count}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Racers */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Featured Creators</h3>
              <div className="space-y-4">
                {racers.filter(racer => racer.profileComplete !== false).slice(0, 4).map(racer => (
                  <div key={racer.id} className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={racer.profilePicture}
                        alt={racer.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {racer.isLive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-gray-900 rounded-full" />
                      )}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border border-gray-900 rounded-full" title="Verified Racer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{racer.name}</h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Users className="h-3 w-3" />
                        <span>{racer.subscribers}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload CTA */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">Are you a racer?</h3>
              <p className="text-sm text-red-100 mb-4">
                Share your racing journey with fans around the world
              </p>
              <button className="w-full px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Start Creating
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};