import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Target, 
  Heart, 
  DollarSign, 
  Star, 
  ArrowRight,
  CheckCircle,
  Zap,
  Crown,
  MapPin,
  Eye,
  Handshake,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const HowSponsorshipWorks: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <section className={`relative py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://worldofoutlaws.com/wp-content/uploads/2023/12/150A7236.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🤝</div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            How Sponsorship Works
            <span className="block bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
              on OnlyRaceFans
            </span>
          </h1>
          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Why It's a Win-Win for Businesses and Racers
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className={`rounded-2xl p-8 mb-12 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          } shadow-lg`}>
            <p className={`text-lg leading-relaxed ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              At OnlyRaceFans, we've built a powerful platform where businesses of all sizes can connect directly with racers across every skill level and every corner of the country. From grassroots dirt track drivers to seasoned pros, our racers proudly showcase available sponsorship locations on their cars, suits, and gear — making it simple for you to place your brand right where the action is.
            </p>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-12">
            <h2 className={`text-3xl font-bold mb-8 text-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              What Makes Our Sponsorship Model Different
            </h2>

            <div className="space-y-6">
              {/* Direct Connection */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Handshake className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Direct Connection</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      We take 0% from our racers. Every dollar you invest goes straight to them, helping them compete, travel, and grow in the sport they love.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nationwide Reach */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Nationwide Reach</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      We have racers everywhere, giving your brand exposure in multiple markets instead of "putting all your eggs in one basket" with a single sponsorship.
                    </p>
                  </div>
                </div>
              </div>

              {/* Proven Loyalty */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Proven Loyalty</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Racing fans are fiercely loyal. They don't just cheer for their drivers — they support the businesses that support their drivers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Visibility */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-fedex-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-fedex-orange" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Brand Visibility</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Whether it's trackside signage, car wraps, or social media shoutouts, your brand will be seen, remembered, and appreciated by an audience that values authenticity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bonus Exposure */}
              <div className={`p-6 rounded-xl bg-gradient-to-r ${
                theme === 'dark' 
                  ? 'from-fedex-orange/20 to-fedex-purple/20 border border-fedex-orange/30' 
                  : 'from-fedex-orange/10 to-fedex-purple/10 border border-fedex-orange/20'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-fedex-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Bonus Exposure from Us</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      When you support a racer, OnlyRaceFans will also feature your brand on our platform feed at no cost. This means even more recognition and reach — because we believe in building one big racing family where everyone helps one another.
                    </p>
                  </div>
                </div>
              </div>

              {/* Perfect Match */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>We'll Match You with the Right Racer</h3>
                    <p className={`text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      If you don't have time to search for the perfect sponsorship fit, let us find the racer who best suits your goals, audience, and brand personality. We'll make sure your sponsorship dollars go exactly where they'll make the most impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="mb-12">
            <h2 className={`text-3xl font-bold mb-8 text-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Why Businesses Choose OnlyRaceFans
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <DollarSign className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Cost Effective</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Get maximum exposure for your marketing budget with direct racer partnerships
                </p>
              </div>

              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <Users className="h-8 w-8 mx-auto mb-4 text-blue-500" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Engaged Audience</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Connect with passionate racing fans who actively support sponsor brands
                </p>
              </div>

              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <TrendingUp className="h-8 w-8 mx-auto mb-4 text-purple-500" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Measurable Results</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Track your sponsorship ROI with detailed analytics and fan engagement metrics
                </p>
              </div>

              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <MapPin className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Local & National</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Choose local racers for regional exposure or national drivers for broader reach
                </p>
              </div>

              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <Star className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Authentic Partnerships</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Build genuine relationships with racers who truly represent your brand values
                </p>
              </div>

              <div className={`p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <Award className="h-8 w-8 mx-auto mb-4 text-fedex-orange" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Platform Promotion</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Get featured on our platform feed when you sponsor racers - extra exposure at no cost
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Process */}
          <div className="mb-12">
            <h2 className={`text-3xl font-bold mb-8 text-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Simple 3-Step Process
            </h2>

            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Browse Available Sponsorship Spots</h3>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Explore racers with available sponsorship locations on their cars, suits, and gear. Filter by location, racing class, or budget to find the perfect fit.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Connect Directly with Racers</h3>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Send sponsorship inquiries directly to racers. Discuss terms, pricing, and placement details. No middleman, no extra fees.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Watch Your Brand Race to Victory</h3>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    See your logo on track, get social media mentions, and enjoy bonus exposure on our platform feed. Track your ROI with detailed analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className={`rounded-2xl p-8 text-center ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-fedex-orange/20 to-fedex-purple/20 border border-fedex-orange/30' 
              : 'bg-gradient-to-r from-fedex-orange/10 to-fedex-purple/10 border border-fedex-orange/20'
          }`}>
            <div className="text-5xl mb-4">🏁</div>
            <h2 className={`text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Get Started?
            </h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join the businesses already supporting grassroots racing and growing their brands with authentic partnerships.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sponsorships"
                className="inline-flex items-center px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Find Sponsorship Opportunities
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center px-8 py-4 border-2 rounded-xl font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105 ${
                  theme === 'dark'
                    ? 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                    : 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                }`}
              >
                <Users className="mr-2 h-5 w-5" />
                Contact Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};