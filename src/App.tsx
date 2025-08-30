import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { getSubscriptionTiersForRacers, getFanCountsForRacers } from './lib/supabase';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import Feed from './pages/Feed';
import { Racers } from './pages/Racers';
import { Tracks } from './pages/Tracks';
import { HowItWorks } from './pages/HowItWorks';
import { TrackProfile } from './pages/TrackProfile';
import { RacerProfile } from './pages/RacerProfile';
import { SeriesProfile } from './pages/SeriesProfile';
import { Series } from './pages/Series';
import { SponsorshipMarketplace } from './pages/SponsorshipMarketplace';
import { SponsorshipPackages } from './pages/SponsorshipPackages';
import { FAQ } from './pages/FAQ';
import { Dashboard } from './pages/Dashboard';
import FanDashboard from './components/fan-dashboard/FanDashboard';
import { TrackDashboard } from './pages/TrackDashboard';
import { Admin } from './pages/Admin';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { TokenPaymentSuccess } from './pages/TokenPaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { Contact } from './pages/Contact';
import { RacerSetup } from './pages/setup/RacerSetup';
import { FanSetup } from './pages/setup/FanSetup';
import { TrackSetup } from './pages/setup/TrackSetup';
import { SeriesSetup } from './pages/setup/SeriesSetup';
import { SeriesDashboard } from './pages/SeriesDashboard';
import { SuperFans } from './pages/SuperFans';
// Fan dashboard is now imported from components/fan-dashboard/FanDashboard
import LiveFeed from './pages/LiveFeed';
import { HowSponsorshipWorks } from './pages/HowSponsorshipWorks';
import { FounderLetter } from './pages/FounderLetter';
import { Home } from './pages/Home';
import { ComingSoon } from './pages/ComingSoon';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import SettingsProfile from './pages/SettingsProfile';
import TestRunner from './components/TestRunner';
import Grandstand from './pages/Grandstand';

// Component to handle scroll to top on route changes
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);
  
  return null;
};

// Render the header on all pages
const HeaderGate: React.FC = () => {
  return <Header />;
};

