import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Bell, Search, Trophy, Layers, Handshake, Megaphone, Upload } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CreatePost } from '@/components/fan-dashboard/posts/CreatePost';

type RacerListItem = {
  id: string;
  name?: string;
  carNumber?: string | number;
  location?: string;
  class?: string;
  profilePicture?: string;
};

const Fanheader = () => {
  const { user, logout } = useUser();
  const { theme } = useTheme();
  const { racers } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [racerSearch, setRacerSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputWrapperRef = useRef<HTMLDivElement | null>(null);

  const racerList: RacerListItem[] = racers as RacerListItem[];
  const matches = useMemo(() => {
    const q = racerSearch.trim();
    if (!q) return [] as RacerListItem[];
    const qLower = q.toLowerCase();
    return racerList.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const car = (r.carNumber ?? '').toString();
      const loc = (r.location || '').toLowerCase();
      return name.includes(qLower) || car.includes(q) || loc.includes(qLower);
    });
  }, [racerSearch, racerList]);

  useEffect(() => {
    if (!racerSearch.trim()) {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    } else {
      setShowSuggestions(true);
    }
  }, [racerSearch]);
  
  if (!user) return null;
  
  return (
    <header
      className={`sticky top-0 z-50 pt-3 pb-3 px-6 backdrop-blur-xl border-b shadow-lg transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/95 border-gray-800/50 shadow-black/20'
          : 'bg-white/95 border-gray-200/50 shadow-gray-200/20'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Logo + Racers search */}
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="shrink-0" aria-label="OnlyRaceFans Home">
            <img src="/onlyracefans-logo.png" alt="OnlyRaceFans" className="h-8 w-auto" />
          </Link>
          <div className="relative hidden md:block w-full max-w-md" ref={inputWrapperRef}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search racers..."
              value={racerSearch}
              onChange={(e) => {
                setRacerSearch(e.target.value);
                setHighlightIndex(-1);
              }}
              className={`w-full pl-12 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange ${
                theme === 'dark'
                  ? 'bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-400'
                  : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setShowSuggestions(true);
                  setHighlightIndex((i) => Math.min(i + 1, Math.min(matches.length, 5) - 1));
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, -1));
                  return;
                }
                if (e.key === 'Enter') {
                  const q = racerSearch.trim();
                  if (highlightIndex >= 0 && highlightIndex < Math.min(matches.length, 5)) {
                    const r = matches[highlightIndex];
                    if (r) navigate(`/racer/${r.id}`);
                  } else {
                    navigate(q ? `/racers?q=${encodeURIComponent(q)}` : '/racers');
                  }
                  setShowSuggestions(false);
                  return;
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setHighlightIndex(-1);
                  return;
                }
              }}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowSuggestions(false), 120);
              }}
            />
            {/* Autocomplete suggestions */}
            {racerSearch.trim() && showSuggestions && (
              <div className={`absolute left-0 right-0 mt-2 rounded-xl overflow-hidden border shadow-xl ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <div className="max-h-72 overflow-y-auto">
                  {matches
                    .slice(0, 5)
                    .map((r, idx) => (
                      <Link
                        key={r.id}
                        to={`/racer/${r.id}`}
                        className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                          theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        } ${idx === highlightIndex ? (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                        onMouseDown={(e) => {
                          // Prevent input blur before navigation
                          e.preventDefault();
                        }}
                      >
                        <img
                          src={r.profilePicture && r.profilePicture.trim() !== '' ? r.profilePicture : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name || 'Racer')}`}
                          alt={r.name || 'Racer'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{r.name}</div>
                          <div className="text-xs text-gray-400 truncate">#{r.carNumber} • {r.class}</div>
                        </div>
                      </Link>
                    ))}
                  {/* Empty state */}
                  {matches.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400">No racers found</div>
                  )}
                  {/* View all */}
                  {matches.length > 5 && (
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-medium text-fedex-orange hover:text-fedex-orange-dark"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const q = racerSearch.trim();
                        navigate(q ? `/racers?q=${encodeURIComponent(q)}` : '/racers');
                      }}
                    >
                      View all results
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Center: Quick action icons */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-6">
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/grandstand') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Grandstand"
            aria-label="Grandstand"
            onClick={() => navigate('/grandstand')}
          >
            <Megaphone className={`h-6 w-6 ${location.pathname.startsWith('/grandstand') ? 'text-fedex-orange' : ''}`} />
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/racers') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Search"
            aria-label="Search"
            onClick={() => navigate('/racers')}
          >
            <Search className={`h-6 w-6 ${location.pathname.startsWith('/racers') ? 'text-fedex-orange' : ''}`} />
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/super-fans') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Leaderboard"
            aria-label="Leaderboard"
            onClick={() => navigate('/super-fans')}
          >
            <Trophy className={`h-6 w-6 ${location.pathname.startsWith('/super-fans') ? 'text-fedex-orange' : ''}`} />
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/series') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Series"
            aria-label="Series"
            onClick={() => navigate('/series')}
          >
            <Layers className={`h-6 w-6 ${location.pathname.startsWith('/series') ? 'text-fedex-orange' : ''}`} />
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/sponsorships') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Sponsorship"
            aria-label="Sponsorship"
            onClick={() => navigate('/sponsorships')}
          >
            <Handshake className={`h-6 w-6 ${location.pathname.startsWith('/sponsorships') ? 'text-fedex-orange' : ''}`} />
          </button>
        </div>

        {/* Right: Create Post + Notification + user controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Create Post */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="hidden md:inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-fedex-orange hover:bg-fedex-orange-dark text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Create Post</span>
          </button>
          {/* Notification bell */}
          <button 
            className={`p-2 relative rounded-md transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            }`}
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="flex items-center space-x-2 focus:outline-none"
              aria-label="User menu"
            >
              {user.avatar && (
                <img 
                  src={user.avatar} 
                  alt="User avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {user.name || user.email.split('@')[0]}
              </span>
              <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={`w-48 mt-2 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}
              align="end"
            >
              <DropdownMenuItem asChild>
                <Link to="/settings/profile" className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings/profile" className="w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={logout}
                className="text-red-600 focus:text-red-600"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => setShowCreatePost(false)}
        />
      )}
    </header>
  );
};

export default Fanheader;