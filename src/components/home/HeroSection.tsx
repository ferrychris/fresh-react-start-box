import React from 'react';
import { Crown } from 'lucide-react';
import { primaryButton } from '../../styles/buttons';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center mt-[20px]"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 27, 75, 0.6), rgba(234, 88, 12, 0.4)), url('https://i.ytimg.com/vi/UIg1O-2W-FE/maxresdefault.jpg')`,
        backdropFilter: 'blur(3px)'
      }}
    >
      {/* Background blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      
      <div className="relative text-center text-white px-6 max-w-6xl z-10">
        <div className="mb-5">
          <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>The Racing Social Platform That Pays</span>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 racing-number leading-tight text-white drop-shadow-2xl">
          The Future of Racing Starts Here
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-6 font-medium text-white/95 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
          Where Racers Get Funded & Fans Get Closer
        </p>
        
        <div className="space-y-6">
          <button
            onClick={onGetStarted}
            className={`${primaryButton} space-x-2 text-xs py-1.5 px-3`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Get Your Pit Pass</span>
          </button>
          
          <div className="flex items-center justify-center space-x-6 text-white/80">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium">Racers Earn More</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium">Fans Get Closer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs font-medium">Sponsors Connect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};