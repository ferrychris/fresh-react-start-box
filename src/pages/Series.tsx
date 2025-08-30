import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Trophy, Users, Star, Calendar, Flag, Heart, DollarSign, Award } from 'lucide-react';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

export const Series: React.FC = () => {
  const { user } = useApp();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('series_profiles')
        .select('*')
        .eq('profile_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedSeries = (data || []).map((seriesProfile: any) => ({
        id: seriesProfile.id,
        name: seriesProfile.series_name || 'Unknown Series',
        type: seriesProfile.series_type || 'Racing Series',
        headquarters: seriesProfile.headquarters || 'Unknown',
        description: seriesProfile.description || 'Professional racing series',
        logo: seriesProfile.series_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${seriesProfile.series_name || 'Series'}`,
        banner: seriesProfile.banner_photo_url,
        followers: 0, // Will be calculated from followers table when created
        upcomingEvents: 0, // Will be calculated from race_schedules
        featuredRacers: seriesProfile.featured_racers?.length || 0,
        totalPurse: seriesProfile.total_purse_cents || 0,
        championshipPurse: (seriesProfile.championship_purse_cents || 0) / 100,
        totalEvents: seriesProfile.total_events || 0,
        founded: seriesProfile.founded || new Date().getFullYear(),
        rating: 4.8, // Default rating
        website: seriesProfile.website,
        contactEmail: seriesProfile.contact_email,
        contactPerson: seriesProfile.contact_person,
        createdAt: seriesProfile.created_at
      }));
      
      setSeries(formattedSeries);
    } catch (error) {
      console.error('Error loading racing series:', error);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeries = series.filter(s => {
    const matchesSearch = searchTerm === '' || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.headquarters.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      s.type.toLowerCase().includes(filterType.toLowerCase());
    
    const matchesLocation = filterLocation === 'all' || 
      s.headquarters.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'events':
        return b.upcomingEvents - a.upcomingEvents;
      case 'purse':
        return b.totalPurse - a.totalPurse;
      case 'founded':
        return a.founded - b.founded;
      default: // popular
        return b.followers - a.followers;
    }
  });

  const seriesTypes = ['Sprint Car', 'Late Model', 'Modified', 'Midget', 'Stock Car'];
  const locations = [...new Set(series.map(s => s.headquarters))];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <span className="bg-gradient-to-r from-purple-500 to-fedex-orange bg-clip-text text-transparent">
              Racing Series
            </span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Follow traveling racing series and support championship racing
          </p>
        </div>

        {/* Search and Filters */}
        <div className={`rounded-xl p-6 mb-8 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search racing series by name, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-4 py-3 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Series Types</option>
                {seriesTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className={`px-4 py-3 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="popular">Most Popular</option>
                <option value="events">Most Events</option>
                <option value="purse">Highest Purse</option>
                <option value="founded">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className={`mt-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing {sortedSeries.length} of {series.length} racing series
          </div>
        </div>

        {/* Series Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`rounded-xl overflow-hidden animate-pulse ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className={`h-32 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                <div className="p-6 pt-10">
                  <div className={`h-6 rounded w-3/4 mb-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className={`h-4 rounded w-1/2 mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className={`h-16 rounded mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className={`h-8 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    <div className={`h-8 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    <div className={`h-8 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  </div>
                  <div className={`h-10 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSeries.map(s => (
              <div
                key={s.id}
                className={`rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${
                  theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* Header Photo */}
                <div className="relative h-32 bg-gradient-to-r from-purple-600 to-fedex-orange">
                  <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                  <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {s.type}
                  </div>
                  <div className="absolute top-4 right-4 flex items-center space-x-1 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    <Star className="h-3 w-3" />
                    <span>{s.rating}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    EST. {s.founded}
                  </div>
                  <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-10">
                  <div className="mb-4">
                    <Link to={`/series/${s.id}`}>
                      <h3 className={`text-xl font-bold mb-1 hover:text-fedex-orange transition-colors cursor-pointer ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{s.name}</h3>
                    </Link>
                    <p className="text-purple-500 font-semibold mb-2">{s.type} Series</p>
                    <div className={`flex items-center text-sm mb-3 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{s.headquarters}</span>
                    </div>
                    <p className={`text-sm line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>{s.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                    <div>
                      <div className="font-bold text-purple-400">{s.followers.toLocaleString()}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Followers</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{s.upcomingEvents}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Events</div>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-400">{s.featuredRacers}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Racers</div>
                    </div>
                  </div>

                  {/* Total Purse */}
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        ${(s.totalPurse / 1000000).toFixed(1)}M
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Season Purse
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/series/${s.id}`}
                      className="flex-1 px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg text-sm font-semibold transition-colors text-center"
                    >
                      View Series
                    </Link>
                    <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}>
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && series.length === 0 && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <img 
                src="/onlyracefans-logo.png" 
                alt="OnlyRaceFans" 
                className="h-16 w-auto"
              />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No racing series yet</h3>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Be the first racing series to join OnlyRaceFans and connect with racers and fans!
            </p>
            <button
              onClick={() => {
                const event = new CustomEvent('openAuthModal', { detail: { userType: 'series' } });
                window.dispatchEvent(event);
              }}
              className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors"
            >
              Register Your Series
            </button>
          </div>
        )}

        {/* Stats */}
        <div className={`mt-16 rounded-2xl p-8 transition-all duration-300 relative overflow-hidden shadow-xl border ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-800/50' 
            : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border-gray-200/50'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.3),transparent_70%)]"></div>
          </div>
          
          <div className="relative">
            <div className="text-center mb-8">
              <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Racing Series Community
              </h2>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Professional racing series statistics and community data
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {/* Active Series */}
              <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                  : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
              }`}>
                <div className="absolute top-4 right-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/10'
                  }`}>
                    <Trophy className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="text-center pt-8">
                  <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                    {series.length}
                  </div>
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Racing Series
                  </div>
                  <div className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Active
                  </div>
                </div>
              </div>

              {/* Total Purse */}
              <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                  : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
              }`}>
                <div className="absolute top-4 right-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'
                  }`}>
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="text-center pt-8">
                  <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                    ${(series.reduce((sum, s) => sum + s.totalPurse, 0) / 1000000).toFixed(1)}M
                  </div>
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Purses
                  </div>
                  <div className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    2025 Season
                  </div>
                </div>
              </div>

              {/* Featured Racers */}
              <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                  : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
              }`}>
                <div className="absolute top-4 right-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-fedex-orange/20' : 'bg-fedex-orange/10'
                  }`}>
                    <Users className="h-6 w-6 text-fedex-orange" />
                  </div>
                </div>
                <div className="text-center pt-8">
                  <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-fedex-orange to-fedex-orange-dark bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                    {series.reduce((sum, s) => sum + s.featuredRacers, 0)}
                  </div>
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Featured Racers
                  </div>
                  <div className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Across All Series
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/80 hover:to-gray-900/80 border border-gray-700/30' 
                  : 'bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-white hover:to-gray-100 border border-gray-200/50'
              }`}>
                <div className="absolute top-4 right-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'
                  }`}>
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="text-center pt-8">
                  <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                    {series.reduce((sum, s) => sum + s.upcomingEvents, 0)}
                  </div>
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Upcoming Events
                  </div>
                  <div className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Next 30 Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Racing Series CTA */}
        <div className={`mt-16 rounded-xl p-8 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-purple-600/20 to-fedex-orange/20 border border-purple-500/30' 
            : 'bg-gradient-to-r from-purple-100/80 to-orange-100/80 border border-purple-200/50'
        }`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fedex-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Support Professional Racing Series</h2>
            <p className={`text-lg mb-6 max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Help traveling racing series increase purses, improve safety, and expand to new markets. 
              Your support keeps professional racing competitive and exciting.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <h3 className={`font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Bigger Purses</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Increase prize money for all events</p>
              </div>
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <div className="w-6 h-6 text-green-400 mx-auto mb-2">🛡️</div>
                <h3 className={`font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Safety First</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Enhanced safety equipment and protocols</p>
              </div>
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <Flag className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <h3 className={`font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Series Growth</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Expand to new tracks and markets</p>
              </div>
            </div>
            
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fedex-orange hover:from-purple-700 hover:to-fedex-orange-dark text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-3 mx-auto">
              <Heart className="h-5 w-5" />
              <span>Support Racing Series</span>
              <Award className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};