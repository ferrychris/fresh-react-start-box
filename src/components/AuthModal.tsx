import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Trophy, Heart, Flag, Building } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '../lib/supabase';
import { cardPrimaryButton, secondaryButton } from '../styles/buttons';

interface AuthModalProps {
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { setShowAuthModal, setUser, redirectToSetup } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [userType, setUserType] = useState<'racer' | 'fan' | 'track' | 'series'>('racer');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }
    
    if (mode === 'signup' && (!formData.name || formData.name.trim() === '')) {
      setError('Name is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from sign in');
      }

      console.log('✅ Sign in successful:', data.user.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw new Error('Failed to load user profile');
      }

      if (profile) {
        console.log('✅ Profile loaded:', profile);
        
          const userData = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            type: profile.user_type,
            user_type: profile.user_type,
            profilePicture: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
            profileComplete: profile.profile_complete
          };
        
        setUser(userData);
        setShowAuthModal(false);
        onClose?.();
        
        // Navigate based on profile completion and user type
        if (!profile.profile_complete) {
          console.log('🚀 Redirecting to setup for user type:', profile.user_type);
          setTimeout(() => {
            redirectToSetup(profile.user_type);
          }, 100);
        } else {
          console.log('🏠 Redirecting to dashboard');
          setTimeout(() => {
            if (profile.user_type === 'racer') {
              window.location.href = '/dashboard';
            } else if (profile.user_type === 'fan') {
              window.location.href = '/fan-dashboard';
            } else if (profile.user_type === 'track') {
              window.location.href = '/track-dashboard';
            } else if (profile.user_type === 'series') {
              window.location.href = '/series-dashboard';
            } else {
              window.location.href = '/';
            }
          }, 100);
        }
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Starting sign up process...');
      console.log('👤 User type:', userType);
      console.log('📧 Email:', formData.email);
      console.log('👤 Name:', formData.name);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            user_type: userType
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Step 2: Create profile record
      const profileData = {
        id: authData.user.id,
        user_type: userType,
        name: formData.name,
        email: formData.email,
        profile_complete: false
      };

      console.log('📝 Creating profile:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // If profile creation fails, try to clean up auth user
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('✅ Profile created successfully:', profile);

      // Step 3: Create type-specific profile
      if (userType === 'racer') {
        console.log('🏁 Creating racer profile...');
        const { error: racerError } = await supabase
          .from('racer_profiles')
          .insert([{
            id: authData.user.id,
            username: formData.name.replace(/\s+/g, '').toLowerCase(),
            bio: '',
            car_number: '',
            racing_class: '',
            hometown: '',
            team_name: '',
            profile_photo_url: '',
            banner_photo_url: '',
            car_photos: [],
            monetization_enabled: false,
            support_tiers: [],
            thank_you_message: '',
            social_links: {},
            career_wins: 0,
            podiums: 0,
            championships: 0,
            years_racing: 0,
            profile_published: false
          }]);

        if (racerError) {
          console.error('❌ Racer profile creation error:', racerError);
          // Don't fail the whole process for this
          console.warn('⚠️ Continuing without racer profile - will be created during setup');
        } else {
          console.log('✅ Racer profile created');
        }
      }

      // Step 4: Set user in app state
      const userData = {
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        type: userType,
        user_type: userType,
        profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`,
        profileComplete: false
      };

      console.log('✅ Setting user data:', userData);
      setUser(userData);
      
      // Step 5: Close modal and redirect
      setShowAuthModal(false);
      onClose?.();
      
      console.log('🚀 Redirecting to setup...');
      
      // Use a more reliable redirect method
      setTimeout(() => {
        try {
          console.log('🎯 Executing redirect to setup for:', userType);
          
          // Direct navigation based on user type
          if (userType === 'racer') {
            console.log('🏁 Navigating to racer setup');
            window.location.href = '/setup/racer';
          } else if (userType === 'fan') {
            console.log('❤️ Navigating to fan setup');
            window.location.href = '/setup/fan';
          } else if (userType === 'track') {
            console.log('🏟️ Navigating to track setup');
            window.location.href = '/setup/track';
          } else if (userType === 'series') {
            console.log('🏆 Navigating to series setup');
            window.location.href = '/setup/series';
          } else {
            console.log('🏠 Navigating to home');
            window.location.href = '/';
          }
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          // Fallback navigation
          window.location.href = '/';
        }
      }, 500); // Increased delay to ensure state is set

    } catch (error) {
      console.error('❌ Sign up error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    console.log('📋 Continue button clicked');
    console.log('🔄 Current step:', step);
    console.log('📝 Current mode:', mode);
    console.log('👤 Selected user type:', userType);
    
    if (step === 1) {
      console.log('➡️ Moving to step 2');
      setStep(2);
    } else if (step === 2) {
      console.log('🚀 Starting signup process');
      handleSignUp();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted');
    console.log('🔄 Current mode:', mode);
    console.log('📋 Current step:', step);
    
    if (mode === 'signin') {
      console.log('🔐 Processing sign in');
      handleSignIn();
    } else {
      console.log('📝 Processing continue/signup');
      handleContinue();
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      username: ''
    });
    setError(null);
    setStep(1);
    setUserType('racer');
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    console.log('🔄 Switching mode to:', newMode);
    setMode(newMode);
    resetForm();
  };

  const userTypeOptions = [
    {
      type: 'racer' as const,
      icon: Trophy,
      title: 'Racer',
      description: 'Share your racing journey and earn from fans',
      color: 'from-red-500 to-orange-500'
    },
    {
      type: 'fan' as const,
      icon: Heart,
      title: 'Fan',
      description: 'Support your favorite racers and get exclusive content',
      color: 'from-pink-500 to-red-500'
    },
    {
      type: 'track' as const,
      icon: Flag,
      title: 'Track',
      description: 'Promote your racing facility and connect with racers',
      color: 'from-blue-500 to-purple-500'
    },
    {
      type: 'series' as const,
      icon: Building,
      title: 'Series',
      description: 'Manage your racing series and grow your community',
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-4 w-full max-w-sm mx-4 shadow-2xl border border-gray-800 relative">
        {/* Header */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-fedex-orange to-fedex-purple rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🏁</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === 'signin' ? 'Welcome Back!' : 
                   step === 1 ? 'Join OnlyRaceFans' : 
                   `Create Your ${userTypeOptions.find(opt => opt.type === userType)?.title} Account`}
                </h2>
                <p className="text-gray-400 text-sm">
                  {mode === 'signin' ? 'Sign in to your account' : 
                   step === 1 ? 'Choose your role in the racing community' :
                   userType === 'racer' ? 'Start building your racing empire' :
                   userType === 'fan' ? 'Join the community and support racers' :
                   userType === 'track' ? 'Showcase your facility' :
                   'Manage your racing series'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAuthModal(false);
                resetForm();
                onClose?.();
              }}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Progress Indicator for Signup */}
          {mode === 'signup' && (
            <div className="flex items-center justify-center space-x-3 mt-5">
              {[1, 2].map((i) => (
                <React.Fragment key={i}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i <= step ? 'bg-fedex-orange text-white shadow-lg' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {i}
                  </div>
                  {i < 2 && (
                    <div className={`w-10 h-1 rounded-full transition-all ${
                      i < step ? 'bg-fedex-orange' : 'bg-gray-600'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: User Type Selection (Signup Only) */}
            {mode === 'signup' && step === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-white mb-2">Choose Your Role</h3>
                  <p className="text-gray-400">Select how you want to participate in the racing community</p>
                </div>

                <div className="space-y-2.5">
                  {userTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => {
                          console.log('👤 User type selected:', option.type);
                          setUserType(option.type);
                        }}
                        className={`w-full p-2.5 rounded-xl border-2 text-left transition-all hover:scale-[1.005] ${
                          userType === option.type
                            ? 'border-fedex-orange bg-fedex-orange/10 shadow-lg shadow-fedex-orange/25'
                            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center shadow-lg`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-xs mb-0.5">{option.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{option.description}</p>
                          </div>
                          {userType === option.type && (
                            <div className="w-3.5 h-3.5 bg-fedex-orange rounded-full flex items-center justify-center">
                              <span className="text-white text-[9px] font-bold">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    console.log('➡️ Continue to step 2 with user type:', userType);
                    setStep(2);
                  }}
                  className={`${cardPrimaryButton} w-full text-sm font-bold`}
                >
                  Continue as {userTypeOptions.find(opt => opt.type === userType)?.title} →
                </button>
              </div>
            )}

            {/* Step 2: Account Creation (Signup) or Sign In Form */}
            {(mode === 'signin' || (mode === 'signup' && step === 2)) && (
              <div className="space-y-2.5">

                {/* Name Field (Signup Only) */}
                {mode === 'signup' && (
                  <div className="mb-1">
                    <label className="block text-[11px] font-medium text-gray-300 mb-0.5">
                      {userType === 'racer' ? 'Racing Name' :
                       userType === 'fan' ? 'Display Name' :
                       userType === 'track' ? 'Track Name' :
                       'Series Name'} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-fedex-orange focus:border-fedex-orange transition-all text-xs"
                        placeholder={
                          userType === 'racer' ? 'Racing name' :
                          userType === 'fan' ? 'Display name' :
                          userType === 'track' ? 'Track name' :
                          'Series name'
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-0.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-fedex-orange focus:border-fedex-orange transition-all text-xs"
                      placeholder="email@site.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-0.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-7 pr-6 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-fedex-orange focus:border-fedex-orange transition-all text-xs"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">6+ chars</p>
                </div>

                {/* Username (Signup Only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-0.5">
                      {userType === 'racer' ? 'Handle' : 'Username'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs font-bold">@</span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full pl-5 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-fedex-orange focus:border-fedex-orange transition-all text-xs"
                        placeholder="handle"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                      Letters, numbers, underscores only
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-600/20 border border-red-600/50 rounded-md p-2">
                    <p className="text-red-400 text-[11px] font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${cardPrimaryButton} w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm`}
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {mode === 'signin' ? 'Sign In to Dashboard' : 'Create Account & Continue'}
                    </span>
                  )}
                </button>

                {/* Back Button for Signup Step 2 */}
                {mode === 'signup' && step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('⬅️ Going back to step 1');
                      setStep(1);
                      setError(null);
                    }}
                    className={`${secondaryButton} w-full`}
                  >
                    ← Back to User Type Selection
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Mode Switch */}
          <div className="mt-5 text-center">
            <p className="text-gray-400 text-sm mb-2">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-fedex-orange hover:text-fedex-orange-light font-semibold transition-colors text-base"
            >
              {mode === 'signin' ? 'Create Account' : 'Sign In Instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};