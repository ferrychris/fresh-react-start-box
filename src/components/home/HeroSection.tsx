import React from 'react';
import { Crown } from 'lucide-react';
import { primaryButton } from '../../styles/buttons';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div 
      className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center bg-cover bg-center pt-16 md:pt-0"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 27, 75, 0.6), rgba(234, 88, 12, 0.4)), url('https://i.ytimg.com/vi/UIg1O-2W-FE/maxresdefault.jpg')`,
        backdropFilter: 'blur(3px)'
      }}
    >
      {/* Background blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      
      <div className="relative text-center text-white px-4 md:px-6 max-w-6xl z-10">
        <div className="mb-5">
          <div className="relative inline-flex items-center space-x-3 px-5 py-2.5 bg-gradient-to-r from-orange-500/10 via-white/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6 group hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 overflow-visible">
            <span className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 via-purple-500/20 to-orange-500/30 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              <span className="ml-2 relative">
                The Racing Social Platform That Pays
                {/* Multiple sparkles with different animations (right side) */}
                <span className="absolute -top-2 -right-2 text-yellow-300 text-xs animate-ping opacity-75">✨</span>
                <span className="absolute -top-3 -right-4 text-yellow-200 text-xs animate-pulse" style={{ animationDelay: '0.5s' }}>✦</span>
                <span className="absolute -top-1 -right-5 text-yellow-100 text-xs animate-bounce" style={{ animationDelay: '0.3s' }}>✧</span>
                <span className="absolute -bottom-2 -right-1 text-yellow-300 text-xs animate-ping" style={{ animationDelay: '0.7s' }}>✧</span>
                <span className="absolute -bottom-3 -right-3 text-yellow-200 text-xs animate-pulse" style={{ animationDelay: '1s' }}>✦</span>
                {/* Mirrored sparkles on the left side */}
                <span className="absolute -top-2 -left-2 text-yellow-300 text-xs animate-ping opacity-75" style={{ animationDelay: '0.4s' }}>✨</span>
                <span className="absolute -top-3 -left-4 text-yellow-200 text-xs animate-pulse" style={{ animationDelay: '0.8s' }}>✦</span>
                <span className="absolute -top-1 -left-5 text-yellow-100 text-xs animate-bounce" style={{ animationDelay: '0.6s' }}>✧</span>
                <span className="absolute -bottom-2 -left-1 text-yellow-300 text-xs animate-ping" style={{ animationDelay: '1s' }}>✧</span>
                <span className="absolute -bottom-3 -left-3 text-yellow-200 text-xs animate-pulse" style={{ animationDelay: '1.2s' }}>✦</span>
              </span>
            </span>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-5 racing-number leading-tight text-white drop-shadow-2xl">
          The Future of Racing Starts Here
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 font-medium text-white/95 max-w-4xl mx-auto leading-relaxed drop-shadow-lg px-2">
          Where Racers Get Funded & Fans Get Closer
        </p>
        
        <div className="space-y-6">
          <button
            onClick={onGetStarted}
            className={`${primaryButton} space-x-2 text-xs py-1.5 px-3 mt-2`}
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