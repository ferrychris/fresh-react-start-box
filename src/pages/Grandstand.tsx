import React from 'react';
import GrandstandPosts from '../components/grandstand/GrandstandPosts';

const Grandstand: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fedex-orange to-red-500">
              The Grandstand
            </span>
          </h1>
          <p className="text-gray-400 mt-2">
            Join the racing community conversation and share your passion for motorsports
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Welcome to the Grandstand</h2>
              <p className="text-gray-300 mb-4">
                This is where fans come together to discuss races, drivers, and everything motorsport.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Share your race day experiences</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Connect with other racing enthusiasts</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Discuss upcoming events and results</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Community Guidelines</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2 text-fedex-orange">1.</span>
                  <span>Be respectful to all members of the racing community</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-fedex-orange">2.</span>
                  <span>No spoilers for races less than 24 hours old</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-fedex-orange">3.</span>
                  <span>Keep discussions on-topic and racing-related</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-fedex-orange">4.</span>
                  <span>Have fun and share your passion for motorsports!</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main Content - Posts */}
          <div className="lg:col-span-2">
            <GrandstandPosts showComposer={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grandstand;
