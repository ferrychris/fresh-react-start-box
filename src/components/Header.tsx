import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, User, Tv, Trophy, Home, Users, Settings, Flag, Menu, X, Sun, Moon, Trash2, Crown, Video, Target, LayoutDashboard, MapPin, Compass, BarChart3, Calendar, DollarSign, MessageSquare, Heart, Clock, Gauge, Award } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthModal } from './auth/AuthModal';

// Placeholder components for NotificationBell and GoLiveModal
const NotificationBell: React.FC = () => {
  const { theme } = useTheme();
  return (
    <button
      className={`relative p-2.5 rounded-xl transition-all duration-200 group ${
        theme === 'dark'
          ? 'text-gray-400 hover:text-white hover:bg-gray-800/80 hover:shadow-lg'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-lg'
      }`}
      title="Notifications"
    >
      <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>
  );
};

const GoLiveModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative max-w-md w-full rounded-2xl shadow-2xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Go Live</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>This feature is coming soon.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-fedex-orange to-fedex-orange-dark rounded-xl text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Define ViewType for navigation
export type ViewType = 
  | 'landing'
  | 'discover'
  | 'dashboard'
  | 'home'
  | 'feed'
  | 'dashboard'
  | 'racers'
  | 'leaderboard'
  | 'tracks'
  | 'series'
  | 'super-fans'
  | 'fan-dashboard'
  | 'track-dashboard'
  | 'series-dashboard'
  | 'discover'
  | 'dashboard-analytics'
  | 'dashboard-schedule'
  | 'dashboard-earnings'
  | 'dashboard-messages'
  | 'dashboard-fans'
  | 'dashboard-history'
  | 'dashboard-performance'
  | 'dashboard-achievements'
  | 'dashboard-racers'
  | 'profile'
  | 'profile'
  | 'fan-profile'
  | 'track-profile'
  | 'series-profile'
  | 'racers'
  | 'search'
  | 'car-sponsorship'
  | 'marketplace'
  | 'sponsor-dashboard'
  | 'groups';

// Theme handling moved to src/contexts/ThemeContext.tsx

interface HeaderProps {
  onViewChange: (view: ViewType, id?: string) => void;
  currentView: ViewType;
}

