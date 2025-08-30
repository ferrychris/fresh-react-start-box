import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Flag, 
  Camera, 
  DollarSign, 
  Star, 
  Heart, 
  MapPin,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  Crown,
  Calendar
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const HowItWorks: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <section className={`relative py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://www.usanetwork.com/sites/usablog/files/2022/09/rftc-bristol-speedway.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🏁</div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            How It Works
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
            OnlyRaceFans.co
          </h2>
          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            OnlyRaceFans.co is the new way to race, get paid, and grow your fanbase. Whether you're a racer, a fan, or a track promoter — we've built this platform for you.
          </p>
        </div>
      </section>

      {/* For Racers Section */}
      <section className={`py-20 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-5xl mb-4">🚦</div>
            <h2 className={`text-4xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>For Racers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Create Your Profile */}
            <div className={`p-8 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mb-6">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Create Your Profile</h3>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Show off your car, truck, bike, or whatever you race. Add photos, videos, and your full schedule.
              </p>
            </div>

            {/* Engage Your Fans */}
            <div className={`p-8 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Engage Your Fans</h3>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Post race day updates, pit area chaos, behind-the-scenes moments, or your victory lane selfie.
              </p>
            </div>

            {/* Drag Drop Sponsorship */}
            <div className={`p-8 rounded-2xl border-2 border-fedex-orange ${
              theme === 'dark' ? 'bg-fedex-orange/10' : 'bg-fedex-orange/5'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Drag. Drop. Get Sponsored.</h3>
              <p className={`text-lg mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Use our exclusive Drag-and-Drop Sponsorship Tool to map out available spots on your vehicle — hood, doors, rear bumper, helmet — whatever you've got!
              </p>
              <div className="space-y-2 text-fedex-orange font-semibold">
                <div>👉 Add a price.</div>
                <div>👉 Fans and businesses pick a spot.</div>
                <div>👉 You get paid.</div>
              </div>
              <p className="text-xl font-bold text-fedex-orange mt-4">As easy as 1-2-3.</p>
            </div>

            {/* Earn Every Time */}
            <div className={`p-8 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mb-6">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Earn Every Time You Post</h3>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                With fan subscriptions, tips, and shoutout options, your content turns into real cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Fans Section */}
      <section className={`py-20 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-5xl mb-4">🏁</div>
            <h2 className={`text-4xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>For Fans</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Follow Your Favorite Racers */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Follow Your Favorite Racers</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                See what really happens between the green flag and the checkered.
              </p>
            </div>

            {/* Support Who You Love */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Support Who You Love</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Tip your driver. Buy a sponsorship. Or subscribe for exclusive behind-the-scenes content.
              </p>
            </div>

            {/* Become a Superfan */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Become a Superfan</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Get VIP content, early access, racer shoutouts, and maybe even your name on the car.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Track Owners Section */}
      <section className={`py-20 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-5xl mb-4">🏟️</div>
            <h2 className={`text-4xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>For Track Owners & Promoters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create a Track Profile */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Flag className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Create a Track Profile</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Highlight your upcoming events, featured racers, and share photo/video content.
              </p>
            </div>

            {/* Build Hype & Attendance */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Build Hype & Attendance</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Racers and fans can tag your track, boosting exposure and ticket sales.
              </p>
            </div>

            {/* Fund Bigger Payouts */}
            <div className={`p-8 rounded-2xl text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Fund Bigger Payouts</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Use monetization tools to help increase purses, improve promotions, and support local racers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It's Different Section */}
      <section className={`py-20 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-5xl mb-4">💥</div>
            <h2 className={`text-4xl font-bold mb-8 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Why It's Different</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className={`font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Built for Racers, by Racers</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-6 w-6 text-fedex-orange" />
                <span className={`font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Exclusive Drag-and-Drop Sponsorship Tools</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <span className={`font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Direct Fan-to-Racer Support</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center space-x-3 mb-4">
                <Flag className="h-6 w-6 text-blue-500" />
                <span className={`font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Track & Team Profiles Included</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="h-6 w-6 text-green-500" />
                <span className={`font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>No Merch. No Gimmicks. Just Grit.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Ride CTA Section */}
      <section className={`py-20 relative overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.3),transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🛞</div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Ready to Ride?
          </h2>
          <p className={`text-xl mb-8 max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Turn your fans into fuel and your passion into power.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/racers"
              className="inline-flex items-center px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Create Your Profile Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          
          <div className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            OnlyRaceFans.co — Where the Real Ones Race.
          </div>
        </div>
      </section>
    </div>
  );
};