// Main content area with conditional padding based on route
const MainContent: React.FC<{ user?: User | null; showAuthModal?: boolean }>
  = ({ user }) => {
  const loc = useLocation();
  const mainPadding = loc.pathname === '/' ? 'pt-0 pb-0' : 'pt-16 pb-20 md:pb-0';
  return (
    <main className={mainPadding}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/racers" element={<Racers />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/series" element={<Series />} />
        <Route path="/super-fans" element={<SuperFans />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/live" element={<LiveFeed />} />
        <Route path="/track/:id" element={<TrackProfile />} />
        <Route path="/racer/:id" element={<RacerProfile />} />
        <Route path="/racer/:id/sponsorship" element={<SponsorshipPackages />} />
        <Route path="/dashboard" element={
          user?.user_type === 'racer' ? <Dashboard /> : <Navigate to="/" />
        } />
        <Route path="/fan-dashboard" element={
          user?.user_type === 'fan' ? <FanDashboard viewedUserId={user.id} /> : <Navigate to="/" />
        } />
        <Route path="/fan/:id" element={<FanDashboard />} />
        <Route path="/track-dashboard" element={
          user?.user_type === 'track' ? <TrackDashboard /> : <Navigate to="/" />
        } />
        <Route path="/series-dashboard" element={
          user?.user_type === 'series' ? <SeriesDashboard /> : <Navigate to="/" />
        } />
        <Route path="/series/:id" element={<SeriesProfile />} />
        <Route path="/sponsorships" element={<SponsorshipMarketplace />} />
        <Route path="/how-sponsorship-works" element={<HowSponsorshipWorks />} />
        <Route path="/admin" element={
          user?.user_type === 'admin' ? <Admin /> : <Navigate to="/" />
        } />
        <Route path="/setup/racer" element={<RacerSetup />} />
        <Route path="/setup/fan" element={<FanSetup />} />
        <Route path="/setup/track" element={<TrackSetup />} />
        <Route path="/setup/series" element={<SeriesSetup />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/token/payment/success" element={<TokenPaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/founder-letter" element={<FounderLetter />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/settings/profile" element={<SettingsProfile />} />
        <Route path="/test-posts" element={<TestRunner />} />
        <Route path="/grandstand" element={<Grandstand />} />
      </Routes>
    </main>
  );
};

// Footer that doesn't show on the homepage
const AppFooter: React.FC = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <footer className="border-t transition-colors duration-300 bg-gray-900 border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img 
                src="/onlyracefans-logo.png" 
                alt="OnlyRaceFans" 
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm mb-4 max-w-md text-gray-400">
              The premier platform where racers, fans, and sponsors connect. 
              Built by racers, for racers.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/onlyracefans" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="https://instagram.com/onlyracefans" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                Instagram
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Platform</h3>
            <div className="space-y-2">
              <Link to="/racers" className="block text-sm transition-colors text-gray-400 hover:text-white">
                Browse Racers
              </Link>
              <Link to="/feed" className="block text-sm transition-colors text-gray-400 hover:text-white">
                Racing Feed
              </Link>
            </div>
          </div>
          
          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <div className="space-y-2">
              <Link to="/how-it-works" className="block text-sm transition-colors text-gray-400 hover:text-white">
                How It Works
              </Link>
              <Link to="/faq" className="block text-sm transition-colors text-gray-400 hover:text-white">
                FAQ
              </Link>
              <Link to="/contact" className="block text-sm transition-colors text-gray-400 hover:text-white">
                Contact Us
              </Link>
              <a href="sms:844-828-2820" className="block text-sm transition-colors text-gray-400 hover:text-white">
                Text Support
              </a>
              <Link to="/founder-letter" className="block text-sm transition-colors text-gray-400 hover:text-white">
                <span className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-fedex-orange to-fedex-purple hover:from-fedex-purple hover:to-fedex-orange rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <span>🏁</span>
                  <span>Letter from the Founder</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center border-gray-800">
          <p className="text-sm text-gray-400">
            © 2025 OnlyRaceFans.co. All rights reserved.
          </p>
          <p className="text-sm mt-2 md:mt-0 text-gray-400">
            Where the Real Ones Race 🏁
          </p>
        </div>
      </div>
    </footer>
  );
};

interface User {
  id: string;
  name: string;
  email: string;
  type: 'fan' | 'racer' | 'track' | 'series' | 'admin';
  user_type: 'fan' | 'racer' | 'track' | 'series' | 'admin';
  profilePicture?: string;
  subscriptions?: string[];
  // Racer specific
  username?: string;
  bio?: string;
  carNumber?: string;
  racingClass?: string;
  teamName?: string;
  favoriteTrack?: string;
  lookingForSponsors?: boolean;
  socialLinks?: any;
  bannerImage?: string;
  carPhotos?: string[];
  // Fan specific
  nickname?: string;
  favoriteTracks?: string[];
  favoriteClasses?: string[];
  whyILoveRacing?: string;
  badgeLevel?: string;
  // Track specific
  trackName?: string;
  contactPerson?: string;
  trackLogo?: string;
  trackBanner?: string;
  trackType?: string;
  classesHosted?: string[];
  website?: string;
  trackLayout?: string;
  // Series specific
  seriesName?: string;
  seriesDescription?: string;
  profileComplete?: boolean;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  racers: any[];
  racersLoading: boolean;
  setRacers: (racers: any[]) => void;
  loadRacers: () => Promise<void>;
  redirectToSetup: (userType: string) => void;
  refreshSession: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [racers, setRacers] = useState<any[]>([]);
  const [racersLoading, setRacersLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Listen for custom events to open auth modal with specific user type
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
      // You could also set a default user type here if needed
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkSession();
        await loadRacers();
      } catch (error) {
        console.error('App initialization error:', error);
        setAppError('Failed to initialize application. Please refresh the page.');
        setSessionChecked(true);
        setRacersLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        console.log('🔍 Checking session for user:', authUser.id);
        
        // Load user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        if (profile) {
          console.log('✅ Profile found:', profile);
          // Create user object for app state
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            type: profile.user_type,
            user_type: profile.user_type,
            profilePicture: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
            profileComplete: profile.profile_complete
          };
          
          setUser(userData);
        } else {
          console.log('⚠️ No profile found for authenticated user. User may need to complete setup.');
          
          // Create a basic profile for the authenticated user to prevent foreign key violations
          try {
            const basicProfileData = {
              id: authUser.id,
              user_type: 'fan', // Default to fan type
              name: authUser.email?.split('@')[0] || 'User',
              email: authUser.email || '',
              profile_complete: false
            };
            
            const { error: createError } = await supabase
              .from('profiles')
              .insert(basicProfileData);
            
            if (createError) {
              console.error('Error creating basic profile:', createError);
            } else {
              console.log('✅ Basic profile created for authenticated user');
            }
          } catch (createProfileError) {
            console.error('Error creating basic profile:', createProfileError);
          }
          
          const userData: User = {
            id: authUser.id,
            name: authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            type: 'fan', // Default type, will be updated during setup
            user_type: 'fan',
            profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${authUser.email?.split('@')[0] || 'User'}`,
            profileComplete: false
          };
          
          setUser(userData);
        }
      } else {
        console.log('❌ No authenticated user found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error checking session - database may be unavailable');
      }
      
      setUser(null);
    } finally {
      setSessionChecked(true);
    }
  };

  const isLoadingRacersRef = useRef(false);
  const racersLoadedRef = useRef(false);

  const loadRacers = useCallback(async () => {
    if (isLoadingRacersRef.current) {
      console.log('loadRacers: already in progress, skipping');
      return;
    }
    if (racersLoadedRef.current && racers.length > 0) {
      console.log('loadRacers: data already loaded, skipping');
      return;
    }
    isLoadingRacersRef.current = true;
    try {
      setRacersLoading(true);
      console.log('Loading racers...');
      
      // Check if Supabase is configured before making requests
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - using empty racers array');
        setRacers([]);
        setRacersLoading(false);
        return;
      }
      
      // First, let's check what profiles exist
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log('All profiles:', allProfiles, 'Error:', allError);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          profile_complete,
          created_at,
          avatar,
          banner_image,
          racer_profiles (
            username,
            bio,
            car_number,
            racing_class,
            hometown,
            team_name,
            profile_photo_url,
            banner_photo_url,
            car_photos,
            social_links,
            monetization_enabled
          )
        `)
        .eq('user_type', 'racer');

      if (error) throw error;

      console.log('Racer profiles found:', profiles?.length || 0);
      console.log('Profiles data:', profiles);

      if (profiles && profiles.length > 0) {
        const racerIds = profiles.map((p: any) => p.id);

        // Batch fetch tiers and fan counts to avoid many parallel requests
        let tiersByRacer: Record<string, any[]> = {};
        let fanCountsByRacer: Record<string, number> = {};
        try {
          tiersByRacer = await getSubscriptionTiersForRacers(racerIds);
        } catch (tierBatchError) {
          console.error('Batch tier fetch failed:', tierBatchError);
        }
        try {
          fanCountsByRacer = await getFanCountsForRacers(racerIds);
        } catch (fanBatchError) {
          console.error('Batch fan count fetch failed:', fanBatchError);
        }

        const racersMapped = profiles.map((profile: any) => {
          const tiers = tiersByRacer[profile.id] || [];
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            profilePicture: profile.racer_profiles?.profile_photo_url || profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}&backgroundColor=ff6600&textColor=ffffff`,
            carNumber: profile.racer_profiles?.car_number || 'TBD',
            class: profile.racer_profiles?.racing_class || 'Racing',
            location: profile.racer_profiles?.hometown || 'Unknown',
            bio: profile.racer_profiles?.bio || 'Racing enthusiast',
            teamName: profile.racer_profiles?.team_name,
            bannerImage: profile.banner_image || profile.racer_profiles?.banner_photo_url,
            carPhotos: profile.racer_profiles?.car_photos || [],
            socialLinks: profile.racer_profiles?.social_links || {},
            monetizationEnabled: profile.racer_profiles?.monetization_enabled || false,
            subscriptionTiers: tiers.map((tier: any) => ({
              name: tier.tier_name,
              price: tier.price_cents / 100,
              description: tier.description || '',
              benefits: tier.benefits || []
            })),
            fanCount: fanCountsByRacer[profile.id] ?? 0,
            isLive: false,
            profileComplete: profile.profile_complete || false
          };
        });

        setRacers(racersMapped);
        racersLoadedRef.current = true;
      } else {
        setRacers([]);
      }
    } catch (error) {
      console.error('Error loading racers:', error);
      setRacers([]);
      // Don't throw error here, just log it
    } finally {
      setRacersLoading(false);
      isLoadingRacersRef.current = false;
    }
  }, [racers.length]);
  const redirectToSetup = (userType: string) => {
    // Use proper navigation with error handling
    try {
      if (userType === 'racer') {
        window.location.href = '/setup/racer';
      } else if (userType === 'fan') {
        window.location.href = '/setup/fan';
      } else if (userType === 'track') {
        window.location.href = '/setup/track';
      } else if (userType === 'series') {
        window.location.href = '/setup/series';
      } else {
        console.warn('Unknown user type for setup:', userType);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/';
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error || !session) {
        console.error('Failed to refresh session:', error);
        setUser(null);
        return false;
      }
      
      // Reload user profile after session refresh
      await checkSession();
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      showAuthModal,
      setShowAuthModal,
      racers,
      racersLoading,
      setRacers,
      loadRacers,
      redirectToSetup,
      refreshSession
    }}>
      <UserProvider>
        <ThemeProvider>
          {/* Error Boundary */}
          {appError && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center">
              <p>{appError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="ml-4 px-4 py-2 bg-red-700 hover:bg-red-800 rounded"
              >
                Refresh Page
              </button>
            </div>
          )}
          {!sessionChecked ? (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading OnlyRaceFans...</p>
                <p className="text-gray-500 text-sm mt-2">Connecting to database...</p>
              </div>
            </div>
          ) : (
            <Router>
              <ScrollToTop />
              <div className="min-h-screen bg-black text-white">
                <HeaderGate />
                <MainContent user={user} />
                {/* Footer (hidden on non-root routes) */}
                <AppFooter />
                {showAuthModal && <AuthModal />}
                <ToastContainer 
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark"
                />
              </div>
            </Router>
          )}
        </ThemeProvider>
      </UserProvider>
    </AppContext.Provider>
  );
}

export default App;