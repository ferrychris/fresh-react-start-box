import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Trophy, 
  Users, 
  Star,
  Crown,
  Gift,
  DollarSign,
  TrendingUp,
  Eye,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SuperFanBadge } from '../components/SuperFanBadge';
import { DynamicMetaTags } from '../components/DynamicMetaTags';
import { 
  supabase,
  getFanStats,
  getFanSubscriptions,
  getFanActivity,
  type RacerPost
} from '../lib/supabase';

interface Fan {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  favoriteClasses: string[];
  favoriteTracks: string[];
  whyILoveRacing: string;
  joinedDate: string;
  profileComplete: boolean;
  posts: RacerPost[];
}

interface FanConnection {
  id: string;
  fan_id: string;
  racer_id: string;
  became_fan_at: string;
  total_tips: number;
  is_superfan: boolean;
  racer_profiles: {
    id: string;
    username: string;
    profile_photo_url: string;
    car_number: string;
    racing_class: string;
    profiles: {
      name: string;
      avatar: string;
    } | null;
  } | null;
}

interface FanActivity {
  type: 'new_fan' | 'tip' | 'superfan_upgrade';
  details: string;
  created_at: string;
  racer_profile: {
    username: string;
    profile_photo_url: string;
  };
}

interface FanStats {
  totalSupport: number;
  racersSupported: number;
  superFanLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinedDate: string;
  totalGifts: number;
}

