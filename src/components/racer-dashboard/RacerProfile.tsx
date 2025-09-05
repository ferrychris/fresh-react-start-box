import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Heart, Trophy, ExternalLink, Crown, DollarSign } from 'lucide-react';
import { EditProfile } from '../../pages/EditProfile';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Fallback theme classes to replace missing useThemeClasses hook
const fallbackTheme = {
  bg: { primary: 'bg-slate-950' },
  text: { primary: 'text-white', secondary: 'text-slate-400', tertiary: 'text-slate-500' },
  button: { secondary: 'bg-slate-800 text-white hover:bg-slate-700' },
};

// Fallback for real-time stats hook
function useRealTimePerformanceStatsStub(_userId: string) {
  return {
    stats: { subscribers: 0, tips: 0 },
    trackEvent: () => {},
    addFollower: () => {},
    addSubscriber: () => {},
    addTip: () => {},
  } as const;
}

// Mock data for fallback when user data is not available
const mockRacer = {
  bio: "Professional racer with years of experience on the track. Passionate about motorsports and connecting with fans.",
  carNumber: "42",
  racingClass: "Pro Stock",
  team: "Thunder Racing",
  region: "Southeast",
  posts: 0,
  followers: 0,
  subscribers: 0,
  totalTips: 0,
  verified: false,
  upcomingRaces: [
    {
      id: '1',
      name: 'Spring Championship',
      track: 'Speedway International',
      date: '2024-03-15T19:00:00Z'
    },
    {
      id: '2',
      name: 'Summer Series Round 1',
      track: 'Thunder Valley Raceway',
      date: '2024-04-20T18:30:00Z'
    }
  ],
  subscriptionTiers: [
    {
      id: '1',
      name: '🏎️ Fan',
      price: 9.99,
      subscribers: 0,
      perks: ['Exclusive updates', 'Behind-the-scenes content', 'Shout-outs on the public feed'],
      buttonText: 'Join the Team'
    },
    {
      id: '2',
      name: '🔥 Supporter',
      price: 19.99,
      subscribers: 0,
      perks: ['All Fan perks', 'Live race commentary', 'Access to racer Q&A', 'Early access to race results/photos'],
      buttonText: 'Back Your Racer'
    },
    {
      id: '3',
      name: '🏆 VIP',
      price: 39.99,
      subscribers: 0,
      perks: ['All Supporter perks', 'Exclusive video messages from the racer', 'Special race-day insights', 'Digital autograph/photo card'],
      buttonText: 'Get the VIP Experience'
    },
    {
      id: '4',
      name: '👑 Champion',
      price: 99.99,
      subscribers: 0,
      perks: ['All VIP perks', '1-on-1 video call or meet & greet (virtual)', 'Race strategy & behind-the-pit updates', 'Your name featured on racer\'s supporter wall'],
      buttonText: 'Become a Champion'
    }
  ]
};

interface RacerProfileProps {
  racerId: string;
}

