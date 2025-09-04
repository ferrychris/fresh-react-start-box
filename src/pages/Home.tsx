import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { HeroSection } from '../components/home/HeroSection';
import FeaturedRacersSection from '../components/home/FeaturedRacersSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import { CallToActionSection } from '../components/home/CTASection';
import Footer from '../components/Footer';

export const Home: React.FC = () => {
  const { racers, loadRacers } = useApp();
  const { theme } = useTheme();
  const navigate = useNavigate();
  // Ensure racers are loaded on mount (only if not already loaded)
  useEffect(() => {
    if (!racers || racers.length === 0) {
      loadRacers().catch((error: unknown) => {
        console.error('Error loading racers:', error);
      });
    }
  }, [racers?.length, loadRacers]);

  const featuredRacers = racers.slice(0, 6);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <HeroSection onGetStarted={() => navigate('/racers')} />

      {/* Featured Racers */}
      <FeaturedRacersSection theme={theme} racers={featuredRacers} />

      {/* How It Works */}
      <HowItWorksSection theme={theme} />

      {/* CTA Section */}
      <CallToActionSection onGetStarted={() => navigate('/racers')} />

      {/* Footer */}
      <Footer />
    </div>
  );
};