import React from 'react';
import { Github, Twitter, Mail, Megaphone, Search, Trophy, Layers, Handshake } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <footer
      className={`mt-12 border-t ${
        isDark
          ? 'bg-black/80 border-gray-800 text-gray-300'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fedex-orange to-fedex-purple flex items-center justify-center">
            <span className="text-white text-base">🏁</span>
          </div>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>OnlyRaceFans</span>
        </div>
        <nav className="flex space-x-4 text-sm">
          <a href="/how-it-works" className="hover:text-fedex-orange transition-colors">How it works</a>
          <a href="/racers" className="hover:text-fedex-orange transition-colors">Racers</a>
          <a href="/faq" className="hover:text-fedex-orange transition-colors">FAQ</a>
          <a href="/contact" className="hover:text-fedex-orange transition-colors">Contact</a>
        </nav>
        <div className="flex space-x-4">
          <a aria-label="Twitter" href="#" className="p-2 rounded hover:bg-gray-800/40 transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
          <a aria-label="GitHub" href="#" className="p-2 rounded hover:bg-gray-800/40 transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a aria-label="Email" href="mailto:hello@onlyracefans.com" className="p-2 rounded hover:bg-gray-800/40 transition-colors">
            <Mail className="w-5 h-5" />
          </a>
        </div>
      </div>
      <p className="text-center text-xs mt-4"> {new Date().getFullYear()} OnlyRaceFans. All rights reserved.</p>

      {/* Mobile Bottom Navigation (Footer) - mirrors Header mobile navbar style */}
      {user ? (
        <nav
          className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl safe-area-inset-bottom ${
            isDark ? 'bg-black/90 border-gray-800/50' : 'bg-white/90 border-gray-200/50'
          }`}
          aria-label="Footer mobile bottom navigation"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-5 py-2 gap-1">
              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/grandstand')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/grandstand')}
              >
                <Megaphone className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Grandstand</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/racers')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/racers')}
              >
                <Search className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Racers</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/super-fans')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/super-fans')}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Super Fans</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/series')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/series')}
              >
                <Layers className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Series</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/sponsorships')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/sponsorships')}
              >
                <Handshake className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Sponsors</span>
              </button>
            </div>
          </div>
        </nav>
      ) : (
        <nav
          className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl safe-area-inset-bottom ${
            isDark ? 'bg-black/90 border-gray-800/50' : 'bg-white/90 border-gray-200/50'
          }`}
          aria-label="Footer mobile bottom navigation (logged out)"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 py-2 gap-1">
              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/grandstand')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/grandstand')}
              >
                <Megaphone className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Explore</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/racers')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/racers')}
              >
                <Search className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Racers</span>
              </button>

              <button
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${
                  location.pathname.startsWith('/series')
                    ? 'text-fedex-orange'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}
                onClick={() => navigate('/series')}
              >
                <Layers className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Series</span>
              </button>

              <a
                className={`flex flex-col items-center py-1 text-xs font-medium rounded-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                href="/how-it-works"
              >
                <Trophy className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">How it works</span>
              </a>
            </div>
          </div>
        </nav>
      )}

    </footer>
  );
};

export default Footer;
