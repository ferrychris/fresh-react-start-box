import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Flag, 
  Users, 
  Star, 
  Calendar, 
  Trophy, 
  Globe,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  UserPlus,
  Bell,
  Heart,
  Share2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase, checkTrackFollow, getTrackFollowerCount, toggleTrackFollow } from '../lib/supabase';
import { ShareModal } from '../components/ShareModal';
import { DynamicMetaTags } from '../components/DynamicMetaTags';

export const TrackProfile: React.FC = () => {
  const { id } = useParams();
  const { user } = useApp();
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [featuredRacers, setFeaturedRacers] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTrackProfile();
      loadFollowerCount();
      checkFollowStatus();
      loadUpcomingEvents();
      loadFeaturedRacers();
    }
  }, [id]);

  const loadFollowerCount = async () => {
    if (!id) return;
    try {
      const count = await getTrackFollowerCount(id);
      setFollowerCount(count);
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !id) return;
    try {
      const following = await checkTrackFollow(user.id, id);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const loadTrackProfile = async () => {
    try {
      console.log('Loading track profile for ID:', id);
      
      // Try multiple approaches to find the track
      let trackData = null;
      let error = null;
      
      // Approach 1: Try to find in track_profiles table by ID
      try {
        const { data: trackProfile, error: trackError } = await supabase
          .from('track_profiles')
          .select(`
            *,
            profiles (*)
          `)
          .eq('id', id)
          .single();

        console.log('Track profile query result:', trackProfile, 'Error:', trackError);
        
        if (!trackError && trackProfile) {
          trackData = {
            id: trackProfile.profiles?.id || trackProfile.id,
            name: trackProfile.track_name || trackProfile.profiles?.name || 'Unknown Track',
            type: trackProfile.track_type || 'Racing Track',
            location: trackProfile.location || 'Unknown',
            logo: trackProfile.track_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${trackProfile.track_name || 'Track'}`,
            banner: trackProfile.banner_photo_url,
            description: `Professional racing facility featuring ${trackProfile.classes_hosted?.length || 0} racing classes`,
            upcomingEvents: 5, // Will be calculated from race_schedules
            featuredRacers: trackProfile.featured_racers?.length || 0,
            classes: trackProfile.classes_hosted || [],
            rating: 4.5,
            website: trackProfile.website,
            contactEmail: trackProfile.contact_email,
            contactPerson: trackProfile.contact_person,
            profileComplete: trackProfile.profiles?.profile_complete || false,
            createdAt: trackProfile.created_at || trackProfile.profiles?.created_at
          };
        }
      } catch (e) {
        console.log('Track profile approach failed:', e);
      }
      
      // Approach 2: If not found, try to find in profiles table by ID
      if (!trackData) {
        try {
          console.log('Trying to find by profile ID...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              track_profiles (*)
            `)
            .eq('id', id)
            .single();

          console.log('Profile query result:', profileData, 'Error:', profileError);

          if (!profileError && profileData && profileData.track_profiles) {
            trackData = {
              id: profileData.id,
              name: profileData.track_profiles.track_name || profileData.name,
              type: profileData.track_profiles.track_type || 'Racing Track',
              location: profileData.track_profiles.location || 'Unknown',
              logo: profileData.track_profiles.track_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.name}`,
              banner: profileData.track_profiles.banner_photo_url,
              description: `Professional racing facility featuring ${profileData.track_profiles.classes_hosted?.length || 0} racing classes`,
              upcomingEvents: 5, // Will be calculated from race_schedules
              featuredRacers: profileData.track_profiles.featured_racers?.length || 0,
              classes: profileData.track_profiles.classes_hosted || [],
              rating: 4.5,
              website: profileData.track_profiles.website,
              contactEmail: profileData.track_profiles.contact_email,
              contactPerson: profileData.track_profiles.contact_person,
              profileComplete: profileData.profile_complete,
              createdAt: profileData.created_at
            };
          }
        } catch (e) {
          console.log('Profile approach failed:', e);
        }
      }
      
      // Approach 3: If still not found, try to find track_profiles by profile_id
      if (!trackData) {
        try {
          console.log('Trying to find track_profiles by profile_id...');
          const { data: trackByProfile, error: trackByProfileError } = await supabase
            .from('track_profiles')
            .select(`
              *,
              profiles (*)
            `)
            .eq('profile_id', id)
            .single();

          console.log('Track by profile_id query result:', trackByProfile, 'Error:', trackByProfileError);

          if (!trackByProfileError && trackByProfile) {
            trackData = {
              id: trackByProfile.profiles?.id || trackByProfile.id,
              name: trackByProfile.track_name || trackByProfile.profiles?.name || 'Unknown Track',
              type: trackByProfile.track_type || 'Racing Track',
              location: trackByProfile.location || 'Unknown',
              logo: trackByProfile.track_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${trackByProfile.track_name || 'Track'}`,
              banner: trackByProfile.banner_photo_url,
              description: `Professional racing facility featuring ${trackByProfile.classes_hosted?.length || 0} racing classes`,
              upcomingEvents: 5, // Will be calculated from race_schedules
              featuredRacers: trackByProfile.featured_racers?.length || 0,
              classes: trackByProfile.classes_hosted || [],
              rating: 4.5,
              website: trackByProfile.website,
              contactEmail: trackByProfile.contact_email,
              contactPerson: trackByProfile.contact_person,
              profileComplete: trackByProfile.profiles?.profile_complete || false,
              createdAt: trackByProfile.created_at || trackByProfile.profiles?.created_at
            };
          }
        } catch (e) {
          console.log('Track by profile_id approach failed:', e);
        }
      }
      
      if (trackData) {
        console.log('Found track data:', trackData);
        setTrack(trackData);
      } else {
        console.log('No track found with any approach');
        error = new Error('Track not found');
      }
      
    } catch (error) {
      console.error('Error loading track profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('race_schedules')
        .select('*')
        .eq('track_id', id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      
      // Format the events for display
      const formattedEvents = (data || []).map(event => ({
        id: event.id,
        name: event.event_name,
        date: event.event_date,
        time: event.event_time,
        track: event.track_name,
        location: event.location,
        classes: [], // Will be added when we enhance the schema
        payout: '$5,000', // Default for now
        status: 'upcoming'
      }));
      
      setUpcomingEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadFeaturedRacers = async () => {
    try {
      // Load featured racers based on track's featured_racers array
      if (track?.featuredRacers && track.featuredRacers.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            racer_profiles (*)
          `)
          .in('id', track.featuredRacers)
          .eq('user_type', 'racer');

        if (error) throw error;
        setFeaturedRacers(data || []);
      }
    } catch (error) {
      console.error('Error loading featured racers:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      alert('Please sign in to follow tracks');
      return;
    }
    if (!id) return;

    setFollowLoading(true);
    try {
      const result = await toggleTrackFollow(user.id, id);
      setIsFollowing(result.following);
      setFollowerCount(result.follower_count);
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading track profile...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Flag className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold text-white mb-4">Track Not Found</h2>
          <p className="text-gray-400 mb-6">The track you're looking for doesn't exist or isn't published yet.</p>
          <Link
            to="/tracks"
            className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            Browse All Tracks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {track && (
        <DynamicMetaTags
          title={`${track.name} - OnlyRaceFans.co`}
          description={track.description || `Check out ${track.name} on OnlyRaceFans!`}
          image={track.logo || 'https://onlyracefans.co/onlyracefans-logo.png'}
          url={`${window.location.origin}/track/${track.id}`}
          type="website"
        />
      )}
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-gray-900 to-gray-800">
        {track.banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${track.banner})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 h-full">
          {/* Track Logo */}
          <div className="absolute bottom-0 left-1/2 md:left-4 lg:left-8 transform -translate-x-1/2 md:translate-x-0 translate-y-1/2">
            <img
              src={track.logo}
              alt={track.name}
              className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 rounded-full border-4 md:border-6 border-white shadow-2xl object-cover"
            />
          </div>
        </div>
      </div>

      {/* Track Info Section */}
      <div className="bg-gray-900 pt-16 md:pt-20 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center md:text-left md:ml-40 lg:ml-48">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start space-y-2 md:space-y-0 md:space-x-4 mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{track.name}</h1>
              <div className="bg-fedex-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                {track.type}
              </div>
              <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                VERIFIED TRACK
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4 lg:gap-6 text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {track.location}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {track.upcomingEvents} upcoming events
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 text-yellow-400" />
                {track.rating} rating
              </div>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-3xl mx-auto md:mx-0 px-4 md:px-0">
              {track.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start px-4 md:px-0">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 rounded-lg font-bold text-sm md:text-base lg:text-lg transition-all flex items-center justify-center space-x-2 ${
                  followLoading
                    ? 'bg-gray-600 cursor-not-allowed text-white'
                    : 
                  isFollowing
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isFollowing ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : <UserPlus className="h-4 w-4 md:h-5 md:w-5" />}
                <span>
                  {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Track'}
                </span>
              </button>
              
              <button className="px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-bold text-sm md:text-base lg:text-lg transition-all">
                <Bell className="inline h-4 w-4 mr-1 md:mr-2" />
                Get Event Notifications
              </button>
              
              <button 
                onClick={() => {
                  // Open Purse Builder modal
                  alert('Support this track with donations for operations, race purses, and facility improvements!');
                }}
                className="px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-bold text-sm md:text-base lg:text-lg transition-all"
              >
                <Heart className="inline h-4 w-4 mr-1 md:mr-2" />
                Donate to Track
              </button>
              
              {track.website && (
                <a
                  href={track.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 border-2 border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white rounded-lg font-bold text-sm md:text-base lg:text-lg transition-all"
                >
                  <Globe className="inline h-4 w-4 mr-1 md:mr-2" />
                  Visit Website
                </a>
              )}
              
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm md:text-base lg:text-lg transition-all"
              >
                <Share2 className="inline h-4 w-4 mr-1 md:mr-2" />
                Share Track
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Racing Classes */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Racing Classes Hosted</h3>
              {track.classes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {track.classes.map((cls: string) => (
                    <div key={cls} className="bg-gray-800 rounded-lg p-3 text-center">
                      <Trophy className="h-5 w-5 mx-auto mb-2 text-fedex-orange" />
                      <span className="text-sm font-medium text-white">{cls}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No racing classes specified yet.</p>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{event.event_name}</h4>
                        <div className="text-fedex-orange font-bold">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </div>
                      {event.event_time && (
                        <div className="flex items-center text-gray-400 text-sm mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.event_time}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming events scheduled yet.</p>
                </div>
              )}
            </div>

            {/* Featured Racers */}
            {featuredRacers.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Featured Racers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredRacers.map((racer) => (
                    <Link
                      key={racer.id}
                      to={`/racer/${racer.id}`}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={racer.racer_profiles?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${racer.name}`}
                          alt={racer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-white">{racer.name}</h4>
                          <p className="text-sm text-gray-400">
                            #{racer.racer_profiles?.car_number} • {racer.racer_profiles?.racing_class}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Track Stats */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Track Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="font-semibold text-white">{followerCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Track Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-semibold text-white">{track.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Racing Classes</span>
                  <span className="font-semibold text-white">{track.classes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Upcoming Events</span>
                  <span className="font-semibold text-white">{track.upcomingEvents}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                {track.contactPerson && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{track.contactPerson}</span>
                  </div>
                )}
                {track.contactEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${track.contactEmail}`}
                      className="text-fedex-orange hover:text-fedex-orange-light transition-colors"
                    >
                      {track.contactEmail}
                    </a>
                  </div>
                )}
                {track.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a
                      href={track.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fedex-orange hover:text-fedex-orange-light transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                    followLoading
                      ? 'bg-gray-600 cursor-not-allowed text-white'
                      : 
                    isFollowing
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Track'}
                </button>
                <button className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors">
                  <Bell className="inline h-4 w-4 mr-2" />
                  Get Notifications
                </button>
                <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  View Full Schedule
                </button>
                <button 
                  onClick={() => {
                    // Open Purse Builder modal
                    alert('Support this track with donations for operations, race purses, and facility improvements!');
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Heart className="inline h-4 w-4 mr-2" />
                  Donate to Track
                </button>
              </div>
            </div>

            {/* Track Owner Actions */}
            {user && user.id === track.id && (
              <div className="bg-gradient-to-r from-fedex-orange/20 to-red-500/20 border border-fedex-orange/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Track Owner</h3>
                <p className="text-gray-300 text-sm mb-4">
                  This is how your track profile appears to visitors.
                </p>
                <Link
                  to="/track-dashboard"
                  className="w-full inline-block text-center px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors"
                >
                  Edit Track Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          racerName={track.name}
          racerId={track.id}
          racerImage={track.logo}
          racerBio={track.description}
        />
      )}
    </div>
  );
};