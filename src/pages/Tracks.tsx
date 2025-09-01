import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Flag, Users, Star, Calendar, Trophy, Heart, DollarSign } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase, getTrackFollowerCount } from '../lib/supabase';

export const Tracks: React.FC = () => {
  const { user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackTypesCount, setTrackTypesCount] = useState(0);

  // Load tracks from database
  React.useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      // First, let's check what profiles exist
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      console.log('All profiles:', allProfiles);

      // Get profiles that have track_profiles
      const { data, error } = await supabase
        .from('track_profiles')
        .select(`
          *,
          profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Track profiles:', data);

      const formattedTracks = (data || []).map((trackProfile: any) => ({
        rawData: trackProfile, // Debug: include raw data
        id: trackProfile.profiles?.id || trackProfile.id,
        name: trackProfile.track_name || trackProfile.profiles?.name || 'Unknown Track',
        type: trackProfile.track_type || 'Racing Track',
        location: trackProfile.location || 'Unknown',
        logo: trackProfile.track_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${trackProfile.track_name || 'Track'}`,
        banner: trackProfile.banner_photo_url,
        description: `Professional racing facility featuring ${trackProfile.classes_hosted?.length || 0} racing classes`,
        followers: '0', // Will be calculated from actual data
        upcomingEvents: 0, // Will be calculated from race_schedules
        featuredRacers: trackProfile.featured_racers?.length || 0,
        classes: trackProfile.classes_hosted || [],
        rating: 4.5, // Default rating
        website: trackProfile.website,
        contactEmail: trackProfile.contact_email,
        contactPerson: trackProfile.contact_person,
        contactPhone: trackProfile.contact_phone,
        profileComplete: trackProfile.profiles?.profile_complete || false,
        createdAt: trackProfile.created_at || trackProfile.profiles?.created_at
      }));
      
      console.log('Formatted tracks:', formattedTracks);
      setTracks(formattedTracks);
      
      // Calculate unique track types
      const uniqueTrackTypes = new Set(
        formattedTracks
          .map(track => track.type)
          .filter(type => type && type.trim() !== '')
      );
      setTrackTypesCount(uniqueTrackTypes.size);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };


  const filteredTracks = tracks.filter(track => {
    const matchesSearch = searchTerm === '' || 
      track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      track.type.toLowerCase().includes(filterType.toLowerCase());
    
    const matchesLocation = filterLocation === 'all' || 
      track.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'events':
        return b.upcomingEvents - a.upcomingEvents;
      case 'rating':
        return b.rating - a.rating;
      default: // popular
        return parseInt(b.followers.replace('K', '000').replace('.', '')) - 
               parseInt(a.followers.replace('K', '000').replace('.', ''));
    }
  })
        .filter(track => track.name !== 'Test Track' && track.name !== 'Unknown Track'); // Remove test and unknown tracks

      console.log('All tracks before filtering:', sortedTracks.map(t => ({ name: t.name, id: t.id })));
      console.log('Filtered tracks:', sortedTracks.filter(track => track.name !== 'Test Track' && track.name !== 'Unknown Track').map(t => ({ name: t.name, id: t.id })));

  const trackTypes = ['Dirt Oval', 'Asphalt Oval', 'Drag Strip', 'Road Course', 'Kart Track'];
  const locations = [...new Set(tracks.map(t => t.location))];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-fedex-orange bg-clip-text text-transparent">
              Racing Tracks
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover racing venues and follow your favorite tracks for event updates
          </p>
        </div>

        {/* Search and Filters */}

        {/* Tracks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-800" />
                <div className="p-6 pt-10">
                  <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                  <div className="h-16 bg-gray-800 rounded mb-4" />
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="h-8 bg-gray-800 rounded" />
                    <div className="h-8 bg-gray-800 rounded" />
                    <div className="h-8 bg-gray-800 rounded" />
                  </div>
                  <div className="h-10 bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTracks.map(track => (
            <div
              key={track.id}
              className="bg-gray-900 rounded-xl overflow-hidden group hover:bg-gray-800 transition-all transform hover:scale-105"
            >
              {/* Header Photo */}
              <div className="relative h-32 bg-gradient-to-r from-fedex-purple to-fedex-orange">
                {track.banner ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${track.banner})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center opacity-30" />
                )}
                <div className="absolute top-4 left-4 bg-fedex-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                  {track.type}
                </div>
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  <Star className="h-3 w-3" />
                  <span>{track.rating}</span>
                </div>
                <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                  <img
                    src={track.logo}
                    alt={track.name}
                    className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-10">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">{track.name}</h3>
                  <div className="flex items-center text-gray-400 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{track.location}</span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">{track.description}</p>
                </div>

                {/* Classes */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {track.classes.slice(0, 3).map((cls: any) => (
                    <span key={cls} className="px-2 py-1 bg-fedex-purple/20 text-xs rounded">
                      {cls}
                    </span>
                  ))}
                  {track.classes.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      +{track.classes.length - 3} more
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                  <div>
                    <div className="font-bold text-blue-400">{track.followers}</div>
                    <div className="text-gray-400 text-xs">Followers</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-400">{track.upcomingEvents}</div>
                    <div className="text-gray-400 text-xs">Events</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-400">{track.featuredRacers}</div>
                    <div className="text-gray-400 text-xs">Racers</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/track/${track.id}`}
                    className="flex-1 px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-sm font-semibold transition-colors text-center"
                  >
                    View Profile
                  </Link>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Empty State */}
        {!loading && tracks.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <img 
                src="/onlyracefans-logo.png" 
                alt="OnlyRaceFans" 
                className="h-16 w-auto"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tracks registered yet</h3>
            <p className="text-gray-400 mb-6">
              Be the first track to join OnlyRaceFans and connect with racers!
            </p>
            <button
              onClick={() => {
                const event = new CustomEvent('openAuthModal', { detail: { userType: 'track' } });
                window.dispatchEvent(event);
              }}
              className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
            >
              Register Your Track
            </button>
          </div>
        ) : !loading && sortedTracks.length === 0 && (
          <div className="text-center py-16">
            <Flag className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterLocation('all');
              }}
              className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Purse Builder CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Support Your Local Racing Tracks</h2>
            <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
              Help keep the engines roaring! Your donations support track maintenance, safety improvements, 
              enhanced race purses, and special events that make racing possible.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="w-6 h-6 text-blue-400 mx-auto mb-2">🔧</div>
                <h3 className="font-semibold text-white mb-1">Track Maintenance</h3>
                <p className="text-sm text-gray-400">Keep the racing surface in top condition</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-1">Race Purses</h3>
                <p className="text-sm text-gray-400">Increase prize money for racers</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="w-6 h-6 text-green-400 mx-auto mb-2">🎯</div>
                <h3 className="font-semibold text-white mb-1">Safety Upgrades</h3>
                <p className="text-sm text-gray-400">Enhance safety equipment and barriers</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <Calendar className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-1">Special Events</h3>
                <p className="text-sm text-gray-400">Fund championship races and festivals</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                // For now, open a general donation modal
                // In a real implementation, this would open the PurseBuilderModal
                alert('Purse Builder donation system coming soon! This will allow fans to donate to support track operations, race purses, and facility improvements.');
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg flex items-center space-x-3 mx-auto"
            >
              <Heart className="h-5 w-5" />
              <span>Support Racing Tracks</span>
              <DollarSign className="h-5 w-5" />
            </button>
            
            <p className="text-sm text-gray-400 mt-4">
              🔒 Secure donations powered by Stripe • Tax-deductible receipts provided
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 bg-gray-900 rounded-xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-fedex-orange mb-2">{loading ? '...' : tracks.length}</div>
              <div className="text-gray-400">Racing Tracks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-fedex-orange mb-2">{trackTypesCount}</div>
              <div className="text-gray-400">Track Types</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-fedex-orange mb-2">8</div>
              <div className="text-gray-400">States</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-fedex-orange mb-2">156</div>
              <div className="text-gray-400">Total Events</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};