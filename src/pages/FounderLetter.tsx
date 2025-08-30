import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Heart, 
  DollarSign, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  Crown,
  Calendar,
  Mail,
  Car,
  Flag
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const FounderLetter: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <section className={`relative py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2449543/pexels-photo-2449543.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🏁</div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            A Letter from the Founder
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
            From One Racer to Another
          </h2>
          <div className="flex items-center justify-center space-x-4 text-gray-400 mb-8">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Racen Jason #82</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Founder, OnlyRaceFans</span>
            </div>
          </div>
        </div>
      </section>

      {/* Letter Content */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl p-8 md:p-12 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          } shadow-xl`}>
            
            {/* Opening */}
            <div className="mb-8">
              <p className={`text-lg leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <strong>Hey race fans, I'm Racen Jason, the founder of OnlyRaceFans,</strong>
              </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Let's get this out of the way — I'm not some corporate guy sitting in a fancy office, wearing a tie, sipping overpriced coffee, and talking about "synergy." The only suit you'll ever see me in is a fire suit, and usually it smells like fuel, rubber, and maybe last night's victory pizza.
              </p>

              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                I built OnlyRaceFans for one simple reason: racing is expensive, and unless you've got a rich uncle or a money tree in the backyard, it's a constant battle to keep the wheels turning. I've been there — stretching tires for "just one more race," eating ramen noodles to afford fuel, and begging sponsors like a door-to-door salesman with a helmet bag.
              </p>

              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                So I thought… what if racers could do what social media influencers do — but without posting TikTok dances in the shop? What if we had a platform built just for racers, where fans, friends, and sponsors could support us directly?
              </p>

              <p className={`font-semibold text-xl ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                That's how OnlyRaceFans was born.
              </p>

              {/* Work in Progress Section */}
              <div className={`p-6 rounded-xl border-l-4 border-fedex-orange ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  <strong>Oh, and one thing to know:</strong> This site is all a work in progress. It's brand new, and we're going to work hard every single day to improve it, add new features, and make it better for racers and fans. We welcome suggestions, ideas, and crazy thoughts — because we're racers, not computer gurus, lol. If something doesn't make sense or you think it could be better, tell us! We'll listen and adjust.
                </p>
              </div>

              <p className={`font-semibold text-xl ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Here's the deal — and this is the part where you go 'hell yes!'
              </p>

              {/* Benefits List */}
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className={`font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>You keep almost everything you earn from fans.</h3>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        Fans subscribe to support you, and you keep $7.99 out of every $9.99. That's money straight into your racing dream, not some corporate wallet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <Target className="h-6 w-6 text-fedex-orange mt-1 flex-shrink-0" />
                    <div>
                      <h3 className={`font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Sponsorships made easy — and 100% yours.</h3>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        Our drag-and-drop tool lets you list spots on your car, helmet, suit, trailer — whatever — and you keep every penny. We don't take a dime. That's all yours, from start to finish.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <Heart className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className={`font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Tips and donations.</h3>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        Fans can throw you extra support anytime they want — no limits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className={`font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Instant income.</h3>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        You post your racing life, and boom — money starts flowing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Money Example */}
              <div className={`p-6 rounded-xl bg-gradient-to-r ${
                theme === 'dark' 
                  ? 'from-green-600/20 to-blue-600/20 border border-green-500/30' 
                  : 'from-green-100/80 to-blue-100/80 border border-green-200/50'
              }`}>
                <p className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Even 20 fans at $9.99/month? That's nearly $2,000 a year just for letting people be part of your racing journey. Add sponsors and tips on top? That's real fuel in your tank. Real races on your calendar. Real upgrades you don't have to beg for. <span className="text-green-500 font-bold">Hell yes.</span>
                </p>
              </div>

              {/* Advertising Section */}
              <div className="mt-12">
                <h2 className={`text-2xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Advertising — my crazy ideas (for later)
                </h2>

                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  We're not at this point yet, but here's an idea bouncing around in my helmet:
                </p>

                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Most platforms take ad money and keep it. Not us.
                  <br />One day, I want to tell companies:
                </p>

                <div className={`p-6 rounded-xl italic ${
                  theme === 'dark' ? 'bg-gray-800 border-l-4 border-fedex-orange' : 'bg-gray-100 border-l-4 border-fedex-orange'
                }`}>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    "Sure, you can advertise here — but the money you were going to spend on ads? Send it to the racers instead. We'll still run your ads, but your dollars actually keep the sport alive."
                  </p>
                </div>

                <p className={`mt-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Or… here's another wild thought: throw all that marketing cash into a giant OnlyRaceFans Shootout Purse and host a race with a payout so big it makes people spit out their beer.
                </p>

                <p className={`mt-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  It's not happening today, but it's how I think — dreaming big, keeping racing badass, and making fans and racers win together.
                </p>
              </div>

              {/* The Future Section */}
              <div className="mt-12">
                <h2 className={`text-2xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  The Future? Hell yes!
                </h2>

                <p className={`mb-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  We're just getting started, and the best is yet to come. We're building features you've never seen in racing — live streams straight from the track, exclusive fan access, mega prize shootouts, and tools to bring fans and racers closer than ever. Merchandise, mobile apps, and sponsorship tools are just the beginning. Every day, we're pushing to make racing bigger, faster, and more fun, while giving racers and fans ways to win together.
                </p>
              </div>

              {/* Superfan Giveaway */}
              <div className={`p-8 rounded-xl bg-gradient-to-r ${
                theme === 'dark' 
                  ? 'from-purple-600/20 to-pink-600/20 border border-purple-500/30' 
                  : 'from-purple-100/80 to-pink-100/80 border border-purple-200/50'
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h2 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Special Superfan Giveaway (Coming Soon!)
                  </h2>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Here's something I'm super excited about — we're going to give one lucky superfan a sport mod car! Every person who supports a racer will have their name entered into a drawing. On March 15, we'll go live and draw the winner. Imagine turning a fan into a racer — that's what we're about.
                  </p>
                </div>
              </div>

              {/* Personal Message */}
              <div className="mt-12 text-center">
                <p className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  I'm not a CEO with a desk. I'm the guy next to you in the staging lanes, covered in dust, duct tape on my glove, grinning because it's race day. Once a racer, always a racer.
                </p>

                <p className={`text-lg mb-8 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  This is our platform. Our family. Our shot to make racing more fun, profitable, and connected than ever.
                </p>

                <div className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <p className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    See you at the track,
                  </p>
                  <p className="text-fedex-orange font-bold text-xl mb-2">
                    Racen Jason #82
                  </p>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Founder, OnlyRaceFans
                  </p>
                  <p className={`text-sm italic mt-2 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    (P.S. My tie is my HANS device.)
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className={`mt-12 p-6 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Mail className="h-8 w-8 mx-auto mb-4 text-fedex-orange" />
                <h3 className={`text-lg font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Got questions, suggestions, or crazy ideas?
                </h3>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Shoot me an email anytime:
                </p>
                <a
                  href="mailto:jason@onlyracefans.co"
                  className="inline-flex items-center px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-lg font-semibold transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  jason@onlyracefans.co
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Ready to Join the Racing Family?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/racers"
              className="inline-flex items-center px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Browse Racers
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/how-it-works"
              className={`inline-flex items-center px-8 py-4 border-2 rounded-xl font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:scale-105 ${
                theme === 'dark'
                  ? 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
                  : 'border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white'
              }`}
            >
              <Zap className="mr-2 h-5 w-5" />
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};