export const Header: React.FC<HeaderProps> = ({ onViewChange, currentView }) => {
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed unused state
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (path: string) => {
    if (path === '/feed' && currentView === 'discover') return true;
    if (path === '/dashboard' && currentView === 'dashboard') return true;
    if (path === '/racers' && currentView === 'racers') return true;
    if (path === '/ace' && currentView === 'racers') return true;
    if (path === '/leaderboard' && currentView === 'leaderboard') return true;
    if (path === '/tracks' && currentView === 'tracks') return true;
    if (path === '/series' && currentView === 'series') return true;
    if (path === '/super-fans' && currentView === 'super-fans') return true;
    
    // Dashboard section paths
    if (path === '/dashboard/analytics' && currentView === 'dashboard-analytics') return true;
    if (path === '/dashboard/schedule' && currentView === 'dashboard-schedule') return true;
    if (path === '/dashboard/earnings' && currentView === 'dashboard-earnings') return true;
    if (path === '/dashboard/messages' && currentView === 'dashboard-messages') return true;
    if (path === '/dashboard/fans' && currentView === 'dashboard-fans') return true;
    if (path === '/dashboard/history' && currentView === 'dashboard-history') return true;
    if (path === '/dashboard/performance' && currentView === 'dashboard-performance') return true;
    if (path === '/dashboard/achievements' && currentView === 'dashboard-achievements') return true;
    
    return location.pathname === path;
  };
  
  // Check if current view is any dashboard
  const isDashboardView = () => {
    return (
      currentView === 'dashboard' || 
      currentView === 'fan-dashboard' || 
      currentView === 'track-dashboard' || 
      currentView === 'series-dashboard' ||
      currentView?.startsWith('dashboard-')
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      `Are you absolutely sure you want to delete your profile?\n\n` +
      `This will permanently delete:\n` +
      `• Your profile and all data\n` +
      `• All posts and content\n` +
      `• Fan connections and earnings\n` +
      `• Your account access\n\n` +
      `This action CANNOT be undone!`
    );
    
    if (!confirmDelete) return;
    
    const finalConfirm = window.confirm(
      `FINAL CONFIRMATION:\n\n` +
      `Type "DELETE" in the next prompt to confirm permanent deletion of your profile.`
    );
    
    if (!finalConfirm) return;
    
    const deleteConfirmation = window.prompt(
      `Type "DELETE" (all caps) to permanently delete your profile:`
    );
    
    if (deleteConfirmation !== 'DELETE') {
      alert('Profile deletion cancelled. You must type "DELETE" exactly.');
      return;
    }
    
    try {
      // This would need to be implemented with a proper API call
      await logout();
      setShowDeleteModal(false);
      alert('Your profile has been permanently deleted.');
      window.location.href = '/';
    } catch (error) {
      console.error('Delete profile error:', error);
      alert('Failed to delete profile. Please contact support.');
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowSearch(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-toggle')) {
        setShowMobileMenu(false);
      }
      if (!target.closest('.profile-menu') && !target.closest('.profile-menu-trigger')) {
        setShowProfileMenu(false);
      }
    };

    if (showMobileMenu || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu, showProfileMenu]);

  // Navigation items for logged-in users
  const loggedInNavigationItems: Array<
    | { path: string; label: string; icon: React.ElementType; type?: 'link' }
    | { type: 'search'; label: string; icon: React.ElementType }
  > = [
    { path: '/feed', label: 'Grandstand', icon: Home, type: 'link' },
    { path: '/racers', label: 'Racers', icon: Users, type: 'link' },
    { type: 'search', label: 'Search', icon: Search },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, type: 'link' },
    { path: '/tracks', label: 'Tracks', icon: Flag, type: 'link' },
    { path: '/series', label: 'Series', icon: Target, type: 'link' },
    { path: '/super-fans', label: 'Super Fans', icon: Crown, type: 'link' },
  ];
  
  // Navigation items for logged-out users
  const loggedOutNavigationItems: Array<
    | { path: string; label: string; icon: React.ElementType; type?: 'link' }
    | { type: 'search'; label: string; icon: React.ElementType }
  > = [
    { path: '/feed', label: 'Discover', icon: Compass, type: 'link' },
    { path: '/racers', label: 'Racers', icon: Users, type: 'link' },
    { type: 'search', label: 'Search', icon: Search },
    { path: '/tracks', label: 'Tracks', icon: Flag, type: 'link' },
    { path: '/series', label: 'Series', icon: Target, type: 'link' },
  ];
  
  // Select the appropriate navigation items based on authentication status
  const navigationItems = user ? loggedInNavigationItems : loggedOutNavigationItems;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-lg transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-black/95 border-gray-800/50 shadow-black/20' 
          : 'bg-white/95 border-gray-200/50 shadow-gray-200/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div onClick={() => onViewChange('home')} className="flex items-center space-x-3 group flex-shrink-0 cursor-pointer">
              <div className="relative flex items-center space-x-2">
                <Flag className="h-4 w-4 text-fedex-orange" aria-hidden="true" />
                <img 
                  src="/files_4459890-1753947080801-only%20race%20fans%20logo.png" 
                  alt="OnlyRaceFans flag logo" 
                  className="h-7 w-7 rounded-2xl object-cover group-hover:opacity-90 transition-all duration-200 group-hover:scale-105"
                />
                <span className={`text-base font-extrabold tracking-tight select-none ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  OnlyRace
                  <span className="text-fedex-orange">Fans</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            {isDashboardView() && user ? (
              <nav className="hidden lg:flex items-center space-x-1 bg-gradient-to-r from-gray-900/30 to-transparent px-3 py-1 rounded-xl">
                {/* Dashboard Navigation - Role specific */}
                {user.user_type === 'RACER' && (
                  <>
                    <div
                      onClick={() => onViewChange('dashboard')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-analytics')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/analytics')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-schedule')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/schedule')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Schedule</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-earnings')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/earnings')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Earnings</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-fans')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/fans')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      <span>Fans</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-messages')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/messages')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Messages</span>
                    </div>
                  </>
                )}
                
                {user.user_type === 'FAN' && (
                  <>
                    <div
                      onClick={() => onViewChange('fan-dashboard')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-racers')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/racers')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>My Racers</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-history')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/history')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span>History</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-messages')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/messages')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Messages</span>
                    </div>
                  </>
                )}
                
                {(user.user_type === 'TRACK' || user.user_type === 'SERIES') && (
                  <>
                    <div
                      onClick={() => onViewChange(user.user_type === 'TRACK' ? 'track-dashboard' : 'series-dashboard')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-analytics')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/analytics')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-schedule')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/schedule')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Events</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-performance')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/performance')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Gauge className="h-4 w-4" />
                      <span>Performance</span>
                    </div>
                    
                    <div
                      onClick={() => onViewChange('dashboard-achievements')}
                      className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive('/dashboard/achievements')
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-white hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <Award className="h-4 w-4" />
                      <span>Achievements</span>
                    </div>
                  </>
                )}
              </nav>
            ) : (
              <nav className="hidden lg:flex items-center space-x-1">
                {navigationItems.map((item, idx) => {
                  if ('type' in item && item.type === 'search') {
                    const Icon = item.icon;
                    return (
                      <button
                        key={`search-${idx}`}
                        onClick={() => setShowSearch((s) => !s)}
                        className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                        }`}
                        title="Search"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  const { path, label, icon: Icon } = item;
                  // Extract view type from path (remove leading slash)
                  const viewType = path.substring(1) as ViewType;
                  
                  return (
                    <div
                      key={path}
                      onClick={() => onViewChange(viewType)}
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive(path)
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg shadow-fedex-orange/25'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      {isActive(path) && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fedex-orange opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-fedex-orange"></span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}


            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative p-2.5 rounded-xl transition-all duration-200 group ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80 hover:shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-lg'
                }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                ) : (
                  <Moon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                )}
              </button>
              
              {/* Removed duplicate desktop Sign In button (fallback exists below) */}
              
              {user ? (
                <>
                  {/* Use NotificationBell component */}
                  <NotificationBell />
                  
                  {/* Go Live button */}
                  <button
                    onClick={() => setShowGoLiveModal(true)}
                    className="relative p-2.5 rounded-xl transition-all duration-200 group bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl"
                    title="Go Live"
                  >
                    <Video className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </button>
                  
                  {/* Coin/Token purchase removed */}
                  
                  <div className="relative profile-menu flex items-center space-x-3">
                    <div className="hidden md:flex items-center space-x-3 pr-2 border-r border-gray-300 dark:border-gray-700">
                      <div className={`px-3 py-1.5 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-1">
                          <Crown className="h-4 w-4 text-fedex-orange" />
                          <span className={`text-xs font-semibold ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>{user.user_type}</span>
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{user.name}</p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{user.email || 'Member since 2023'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfileMenu((s) => !s)}
                      className="relative group profile-menu-trigger"
                      title={user.name}
                    >
                      <div className={`p-1 rounded-full transition-all duration-200 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-gradient-to-r from-fedex-orange to-fedex-purple' : 'bg-gradient-to-r from-fedex-orange to-fedex-purple'
                      }`}>
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover shadow-md"
                        />
                      </div>
                    </button>
                    <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} text-sm font-medium hidden sm:inline md:hidden`}>{user.name}</span>
                    {showProfileMenu && (
                      <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg overflow-hidden z-20 border ${
                        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                      }`}>
                        {/* User Profile Header */}
                        <div className={`p-4 border-b ${
                          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover shadow-md border-2 border-fedex-orange"
                            />
                            <div>
                              <h3 className={`font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{user.name}</h3>
                              <div className="flex items-center space-x-1">
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>{user.user_type}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-xs text-green-500">Online</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* User Stats */}
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className={`text-center p-1 rounded ${
                              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <div className="text-fedex-orange font-bold text-sm">24</div>
                              <div className="text-xs text-gray-500">Races</div>
                            </div>
                            <div className={`text-center p-1 rounded ${
                              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <div className="text-fedex-orange font-bold text-sm">142</div>
                              <div className="text-xs text-gray-500">Followers</div>
                            </div>
                            <div className={`text-center p-1 rounded ${
                              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <div className="text-fedex-orange font-bold text-sm">86</div>
                              <div className="text-xs text-gray-500">Following</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Options */}
                        <div
                          onClick={() => {
                            setShowProfileMenu(false);
                            onViewChange(
                              user.user_type === 'RACER' ? 'dashboard' :
                              user.user_type === 'FAN' ? 'fan-dashboard' :
                              user.user_type === 'TRACK' ? 'track-dashboard' :
                              user.user_type === 'SERIES' ? 'series-dashboard' :
                              'admin'
                            );
                          }}
                          className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-100/10 cursor-pointer`}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Dashboard</span>
                        </div>
                        
                        <div
                          onClick={() => {
                            setShowProfileMenu(false);
                            onViewChange('profile');
                          }}
                          className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-100/10 cursor-pointer`}
                        >
                          <User className="h-4 w-4" />
                          <span>Edit Profile</span>
                        </div>
                        
                        <button
                          onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                          className={`w-full flex items-center space-x-3 text-left px-4 py-3 text-sm font-medium transition-colors ${
                            theme === 'dark' ? 'text-red-400 hover:bg-gray-800 hover:text-red-300' : 'text-red-600 hover:bg-gray-100'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-fedex-orange to-fedex-orange-dark hover:from-fedex-orange-dark hover:to-fedex-orange rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-1 md:hidden">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2.5 rounded-xl transition-all duration-200 mobile-menu-toggle ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showSearch && (
            <div className="md:hidden pb-4">
              <div className="relative group">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-400 group-focus-within:text-fedex-orange' : 'text-gray-500 group-focus-within:text-fedex-orange'
                }`} />
                <input
                  type="text"
                  placeholder="Search racers, classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange/50 focus:border-fedex-orange transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-800/80 border border-gray-700/50 text-white hover:bg-gray-800 hover:border-gray-600'
                      : 'bg-gray-50/80 border border-gray-300/50 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className={`md:hidden mobile-menu border-t transition-all duration-300 ${
            theme === 'dark' ? 'border-gray-800/50 bg-black/98 backdrop-blur-xl' : 'border-gray-200/50 bg-white/98 backdrop-blur-xl'
          }`}>
            <div className="px-4 py-3">
              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {navigationItems.filter((i): i is { path: string; label: string; icon: React.ElementType; type?: 'link' } => 'path' in i).map(({ path, label, icon: Icon }) => {
                  // Extract view type from path (remove leading slash)
                  const viewType = path.substring(1) as ViewType;
                  
                  return (
                    <div
                      key={path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive(path) 
                          ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg' 
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-md'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                      }`}
                      onClick={() => {
                        setShowMobileMenu(false);
                        onViewChange(viewType);
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </nav>

              {/* Mobile User Actions */}
              <div className="mt-4 pt-4 border-t border-gray-700/30">
                {user ? (
                  <div className="space-y-2">
                    <div className={`px-4 py-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/70' : 'bg-gray-100/70'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="p-1 rounded-full bg-gradient-to-r from-fedex-orange to-fedex-purple">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover shadow-md border-2 border-fedex-orange"
                            />
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}></div>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{user.name}</p>
                          <div className="flex items-center space-x-1">
                            <span className={`text-xs ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>{user.user_type}</span>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <span className="text-xs text-green-500">Online</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* User Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className={`text-center p-1.5 rounded ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-white/70'}`}>
                          <div className="text-fedex-orange font-bold text-sm">24</div>
                          <div className="text-xs text-gray-500">Races</div>
                        </div>
                        <div className={`text-center p-1.5 rounded ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-white/70'}`}>
                          <div className="text-fedex-orange font-bold text-sm">142</div>
                          <div className="text-xs text-gray-500">Followers</div>
                        </div>
                        <div className={`text-center p-1.5 rounded ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-white/70'}`}>
                          <div className="text-fedex-orange font-bold text-sm">86</div>
                          <div className="text-xs text-gray-500">Following</div>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      onClick={() => {
                        onViewChange(
                          user.user_type === 'RACER' ? 'dashboard' : 
                          user.user_type === 'FAN' ? 'fan-dashboard' : 
                          user.user_type === 'TRACK' ? 'track-dashboard' : 
                          user.user_type === 'SERIES' ? 'series-dashboard' : 'dashboard'
                        );
                        setShowProfileMenu(false);
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-md' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Dashboard</span>
                    </div>
                    
                    <div
                      onClick={() => {
                        setShowProfileMenu(false);
                        onViewChange('profile');
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-md' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span>Edit Profile</span>
                    </div>
                    
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>Delete Profile</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-fedex-orange to-fedex-orange-dark hover:from-fedex-orange-dark hover:to-fedex-orange text-white transition-all duration-200 shadow-lg"
                  >
                    <User className="h-5 w-5" />
                    <span>Sign In</span>
                  </button>
                )}
                
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t safe-area-inset-bottom transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900/98 border-gray-800/50 shadow-lg' : 'bg-white/98 border-gray-200/50 shadow-lg'
      }`}>
        <div className="flex items-center justify-around py-3 px-2">
          {user ? (
            <>
              {/* Dashboard (left) - For logged in users */}
              <div
                onClick={() => onViewChange(
                  user.user_type === 'RACER' ? 'dashboard' : 
                  user.user_type === 'FAN' ? 'fan-dashboard' : 
                  user.user_type === 'TRACK' ? 'track-dashboard' : 
                  user.user_type === 'SERIES' ? 'series-dashboard' : 'dashboard'
                )}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                  (isActive('/dashboard') || isActive('/fan-dashboard') || isActive('/track-dashboard') || isActive('/series-dashboard'))
                    ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg' 
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                }`}
                aria-label="Dashboard"
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs font-medium leading-tight">Dashboard</span>
                {(isActive('/dashboard') || isActive('/fan-dashboard') || isActive('/track-dashboard') || isActive('/series-dashboard')) && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                )}
              </div>

              {/* Middle actions */}
              {/* Racers only: Go Live */}
              {user.user_type === 'RACER' && (
                <button
                  onClick={() => setShowGoLiveModal(true)}
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
                    theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                  }`}
                  aria-label="Go Live"
                >
                  <Video className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs font-medium leading-tight">Go Live</span>
                </button>
              )}

              {/* Fans: Live, Racers, Tracks */}
              {user.user_type === 'FAN' && (
                <>
                  <div
                    onClick={() => onViewChange('feed')}
                    className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                      isActive('/feed')
                        ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                    }`}
                    aria-label="Live"
                  >
                    <Tv className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-xs font-medium leading-tight">Live</span>
                    {isActive('/feed') && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                    )}
                  </div>

                  <div
                    onClick={() => onViewChange('series')}
                    className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                      isActive('/series')
                        ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                    }`}
                    aria-label="Series"
                  >
                    <Trophy className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-xs font-medium leading-tight">Series</span>
                    {isActive('/series') && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                    )}
                  </div>

                  <div
                    onClick={() => onViewChange('tracks')}
                    className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                      isActive('/tracks')
                        ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                    }`}
                    aria-label="Tracks"
                  >
                    <MapPin className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-xs font-medium leading-tight">Tracks</span>
                    {isActive('/tracks') && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                    )}
                  </div>
                </>
              )}

              {/* Profile (right) */}
              <div
                onClick={() => setShowProfileMenu(true)}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                  showProfileMenu
                    ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg' 
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                }`}
                aria-label="Profile"
              >
                <div className="relative">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover shadow-md border border-fedex-orange"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border ${theme === 'dark' ? 'border-gray-900' : 'border-white'}`}></div>
                </div>
                <span className="text-xs font-medium leading-tight">Profile</span>
                {showProfileMenu && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Navigation for logged out users */}
              <div
                onClick={() => onViewChange('feed')}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                  isActive('/feed')
                    ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                }`}
                aria-label="Discover"
              >
                <Compass className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs font-medium leading-tight">Discover</span>
                {isActive('/feed') && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                )}
              </div>
              
              <div
                onClick={() => onViewChange('racers')}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer ${
                  isActive('/racers')
                    ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                }`}
                aria-label="Racers"
              >
                <Users className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs font-medium leading-tight">Racers</span>
                {isActive('/racers') && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Sign In Button for Mobile */}
              <div
                onClick={() => setShowAuthModal(true)}
                className="flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group cursor-pointer bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white"
                aria-label="Sign In"
              >
                <User className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs font-medium leading-tight">Sign In</span>
              </div>
            </>
          )}
        </div>
      </nav>
      
      {/* Token store removed */}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className={`relative max-w-md w-full rounded-2xl shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Sign Out
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Are you sure you want to sign out?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative max-w-md w-full rounded-2xl shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Delete Profile
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> This will permanently delete your entire profile, 
                  all posts, fan connections, earnings data, and account access.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Go Live Modal */}
      <GoLiveModal isOpen={showGoLiveModal} onClose={() => setShowGoLiveModal(false)} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};