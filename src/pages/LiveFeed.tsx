import React from 'react';
import { Calendar, Users, Gift, Crown, Video, Clock, Zap, Star } from 'lucide-react';

export default function LiveFeed() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <Video className="w-12 h-12 text-red-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Live Racing Feed
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Watch live racing content, interact with streamers, and send gifts to your favorite racers
          </p>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-gray-400">0 Live Now</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">0 Total Viewers</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-12 text-center mb-16 border border-gray-600/30">
          <div className="mb-8">
            <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Coming Soon!</h2>
            <p className="text-xl text-gray-300 mb-6">
              Live streaming is currently in development and will be available soon.
            </p>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">What's Coming</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-6 rounded-xl border border-red-500/30">
              <Video className="w-8 h-8 text-red-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Live Race Coverage</h4>
              <p className="text-gray-300 text-sm">Stream directly from the track with HD quality</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Interactive Chat</h4>
              <p className="text-gray-300 text-sm">Real-time chat with racers and fans</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-500/30">
              <Gift className="w-8 h-8 text-green-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Live Gifts & Tips</h4>
              <p className="text-gray-300 text-sm">Send support during live streams</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-500/30">
              <Crown className="w-8 h-8 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold mb-2">VIP Access</h4>
              <p className="text-gray-300 text-sm">Exclusive content for superfans</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-300 mb-6">
            Want to be notified when live streaming launches? Follow your favorite racers now!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/racers'}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Users className="w-5 h-5 inline mr-2" />
              Browse Racers
            </button>
            <button 
              onClick={() => window.location.href = '/feed'}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border border-gray-600"
            >
              <Zap className="w-5 h-5 inline mr-2" />
              View Racing Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}