import React, { useState } from 'react';
import { X, Mail, Lock, User, Car, Trophy, MapPin, Phone, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RacerSignupFormProps {
  onClose: () => void;
}

export const RacerSignupForm: React.FC<RacerSignupFormProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [userType, setUserType] = useState<'FAN' | 'RACER' | 'TRACK' | 'SERIES'>('RACER');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const parseAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();
    
    if (lower.includes('user not found')) {
      return 'No account found with this email address. Please register first.';
    }
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lower.includes('email not confirmed') || lower.includes('email not confirmed')) {
      return 'Please confirm your email before signing in.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
      return 'Network issue. Please check your connection and try again.';
    }
    if (lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    
    console.error('Unhandled auth error:', err);
    return raw || 'Unable to sign in. Please try again.';
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    // Racer specific
    carNumber: '',
    racingClass: '',
    team: '',
    region: '',
    // Track specific
    trackName: '',
    contactPerson: '',
    trackType: '',
    capacity: '',
    // Series specific
    seriesName: '',
    category: '',
    season: '',
    // Privacy settings
    showContactForSponsorship: false,
    racingInterests: '',
    acceptTerms: false
  });
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // prevent duplicate submissions
    setErrorMsg(null);

    // Basic client-side validation
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    if (mode === 'login') {
      if (!email || !emailRegex.test(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        console.log('🔐 Attempting login for:', formData.email);
        await login(email, password);
        console.log('✅ Login successful, closing modal');
        onClose();
        // Navigation will be handled by App.tsx useEffect
      } else {
        console.log('📝 Attempting registration for:', { email: formData.email, role: userType });
        await register({
          ...formData,
          role: userType
        });
        console.log('✅ Registration successful, closing modal');
        onClose();
        // Navigation will be handled by App.tsx useEffect
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const message = parseAuthError(error);
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { 
      value: 'FAN' as const, 
      label: 'Fan', 
      icon: Trophy, 
      description: 'Support racers and follow racing' 
    },
    { 
      value: 'RACER' as const, 
      label: 'Racer', 
      icon: Car, 
      description: 'Share content and find sponsors' 
    },
    { 
      value: 'TRACK' as const, 
      label: 'Track', 
      icon: MapPin, 
      description: 'Promote events and find sponsors' 
    },
    { 
      value: 'SERIES' as const, 
      label: 'Series', 
      icon: Trophy, 
      description: 'Manage championship series' 
    }
  ];

  const racingClasses = [
    'Late Model', 'Sprint Car', 'Modified', 'Street Stock', 'Super Late Model',
    'Midget', 'Micro Sprint', 'Legend Car', 'Bandolero', 'Other'
  ];

  const trackTypes = [
    'Dirt Oval', 'Asphalt Oval', 'Road Course', 'Drag Strip', 'Short Track', 'Superspeedway'
  ];

  const seriesCategories = [
    'Late Model', 'Sprint Car', 'Modified', 'Street Stock', 'Multi-Class', 'Touring Series'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-[20rem] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white transition-colors duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-2 sm:p-3 md:p-4">
          {/* Header */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 brand-gradient rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white racing-number">
              {mode === 'login' ? 'Racer Login' : 'Racer Registration'}
            </h2>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm">
              {mode === 'login' 
                ? 'Sign in to your racer account' 
                : 'Create your racer profile today'
              }
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-lg p-2">
              {errorMsg}
            </div>
          )}

          {/* Racer Registration Header */}
          {mode === 'register' && (
            <div className="mb-3 sm:mb-4 bg-slate-800/50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                <h3 className="text-white font-medium text-xs">Racer Profile Setup</h3>
              </div>
              <p className="text-slate-400 text-[10px] text-center">
                Complete your profile to connect with fans and sponsors
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
            </div>

            {mode === 'register' && (
              <>
                {/* Common Registration Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                      {userType === 'TRACK' ? 'Track Name' : 
                       userType === 'SERIES' ? 'Series Name' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                      <input
                        type="text"
                        value={userType === 'TRACK' ? formData.trackName : 
                               userType === 'SERIES' ? formData.seriesName : formData.name}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          ...(userType === 'TRACK' ? { trackName: e.target.value } :
                              userType === 'SERIES' ? { seriesName: e.target.value } :
                              { name: e.target.value })
                        })}
                        className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        placeholder={userType === 'TRACK' ? 'Charlotte Motor Speedway' : 
                                   userType === 'SERIES' ? 'Late Model Championship' : 'Your full name'}
                        required
                      />
                    </div>
                  </div>

                  {userType !== 'TRACK' && userType !== 'SERIES' && (
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs sm:text-sm">@</span>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full pl-6 sm:pl-7 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="username"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {(userType === 'TRACK' || userType === 'SERIES') && (
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Contact Person
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                        <input
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="Contact person name"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Address Information */}
                {(userType === 'RACER' || userType === 'TRACK') && (
                  <>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-7 sm:pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="Street address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                          placeholder="ZIP"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Racer Specific Fields */}
                {userType === 'RACER' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Car Number
                      </label>
                      <input
                        type="text"
                        value={formData.carNumber}
                        onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        placeholder="23"
                        required
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Racing Class
                      </label>
                      <select
                        value={formData.racingClass}
                        onChange={(e) => setFormData({ ...formData, racingClass: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        required
                      >
                        <option value="">Select racing class</option>
                        {racingClasses.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Track Specific Fields */}
                {userType === 'TRACK' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Track Type
                      </label>
                      <select
                        value={formData.trackType}
                        onChange={(e) => setFormData({ ...formData, trackType: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                      >
                        <option value="">Select track type</option>
                        {trackTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                )}

                {/* Series Specific Fields */}
                {userType === 'SERIES' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                      >
                        <option value="">Select category</option>
                        {seriesCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                        Season
                      </label>
                      <input
                        type="text"
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                        placeholder="2024"
                      />
                    </div>
                  </div>
                )}

                {/* Fan Specific Fields */}
                {userType === 'FAN' && (
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1">
                      Racing Interests (Optional)
                    </label>
                    <textarea
                      value={formData.racingInterests}
                      onChange={(e) => setFormData({ ...formData, racingInterests: e.target.value })}
                      className="w-full px-2 sm:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm"
                      rows={2}
                      placeholder="Tell us about your favorite racers, series, or racing interests..."
                    />
                  </div>
                )}

                {/* Privacy Settings */}
                {(userType === 'RACER' || userType === 'TRACK' || userType === 'SERIES') && (
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showContactForSponsorship}
                        onChange={(e) => setFormData({ ...formData, showContactForSponsorship: e.target.checked })}
                        className="mt-1 w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-white font-medium text-xs sm:text-sm">
                          Show contact information for sponsorship inquiries
                        </span>
                        <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">
                          Allow potential sponsors to see your contact details when requesting sponsorships
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
              )}
            </button>
            
            <div className="text-center mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(null); }}
                className="text-slate-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm min-h-[36px] px-3 py-1.5"
              >
                {mode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </form>

          {/* Debug Section - Remove this in production */}
          {mode === 'login' && (
            <div className="mt-3 p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-[10px] sm:text-xs mb-1">
                🔧 Debug: If you're having login issues, try these test accounts:
              </p>
              <div className="space-y-0.5 text-[10px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, email: 'test@example.com', password: 'password123' })}
                  className="block text-blue-300 hover:text-blue-100 underline"
                >
                  Use test@example.com / password123
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, email: 'admin@onlyracefans.com', password: 'admin123' })}
                  className="block text-blue-300 hover:text-blue-100 underline"
                >
                  Use admin@onlyracefans.com / admin123
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      console.log('🔧 Creating test user...');
                      await register({
                        email: 'test@example.com',
                        password: 'password123',
                        name: 'Test User',
                        username: 'testuser',
                        role: 'FAN'
                      });
                      setFormData({ ...formData, email: 'test@example.com', password: 'password123' });
                      setErrorMsg('✅ Test user created! You can now login.');
                    } catch (err) {
                      console.error('Failed to create test user:', err);
                      setErrorMsg('Failed to create test user. Try registering manually.');
                    }
                  }}
                  className="block text-green-300 hover:text-green-100 underline"
                >
                  🔧 Create test user (test@example.com)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-[22rem] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-2 sm:p-3 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">Terms & Conditions</h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-slate-300 space-y-3 text-xs sm:text-sm leading-relaxed">
                <p><strong>Effective Date:</strong> August 21, 2025</p>
                
                <p>Welcome to Only Race Fans ("Platform," "we," "our," "us"). By accessing or using our platform, mobile applications, services, or content (collectively, "Services"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree, do not use the Services.</p>

                <h3 className="text-sm sm:text-base font-semibold text-white mt-4 mb-2">Key Points:</h3>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                  <ul className="text-red-200 text-[10px] sm:text-xs space-y-1 sm:space-y-2">
                    <li>• <strong>Age Requirement:</strong> Must be 18+ to use the platform</li>
                    <li>• <strong>Zero Tolerance:</strong> Inappropriate content results in permanent ban</li>
                    <li>• <strong>Platform Fee:</strong> 20% service fee on all transactions</li>
                    <li>• <strong>Payment Processing:</strong> All payments handled by Stripe Connect</li>
                    <li>• <strong>No Liability:</strong> We're not responsible for user agreements or disputes</li>
                  </ul>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 sm:p-3 mt-4">
                  <p className="text-orange-300 font-medium text-center text-xs sm:text-sm">
                    <strong>Racing is fast. Only Race Fans is faster.</strong>
                  </p>
                  <p className="text-orange-200 text-[10px] sm:text-xs text-center mt-1 sm:mt-2">
                    Play fair, race hard, monetize smarter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-[22rem] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-2 sm:p-3 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">Privacy Policy</h2>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-slate-300 space-y-3 text-xs sm:text-sm leading-relaxed">
                <p><strong>Effective Date:</strong> August 21, 2025</p>
                
                <p>Only Race Fans respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and protect your information.</p>

                <h3 className="text-sm sm:text-base font-semibold text-white mt-4 mb-2">What We Collect:</h3>
                <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                  <li><strong>Account Info:</strong> Name, email, racing details, verification documents</li>
                  <li><strong>Content:</strong> Posts, photos, videos, comments you share</li>
                  <li><strong>Usage Data:</strong> How you interact with the platform</li>
                  <li><strong>Payment Info:</strong> Processed securely through Stripe (we don't store card details)</li>
                </ul>

                <h3 className="text-sm sm:text-base font-semibold text-white mt-4 mb-2">How We Use It:</h3>
                <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                  <li>Provide and improve our Services</li>
                  <li>Process payments and verify identities</li>
                  <li>Send important notifications</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>

                <h3 className="text-sm sm:text-base font-semibold text-white mt-4 mb-2">Your Rights:</h3>
                <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                  <li>Access and update your information</li>
                  <li>Delete your account and data</li>
                  <li>Control privacy settings</li>
                  <li>Opt out of non-essential communications</li>
                </ul>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-3 mt-4">
                  <p className="text-blue-300 font-medium text-center text-xs sm:text-sm">
                    Your privacy matters. We're committed to transparency and protecting your data.
                  </p>
                  <p className="text-blue-200 text-[10px] sm:text-xs text-center mt-1 sm:mt-2">
                    Questions? Contact us at privacy@onlyracefans.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};