import React from 'react';
import { Crown } from 'lucide-react';
import { primaryButton } from '../../styles/buttons';

interface CallToActionSectionProps {
  onGetStarted: () => void;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="py-16 px-6 bg-gradient-to-r from-purple-600 to-orange-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 racing-number leading-tight">
          Don't just watch racing.<br />
          <span className="text-yellow-300">Fuel it. Fund it. Be part of it.</span>
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
          Join the revolution where passion meets profit and every lap counts toward your dreams.
        </p>
        
        <button
          onClick={onGetStarted}
          className={`${primaryButton} space-x-3 text-sm md:text-base px-4 py-2`}
        >
          <Crown className="w-6 h-6" />
          <span>Get Your Pit Pass</span>
        </button>
      </div>
    </div>
  );
};