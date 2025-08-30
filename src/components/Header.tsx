import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Tv, Trophy, Wrench, Home, Rss, Users, Settings, Flag, Menu, X, Sun, Moon, Link as LinkIcon, Trash2, MessageCircle, Crown, Video, Target, LayoutDashboard } from 'lucide-react';
import { useApp } from '../App';
import { NotificationBell } from './NotificationBell';
import { supabase, deleteUserProfile } from '../lib/supabase';
import { GoLiveModal } from './GoLiveModal';
import { useTheme } from '../contexts/ThemeContext';

// Theme handling moved to src/contexts/ThemeContext.tsx

export const Header: React.FC = () => {
  const { user, setUser, setShowAuthModal } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGoLive, setShowGoLive] = useState(false);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
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
      await deleteUserProfile(user.id);
      setUser(null);
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

  const navigationItems: Array<
    | { path: string; label: string; icon: any; type?: 'link' }
    | { type: 'search'; label: string; icon: any }
  > = [
    { path: '/feed', label: 'Feed', icon: Rss, type: 'link' },
    { path: '/grandstand', label: 'Grandstand', icon: Home, type: 'link' },
    { path: '/racers', label: 'Racers', icon: Users, type: 'link' },
    { type: 'search', label: 'Search', icon: Search },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, type: 'link' },
    { path: '/tracks', label: 'Tracks', icon: Flag, type: 'link' },
    { path: '/series', label: 'Series', icon: Target, type: 'link' },
    { path: '/super-fans', label: 'Super Fans', icon: Crown, type: 'link' },
  ];

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
            <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
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
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item, idx) => {
                if ('type' in item && item.type === 'search') {
                  const Icon = item.icon as any;
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
                const { path, label, icon: Icon } = item as any;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                      <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>


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

              {user ? (
                <>
                  <NotificationBell />
                  
                  {user.profileComplete && (
                    <button
                      onClick={() => setShowGoLiveModal(true)}
                      className="relative p-2.5 rounded-xl transition-all duration-200 group bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl"
                      title="Go Live"
                    >
                      <Video className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </button>
                  )}
                  
                  {/* Coin/Token purchase removed */}
                  
                  <div className="relative profile-menu flex items-center space-x-3">
                    <button
                      onClick={() => setShowProfileMenu((s) => !s)}
                      className="relative group profile-menu-trigger"
                      title={user.name}
                    >
                      <div className={`p-1 rounded-full transition-all duration-200 group-hover:scale-110 ${
                        theme === 'dark' ? 'bg-gradient-to-r from-fedex-orange to-fedex-purple' : 'bg-gradient-to-r from-fedex-orange to-fedex-purple'
                      }`}>
                        <img
                          src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover shadow-md"
                        />
                      </div>
                    </button>
                    <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} text-sm font-medium hidden xl:inline`}>{user.name}</span>
                    {showProfileMenu && (
                      <div
                        className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden ${
                          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                        }`}
                      >
                        <Link
                          to={
                            user.type === 'racer' ? '/dashboard' :
                            user.type === 'fan' ? '/fan-dashboard' :
                            user.type === 'track' ? '/track-dashboard' :
                            user.type === 'series' ? '/series-dashboard' : '/dashboard'
                          }
                          className={`block px-4 py-3 text-sm font-medium transition-colors ${
                            theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'
                          }`}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                            theme === 'dark' ? 'text-red-400 hover:bg-gray-800 hover:text-red-300' : 'text-red-600 hover:bg-gray-100'
                          }`}
                        >
                          Logout
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
                {navigationItems.filter((i): i is { path: string; label: string; icon: any; type?: 'link' } => 'path' in i).map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(path) 
                        ? 'bg-gradient-to-r from-fedex-orange to-fedex-orange-dark text-white shadow-lg' 
                        : theme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-md'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Actions */}
              <div className="mt-4 pt-4 border-t border-gray-700/30">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50">
                      <img
                        src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{user.name}</p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{user.type}</p>
                      </div>
                    </div>
                    
                    <Link
                      to={
                        user.type === 'racer' ? '/dashboard' : 
                        user.type === 'fan' ? '/fan-dashboard' : 
                        user.type === 'track' ? '/track-dashboard' : 
                        user.type === 'series' ? '/series-dashboard' : '/dashboard'
                      }
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-md' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    
                    {/* Coin/Token purchase removed (mobile) */}
                    
                    {user.profileComplete && (
                      <button
                        onClick={() => setShowGoLive(true)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                      >
                        <Video className="h-5 w-5" />
                        <span>Go Live</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                    >
                      <User className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                    
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
      {user && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t safe-area-inset-bottom transition-all duration-300 ${
          theme === 'dark' ? 'bg-gray-900/98 border-gray-800/50 shadow-lg' : 'bg-white/98 border-gray-200/50 shadow-lg'
        }`}>
          <div className="flex items-center justify-around py-3 px-2">
            {/* Dashboard (left) */}
            <Link
              to={
                user.type === 'racer' ? '/dashboard' : 
                user.type === 'fan' ? '/fan-dashboard' : 
                user.type === 'track' ? '/track-dashboard' : 
                user.type === 'series' ? '/series-dashboard' : '/dashboard'
              }
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
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
            </Link>

            {/* Middle actions */}
            {/* Racers only: Go Live */}
            {user && user.type === 'racer' && user.profileComplete && (
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
            {user && user.type === 'fan' && (
              <>
                <Link
                  to="/feed"
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
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
                </Link>

                <Link
                  to="/racers"
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
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
                </Link>

                <Link
                  to="/tracks"
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
                    isActive('/tracks')
                      ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
                  }`}
                  aria-label="Tracks"
                >
                  <Flag className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs font-medium leading-tight">Tracks</span>
                  {isActive('/tracks') && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
                  )}
                </Link>
              </>
            )}

            {/* Profile (right) */}
            <Link
              to={
                user.type === 'racer' ? '/dashboard' : 
                user.type === 'fan' ? '/fan-dashboard' : 
                user.type === 'track' ? '/track-dashboard' : 
                user.type === 'series' ? '/series-dashboard' : '/dashboard'
              }
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 relative group ${
                isActive('/dashboard') || isActive('/fan-dashboard') || isActive('/track-dashboard') || isActive('/series-dashboard')
                  ? 'text-fedex-orange bg-fedex-orange/20 scale-105 shadow-lg' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 hover:scale-105'
              }`}
              aria-label="Profile"
            >
              <Settings className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-xs font-medium leading-tight">Profile</span>
              {(isActive('/dashboard') || isActive('/fan-dashboard') || isActive('/track-dashboard') || isActive('/series-dashboard')) && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fedex-orange rounded-full animate-pulse"></div>
              )}
            </Link>
          </div>
        </nav>
      )}
      
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
      {showGoLiveModal && user && (
        <GoLiveModal
          onClose={() => setShowGoLiveModal(false)}
          onGoLive={(streamData) => {
            console.log('Stream started:', streamData);
            setShowGoLiveModal(false);
          }}
        />
      )}
    </>
  );
};