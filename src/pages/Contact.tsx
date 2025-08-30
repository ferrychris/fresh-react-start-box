import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Contact: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <section className={`relative py-20 overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0 bg-[url('https://d1yr8cjvaju39m.cloudfront.net/uploads/images/_newsArticle/NWBS-Spotter-Stand-1.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">📞</div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Contact Us
          </h1>
          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Get in touch with the OnlyRaceFans team. We're here to help racers, fans, and tracks succeed!
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Text Support */}
            <div className={`p-8 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-lg hover:shadow-xl`}>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Call Us
              </h3>
              <p className={`text-lg mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Speak directly with our professional support team
              </p>
              <a
                href="sms:844-828-2820"
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Phone className="h-5 w-5 mr-3" />
                Text 844-828-2820
              </a>
              <div className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Response time: Usually within 1 hour</span>
                </div>
              </div>
            </div>

            {/* Facebook Messenger */}
            <div className={`p-8 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-lg hover:shadow-xl`}>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Facebook Messenger
              </h3>
              <p className={`text-lg mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Message us directly on Facebook for support
              </p>
              <a
                href="https://m.me/onlyracefans"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MessageCircle className="h-5 w-5 mr-3" />
                Message on Facebook
              </a>
              <div className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Response time: Usually within 2 hours</span>
                </div>
              </div>
            </div>

            {/* Email Support */}
            <div className={`p-8 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            } shadow-lg hover:shadow-xl`}>
              <div className="w-16 h-16 bg-fedex-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Email Support
              </h3>
              <p className={`text-lg mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Send us an email for detailed inquiries
              </p>
              <a
                href="mailto:Info2@onlyracefans.co"
                className="inline-flex items-center px-8 py-4 bg-fedex-orange hover:bg-fedex-orange-dark text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Mail className="h-5 w-5 mr-3" />
                Email Support
              </a>
              <div className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Response time: Within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Get In Touch
            </h2>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We're building OnlyRaceFans with the racing community. Your feedback helps us improve!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Phone Support */}
            <div className={`text-center p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Phone className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <h3 className={`font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Call Us
              </h3>
              <p className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Talk to a real person
              </p>
              <a
                href="sms:844-828-2820"
                className="text-green-500 hover:text-green-400 font-semibold"
              >
                844-828-2820
              </a>
            </div>

            {/* Email */}
            <div className={`text-center p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Mail className="h-8 w-8 text-fedex-orange mx-auto mb-4" />
              <h3 className={`font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Email Support
              </h3>
              <p className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                For detailed inquiries
              </p>
              <a
                href="mailto:Info2@onlyracefans.co"
                className="text-fedex-orange hover:text-fedex-orange-light font-semibold"
              >
                Info2@onlyracefans.co
              </a>
            </div>

            {/* Facebook */}
            <div className={`text-center p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className={`font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Facebook
              </h3>
              <p className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Message us on social
              </p>
              <a
                href="https://facebook.com/onlyracefans"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 font-semibold"
              >
                @onlyracefans
              </a>
            </div>

            {/* Business Hours */}
            <div className={`text-center p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-4" />
              <h3 className={`font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Support Hours
              </h3>
              <p className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We're here when you need us
              </p>
              <div className="text-purple-500 font-semibold text-sm">
                <div>Mon-Fri: 9AM-8PM EST</div>
                <div>Weekends: 10AM-6PM EST</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Common Questions
            </h2>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Quick answers to frequently asked questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                How do I get started as a racer?
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Simply sign up, complete your profile setup, and start sharing your racing journey. 
                You can begin earning from fans immediately!
              </p>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                How do payouts work?
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Racers receive 80% of all fan payments. Payouts are processed weekly via Stripe Connect 
                directly to your bank account.
              </p>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Is there a mobile app?
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                We're launching the mobile app soon! For now, our mobile website is fully optimized 
                and works great on all devices.
              </p>
            </div>

            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                How do I report a problem?
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Text us at 844-828-2820 or message us on Facebook. We respond quickly and 
                take all feedback seriously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className={`py-16 ${
        theme === 'dark' ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20' : 'bg-gradient-to-r from-red-100/80 to-orange-100/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl mb-4">🚨</div>
          <h2 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Urgent Issues?
          </h2>
          <p className={`text-lg mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            For urgent platform issues, payment problems, or account access issues:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="sms:844-828-2820?body=URGENT:%20"
              className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <Phone className="h-5 w-5 mr-2" />
              Text: 844-828-2820
            </a>
            <a
              href="mailto:Info2@onlyracefans.co"
              className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <Mail className="h-5 w-5 mr-2" />
              Info2@onlyracefans.co
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};