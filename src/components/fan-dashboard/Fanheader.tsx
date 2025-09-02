import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Bell, Search, Trophy, Layers, Handshake, Megaphone } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Fanheader = () => {
  const { user, logout } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
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
          <div className="relative hidden md:block w-full max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search racers..."
              className={`w-full pl-12 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange ${
                theme === 'dark'
                  ? 'bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-400'
                  : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate('/racers');
                }
              }}
            />
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

        {/* Right: Notification + user controls */}
        <div className="flex items-center space-x-3 shrink-0">
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
    </header>
  );
};

export default Fanheader;