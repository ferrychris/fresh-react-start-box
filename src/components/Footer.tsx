import React from 'react';
import { Github, Twitter, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer
      className={`mt-12 border-t ${
        isDark
          ? 'bg-black/80 border-gray-800 text-gray-300'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fedex-orange to-fedex-purple flex items-center justify-center">
                <span className="text-white text-base">🏁</span>
              </div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>OnlyRaceFans</span>
            </div>
            <p className="mt-3 text-sm">
              Connect racers, fans, tracks, and series in one community.
            </p>
          </div>

          <div className="flex md:justify-center">
            <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <a href="/how-it-works" className="hover:text-fedex-orange transition-colors">How it works</a>
              <a href="/racers" className="hover:text-fedex-orange transition-colors">Racers</a>
              <a href="/faq" className="hover:text-fedex-orange transition-colors">FAQ</a>
              <a href="/contact" className="hover:text-fedex-orange transition-colors">Contact</a>
            </nav>
          </div>

          <div className="md:text-right">
            <div className="flex md:justify-end space-x-4">
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
            <p className="mt-3 text-xs">© {new Date().getFullYear()} OnlyRaceFans. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
