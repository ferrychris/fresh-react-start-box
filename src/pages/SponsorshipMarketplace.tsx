import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  DollarSign, 
  Car, 
  Trophy, 
  Users, 
  Star,
  MapPin,
  Search,
  Filter,
  TrendingUp,
  Eye,
  Heart,
  Calendar,
  Zap,
  Crown,
  Award,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

interface RacerWithSponsorship {
  id: string;
  racerName: string;
  racerImage: string;
  carNumber: string;
  racingClass: string;
  location: string;
  bio: string;
  carPhoto: string;
  fanCount: number;
  avgViews: number;
  rating: number;
  upcomingRaces: number;
  totalSpots: number;
  availableSpots: number;
  priceRange: { min: number; max: number };
  spotTypes: string[];
}

export const SponsorshipMarketplace: React.FC = () => {
  const { racers } = useApp();
  const { theme } = useTheme();
  const { user, setShowAuthModal } = useApp();
  const [racersWithSponsorship, setRacersWithSponsorship] = useState<RacerWithSponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPriceRange, setFilterPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('price_low');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRacersWithSponsorship();
  }, []);

  const loadRacersWithSponsorship = async () => {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - using mock sponsorship data');
        generateMockRacersWithSponsorship();
        return;
      }

      // Get racers who have sponsorship spots
      const { data: racersWithSpots, error } = await supabase
        .from('sponsorship_spots')
        .select(`
          racer_id,
          spot_name,
          price_per_race,
          spot_size,
          is_available,
          racer_profiles!inner(
            id,
            username,
            profile_photo_url,
            bio,
            car_number,
            racing_class,
            hometown,
            car_photos,
            profiles!inner(
              name,
              avatar
            )
          )
        `)
        .order('price_per_race', { ascending: true });

      if (error) {
        console.error('Error loading racers with sponsorship:', error);
        generateMockRacersWithSponsorship();
        return;
      }

      // Group spots by racer
      const racerSpotsMap = new Map();
      
      (racersWithSpots || []).forEach(spot => {
        const racerId = spot.racer_id;
        if (!racerSpotsMap.has(racerId)) {
          racerSpotsMap.set(racerId, {
            racer: spot.racer_profiles,
            spots: []
          });
        }
        racerSpotsMap.get(racerId).spots.push(spot);
      });

      // Format racer data with sponsorship info
      const formattedRacers = Array.from(racerSpotsMap.entries()).map(([racerId, data]) => {
        const { racer, spots } = data;
        const availableSpots = spots.filter((s: any) => s.is_available);
        const prices = spots.map((s: any) => s.price_per_race);
        const spotTypes = [...new Set(spots.map((s: any) => s.spot_name))];
        
        return {
          id: racerId,
          racerName: racer?.profiles?.name || racer?.username || 'Unknown Racer',
          racerImage: racer?.profiles?.avatar || racer?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${racer?.profiles?.name || 'Racer'}`,
          carNumber: racer?.car_number || 'TBD',
          racingClass: racer?.racing_class || 'Racing',
          location: racer?.hometown || 'Unknown',
          bio: racer?.bio || 'Professional racer seeking sponsorship opportunities',
          carPhoto: racer?.car_photos?.[0] || racer?.profile_photo_url || '',
          fanCount: 0, // Will be calculated from fan_connections
          avgViews: Math.floor(Math.random() * 10000) + 5000,
          rating: 4.5 + Math.random() * 0.5,
          upcomingRaces: Math.floor(Math.random() * 10) + 5,
          totalSpots: spots.length,
          availableSpots: availableSpots.length,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          },
          spotTypes
        };
      });

      setRacersWithSponsorship(formattedRacers);
    } catch (error) {
      console.error('Error loading racers with sponsorship:', error);
      generateMockRacersWithSponsorship();
    } finally {
      setLoading(false);
    }
  };

  const generateMockRacersWithSponsorship = () => {
    // Generate mock data from existing racers who would have sponsorship spots
    const mockRacers: RacerWithSponsorship[] = [];
    
    // Only include racers who have complete profiles (more likely to have sponsorship)
    racers.filter(racer => racer.profileComplete !== false).forEach(racer => {
      // 60% chance a racer has sponsorship spots set up
      if (Math.random() > 0.4) {
        const spots = ['Hood', 'Door Panels', 'Rear Spoiler', 'Front Bumper', 'Quarter Panel', 'Roof'];
        const prices = [250, 350, 500, 750, 1000, 300];
        const availableSpotCount = Math.floor(Math.random() * 4) + 2; // 2-5 available spots
        const totalSpotCount = Math.floor(Math.random() * 2) + availableSpotCount; // Some may be taken
        
        const racerPrices = prices.slice(0, totalSpotCount);
        const racerSpots = spots.slice(0, totalSpotCount);
      
        mockRacers.push({
          id: racer.id,
          racerName: racer.name,
          racerImage: racer.profilePicture,
          carNumber: racer.carNumber || 'TBD',
          racingClass: racer.class || 'Racing',
          location: racer.location || 'Unknown',
          bio: racer.bio || 'Professional racer seeking sponsorship opportunities',
          carPhoto: racer.carPhotos?.[0] || racer.profilePicture,
          fanCount: racer.fanCount || 0,
          avgViews: Math.floor(Math.random() * 10000) + 5000,
          rating: 4.5 + Math.random() * 0.5,
          upcomingRaces: Math.floor(Math.random() * 10) + 5,
          totalSpots: totalSpotCount,
          availableSpots: availableSpotCount,
          priceRange: {
            min: Math.min(...racerPrices),
            max: Math.max(...racerPrices)
          },
          spotTypes: racerSpots
        });
      }
    });
    
    setRacersWithSponsorship(mockRacers);
    setLoading(false);
  };

  const filteredRacers = racersWithSponsorship.filter(racer => {
    const matchesSearch = searchTerm === '' || 
      racer.racerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      racer.carNumber.includes(searchTerm) ||
      racer.spotTypes.some(spot => spot.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = filterClass === 'all' || 
      racer.racingClass.toLowerCase().includes(filterClass.toLowerCase());
    
    const matchesLocation = filterLocation === 'all' || 
      racer.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    const matchesPriceRange = filterPriceRange === 'all' || 
      (filterPriceRange === 'under_500' && racer.priceRange.max < 500) ||
      (filterPriceRange === '500_1000' && racer.priceRange.min <= 1000 && racer.priceRange.max >= 500) ||
      (filterPriceRange === 'over_1000' && racer.priceRange.min > 1000);
    
    return matchesSearch && matchesClass && matchesLocation && matchesPriceRange;
  });

  const sortedRacers = [...filteredRacers].sort((a, b) => {
    switch (sortBy) {
      case 'price_high':
        return b.priceRange.max - a.priceRange.max;
      case 'fans':
        return b.fanCount - a.fanCount;
      case 'views':
        return b.avgViews - a.avgViews;
      case 'rating':
        return b.rating - a.rating;
      default: // price_low
        return a.priceRange.min - b.priceRange.min;
    }
  });

  const totalRacers = racersWithSponsorship.length;
  const totalSpots = racersWithSponsorship.reduce((sum, racer) => sum + racer.totalSpots, 0);
  const availableSpots = racersWithSponsorship.reduce((sum, racer) => sum + racer.availableSpots, 0);
  const startingPrice = 25; // Starting price for sponsorship spots

  // Require authentication to view sponsorship opportunities
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        {/* Hero Section */}
        <section className={`relative py-12 md:py-20 overflow-hidden ${
          theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
        }`}>
          <div className="absolute inset-0 bg-[url('https://worldofoutlaws.com/wp-content/uploads/2023/12/150A7236.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-4xl md:text-6xl mb-4 md:mb-6">🏁</div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Sponsorship
              <span className="block bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-4xl mx-auto px-4 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Connect with racers seeking sponsors. Support grassroots racing while promoting your brand.
            </p>
          </div>
        </section>

        {/* Sign In Required Section */}
        <section className={`py-16 ${
          theme === 'dark' ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`rounded-2xl p-8 md:p-12 text-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-xl`}>
              <div className="w-20 h-20 bg-fedex-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-fedex-orange" />
              </div>
              
              <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Account Required
              </h2>
              
              <p className={`text-lg mb-8 max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                To view sponsorship opportunities and connect with racers, please create a free account or sign in to your existing account.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    What you'll get with an account:
                  </h3>
                  <ul className={`text-sm space-y-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <li>• Browse all available sponsorship spots</li>
                    <li>• Contact racers directly for sponsorship deals</li>
                    <li>• View detailed racer profiles and statistics</li>
                    <li>• Track your sponsorship investments</li>
                    <li>• Get notifications about new opportunities</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`px-8 py-4 border-2 rounded-xl font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105 ${
                    theme === 'dark'
                      ? 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                      : 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>
              
              <p className={`text-sm mt-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Creating an account is free and takes less than 2 minutes
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <section className={`relative py-12 md:py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://worldofoutlaws.com/wp-content/uploads/2023/12/150A7236.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl md:text-6xl mb-4 md:mb-6">🏁</div>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Sponsorship
            <span className="block bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-4xl mx-auto px-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Connect with racers seeking sponsors. Support grassroots racing while promoting your brand.
          </p>
          
          <div className="flex justify-center">
            <Link
              to="/how-sponsorship-works"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 text-sm shadow-md hover:shadow-lg hover:scale-105"
            >
              <Trophy className="mr-2 h-4 w-4" />
              How Sponsorship Works
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>


      {/* Search and Filters */}
      <section className={`py-4 md:py-8 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-xl p-4 md:p-6 mb-6 md:mb-8 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search racers, car numbers, or spots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-sm md:text-base ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {sortedRacers.length} racers
              </div>
            </div>

            {/* Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-lg text-sm md:text-base ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Classes</option>
                  <option value="sprint">Sprint Car</option>
                  <option value="late">Late Model</option>
                  <option value="modified">Modified</option>
                  <option value="drag">Drag Racing</option>
                </select>

                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-lg text-sm md:text-base ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Locations</option>
                  <option value="ohio">Ohio</option>
                  <option value="pennsylvania">Pennsylvania</option>
                  <option value="california">California</option>
                  <option value="florida">Florida</option>
                </select>

                <select
                  value={filterPriceRange}
                  onChange={(e) => setFilterPriceRange(e.target.value)}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-lg text-sm md:text-base ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Prices</option>
                  <option value="under_500">Under $500</option>
                  <option value="500_1000">$500 - $1,000</option>
                  <option value="over_1000">Over $1,000</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-lg text-sm md:text-base ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="fans">Most Fans</option>
                  <option value="views">Most Views</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || filterClass !== 'all' || filterLocation !== 'all' || filterPriceRange !== 'all') && (
                <div className="mt-3 md:mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterClass('all');
                      setFilterLocation('all');
                      setFilterPriceRange('all');
                    }}
                    className="flex items-center space-x-2 px-3 py-1 bg-fedex-orange/20 border border-fedex-orange/30 rounded-lg text-fedex-orange text-sm hover:bg-fedex-orange/30 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>

            {/* Results Count - Desktop */}
            <div className={`hidden md:block mt-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Showing {sortedRacers.length} of {totalRacers} racers with sponsorship opportunities
            </div>
          </div>
        </div>
      </section>

      {/* Racers Grid */}
      <section className={`py-4 md:py-8 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`rounded-xl p-4 md:p-6 animate-pulse ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                }`}>
                  <div className={`h-32 md:h-40 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className={`h-4 md:h-6 rounded w-3/4 mb-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className={`h-3 md:h-4 rounded w-1/2 mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className={`h-8 md:h-10 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
          ) : sortedRacers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedRacers.map(racer => (
                <Link
                  key={racer.id}
                  to={`/racer/${racer.id}/sponsorship`}
                  className={`bg-gray-900 rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Header Photo */}
                  <div className="relative h-20 sm:h-24 md:h-32 bg-gradient-to-r from-fedex-purple to-fedex-orange">
                    {racer.carPhoto ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${racer.carPhoto})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                    )}
                    
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 bg-fedex-orange text-white px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full text-xs sm:text-sm font-bold">
                      #{racer.carNumber}
                    </div>
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                      <span className="hidden sm:inline">{racer.availableSpots} SPOTS</span>
                      <span className="sm:hidden">{racer.availableSpots}</span>
                    </div>
                    <div className="absolute bottom-0 left-2 sm:left-3 md:left-4 transform translate-y-1/2">
                      <img
                        src={racer.racerImage}
                        alt={racer.racerName}
                        className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white shadow-lg hover:border-fedex-orange transition-colors cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 md:p-6 pt-8 sm:pt-9 md:pt-10">
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 hover:text-fedex-orange transition-colors cursor-pointer leading-tight truncate">{racer.racerName}</h3>
                      <p className="text-fedex-orange font-semibold mb-1 text-xs sm:text-sm md:text-base leading-tight truncate">{racer.racingClass}</p>
                      <div className="flex items-center text-gray-400 text-xs mb-1 sm:mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{racer.location}</span>
                      </div>
                      <p className="text-gray-300 text-xs line-clamp-2 mb-2 leading-tight">{racer.bio}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center text-xs mb-2">
                      <div className="flex items-center text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{racer.fanCount || 0} {racer.fanCount === 1 ? 'fan' : 'fans'}</span>
                      </div>
                    </div>

                    {/* Sponsorship Info */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1">Sponsorship spots:</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm sm:text-base font-bold text-green-400">
                          ${racer.priceRange.min}-${racer.priceRange.max}/race
                        </span>
                        <span className="text-xs text-gray-400 truncate ml-1">
                          {racer.availableSpots}/{racer.totalSpots} available
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/racer/${racer.id}/sponsorship`;
                        }}
                        className="flex-1 px-2 py-2 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg text-xs font-semibold transition-colors text-center"
                      >
                        Sponsor
                      </button>
                      <button className="px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <Heart className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-fedex-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Target className="h-8 w-8 md:h-10 md:w-10 text-fedex-orange" />
              </div>
              <h3 className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>No Sponsorship Opportunities Found</h3>
              <p className={`text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto px-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {searchTerm || filterClass !== 'all' || filterLocation !== 'all' || filterPriceRange !== 'all'
                  ? 'Try adjusting your search terms or filters to find sponsorship opportunities.'
                  : 'Racers are still setting up their sponsorship spots. Check back soon!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterClass('all');
                    setFilterLocation('all');
                    setFilterPriceRange('all');
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors text-sm md:text-base"
                >
                  Clear Filters
                </button>
                <Link
                  to="/racers"
                  className={`px-4 md:px-6 py-2 md:py-3 border-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                    theme === 'dark'
                      ? 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                      : 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                  }`}
                >
                  Browse Racers
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How Sponsorship Works */}
      <section className={`py-12 md:py-16 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`text-2xl md:text-3xl font-bold mb-3 md:mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>How Sponsorship Works</h2>
            <p className={`text-sm md:text-lg max-w-3xl mx-auto px-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Simple, transparent sponsorship process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Search className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>1. Browse Racers</h3>
              <p className={`text-sm md:text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Find racers with available sponsorship spots
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Target className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>2. Choose Spots</h3>
              <p className={`text-sm md:text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                View all available spots and pricing
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Trophy className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>3. Sponsor & Race</h3>
              <p className={`text-sm md:text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Connect with racers and get on track
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 md:py-20 relative overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.3),transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl md:text-6xl mb-4 md:mb-6">🏆</div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Ready to Sponsor a Racer?
          </h2>
          <p className={`text-sm sm:text-base md:text-xl mb-6 md:mb-8 max-w-3xl mx-auto px-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Support grassroots racing while promoting your brand to passionate racing fans
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 text-sm md:text-lg shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Target className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Find Sponsorship Spots
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </button>
            <Link
              to="/racers"
              className={`inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border-2 rounded-xl font-semibold transition-all duration-300 text-sm md:text-lg shadow-lg hover:shadow-xl hover:scale-105 ${
                theme === 'dark'
                  ? 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                  : 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
              }`}
            >
              <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Browse All Racers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};