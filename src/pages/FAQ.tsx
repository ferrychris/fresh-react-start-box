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
  Calendar,
  Shield,
  Smartphone,
  HelpCircle,
  MessageCircle,
  Phone
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const FAQ: React.FC = () => {
  const { theme } = useTheme();

  const faqSections = [
    {
      id: 'general',
      title: 'General Questions',
      icon: Trophy,
      color: 'text-fedex-orange',
      bgColor: 'bg-fedex-orange/20',
      questions: [
        {
          q: 'What is OnlyRaceFans.co?',
          a: 'OnlyRaceFans.co is the ultimate platform where racers, fans, sponsors, and tracks connect. Racers can monetize their following, find sponsors, and share exclusive content. Fans can support their favorite drivers and get behind-the-scenes access. It\'s like Patreon meets racing—with features built 100% for motorsports.'
        },
        {
          q: 'Who can sign up?',
          a: 'Anyone! Whether you\'re a racer, fan, track promoter, car builder, sponsor, or content creator—you can make a free profile and join the racing revolution.'
        },
        {
          q: 'Is it free to join?',
          a: 'Yes! Creating a profile is completely free. Racers can start earning money right away. Fans only pay if they choose to support a racer or buy exclusive content.'
        },
        {
          q: 'What makes OnlyRaceFans different from other racing platforms?',
          a: 'OnlyRaceFans is built by racers for racers. We offer direct monetization, drag-and-drop sponsorship tools, custom fan clubs, behind-the-scenes content, and even ad revenue options—everything built for the racing lifestyle.'
        }
      ]
    },
    {
      id: 'racers',
      title: 'For Racers',
      icon: Trophy,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      questions: [
        {
          q: 'How do I make money on OnlyRaceFans?',
          a: 'Racers make money through:\n• Fan subscriptions\n• Tips and donations\n• Sponsored content\n• Drag-and-drop sponsorships – the first and only tool of its kind where you can place sponsor slots directly onto your vehicle image and set your own prices. Proudly built by racers, for racers.\n• Paid shoutouts & perks\n• Video views (monetization coming soon)'
        },
        {
          q: 'What is the drag-and-drop sponsorship tool?',
          a: 'It\'s a game-changing feature! You can drag and drop sponsor slots onto your car/truck image and set prices. Sponsors and fans can visually see what\'s for sale—making deals easier and faster.'
        },
        {
          q: 'How do I get discovered by sponsors?',
          a: 'Build your profile with photos, racing history, upcoming events, and post regular content. Our system also highlights active racers to potential sponsors looking to back talent.'
        },
        {
          q: 'Can I share my OnlyRaceFans profile on social media?',
          a: 'Absolutely! Every racer gets a custom link to share. Use it in your bio, posts, or even on your race car.'
        }
      ]
    },
    {
      id: 'fans',
      title: 'For Fans',
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/20',
      questions: [
        {
          q: 'What do fans get when they subscribe to a racer?',
          a: 'Depending on the racer\'s settings, fans may get:\n• Exclusive content (videos, pics, behind-the-scenes)\n• Early access to race day footage\n• Discounts on merch\n• Personal shoutouts\n• Voting on race themes, liveries, etc.'
        },
        {
          q: 'Can I support more than one racer?',
          a: '100%! You can support as many racers as you want—and manage them all from your fan dashboard.'
        }
      ]
    },
    {
      id: 'sponsors',
      title: 'For Sponsors',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      questions: [
        {
          q: 'How do I sponsor a racer on the site?',
          a: 'Use our drag-and-drop sponsorship system, explore racer profiles, or reach out directly via their messaging system. You can even sponsor entire series or events.'
        },
        {
          q: 'Can I advertise on the platform?',
          a: 'Yes—advertisers can reach a loyal, motorsports-focused audience. But instead of paying us directly, we encourage advertisers to sponsor racers on the platform. In return, we\'ll give you premium advertising spots across the site, app, and media.\n\nThis keeps the money in the racing community and helps drivers chase their dreams while your brand gains visibility.'
        }
      ]
    },
    {
      id: 'tracks',
      title: 'For Tracks & Promoters',
      icon: Flag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      questions: [
        {
          q: 'What can tracks do on OnlyRaceFans?',
          a: 'Tracks can:\n• Build a profile\n• Sell event listings\n• Promote races\n• Host live video streams (coming soon!)\n• Connect with racers and fans\n• Offer exclusive deals'
        },
        {
          q: 'Can I post my racing series?',
          a: 'Yes—Series and events can have their own profile page and grow their audience right on the platform.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Account & Payments',
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      questions: [
        {
          q: 'How do I get paid?',
          a: 'We use secure payment processors (like Stripe) to deposit your earnings directly to your bank account. You can track earnings in real time from your dashboard.'
        },
        {
          q: 'Is my information secure?',
          a: 'Absolutely. We use encryption and best-in-class security protocols to keep your data safe.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Tech & Support',
      icon: MessageCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
      questions: [
        {
          q: 'Is there an app?',
          a: 'We\'re launching the app soon! For now, the mobile site is fully functional and optimized for any device.'
        },
        {
          q: 'I found a bug or need help. What do I do?',
          a: 'Just message us on Facebook, or text our support team directly at 602-880-8882. We\'re building this in real time with you—so let us know how we can improve!'
        }
      ]
    }
  ];

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
            Frequently Asked Questions
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-fedex-orange to-fedex-purple bg-clip-text text-transparent">
            OnlyRaceFans.co
          </h2>
          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Everything you need to know about the racing platform built by racers, for racers
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Navigation */}
          <div className="mb-12">
            <h3 className={`text-2xl font-bold mb-6 text-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Jump to Section
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {faqSections.map(section => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                    } shadow-lg hover:shadow-xl`}
                  >
                    <Icon className={`h-4 w-4 ${section.color}`} />
                    <span>{section.title}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-16">
            {faqSections.map(section => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="scroll-mt-20">
                  {/* Section Header */}
                  <div className="text-center mb-12">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${section.bgColor}`}>
                      <Icon className={`h-10 w-10 ${section.color}`} />
                    </div>
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {section.title}
                    </h2>
                  </div>

                  {/* Questions */}
                  <div className="space-y-6">
                    {section.questions.map((faq, index) => (
                      <div
                        key={index}
                        className={`rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] ${
                          theme === 'dark' 
                            ? 'bg-gray-900 hover:bg-gray-800 border border-gray-800' 
                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                        } shadow-lg hover:shadow-xl`}
                      >
                        <h3 className={`text-xl md:text-2xl font-bold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Q: {faq.q}
                        </h3>
                        <div className={`text-lg leading-relaxed ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {faq.a.split('\n').map((line, lineIndex) => (
                            <div key={lineIndex} className="mb-2">
                              {line.startsWith('•') ? (
                                <div className="flex items-start space-x-2 ml-4">
                                  <div className="w-2 h-2 bg-fedex-orange rounded-full mt-3 flex-shrink-0"></div>
                                  <span>{line.substring(1).trim()}</span>
                                </div>
                              ) : (
                                <p className={line.trim() === '' ? 'mb-2' : ''}>{line}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className={`py-20 relative overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,165,0,0.3),transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🏁</div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Still Have Questions?
          </h2>
          <p className={`text-xl mb-8 max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            We're building this platform in real time with the racing community. 
            Reach out and let us know how we can help!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            {/* Text Support */}
            <div className={`p-6 rounded-2xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Text Support
              </h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Get instant help from our team
              </p>
              <a
                href="sms:602-880-8882"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Phone className="h-4 w-4 mr-2" />
                Text 602-880-8882
              </a>
            </div>

            {/* Facebook Support */}
            <div className={`p-6 rounded-2xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Facebook Messenger
              </h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Message us on Facebook
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message on Facebook
              </button>
            </div>
          </div>

          <div className={`text-lg ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p className="mb-4">We're here to help you succeed on the platform!</p>
            <p className="font-semibold">
              OnlyRaceFans.co — Where the Real Ones Race.
            </p>
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
            Ready to Get Started?
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