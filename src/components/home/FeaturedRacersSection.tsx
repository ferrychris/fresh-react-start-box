import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, ArrowRight, Heart } from 'lucide-react';
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
    <section className={`py-16 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Featured Racers</h2>
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Support your favorite racing heroes</p>
          </div>
          <Link
            to="/racers"
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
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
          {racers.map(racer => (
            <div
              key={racer.id}
              className={`rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl`}
            >
              {/* Header Photo */}
              <div className="relative h-32 bg-gradient-to-r from-fedex-purple to-fedex-orange">
                {racer.bannerImage ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${racer.bannerImage})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                )}
                <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  VERIFIED RACER
                </div>
                <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                  <img
                    src={racer.profilePicture}
                    alt={racer.name}
                    className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg hover:border-fedex-orange transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-10">
                <div className="mb-4">
                  <Link to={`/racer/${racer.id}`}>
                    <h3 className={`text-xl font-bold mb-1 hover:text-fedex-orange transition-colors cursor-pointer ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{racer.name}</h3>
                  </Link>
                  <p className="text-fedex-orange font-semibold mb-2">{racer.class}</p>
                  <div className={`flex items-center text-sm mb-3 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{racer.location}</span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>{racer.bio}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className={`flex items-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Users className="h-4 w-4 mr-1" />
                    <span>{racer.fanCount || 0} {racer.fanCount === 1 ? 'fan' : 'fans'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link 
                    to={`/racer/${racer.id}`}
                    className={`${cardPrimaryButton} text-center`}
                  >
                    View Profile
                  </Link>
                  <button className={iconButton}>
                    <Heart className="h-4 w-4" />
                  </button>
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
