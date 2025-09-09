import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, ArrowRight, Heart, Star } from 'lucide-react';
import { cardPrimaryButton, iconButton } from '../../styles/buttons';

interface Racer {
  id: string;
  name: string;
  class: string;
  location: string;
  bio: string;
  fanCount?: number;
  bannerImage?: string | null;
  profilePicture: string;
}

interface FeaturedRacersSectionProps {
  theme: 'light' | 'dark' | string;
  racers: Racer[];
}

const FeaturedRacersSection: React.FC<FeaturedRacersSectionProps> = ({ theme, racers }) => {
  return (
    <section className={`py-12 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Featured Racers</h2>
            <p className={`text-sm md:text-base ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Support your favorite racing heroes</p>
          </div>
          <Link
            to="/racers"
            className={`inline-flex items-center px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              theme === 'dark'
                ? 'text-fedex-orange hover:text-fedex-orange-dark'
                : 'text-fedex-orange hover:text-fedex-orange-dark'
            }`}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {racers.map((racer) => (
            <div className={`relative rounded-xl border transition-all duration-200 ${theme === 'dark' ? 'bg-gray-950/80 border-gray-800 hover:border-gray-700 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'} hover:shadow-md`}>
              {/* Featured Badge */}
              <div className={`relative`}> {/* wrapper for sparkles */}
                <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>Featured</span>
                  {/* Sparkles */}
                  <span className="absolute -top-2 -right-2 text-yellow-300 text-xs animate-ping opacity-75">✨</span>
                  <span className="absolute -top-3 -right-4 text-yellow-200 text-xs animate-pulse" style={{animationDelay: '0.5s'}}>✦</span>
                  <span className="absolute -top-1 -right-5 text-yellow-100 text-xs animate-bounce" style={{animationDelay: '0.3s'}}>✧</span>
                  <span className="absolute -bottom-2 -right-1 text-yellow-300 text-xs animate-ping" style={{animationDelay: '0.7s'}}>✧</span>
                  <span className="absolute -bottom-3 -right-3 text-yellow-200 text-xs animate-pulse" style={{animationDelay: '1s'}}>✦</span>
                </div>
              </div>
              <div className="p-5">
                {/* Top: Avatar + Basic Info */}
                <div className="flex items-center gap-4">
                  <Link to={`/racer/${racer.id}`} className="shrink-0">
                    <img
                      src={racer.profilePicture}
                      alt={racer.name}
                      className={`w-14 h-14 rounded-full object-cover ring-2 ${
                        theme === 'dark' ? 'ring-gray-800' : 'ring-gray-200'
                      }`}
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/racer/${racer.id}`}>
                      <h3
                        className={`text-base md:text-lg font-semibold truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        } hover:text-fedex-orange transition-colors`}
                        title={racer.name}
                      >
                        {racer.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <span className="text-fedex-orange font-medium">{racer.class}</span>
                      <span className={theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}>•</span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        <span className="inline-flex items-center">
                          <MapPin className="h-4 w-4 mr-1 opacity-80" /> {racer.location}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p
                  className={`mt-4 text-sm line-clamp-3 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {racer.bio}
                </p>

                {/* Footer: Stats + Actions */}
                <div className="mt-5 flex items-center justify-between">
                  <div
                    className={`inline-flex items-center text-xs md:text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {racer.fanCount || 0} {racer.fanCount === 1 ? 'fan' : 'fans'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/racer/${racer.id}`}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-[20px] text-sm font-bold text-orange-500 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 dark:hover:bg-orange-950/20`}
                    >
                      View Profile
                    </Link>
                    <button className={`p-2 rounded-[20px] text-fedex-orange hover:text-fedex-orange-dark transition-colors bg-transparent`} aria-label="Like racer">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedRacersSection;
