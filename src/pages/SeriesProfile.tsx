import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Trophy, 
  MapPin, 
  Flag, 
  Users, 
  Star, 
  Calendar, 
  Globe,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  UserPlus,
  Bell,
  Heart,
  Share2,
  DollarSign,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { DynamicMetaTags } from '../components/DynamicMetaTags';

export const SeriesProfile: React.FC = () => {
  const { id } = useParams();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [series, setSeries] = useState<any>(null);
  const [seriesLoading, setSeriesLoading] = useState(true);

  useEffect(() => {
    loadSeriesProfile();
  }, [id]);

  const loadSeriesProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('series_profiles')
        .select('*')
        .eq('id', id)
        .eq('profile_published', true)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedSeries = {
          id: data.id,
          name: data.series_name || 'Unknown Series',
          type: data.series_type || 'Racing Series',
          headquarters: data.headquarters || 'Unknown',
          description: data.description || 'Professional racing series',
          logo: data.series_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${data.series_name || 'Series'}`,
          banner: data.banner_photo_url,
          followers: 0, // Will be calculated from followers table when created
          upcomingEvents: 0, // Will be calculated from race_schedules
          featuredRacers: data.featured_racers?.length || 0,
          totalPurse: data.total_purse_cents || 0,
          championshipPurse: (data.championship_purse_cents || 0) / 100,
          totalEvents: data.total_events || 0,
          founded: data.founded || new Date().getFullYear(),
          rating: 4.8, // Default rating
          website: data.website,
          contactEmail: data.contact_email,
          contactPerson: data.contact_person,
          createdAt: data.created_at
        };
        
        setSeries(formattedSeries);
      } else {
        setSeries(null);
      }
    } catch (error) {
      console.error('Error loading series profile:', error);
      setSeries(null);
    } finally {
      setSeriesLoading(false);
    }
  };

  const featuredRacers = [
    {
      id: '1',
      name: 'Brad Sweet',
      carNumber: '49',
      class: 'Sprint Car',
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=Brad Sweet',
      championships: 3,
      wins: 89
    },
    {
      id: '2', 
      name: 'Carson Macedo',
      carNumber: '41',
      class: 'Sprint Car',
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=Carson Macedo',
      championships: 1,
      wins: 45
    },
    {
      id: '3',
      name: 'David Gravel',
      carNumber: '2',
      class: 'Sprint Car', 
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=David Gravel',
      championships: 2,
      wins: 67
    }
  ];

  const featuredTracks = [
    {
      id: '1',
      name: 'Eldora Speedway',
      location: 'Rossburg, OH',
      type: 'Dirt Oval',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Eldora Speedway'
    },
    {
      id: '2',
      name: 'Knoxville Raceway', 
      location: 'Knoxville, IA',
      type: 'Dirt Oval',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Knoxville Raceway'
    },
    {
      id: '3',
      name: 'Williams Grove Speedway',
      location: 'Mechanicsburg, PA', 
      type: 'Dirt Oval',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Williams Grove'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      name: 'Kings Royal',
      date: '2025-07-18',
      track: 'Eldora Speedway',
      location: 'Rossburg, OH',
      purse: '$175,000',
      status: 'upcoming'
    },
    {
      id: '2',
      name: 'Knoxville Nationals',
      date: '2025-08-14',
      track: 'Knoxville Raceway', 
      location: 'Knoxville, IA',
      purse: '$150,000',
      status: 'upcoming'
    },
    {
      id: '3',
      name: 'World Finals',
      date: '2025-11-07',
      track: 'The Dirt Track at Charlotte',
      location: 'Concord, NC',
      purse: '$200,000',
      status: 'upcoming'
    }
  ];

  const sponsorshipPackages = [
    {
      id: '1',
      name: 'Title Sponsor',
      price: 250000,
      duration: 'Full Season',
      benefits: [
        'Series naming rights',
        'Logo on all promotional materials',
        'VIP hospitality at all events',
        'Social media promotion',
        'TV/streaming mentions'
      ]
    },
    {
      id: '2', 
      name: 'Official Partner',
      price: 100000,
      duration: 'Full Season',
      benefits: [
        'Official partner designation',
        'Logo placement on series materials',
        'Event hospitality access',
        'Digital marketing inclusion'
      ]
    },
    {
      id: '3',
      name: 'Event Sponsor',
      price: 25000,
      duration: 'Per Event',
      benefits: [
        'Event naming rights',
        'Track signage',
        'PA announcements',
        'Social media posts'
      ]
    }
  ];

  const handleFollow = async () => {
    if (!user) {
      alert('Please sign in to follow racing series');
      return;
    }

    setFollowLoading(true);
    try {
      // Mock follow functionality - replace with real API call
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading series profile...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Series Not Found</h2>
          <p className="text-gray-400 mb-6">
            This racing series doesn't exist yet or hasn't been published.
          </p>
          <Link
            to="/series"
            className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
          >
            Browse All Series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {series && (
        <DynamicMetaTags
          title={`${series.name} - OnlyRaceFans.co`}
          description={series.description}
          image={series.logo}
          url={`${window.location.origin}/series/${series.id}`}
          type="website"
        />
      )}

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-gray-900 to-gray-800">
        {series.banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${series.banner})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 h-full">
          {/* Series Logo */}
          <div className="absolute bottom-0 left-1/2 md:left-4 lg:left-8 transform -translate-x-1/2 md:translate-x-0 translate-y-1/2">
            <img
              src={series.logo}
              alt={series.name}
              className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 rounded-full border-4 md:border-6 border-white shadow-2xl object-cover"
            />
          </div>
        </div>
      </div>

      {/* Series Info Section */}
      <div className="bg-gray-900 pt-16 md:pt-20 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center md:text-left md:ml-40 lg:ml-48">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start space-y-2 md:space-y-0 md:space-x-4 mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white">{series.name}</h1>
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                RACING SERIES
              </div>
              <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                VERIFIED SERIES
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-5 lg:gap-6 text-gray-400 mb-6 md:mb-8 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {series.headquarters}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {series.followers.toLocaleString()} followers
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {series.upcomingEvents} upcoming events
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 text-yellow-400" />
                {series.rating} rating
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 text-fedex-orange" />
                Est. {series.founded}
              </div>
            </div>
            
            <p className="text-gray-400 text-base md:text-lg mb-8 md:mb-10 max-w-4xl mx-auto md:mx-0 px-4 md:px-0 leading-relaxed font-light">
              {series.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start px-4 md:px-0">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
                  followLoading
                    ? 'bg-gray-600 cursor-not-allowed text-white'
                    : 
                  isFollowing
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isFollowing ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : <UserPlus className="h-4 w-4 md:h-5 md:w-5" />}
                <span>
                  {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Series'}
                </span>
              </button>
              
              <button className="px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-medium text-sm transition-all">
                <Bell className="inline h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                Get Event Notifications
              </button>
              
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all">
                <Heart className="inline h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                Support Series
              </button>
              
              {series.website && (
                <a
                  href={series.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white rounded-lg font-medium text-sm transition-all"
                >
                  <Globe className="inline h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Visit Website
                </a>
              )}
              
              <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-all">
                <Share2 className="inline h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                Share Series
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg overflow-x-auto">
          {['overview', 'racers', 'tracks', 'schedule', 'sponsors', 'purse-builder'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 py-3 px-4 rounded-md font-medium transition-all text-sm capitalize ${
                activeTab === tab
                  ? 'bg-fedex-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Series Stats */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Series Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{series.featuredRacers}</div>
                      <div className="text-gray-400 text-sm">Featured Racers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{featuredTracks.length}</div>
                      <div className="text-gray-400 text-sm">Partner Tracks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{series.upcomingEvents}</div>
                      <div className="text-gray-400 text-sm">Upcoming Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{series.championshipPurse}</div>
                      <div className="text-gray-400 text-sm">Championship Purse</div>
                    </div>
                  </div>
                </div>

                {/* About Series */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">About the Series</h3>
                  <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed">{series.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                      <div>
                        <h4 className="font-semibold text-white mb-3">Series Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Founded:</span>
                            <span className="text-white">{series.founded}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Headquarters:</span>
                            <span className="text-white">{series.headquarters}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Events:</span>
                            <span className="text-white">{series.totalEvents}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Championship Purse:</span>
                            <span className="text-green-400 font-semibold">{series.championshipPurse}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-3">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${series.contactEmail}`} className="text-fedex-orange hover:text-fedex-orange-light">
                              {series.contactEmail}
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <a href={series.website} target="_blank" rel="noopener noreferrer" className="text-fedex-orange hover:text-fedex-orange-light">
                              Official Website
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Racers Tab */}
            {activeTab === 'racers' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Featured Racers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredRacers.map(racer => (
                      <div key={racer.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={racer.profilePicture}
                            alt={racer.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-white">{racer.name}</h4>
                            <p className="text-sm text-gray-400">#{racer.carNumber} • {racer.class}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center text-sm">
                          <div>
                            <div className="font-bold text-yellow-400">{racer.championships}</div>
                            <div className="text-gray-400">Championships</div>
                          </div>
                          <div>
                            <div className="font-bold text-green-400">{racer.wins}</div>
                            <div className="text-gray-400">Career Wins</div>
                          </div>
                        </div>
                        <Link
                          to={`/racer/${racer.id}`}
                          className="w-full mt-3 px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-center font-semibold transition-colors block"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Partner Tracks Tab */}
            {activeTab === 'tracks' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Partner Tracks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredTracks.map(track => (
                      <div key={track.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={track.logo}
                            alt={track.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-white">{track.name}</h4>
                            <p className="text-sm text-gray-400">{track.type} • {track.location}</p>
                          </div>
                        </div>
                        <Link
                          to={`/track/${track.id}`}
                          className="w-full mt-3 px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-center font-semibold transition-colors block"
                        >
                          View Track
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">2025 Race Schedule</h3>
                  <div className="space-y-4">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-lg">{event.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Flag className="h-3 w-3 mr-1" />
                                {event.track}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-400">{event.purse}</div>
                            <div className="text-sm text-gray-400">Total Purse</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-sm font-semibold transition-colors">
                            Event Details
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Add to Calendar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sponsors Tab */}
            {activeTab === 'sponsors' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Sponsorship Opportunities</h3>
                  <div className="space-y-4">
                    {sponsorshipPackages.map(pkg => (
                      <div key={pkg.id} className="bg-gray-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-white">{pkg.name}</h4>
                            <p className="text-gray-400">{pkg.duration}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                              ${(pkg.price / 100).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">Investment</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {pkg.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <Star className="h-3 w-3 text-fedex-orange flex-shrink-0" />
                              <span className="text-gray-300">{benefit}</span>
                            </div>
                          ))}
                        </div>
                        
                        <button className="w-full px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors">
                          <Target className="inline h-4 w-4 mr-2" />
                          Sponsor This Package
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Purse Builder Tab */}
            {activeTab === 'purse-builder' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Support the {series.name}</h2>
                    <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
                      Help us increase race purses, improve safety, and provide better facilities for drivers and fans. 
                      Your donations directly support the racing community.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-white mb-1">Increase Purses</h3>
                        <p className="text-sm text-gray-400">Boost prize money for all events</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="w-6 h-6 text-green-400 mx-auto mb-2">🛡️</div>
                        <h3 className="font-semibold text-white mb-1">Safety Improvements</h3>
                        <p className="text-sm text-gray-400">Enhanced safety equipment and protocols</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <Zap className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-white mb-1">Series Growth</h3>
                        <p className="text-sm text-gray-400">Expand to new tracks and markets</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[25, 50, 100, 250].map(amount => (
                        <button
                          key={amount}
                          className="p-4 bg-gray-800 hover:bg-fedex-orange rounded-lg font-semibold transition-colors"
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    
                    <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg flex items-center space-x-3 mx-auto">
                      <Heart className="h-5 w-5" />
                      <span>Support the Series</span>
                      <DollarSign className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Series Info Card */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Series Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Founded</span>
                  <span className="font-semibold text-white">{series.founded}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Headquarters</span>
                  <span className="font-semibold text-white">{series.headquarters}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="font-semibold text-white">{series.followers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Series Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-semibold text-white">{series.rating}</span>
                  </div>
                </div>
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
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Series'}
                </button>
                
                <button className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors">
                  <Bell className="inline h-4 w-4 mr-2" />
                  Get Notifications
                </button>
                
                <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  View Full Schedule
                </button>
                
                <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors">
                  <Heart className="inline h-4 w-4 mr-2" />
                  Support Series
                </button>
              </div>
            </div>

            {/* Championship Standings */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Championship Standings</h3>
              <div className="space-y-3">
                {featuredRacers.slice(0, 5).map((racer, index) => (
                  <div key={racer.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <img
                        src={racer.profilePicture}
                        alt={racer.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-white text-sm">{racer.name}</div>
                        <div className="text-xs text-gray-400">#{racer.carNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-fedex-orange">{1250 - (index * 150)} pts</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                <Trophy className="inline h-4 w-4 mr-2" />
                View Full Standings
              </button>
            </div>

            {/* Series Owner Actions */}
            {user && user.id === series.id && (
              <div className="bg-gradient-to-r from-purple-600/20 to-fedex-orange/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Series Owner</h3>
                <p className="text-gray-300 text-sm mb-4">
                  This is how your racing series profile appears to visitors.
                </p>
                <Link
                  to="/series-dashboard"
                  className="w-full inline-block text-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Manage Series
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};