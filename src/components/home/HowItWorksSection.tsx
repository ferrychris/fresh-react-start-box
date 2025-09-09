import React from 'react';
import { Users, Heart, Trophy } from 'lucide-react';

interface HowItWorksSectionProps {
  theme: 'light' | 'dark' | string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ theme }) => {
  return (
    <section className={`py-12 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>How It Works</h2>
          <p className={`text-base md:text-lg max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Support your favorite racers and get exclusive access to their journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-14 h-14 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Discover Racers</h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Browse through verified racers from various classes and locations
            </p>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-14 h-14 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Support & Subscribe</h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Choose a subscription tier and support your favorite racers
            </p>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-14 h-14 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Exclusive Content</h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Get behind-the-scenes content, live streams, and exclusive updates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
