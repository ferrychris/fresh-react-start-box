import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Bell, Search, Upload, Home, Trophy, Flag, Handshake } from 'lucide-react';
import { ProfileCompletionIndicator } from '@/components/ProfileCompletionIndicator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'tip' | 'badge' | 'subscription' | 'post' | 'comment';
    timestamp: string;
    content: string;
    metadata?: Record<string, any>;
    timeAgo: string;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
  
  // Ensure page content isn't hidden behind fixed header and bottom nav on mobile
  useEffect(() => {
    // Add bottom padding on mobile to account for fixed bottom nav
    const mm = window.matchMedia('(max-width: 767px)');
    const origPaddingBottom = document.body.style.paddingBottom;
    const applyPadding = () => {
      if (mm.matches) {
        document.body.style.paddingBottom = '64px'; // approximate height of mobile bottom nav
      } else {
        document.body.style.paddingBottom = origPaddingBottom;
      }
    };
    applyPadding();
    const listener = () => applyPadding();
    type SafeMQL = MediaQueryList & {
      addListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
    };
    const smm = mm as SafeMQL;
    if (typeof smm.addEventListener === 'function') {
      smm.addEventListener('change', listener);
    } else if (typeof smm.addListener === 'function') {
      smm.addListener(listener);
    }
    return () => {
      // Cleanup: restore original padding and remove listener
      document.body.style.paddingBottom = origPaddingBottom;
      if (typeof smm.removeEventListener === 'function') {
        smm.removeEventListener('change', listener);
      } else if (typeof smm.removeListener === 'function') {
        smm.removeListener(listener);
      }
    };
  }, []);

  const getTimeAgo = useCallback((date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.max(0, Math.floor(seconds))}s`;
  }, []);

  const loadRecentActivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingActivity(true);
      const lastSeenKey = `activity_last_seen_${user.id}`;
      const lastSeenStr = localStorage.getItem(lastSeenKey);
      const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
      const { data, error } = await supabase
        .from('fan_activity')
        .select('*')
        .eq('fan_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      const items = (data || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type as any,
        timestamp: a.created_at,
        content: a.content || '',
        metadata: {
          racerName: a.racer_name,
          amount: a.amount,
          postContent: a.post_content,
          commentContent: a.comment_content,
        },
        timeAgo: getTimeAgo(new Date(a.created_at)),
      }));
      setRecentActivity(items);
      // compute unread vs lastSeen
      const unread = (data || []).filter((a: any) => new Date(a.created_at).getTime() > lastSeen).length;
      setUnreadCount(unread);
    } catch (e) {
      // non-fatal
    } finally {
      setLoadingActivity(false);
    }
  }, [user?.id, getTimeAgo]);

  const markAllAsRead = useCallback(() => {
    if (!user?.id) return;
    const lastSeenKey = `activity_last_seen_${user.id}`;
    localStorage.setItem(lastSeenKey, new Date().toISOString());
    setUnreadCount(0);
  }, [user?.id]);
  
  if (!user) return null;
  
  // Normalize profile user_type for routing
  const profileUserType = (user?.user_type || '').toLowerCase();
  const profileRoute =
    profileUserType === 'racer'
      ? '/dashboard'
      : profileUserType === 'fan'
        ? '/fan-dashboard'
        : profileUserType === 'track'
          ? '/track-dashboard'
          : profileUserType === 'series'
            ? '/series-dashboard'
            : '/dashboard';

  return (
    <>
    <header
      className={`fixed top-0 inset-x-0 z-50 h-16 border-b shadow-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-800'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo + Racers search */}
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="shrink-0 flex items-center gap-3 group" aria-label="OnlyRaceFans Home">
          <div className="group flex-shrink-0 cursor-pointer">
              <div className="h-[44px] md:h-[50px] flex items-center justify-center overflow-hidden transition-transform duration-300">
                <img src="/onlyracefanlogo.png" alt="OnlyRaceFan Logo" className="h-[150px] w-[180px] md:h-[200px] md:w-[250px] object-contain" />
              </div>
            </div>
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
        
        {/* Center: Quick action text buttons */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-6">
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/grandstand') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Grandstand"
            aria-label="Grandstand"
            onClick={() => navigate('/grandstand')}
          >
            <span className={`text-sm font-semibold ${location.pathname.startsWith('/grandstand') ? 'text-fedex-orange' : ''}`}>Grandstand</span>
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/racers') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Search"
            aria-label="Search"
            onClick={() => navigate('/racers')}
          >
            <span className={`text-sm font-semibold ${location.pathname.startsWith('/racers') ? 'text-fedex-orange' : ''}`}>Racers</span>
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/super-fans') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Leaderboard"
            aria-label="Leaderboard"
            onClick={() => navigate('/super-fans')}
          >
            <span className={`text-sm font-semibold ${location.pathname.startsWith('/super-fans') ? 'text-fedex-orange' : ''}`}>Super Fans</span>
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/series') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Series"
            aria-label="Series"
            onClick={() => navigate('/series')}
          >
            <span className={`text-sm font-semibold ${location.pathname.startsWith('/series') ? 'text-fedex-orange' : ''}`}>Series</span>
          </button>
          <button
            className={`p-2 pb-1 flex flex-col items-center border-b-2 cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
            } ${location.pathname.startsWith('/sponsorships') ? 'text-fedex-orange border-fedex-orange' : 'border-transparent'}`}
            title="Sponsorship"
            aria-label="Sponsorship"
            onClick={() => navigate('/sponsorships')}
          >
            <span className={`text-sm font-semibold ${location.pathname.startsWith('/sponsorships') ? 'text-fedex-orange' : ''}`}>Sponsors</span>
          </button>
        </div>

        {/* Right: Create Post + Notification + user controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Create Post */}
          
          {/* Notifications dropdown */}
          <DropdownMenu open={notifOpen} onOpenChange={(open) => { setNotifOpen(open); if (open) { loadRecentActivity(); markAllAsRead(); } }}>
            <DropdownMenuTrigger asChild>
              <button 
                className={`p-2 relative rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                    : 'text-gray-600 hover:text-fedex-orange hover:bg-gray-100/80'
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-semibold">{unreadCount}</span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-800'} w-80 p-0 overflow-hidden` }>
              <div className="max-h-96 overflow-y-auto">
                <div className={`px-4 py-3 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="text-sm font-semibold">Recent activity</div>
                  <div className="flex items-center gap-2">
                    <button onClick={markAllAsRead} className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'}`}>Mark all as read</button>
                    <Link to="/activity" className="text-xs text-fedex-orange hover:underline">View all</Link>
                  </div>
                </div>
                {loadingActivity ? (
                  <div className="p-4 text-sm text-gray-400">Loading...</div>
                ) : recentActivity.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">No recent activity</div>
                ) : (
                  <ul className="divide-y divide-gray-800/60">
                    {recentActivity.map(item => (
                      <li key={item.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Minimal type indicator */}
                          <span className={`inline-block mt-0.5 w-2 h-2 rounded-full ${
                            item.type === 'tip' ? 'bg-green-500' :
                            item.type === 'badge' ? 'bg-amber-500' :
                            item.type === 'subscription' ? 'bg-purple-500' :
                            item.type === 'comment' ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">{item.content || (item.type.charAt(0).toUpperCase() + item.type.slice(1))}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{item.timeAgo} ago</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Profile Completion Indicator - only show for fans */}
          {user.user_type === 'fan' && (
            <ProfileCompletionIndicator 
              userId={user.id} 
              className="hidden md:flex"
            />
          )}
          
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="flex items-center space-x-2 focus:outline-none cursor-pointer"
              aria-label="User menu"
            >
              {user.avatar && (
                <img 
                  src={user.avatar} 
                  alt="User avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className={`hidden md:inline text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {user.name || user.email.split('@')[0]}
              </span>
              <ChevronDown className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={`w-48 mt-2 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}
              align="end"
            >
              {profileUserType === 'racer' && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full cursor-pointer">
                    Creator Studio
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link
                  to={profileRoute}
                  className="w-full cursor-pointer"
                >
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/profile"
                  className="w-full cursor-pointer"
                >
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={logout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
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
    {/* Spacer to offset fixed header height */}
    <div className="h-16" aria-hidden="true" />

    {/* Mobile Bottom Navigation - text labels only */}
    <nav
      className={`fixed bottom-0 inset-x-0 z-50 md:hidden border-t backdrop-blur-xl ${
        theme === 'dark' ? 'bg-black/90 border-gray-800/50' : 'bg-white/90 border-gray-200/50'
      }`}
      aria-label="Mobile bottom navigation"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-5 py-2 gap-1">
          <button
            className={`flex flex-col items-center py-1 text-xs font-medium rounded-md cursor-pointer ${
              location.pathname.startsWith('/grandstand')
                ? 'text-fedex-orange'
                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            onClick={() => navigate('/grandstand')}
          >
            <Home className="h-5 w-5 text-fedex-orange" />
            <span className="text-[12px] mt-0.5 font-semibold">Grandstand</span>
          </button>

          <button
            className={`flex flex-col items-center py-1 text-xs font-medium rounded-md cursor-pointer ${
              location.pathname.startsWith('/racers')
                ? 'text-fedex-orange'
                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            onClick={() => navigate('/racers')}
          >
            <Search className="h-5 w-5 text-fedex-orange" />
            <span className="text-[12px] mt-0.5 font-semibold">Racers</span>
          </button>

          <button
            className={`flex flex-col items-center py-1 text-xs font-medium rounded-md cursor-pointer ${
              location.pathname.startsWith('/super-fans')
                ? 'text-fedex-orange'
                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            onClick={() => navigate('/super-fans')}
          >
            <Trophy className="h-5 w-5 text-fedex-orange" />
            <span className="text-[12px] mt-0.5 font-semibold">Super Fans</span>
          </button>

          <button
            className={`flex flex-col items-center py-1 text-xs font-medium rounded-md cursor-pointer ${
              location.pathname.startsWith('/series')
                ? 'text-fedex-orange'
                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            onClick={() => navigate('/series')}
          >
            <Flag className="h-5 w-5 text-fedex-orange" />
            <span className="text-[12px] mt-0.5 font-semibold">Series</span>
          </button>

          <button
            className={`flex flex-col items-center py-1 text-xs font-medium rounded-md cursor-pointer ${
              location.pathname.startsWith('/sponsorships')
                ? 'text-fedex-orange'
                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            onClick={() => navigate('/sponsorships')}
          >
            <Handshake className="h-5 w-5 text-fedex-orange" />
            <span className="text-[12px] mt-0.5 font-semibold">Sponsors</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Fanheader;