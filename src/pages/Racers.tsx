import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Trophy, Users, Star, Zap, DollarSign, TrendingUp, X, Heart } from 'lucide-react';
import { useApp } from '../App';
import { raceClasses } from '../data/raceClasses';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { LiveStreamIndicator } from '../components/LiveStreamIndicator';

export const Racers: React.FC = () => {
  const { racers, loadRacers } = useApp();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeRacers: 0,
    raceClasses: 47,
    states: 0,
    totalRaised: 0
  });

  // Load racers on component mount (only if not already loaded). Load stats regardless.
  useEffect(() => {
    if (!racers || racers.length === 0) {
      loadRacersData();
    } else {
      setLoading(false);
    }
    loadStats();
  }, [racers?.length]);

  const loadRacersData = async () => {
    try {
      await loadRacers();
    } catch (error) {
      console.error('Error loading racers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get active racers count
      const { data: racerProfiles, error: racerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'racer')
        .eq('profile_complete', true);
      
      if (racerError) throw racerError;

      // Get unique states count
      const { data: locations, error: locationError } = await supabase
        .from('racer_profiles')
        .select('hometown')
        .not('hometown', 'is', null);
      
      if (locationError) throw locationError;

      console.log("locations", locations);
      
      const uniqueStates = new Set(
        locations?.map((l: { hometown: string | null }) => l.hometown?.split(',')[1]?.trim()).filter(Boolean) || []
      ).size;

      // Get total raised amount
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('total_amount_cents')
        .eq('status', 'completed');
      
      if (transactionError) throw transactionError;

      const totalRaisedCents = transactions?.reduce((sum: number, t: { total_amount_cents: number | null }) => sum + (t.total_amount_cents || 0), 0) || 0;

      setStats({
        activeRacers: racerProfiles?.length || 0,
        raceClasses: raceClasses.length,
        states: uniqueStates,
        totalRaised: Math.round(totalRaisedCents / 100)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredRacers = useMemo(() => {
    console.log('Filtering racers:', racers.length, 'total racers');
    
    return racers.filter(racer => {
      // Show racers even if their profile is not complete, but they have basic info
      // Only filter out if they have no name or essential information
      if (!racer.name || racer.name.trim() === '') {
        console.log('Filtering out racer with no name:', racer);
      return false;
    }
    
    const matchesSearch = searchTerm.trim() === '' || 
      racer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (racer.carNumber && racer.carNumber.includes(searchTerm)) ||
        (racer.location && racer.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = filterClass === 'all' || 
        (racer.class && racer.class.toLowerCase().includes(filterClass.toLowerCase()));
    
    const matchesLocation = filterLocation === 'all' || 
        (racer.location && racer.location.toLowerCase().includes(filterLocation.toLowerCase()));
      
      const shouldInclude = matchesSearch && matchesClass && matchesLocation;
      
      if (!shouldInclude) {
        console.log('Filtering out racer:', racer.name, 'search:', matchesSearch, 'class:', matchesClass, 'location:', matchesLocation);
      }
      
      return shouldInclude;
    });
  }, [racers, searchTerm, filterClass, filterLocation]);

  const sortedRacers = useMemo(() => {
    return [...filteredRacers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price':
        const aPrice = a.subscriptionTiers && a.subscriptionTiers.length > 0 ? a.subscriptionTiers[0].price : 0;
        const bPrice = b.subscriptionTiers && b.subscriptionTiers.length > 0 ? b.subscriptionTiers[0].price : 0;
        return aPrice - bPrice;
      default: // popular
        return (b.fanCount || 0) - (a.fanCount || 0);
    }
  });
  }, [filteredRacers, sortBy]);

  const locations = useMemo(() => {
    return [...new Set(racers.map(r => r.location))];
  }, [racers]);

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-fedex-orange bg-clip-text text-transparent">
              Discover Racers
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Support your favorite racing heroes and get exclusive access to their journey
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading racers...</p>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Search Overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
            <div className="flex items-start justify-center pt-20 px-4">
              <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Find Your Racer</h3>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchTerm('');
                    }}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or car number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                    autoFocus
                  />
                </div>
                
                {/* Search Results */}
                {searchTerm.trim() && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredRacers.slice(0, 5).map(racer => (
                      <Link
                        key={racer.id}
                        to={`/racer/${racer.id}`}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchTerm('');
                        }}
                        className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <img
                          src={racer.profilePicture}
                          alt={racer.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">{racer.name}</div>
                          <div className="text-sm text-gray-400">#{racer.carNumber} • {racer.class}</div>
                        </div>
                      </Link>
                    ))}
                    
                    {filteredRacers.length === 0 && (
                      <div className="text-center py-4 text-gray-400">
                        <p className="text-sm">No racers found matching "{searchTerm}"</p>
                      </div>
                    )}
                    
                    {filteredRacers.length > 5 && (
                      <div className="text-center py-2">
                        <button
                          onClick={() => {
                            setShowSearch(false);
                            // The search term will remain and filter the main grid
                          }}
                          className="text-fedex-orange hover:text-fedex-orange-light text-sm font-medium"
                        >
                          View all {filteredRacers.length} results
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {!searchTerm.trim() && (
                  <div className="text-center py-4 text-gray-400">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search for racers</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
            >
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-gray-400">Search racers...</span>
            </button>
            
            {searchTerm && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-fedex-orange/20 border border-fedex-orange/30 rounded-lg">
                <span className="text-fedex-orange text-sm">Searching: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 hover:bg-fedex-orange/20 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-fedex-orange" />
                </button>
              </div>
            )}
          </div>
          
          <div className="text-gray-400 text-sm">
            {searchTerm ? `${sortedRacers.length} results` : `${racers.length} racers`}
          </div>
        </div>

        {/* Racers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {sortedRacers.map(racer => (
            <Link
              to={`/racer/${racer.id}`}
              key={racer.id}
              className="bg-gray-900 rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {/* Header Photo */}
              <div className="relative h-20 sm:h-24 md:h-32 bg-gradient-to-r from-fedex-purple to-fedex-orange">
                {racer.bannerImage && racer.bannerImage.trim() !== '' ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${racer.bannerImage})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                )}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 bg-fedex-orange text-white px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full text-xs sm:text-sm font-bold">
                  #{racer.carNumber}
                </div>
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                  <span className="hidden sm:inline">VERIFIED RACER</span>
                  <span className="sm:hidden">✓</span>
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                  <LiveStreamIndicator streamerId={racer.id} />
                </div>
                <div className="absolute bottom-0 left-2 sm:left-3 md:left-4 transform translate-y-1/2">
                  <img
                    src={racer.profilePicture && racer.profilePicture.trim() !== '' 
                      ? racer.profilePicture 
                      : `https://api.dicebear.com/7.x/initials/svg?seed=${racer.name}`}
                      alt={racer.name}
                      className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white shadow-lg hover:border-fedex-orange transition-colors cursor-pointer"
                    />
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 md:p-6 pt-8 sm:pt-9 md:pt-10">
                <div className="mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 hover:text-fedex-orange transition-colors cursor-pointer leading-tight truncate">{racer.name}</h3>
                  <p className="text-fedex-orange font-semibold mb-1 text-xs sm:text-sm md:text-base leading-tight truncate">{racer.class}</p>
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

                {/* Subscription Tiers */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Starting at:</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm sm:text-base font-bold text-green-400">
                          ${racer.subscriptionTiers && racer.subscriptionTiers.length > 0 ? racer.subscriptionTiers[0].price : 0}/mo
                    </span>
                    <span className="text-xs text-gray-400 truncate ml-1">
                          {racer.subscriptionTiers && racer.subscriptionTiers.length > 0 ? racer.subscriptionTiers[0].name : 'Basic'} tier
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/racer/${racer.id}`;
                    }}
                    className="flex-1 px-2 py-2 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg text-xs font-semibold transition-colors text-center"
                  >
                    View
                  </button>
                  <button className="px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    <Heart className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {racers.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <img 
                src="/onlyracefans-logo.png" 
                alt="OnlyRaceFans" 
                className="h-16 w-auto"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">No racers yet</h3>
            <p className="text-gray-400 mb-6">
              Be the first racer to join OnlyRaceFans and start building your fanbase!
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
            >
              Sign Up as a Racer
            </button>
          </div>
            ) : sortedRacers.length === 0 && !loading && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No racers found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterClass('all');
                setFilterLocation('all');
              }}
              className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Stats */}
            <div className={`mt-16 rounded-2xl p-8 transition-all duration-300 relative overflow-hidden ${
              theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
            } shadow-xl border ${
              theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/50'
            }`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.3),transparent_70%)]"></div>
              </div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Racing Community Stats
                  </h2>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Real-time statistics from our growing racing community
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  {/* Active Racers */}
                  <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                      : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
                  } shadow-lg hover:shadow-xl backdrop-blur-sm`}>
                    <div className="absolute top-4 right-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-fedex-orange/20' : 'bg-fedex-orange/10'
                      }`}>
                        <Users className="h-6 w-6 text-fedex-orange" />
                      </div>
                    </div>
                    <div className="text-center pt-8">
                      <div className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-fedex-orange to-fedex-orange-dark bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                        {stats.activeRacers}
                      </div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Active Racers
                      </div>
                      <div className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Verified Profiles
                      </div>
                    </div>
                  </div>

                  {/* Race Classes */}
                  <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                      : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
                  } shadow-lg hover:shadow-xl backdrop-blur-sm`}>
                    <div className="absolute top-4 right-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/10'
                      }`}>
                        <Trophy className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="text-center pt-8">
                      <div className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                        {stats.raceClasses}
                      </div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Race Classes
                      </div>
                      <div className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Available
                      </div>
                    </div>
                  </div>

                  {/* States */}
                  <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                      : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
                  } shadow-lg hover:shadow-xl backdrop-blur-sm`}>
                    <div className="absolute top-4 right-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'
                      }`}>
                        <MapPin className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="text-center pt-8">
                      <div className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                        {stats.states}
                      </div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        States
                      </div>
                      <div className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Represented
                      </div>
                    </div>
                  </div>

                  {/* Total Raised */}
                  <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                      : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
                  } shadow-lg hover:shadow-xl backdrop-blur-sm`}>
                    <div className="absolute top-4 right-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'
                      }`}>
                        <DollarSign className="h-6 w-6 text-green-500" />
                      </div>
            </div>
                    <div className="text-center pt-8">
                      <div className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                        ${stats.totalRaised.toLocaleString()}
            </div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Raised
            </div>
                      <div className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        This Month
            </div>
          </div>
        </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};