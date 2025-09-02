import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { getSubscriptionTiersForRacers, getFanCountsForRacers } from './lib/supabase';
import { Header } from './components/Header';
import type { ViewType } from './components/Header';
import Feed from './pages/Feed';
import { Racers } from './pages/Racers';
import { Tracks } from './pages/Tracks';
import { HowItWorks } from './pages/HowItWorks';
import { TrackProfile } from './pages/TrackProfile';
import { RacerProfile } from './pages/RacerProfile';
import { SeriesProfile } from './pages/SeriesProfile';
import { Series } from './pages/Series';
import { SuperFans } from './pages/SuperFans';
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
import LiveFeed from './pages/LiveFeed';
import { HowSponsorshipWorks } from './pages/HowSponsorshipWorks';
import { FounderLetter } from './pages/FounderLetter';
import { Home } from './pages/Home';
import { ComingSoon } from './pages/ComingSoon';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import SettingsProfile from './pages/SettingsProfile';
import TestRunner from './components/TestRunner';
import Grandstand from './pages/Grandstand';
import { AppProvider, useApp } from './contexts/AppContext';
import { Toaster } from 'react-hot-toast';
import Fanheader from './components/fan-dashboard/Fanheader'; // Import Fanheader component

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

// Minimal footer for logged-in pages
const AppFooterMinimal: React.FC = () => {
  return (
    <footer className="border-t transition-colors duration-300 bg-gray-900 border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center">
          <p className="text-sm text-gray-400">&copy; 2025 OnlyRaceFans.co. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Render the appropriate header based on auth state and route
const HeaderGate: React.FC = () => {
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const onViewChange = (view: ViewType, id?: string) => {
    switch (view) {
      case 'feed':
        navigate('/feed');
        break;
      case 'racers':
        navigate('/racers');
        break;
      case 'tracks':
        navigate('/tracks');
        break;
      case 'series':
        navigate('/series');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'fan-dashboard':
        navigate('/fan-dashboard');
        break;
      case 'track-dashboard':
        navigate('/track-dashboard');
        break;
      case 'series-dashboard':
        navigate('/series-dashboard');
        break;
      case 'profile':
        if (id) navigate(`/racer/${id}`); else navigate('/settings/profile');
        break;
      default:
        navigate('/');
    }
  };

  // Show main header only on home page or when not logged in
  if (location.pathname === '/' || !user) {
    return (
      <Header 
        currentView={location.pathname === '/' ? 'landing' : 'discover'}
        onViewChange={onViewChange}
      />
    );
  }

  // Show Fanheader for logged-in users on all other pages
  return <Fanheader />;
};

// Main content area with conditional padding based on route
const MainContent: React.FC<{ user?: User | null; showAuthModal?: boolean }>
  = ({ user }) => {
  const loc = useLocation();
  const mainPadding = loc.pathname === '/'
    ? 'pt-0 pb-0'
    : loc.pathname === '/grandstand'
      ? 'pt-0 pb-20 md:pb-0'
      : 'pt-16 pb-20 md:pb-0';
  return (
    <main className={mainPadding}>
      <Routes>
        <Route path="/" element={<Navigate to="/fan-dashboard" replace />} />
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
        <Route
          path="/dashboard"
          element={
            user?.user_type === 'racer' ? (
              <Dashboard />
            ) : user?.user_type === 'fan' ? (
              <FanDashboard />
            ) : user?.user_type === 'track' ? (
              <TrackDashboard />
            ) : user?.user_type === 'series' ? (
              <SeriesDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Stick with legacy fan dashboard route */}
        <Route path="/fan-dashboard" element={<FanDashboard />} />
        {/* Redirect generic /fan to legacy /fan-dashboard */}
        <Route path="/fan" element={<Navigate to="/fan-dashboard" replace />} />
        {/* Redirect old fan profile/settings routes to settings profile */}
        <Route path="/fan/profile" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/fan/settings" element={<Navigate to="/settings/profile" replace />} />
        {/** Removed dynamic fan route to simplify navigation */}
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
            &copy; 2025 OnlyRaceFans.co. All rights reserved.
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

const AppContent: React.FC = () => {
  const { sessionChecked, user } = useApp();

  if (!sessionChecked) {
    return <div>Loading...</div>; // Or a proper splash screen
  }

  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <ScrollToTop />
        <HeaderGate />
        <MainContent user={user} />
        {/* Footer: full on logged-out pages, minimal on logged-in pages */}
        {user ? <AppFooterMinimal /> : <AppFooter />}
        <Toaster position="bottom-center" />
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
  );
};

// Main App wrapper
const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </ThemeProvider>
    </AppProvider>
  );
};

export default App;