import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Crown, 
  Trophy, 
  Heart, 
  Gift, 
  DollarSign, 
  Users, 
  Star,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Target,
  MapPin,
  Filter,
  Search
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SuperFanBadge } from '../components/SuperFanBadge';
import { supabase } from '../lib/supabase';

interface SuperFan {
  id: string;
  fan_id: string;
  racer_id: string;
  fan_name: string;
  fan_avatar: string;
  fan_location?: string;
  racer_name: string;
  racer_avatar: string;
  racer_car_number: string;
  racer_class: string;
  total_tips: number;
  total_gifts: number;
  became_fan_at: string;
  last_support_date: string;
  support_level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const SuperFans: React.FC = () => {
  const { theme } = useTheme();
  const [superFans, setSuperFans] = useState<SuperFan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('total_support');

  useEffect(() => {
    loadSuperFans();
  }, []);

  const loadSuperFans = async () => {
    try {
      // Get all super fans with their tip data
      const { data: fanConnections, error: connectionsError } = await supabase
        .from('fan_connections')
        .select('*')
        .eq('is_superfan', true)
        .order('total_tips', { ascending: false });

      if (connectionsError) {
        console.error('Error loading fan connections:', connectionsError);
        setSuperFans([]);
        return;
      }

      // Get fan profile data
      const fanIds = fanConnections?.map(fc => fc.fan_id) || [];
      const { data: fanProfiles, error: fanError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', fanIds);

      if (fanError) {
        console.error('Error loading fan profiles:', fanError);
      }

      // Get racer profile data
      const racerIds = fanConnections?.map(fc => fc.racer_id) || [];
      const { data: racerProfiles, error: racerError } = await supabase
        .from('racer_profiles')
        .select('id, username, profile_photo_url, car_number, racing_class')
        .in('id', racerIds);

      if (racerError) {
        console.error('Error loading racer profiles:', racerError);
      }

      // Get racer names from profiles table
      const { data: racerNames, error: racerNamesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', racerIds);

      if (racerNamesError) {
        console.error('Error loading racer names:', racerNamesError);
      }

      // Get gift data for each fan
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select('sender_id, receiver_id, token_amount')
        .in('sender_id', fanIds);

      if (giftError) {
        console.error('Error loading gift data:', giftError);
      }

      // Combine all data
      const formattedSuperFans = (fanConnections || []).map(connection => {
        const fanProfile = fanProfiles?.find(fp => fp.id === connection.fan_id);
        const racerProfile = racerProfiles?.find(rp => rp.id === connection.racer_id);
        const racerName = racerNames?.find(rn => rn.id === connection.racer_id);
        
        // Calculate total gifts for this fan-racer pair
        const totalGifts = giftData?.filter(g => 
          g.sender_id === connection.fan_id && g.receiver_id === connection.racer_id
        ).reduce((sum, gift) => sum + (gift.token_amount || 0), 0) || 0;

        const totalSupport = (connection.total_tips || 0) + totalGifts;
        
        // Determine support level based on total support
        let supportLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
        if (totalSupport >= 1000) supportLevel = 'platinum';
        else if (totalSupport >= 500) supportLevel = 'gold';
        else if (totalSupport >= 100) supportLevel = 'silver';

        return {
          id: connection.id,
          fan_id: connection.fan_id,
          racer_id: connection.racer_id,
          fan_name: fanProfile?.name || 'Anonymous Fan',
          fan_avatar: fanProfile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${fanProfile?.name || 'Fan'}`,
          fan_location: null, // Will be loaded from fan_profiles if needed
          racer_name: racerName?.name || racerProfile?.username || 'Unknown Racer',
          racer_avatar: racerProfile?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${racerName?.name || 'Racer'}`,
          racer_car_number: racerProfile?.car_number || 'TBD',
          racer_class: racerProfile?.racing_class || 'Racing',
          total_tips: connection.total_tips || 0,
          total_gifts: totalGifts,
          became_fan_at: connection.became_fan_at,
          last_support_date: connection.last_support_date || connection.became_fan_at,
          support_level: supportLevel
        };
      });

      setSuperFans(formattedSuperFans);
    } catch (error) {
      console.error('Error loading super fans:', error);
      setSuperFans([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuperFans = superFans.filter(fan => {
    const matchesSearch = searchTerm === '' || 
      fan.fan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fan.racer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || fan.support_level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const sortedSuperFans = [...filteredSuperFans].sort((a, b) => {
    switch (sortBy) {
      case 'fan_name':
        return a.fan_name.localeCompare(b.fan_name);
      case 'racer_name':
        return a.racer_name.localeCompare(b.racer_name);
      case 'recent':
        return new Date(b.last_support_date).getTime() - new Date(a.last_support_date).getTime();
      default: // total_support
        return (b.total_tips + b.total_gifts) - (a.total_tips + a.total_gifts);
    }
  });

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

  const totalSuperFans = superFans.length;
  const totalSupport = superFans.reduce((sum, fan) => sum + fan.total_tips + fan.total_gifts, 0);
  const avgSupport = totalSuperFans > 0 ? totalSupport / totalSuperFans : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 bg-[url('https://nbcsports.brightspotcdn.com/dims4/default/85959b5/2147483647/strip/false/crop/4551x2560+0+0/resize/1200x675!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2F1a%2F07%2F2a8b1d1ac3cf967c51dc18d94635%2Fworldofoutlaws-pyro-e1593179645712.jpg')] bg-cover bg-center opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl md:text-8xl mb-8 animate-bounce">👑</div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-foreground">
            Super Fan
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
              Hall of Fame
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-muted-foreground leading-relaxed">
            Celebrating the most dedicated racing fans who support their favorite racers with tips and gifts
          </p>
          <div className="flex flex-wrap justify-center gap-4 opacity-60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Crown className="h-5 w-5" />
              <span className="text-sm">Elite Recognition</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-5 w-5" />
              <span className="text-sm">Top Supporters</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-5 w-5" />
              <span className="text-sm">True Dedication</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Community Impact
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See the incredible support our racing community provides
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{totalSuperFans}</div>
                <div className="text-muted-foreground font-medium">
                  Total Super Fans
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-green-500 mb-2">${totalSupport.toLocaleString()}</div>
                <div className="text-muted-foreground font-medium">
                  Total Support Given
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-red-500 mb-2">${Math.round(avgSupport)}</div>
                <div className="text-muted-foreground font-medium">
                  Average Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 mb-8 sticky top-20 z-20 shadow-lg">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Find Super Fans</h3>
              <p className="text-muted-foreground text-sm">Search and filter through our community of dedicated supporters</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search super fans or racers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border/50 bg-background/50 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="pl-10 pr-4 py-4 rounded-xl border border-border/50 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-w-[160px]"
                  >
                    <option value="all">All Levels</option>
                    <option value="platinum">💎 Platinum</option>
                    <option value="gold">🥇 Gold</option>
                    <option value="silver">🥈 Silver</option>
                    <option value="bronze">🥉 Bronze</option>
                  </select>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-4 rounded-xl border border-border/50 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-w-[160px]"
                >
                  <option value="total_support">Highest Support</option>
                  <option value="recent">Most Recent</option>
                  <option value="fan_name">Fan Name A-Z</option>
                  <option value="racer_name">Racer Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-medium">
                Showing {sortedSuperFans.length} of {totalSuperFans} super fans
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Super Fans Grid */}
      <section className="pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 animate-pulse">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded bg-muted w-3/4" />
                      <div className="h-3 rounded bg-muted w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-20 rounded-lg bg-muted" />
                    <div className="h-12 rounded-lg bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedSuperFans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedSuperFans.map(fan => (
                <div
                  key={fan.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Header with gradient based on support level */}
                  <div className={`relative h-20 bg-gradient-to-r ${getSupportLevelColor(fan.support_level)}`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <span>{getSupportLevelIcon(fan.support_level)}</span>
                      <span className="capitalize">{fan.support_level}</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <SuperFanBadge type="superfan" size="sm" />
                    </div>
                    <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                      <div className="relative">
                        <img
                          src={fan.fan_avatar}
                          alt={fan.fan_name}
                          className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                   {/* Content */}
                  <div className="p-6 pt-10">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2 text-foreground">{fan.fan_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Super Fan since {formatTimeAgo(fan.became_fan_at)}
                      </p>
                    </div>

                    {/* Supporting Racer */}
                    <div className="p-4 rounded-xl bg-muted/50 mb-6 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <img
                          src={fan.racer_avatar}
                          alt={fan.racer_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">
                            Supporting {fan.racer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            #{fan.racer_car_number} • {fan.racer_class}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Support Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 text-center">
                        <div className="font-bold text-green-500 text-lg mb-1">${fan.total_tips}</div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Tips Sent
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 text-center">
                        <div className="font-bold text-pink-500 text-lg mb-1">{fan.total_gifts}</div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Gifts Sent
                        </div>
                      </div>
                    </div>

                    {/* Last Support */}
                    <div className="text-center text-xs mb-6 text-muted-foreground">
                      Last support: {formatTimeAgo(fan.last_support_date)}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/fan/${fan.fan_id}`}
                        className="px-3 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors text-center"
                      >
                        View Fan
                      </Link>
                      <Link
                        to={`/racer/${fan.racer_id}`}
                        className="px-3 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors text-center"
                      >
                        View Racer
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Crown className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">No Super Fans Yet</h3>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
                Be the first to become a Super Fan by supporting your favorite racers with tips and gifts!
              </p>
              <Link
                to="/racers"
                className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Crown className="mr-2 h-5 w-5" />
                Support a Racer
                <Trophy className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How to Become a Super Fan */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How to Become a Super Fan
            </h2>
            <p className="text-lg max-w-3xl mx-auto text-muted-foreground">
              Show your support and earn recognition in the racing community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
              <div className="relative">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🥉</span>
                </div>
                <h3 className="font-bold mb-2 text-foreground">Bronze Level</h3>
                <p className="text-sm mb-3 text-muted-foreground">$1 - $99 in support</p>
                <div className="text-orange-500 font-semibold">Entry Level</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 to-transparent" />
              <div className="relative">
                <div className="w-16 h-16 bg-gray-400/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🥈</span>
                </div>
                <h3 className="font-bold mb-2 text-foreground">Silver Level</h3>
                <p className="text-sm mb-3 text-muted-foreground">$100 - $499 in support</p>
                <div className="text-gray-400 font-semibold">Dedicated Fan</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />
              <div className="relative">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🥇</span>
                </div>
                <h3 className="font-bold mb-2 text-foreground">Gold Level</h3>
                <p className="text-sm mb-3 text-muted-foreground">$500 - $999 in support</p>
                <div className="text-yellow-500 font-semibold">Elite Supporter</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💎</span>
                </div>
                <h3 className="font-bold mb-2 text-foreground">Platinum Level</h3>
                <p className="text-sm mb-3 text-muted-foreground">$1,000+ in support</p>
                <div className="text-primary font-semibold">Ultimate Fan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.3),transparent_70%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl md:text-8xl mb-8 animate-pulse">🏆</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">
            Ready to Become a Super Fan?
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-muted-foreground">
            Support your favorite racers and earn your place in the Super Fan Hall of Fame
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/racers"
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl transition-all duration-300 text-lg shadow-xl hover:shadow-2xl hover:scale-105 border border-primary/20"
            >
              <Crown className="mr-3 h-6 w-6" />
              Find Racers to Support
              <Trophy className="ml-3 h-6 w-6" />
            </Link>
            <Link
              to="/feed"
              className="inline-flex items-center px-8 py-4 border-2 border-border bg-background text-foreground rounded-xl font-semibold transition-all duration-300 text-lg shadow-xl hover:shadow-2xl hover:scale-105 hover:bg-muted"
            >
              <Heart className="mr-3 h-6 w-6" />
              Explore Racing Feed
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};