export const FanProfile: React.FC = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const [fan, setFan] = useState<Fan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState<FanConnection[]>([]);
  const [activity, setActivity] = useState<FanActivity[]>([]);
  const [stats, setStats] = useState<FanStats>({
    totalSupport: 0,
    racersSupported: 0,
    superFanLevel: 'bronze',
    joinedDate: '',
    totalGifts: 0
  });

  useEffect(() => {
    if (id) {
      loadFanProfile();
    }
  }, [id]);

  const loadFanProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: fanData, error: fanError } = await supabase
        .from('profiles')
        .select(`
          id,
          name: full_name,
          email,
          avatar: avatar_url,
          location,
          favoriteClasses: favorite_classes,
          favoriteTracks: favorite_tracks,
          whyILoveRacing: why_i_love_racing,
          joinedDate: created_at,
          profileComplete: profile_complete,
          posts: racer_posts (id, racer_id, content, media_urls, created_at, likes_count, comments_count, profiles (full_name, avatar_url))
        `)
        .eq('id', id)
        .single();

      if (fanError) throw fanError;
      if (!fanData) throw new Error('Fan not found');

      const fanStats = await getFanStats(id);
      const fanSubscriptions = await getFanSubscriptions(id);
      const fanActivity = await getFanActivity(id);

      setFan(fanData as unknown as Fan);
      setStats(fanStats);
      setSubscriptions(fanSubscriptions);
      setActivity(fanActivity);

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error loading fan profile:", error.message);
      } else {
        console.error("An unknown error occurred while loading the fan profile.");
      }
      setFan(null);
    } finally {
      setLoading(false);
    }
  };

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'from-purple-500 to-pink-500';
      case 'gold': return 'from-yellow-400 to-orange-500';
      case 'silver': return 'from-gray-400 to-gray-500';
      default: return 'from-orange-600 to-red-600';
    }
  };

  const getSupportLevelIcon = (level: string) => {
    switch (level) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading fan profile...</p>
        </div>
      </div>
    );
  }

  if (!fan) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Fan Not Found</h2>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            This fan profile doesn't exist or isn't public.
          </p>
          <Link
            to="/super-fans"
            className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors"
          >
            Back to Super Fans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {fan && (
        <DynamicMetaTags
          title={`${fan.name} - Super Fan Profile | OnlyRaceFans.co`}
          description={`${fan.name} is a dedicated racing super fan supporting ${stats.racersSupported} racers with $${stats.totalSupport} in total support.`}
          image={fan.avatar}
          url={`${window.location.origin}/fan/${fan.id}`}
          type="profile"
        />
      )}

      {/* Hero Section */}
      <section className={`relative py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-purple-900 via-black to-pink-900' : 'bg-gradient-to-br from-purple-100 via-white to-pink-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://nbcsports.brightspotcdn.com/dims4/default/85959b5/2147483647/strip/false/crop/4551x2560+0+0/resize/1200x675!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2F1a%2F07%2F2a8b1d1ac3cf967c51dc18d94635%2Fworldofoutlaws-pyro-e1593179645712.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Fan Avatar with Super Fan Badge */}
            <div className="relative inline-block mb-6">
              <div className={`p-2 rounded-full bg-gradient-to-r ${getSupportLevelColor(stats.superFanLevel)}`}>
                <img
                  src={fan.avatar}
                  alt={fan.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-2xl"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className={`px-4 py-2 rounded-full text-white font-bold text-sm bg-gradient-to-r ${getSupportLevelColor(stats.superFanLevel)}`}>
                  {getSupportLevelIcon(stats.superFanLevel)} {stats.superFanLevel.toUpperCase()} SUPER FAN
                </div>
              </div>
            </div>

            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {fan.name}
            </h1>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-gray-400 mb-6">
              {fan.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {fan.location}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Fan since {formatTimeAgo(stats.joinedDate)}
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Supporting {stats.racersSupported} racers
              </div>
            </div>

            {fan.whyILoveRacing && (
              <p className={`text-lg max-w-3xl mx-auto mb-8 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                "{fan.whyILoveRacing}"
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <DollarSign className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <div className="text-3xl font-bold text-green-500 mb-1">${stats.totalSupport}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Support Given
              </div>
            </div>
            
            <div className={`p-6 rounded-xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Users className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <div className="text-3xl font-bold text-blue-500 mb-1">{stats.racersSupported}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Racers Supported
              </div>
            </div>
            
            <div className={`p-6 rounded-xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Gift className="h-8 w-8 mx-auto mb-3 text-pink-500" />
              <div className="text-3xl font-bold text-pink-500 mb-1">{stats.totalGifts}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Gifts Sent
              </div>
            </div>
            
            <div className={`p-6 rounded-xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Crown className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <div className="text-3xl font-bold text-purple-500 mb-1 capitalize">{stats.superFanLevel}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Super Fan Level
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
            {['overview', 'posts', 'supported-racers', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all text-sm capitalize ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Fan Story */}
                  {fan.whyILoveRacing && (
                    <div className={`rounded-xl p-6 ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Why I Love Racing</h3>
                      <p className={`text-lg leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {fan.whyILoveRacing}
                      </p>
                    </div>
                  )}

                  {/* Favorite Classes */}
                  {fan.favoriteClasses.length > 0 && (
                    <div className={`rounded-xl p-6 ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Favorite Racing Classes</h3>
                      <div className="flex flex-wrap gap-2">
                        {fan.favoriteClasses.map((cls: string) => (
                          <span
                            key={cls}
                            className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm font-medium"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Favorite Tracks */}
                  {fan.favoriteTracks.length > 0 && (
                    <div className={`rounded-xl p-6 ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Favorite Tracks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fan.favoriteTracks.map((track: string) => (
                          <div
                            key={track}
                            className={`p-3 rounded-lg flex items-center space-x-2 ${
                              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}
                          >
                            <Flag className="h-4 w-4 text-fedex-orange" />
                            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                              {track}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${
                    theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Racing Posts</h3>
                    
                    {fan.posts && fan.posts.length > 0 ? (
                      <div className="space-y-4">
                        {fan.posts.map((post: RacerPost) => (
                          <div key={post.id} className={`p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <img
                                src={fan.avatar}
                                alt={fan.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`font-semibold ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>{fan.name}</span>
                                  <div className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                    RACING FAN
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {formatTimeAgo(post.created_at)}
                                  </span>
                                </div>
                                <p className={`${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>{post.content}</p>
                                {post.media_urls && post.media_urls.length > 0 && (
                                  <div className="mt-3">
                                    <img
                                      src={post.media_urls[0]}
                                      alt="Post media"
                                      className="w-full max-w-md h-48 object-cover rounded-lg"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="h-4 w-4" />
                                    <span>{post.likes_count || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{post.comments_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          No posts yet. Share your racing thoughts with the community!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'supported-racers' && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${
                    theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Supported Racers</h3>
                    
                    {subscriptions.length > 0 ? (
                      <div className="space-y-4">
                        {subscriptions.map(connection => (
                          <div key={connection.id} className={`p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-4">
                              <Link to={`/racer/${connection.racer_id}`}>
                                <img
                                  src={connection.racer_profiles?.profiles?.avatar || connection.racer_profiles?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${connection.racer_profiles?.profiles?.name || 'Racer'}`}
                                  alt={connection.racer_profiles?.profiles?.name || 'Racer'}
                                  className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-purple-500 transition-all"
                                />
                              </Link>
                              <div className="flex-1">
                                <Link 
                                  to={`/racer/${connection.racer_id}`}
                                  className={`font-semibold hover:text-purple-400 transition-colors ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {connection.racer_profiles?.profiles?.name || connection.racer_profiles?.username || 'Unknown Racer'}
                                </Link>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  #{connection.racer_profiles?.car_number} • {connection.racer_profiles?.racing_class}
                                </p>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Supporting since {formatTimeAgo(connection.became_fan_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                {connection.total_tips > 0 && (
                                  <div className="text-green-400 font-semibold">
                                    ${connection.total_tips} tipped
                                  </div>
                                )}
                                {connection.is_superfan && (
                                  <SuperFanBadge type="superfan" size="sm" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Not supporting any racers yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${
                    theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Recent Activity</h3>
                    
                    {activity.length > 0 ? (
                      <div className="space-y-4">
                        {activity.map((item, index) => (
                          <div key={index} className={`p-4 rounded-lg flex items-start space-x-4 ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${{
                              'new_fan': 'bg-blue-500/20 text-blue-400',
                              'tip': 'bg-green-500/20 text-green-400',
                              'superfan_upgrade': 'bg-purple-500/20 text-purple-400'
                            }[item.type]}`}>
                              {{
                                'new_fan': <UserPlus className="h-5 w-5" />,
                                'tip': <DollarSign className="h-5 w-5" />,
                                'superfan_upgrade': <Crown className="h-5 w-5" />
                              }[item.type]}
                            </div>
                            <div className="flex-1">
                              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {item.details}
                              </p>
                              <p className="text-sm text-gray-400">
                                {formatTimeAgo(item.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          No recent activity to show.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Super Fan Badge */}
              <div className={`rounded-xl p-6 text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-r ${getSupportLevelColor(stats.superFanLevel)}`}>
                  <span className="text-2xl">{getSupportLevelIcon(stats.superFanLevel)}</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.superFanLevel.charAt(0).toUpperCase() + stats.superFanLevel.slice(1)} Super Fan
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  ${stats.totalSupport} total support given
                </p>
              </div>

              {/* Support Breakdown */}
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Support Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Tips Sent
                    </span>
                    <span className="font-semibold text-green-400">
                      ${stats.totalSupport - stats.totalGifts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Gifts Sent
                    </span>
                    <span className="font-semibold text-pink-400">
                      {stats.totalGifts} tokens
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Racers Supported
                    </span>
                    <span className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.racersSupported}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/racers"
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-center block"
                  >
                    <Users className="inline h-4 w-4 mr-2" />
                    Find More Racers
                  </Link>
                  <Link
                    to="/feed"
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors text-center block ${
                      theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <Eye className="inline h-4 w-4 mr-2" />
                    View Racing Feed
                  </Link>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                      theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <Share2 className="inline h-4 w-4 mr-2" />
                    Share Profile
                  </button>
                </div>
              </div>

              {/* Fan Recognition */}
              <div className={`rounded-xl p-6 bg-gradient-to-br ${getSupportLevelColor(stats.superFanLevel)} text-white`}>
                <div className="text-center">
                  <Crown className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Super Fan Recognition</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Thank you for being an amazing supporter of the racing community!
                  </p>
                  <div className="text-2xl font-bold mb-1">
                    {getSupportLevelIcon(stats.superFanLevel)} {stats.superFanLevel.toUpperCase()}
                  </div>
                  <div className="text-sm opacity-80">
                    Keep supporting to reach the next level!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};