const RacerProfile: React.FC<RacerProfileProps> = ({ racerId }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'schedule' | 'sponsors' | 'racing-info' | 'sponsorship-slots'>('feed');
 const [isFan, setIsFan] = useState(false);
 const [fanCount, setFanCount] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { user, isAuthenticated, subscribeToUserUpdates } = useAuth();
  const theme = fallbackTheme; // using fallback; replace with useThemeClasses() if available
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Use current user if racerId is 'current-user'
  const actualRacerId = racerId === 'current-user' ? user?.id || racerId : racerId;
  const { stats: realTimeStats, trackEvent, addFollower, addSubscriber, addTip } = useRealTimePerformanceStatsStub(actualRacerId);
  
  const [sponsorshipSlots, setSponsorshipSlots] = useState([
    {
      id: '1',
      title: 'Hood Center Placement',
      description: 'Prime visibility on the hood center for maximum exposure during races and media coverage.',
      price: 750,
      duration: 'per-race' as const,
      category: 'Hood',
      isActive: true,
      isPublic: true,
      imageUrl: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
      inquiries: 3,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-02-01T14:30:00Z'
    },
    {
      id: '2',
      title: 'Side Panel Sponsorship',
      description: 'Highly visible side panel placement perfect for brand recognition and social media content.',
      price: 500,
      duration: 'per-race' as const,
      category: 'Side Panel',
      isActive: true,
      isPublic: true,
      imageUrl: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
      inquiries: 1,
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T09:00:00Z'
    }
  ]);

  const isOwnProfile = racerId === 'current-user' || user?.id === racerId;
  const isNewProfile = isOwnProfile && (!user?.avatar || !user?.bio);

  // View proxy: use context user for own profile, fetched profile for others
  const viewUser = isOwnProfile ? user : profileUser;

  // Fetch viewed racer's profile when not own profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!racerId || isOwnProfile) return;
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const { data: base, error: baseErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', racerId)
          .single();
        if (baseErr) throw baseErr;
        let merged: any = base || {};
        if (base?.role === 'RACER') {
          const { data: rp, error: rpErr } = await supabase
            .from('racer_profiles')
            .select('*')
            .eq('user_id', racerId)
            .single();
          if (rpErr && rpErr.code !== 'PGRST116') throw rpErr; // ignore not found
          if (rp) {
            merged = {
              ...merged,
              carNumber: rp.car_number,
              racingClass: rp.racing_class,
              team: rp.team,
              region: rp.region,
              phone: rp.phone,
              address: rp.address,
              city: rp.city,
              state: rp.state,
              zipCode: rp.zip_code,
              showContactForSponsorship: rp.show_contact_for_sponsorship,
            };
          }
        }
        setProfileUser(merged);
      } catch (e: any) {
        setProfileError(e?.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [racerId, isOwnProfile]);

 // Initialize fan count to start from zero
 useEffect(() => {
   setFanCount(0);
 }, []);

 // Handle becoming a fan with real-time updates
 const handleBecomeFan = () => {
   if (isFan) {
     // Unfan
     setIsFan(false);
     setFanCount(prev => prev - 1);
   } else {
     // Become a fan
     setIsFan(true);
     setFanCount(prev => prev + 1);
     
     // Track the new follower event in database
     addFollower();
     
     // Simulate real-time fan increase
     setTimeout(() => {
       setFanCount(prev => prev + Math.floor(Math.random() * 3) + 1);
       addFollower();
     }, 2000);
   }
 };
  // Subscribe to real-time updates for this user
  useEffect(() => {
    if (actualRacerId) {
      const unsubscribe = subscribeToUserUpdates(actualRacerId);
      return unsubscribe;
    }
  }, [actualRacerId, subscribeToUserUpdates]);
  // Auto-open edit profile for new users - immediate
  React.useEffect(() => {
    if (isOwnProfile && isAuthenticated && user) {
      console.log('🔧 Checking if profile setup needed...', { 
        hasAvatar: !!user.avatar, 
        hasBio: !!user.bio, 
        hasCarNumber: !!user.carNumber 
      });
      
      // Open edit immediately for new profiles
      const needsSetup = !user.avatar || !user.bio || !user.carNumber;
      if (needsSetup) {
        console.log('🚀 Opening profile setup immediately!');
        setShowEditProfile(true);
      }
    }
  }, [isOwnProfile, isAuthenticated, user]);

  const tabs = [
    { id: 'feed' as const, label: 'Feed', count: mockRacer.posts },
    { id: 'racing-info' as const, label: 'Racing Info' },
    { id: 'schedule' as const, label: 'Schedule', count: 0 },
    { id: 'sponsors' as const, label: 'Sponsors', count: 0 },
    { id: 'sponsorship-slots' as const, label: 'Car Sponsorships', count: 2 }
  ];

  return (
    <div className={`min-h-screen ${fallbackTheme.bg.primary}`}>
      {/* Loading / Error states for viewed profiles */}
      {!isOwnProfile && (
        <div className="px-6 pt-6">
          {loadingProfile && (
            <div className="text-center text-slate-400">Loading racer profile…</div>
          )}
          {profileError && (
            <div className="text-center text-red-400">{profileError}</div>
          )}
        </div>
      )}
      {/* If viewing another racer and data not yet loaded, avoid rendering rest */}
      {(!isOwnProfile && (loadingProfile || (!viewUser && !profileError))) ? null : (
        <>
      {/* Profile Banner */}
      <div className="relative">
        <div 
          className="h-64 lg:h-80 bg-cover bg-center track-texture"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${viewUser?.coverPhoto || 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&dpr=2'})` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${fallbackTheme.bg.primary.replace('bg-', 'from-')}`} />
          
          {/* New Profile Setup Overlay */}
          {isNewProfile && (
            <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏁</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to OnlyRaceFans!</h2>
                <p className="text-lg opacity-90">Let's set up your racing profile</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={viewUser?.avatar || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2'}
                alt={viewUser?.name || 'User'}
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover"
              />
              {viewUser?.verified && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
              {isNewProfile && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                  <span className="text-white text-sm">+</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className={`text-3xl font-bold ${fallbackTheme.text.primary}`}>{viewUser?.name || ''}</h1>
                <span className="racing-number text-2xl text-orange-500">#{viewUser?.carNumber || '00'}</span>
              </div>
              <div className={`flex items-center space-x-4 ${fallbackTheme.text.secondary} mb-3`}>
                <span>@{viewUser?.username || 'username'}</span>
                <span>•</span>
                <span>{viewUser?.racingClass || 'Racing Class'}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{viewUser?.region || 'Region'}</span>
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className={`w-4 h-4 ${fallbackTheme.text.tertiary}`} />
                  <span className={`${fallbackTheme.text.primary} font-medium`}>{fanCount.toLocaleString()}</span>
                  <span className={fallbackTheme.text.tertiary}>fans</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-orange-500" />
                  <span className={`${fallbackTheme.text.primary} font-medium`}>{(realTimeStats as any).subscribers?.toLocaleString?.() ?? 0}</span>
                  <span className={fallbackTheme.text.tertiary}>loyal fans</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className={`${fallbackTheme.text.primary} font-medium`}>${(realTimeStats as any).tips?.toLocaleString?.() ?? 0}</span>
                  <span className={fallbackTheme.text.tertiary}>total tips</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className={`px-6 py-3 text-white rounded-xl font-medium hover:scale-105 transition-all duration-200 ${
                    isNewProfile 
                      ? 'bg-green-500 hover:bg-green-600 animate-pulse shadow-lg shadow-green-500/30' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isNewProfile ? '🚀 Complete Profile Setup' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleBecomeFan}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                      isFan
                        ? `${fallbackTheme.button.secondary}`
                        : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-105'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>{isFan ? 'Fan' : 'Become a Fan'}</span>
                    {isFan && <span className="text-orange-300">✓</span>}
                  </button>
                  <button 
                    onClick={() => addTip(5)}
                   className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:scale-105 transition-all duration-200 text-sm flex items-center space-x-1 shadow-lg shadow-green-500/30"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>$5</span>
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('racing-info');
                      // Scroll to subscription tiers section
                      setTimeout(() => {
                        const tiersSection = document.querySelector('[data-section="subscription-tiers"]');
                        if (tiersSection) {
                          tiersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                   className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 text-sm flex items-center space-x-1 shadow-lg shadow-blue-500/30"
                  >
                    <Crown className="w-3 h-3" />
                   <span>Join the Team</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`bg-slate-950 border-b border-slate-800 sticky top-16 z-30`}>
        <div className="flex space-x-2 lg:space-x-8 px-3 lg:px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-1 py-3 lg:py-4 border-b-2 font-medium transition-all duration-200 whitespace-nowrap text-sm lg:text-base ${
                activeTab === tab.id
                  ? 'border-transparent text-orange-500 bg-orange-500/10'
                  : `border-transparent text-slate-500 hover:text-white`
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`bg-slate-900 text-slate-400 px-1.5 lg:px-2 py-0.5 rounded-full text-xs`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'feed' && (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sample posts */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={`aspect-square bg-slate-900 rounded-xl overflow-hidden group cursor-pointer`}>
                  <img
                    src={`https://images.pexels.com/photos/${35807 + index * 100}/pexels-photo-${35807 + index * 100}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2`}
                    alt="Post"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'racing-info' && (
          <div className="max-w-4xl space-y-8">
            {/* Racing Bio */}
            <div className={`bg-slate-900 rounded-2xl p-6 border border-slate-800`}>
              <h3 className={`text-xl font-bold text-white mb-4`}>Racing Bio</h3>
              <p className={`text-slate-300 leading-relaxed mb-6`}>
                {viewUser?.bio || mockRacer.bio}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`font-semibold text-white mb-3`}>Racing Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Car Number:</span>
                      <span className={`text-white racing-number`}>#{viewUser?.carNumber || mockRacer.carNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Class:</span>
                      <span className={`text-white`}>{viewUser?.racingClass || mockRacer.racingClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Team:</span>
                      <span className={`text-white`}>{viewUser?.team || mockRacer.team}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Region:</span>
                      <span className={`text-white`}>{viewUser?.region || mockRacer.region}</span>
                    </div>
                    {viewUser?.phone && (
                      <div className="flex justify-between">
                        <span className={`text-slate-500`}>Phone:</span>
                        <span className={`text-white`}>{viewUser.phone}</span>
                      </div>
                    )}
                    {viewUser?.city && viewUser?.state && (
                      <div className="flex justify-between">
                        <span className={`text-slate-500`}>Location:</span>
                        <span className={`text-white`}>{viewUser.city}, {viewUser.state}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className={`font-semibold text-white mb-3`}>Performance Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Total Posts:</span>
                      <span className={`text-white`}>{(realTimeStats as any).posts ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Followers:</span>
                      <span className={`text-white`}>{(realTimeStats as any).followers?.toLocaleString?.() ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Subscribers:</span>
                      <span className={`text-white`}>{(realTimeStats as any).subscribers?.toLocaleString?.() ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Total Tips:</span>
                      <span className={`text-white`}>${(realTimeStats as any).tips?.toLocaleString?.() ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-slate-500`}>Total Earnings:</span>
                      <span className={`text-white`}>${(realTimeStats as any).earnings?.toLocaleString?.() ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {viewUser?.showContactForSponsorship && (viewUser?.phone || viewUser?.email) && (
              <div className={`bg-slate-900 rounded-2xl p-6 border border-slate-800`}>
                <h3 className={`text-xl font-bold text-white mb-4`}>Sponsorship Contact</h3>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className={`text-green-400 font-medium mb-3`}>✓ Open to sponsorship opportunities</p>
                  <div className="space-y-2 text-sm">
                    {viewUser.email && (
                      <div className="flex justify-between">
                        <span className={`text-slate-500`}>Email:</span>
                        <span className={`text-white`}>{viewUser.email}</span>
                      </div>
                    )}
                    {viewUser.phone && (
                      <div className="flex justify-between">
                        <span className={`text-slate-500`}>Phone:</span>
                        <span className={`text-white`}>{viewUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tiers */}
            <div className={`bg-slate-900 rounded-2xl p-6 border border-slate-800`} data-section="subscription-tiers">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold text-white`}>Subscription Tiers</h3>
                {isOwnProfile && (
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm">
                    Manage Tiers
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockRacer.subscriptionTiers.map((tier) => (
                  <div key={tier.id} className={`bg-slate-900 rounded-xl p-6 border border-slate-800`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`text-lg font-semibold text-white`}>{tier.name}</h4>
                      <span className="text-2xl font-bold text-orange-500 racing-number">
                        ${tier.price}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className={`text-slate-500 text-sm mb-2`}>
                        {tier.subscribers} subscribers
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {tier.perks.map((perk, index) => (
                        <div key={index} className={`flex items-center space-x-2 text-sm text-slate-300`}>
                          <span className={`text-green-400`}>✓</span>
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>

                    {!isOwnProfile && (
                      <>
                      <button className={`w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm`}>
                        <span onClick={() => addSubscriber()}>{tier.buttonText} - ${tier.price}/mo</span>
                      </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl space-y-8">
            {/* Bio */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4">About {viewUser?.name || (mockRacer as any).name}</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                {viewUser?.bio || mockRacer.bio}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Basic Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Username:</span>
                      <span className="text-white">@{viewUser?.username || (mockRacer as any).username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white">{viewUser?.email || 'Private'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verified:</span>
                      <span className="text-white">{viewUser?.verified || mockRacer.verified ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Platform Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member Since:</span>
                      <span className="text-white">January 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profile Views:</span>
                      <span className="text-white">45,782</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Engagement Rate:</span>
                      <span className="text-white">8.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="max-w-4xl">
            <div className="bg-slate-900 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Upcoming Races</h3>
              <div className="space-y-4">
                {mockRacer.upcomingRaces.map((race) => (
                  <div key={race.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{race.name}</h4>
                        <p className="text-slate-400 flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{race.track}</span>
                          <span>•</span>
                          <span>{new Date(race.date).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                      Get Notified
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sponsors' && (
          <div className="max-w-4xl">
            <div className="bg-slate-900 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Sponsors & Partners</h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-orange-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {isOwnProfile ? 'Connect with Sponsors' : 'No Current Sponsors'}
                </h4>
                <p className="text-slate-400 mb-4">
                  {isOwnProfile 
                    ? 'Start attracting sponsors by completing your profile and creating sponsorship opportunities'
                    : 'This racer doesn\'t have any current sponsors'
                  }
                </p>
                {isOwnProfile && (
                  <button className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors duration-200">
                    Browse Sponsors
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sponsorship-slots' && (
          <div className="max-w-4xl">
            {/* Placeholder for StreamlinedSponsorshipTool */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">Sponsorship Slots</h3>
              <p className="text-slate-400">Tool integration coming soon.</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}
        </>
      )}
    </div>
  );
};

export default RacerProfile;
