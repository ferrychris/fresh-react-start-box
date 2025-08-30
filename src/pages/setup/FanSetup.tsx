import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  User, 
  MapPin, 
  Heart, 
  Camera, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Image,
  Flag
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { updateProfile, createFanProfile, supabase } from '../../lib/supabase';
import { SupabaseImageUpload } from '../../components/SupabaseImageUpload';
import { raceClasses } from '../../data/raceClasses';
import { primaryButton, secondaryButton, outlineButton } from '../../styles/buttons';

export const FanSetup: React.FC = () => {
  const { user, refreshSession } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    profilePhoto: '',
    location: '',
    favoriteClasses: [] as string[],
    favoriteTracks: [] as string[],
    followedRacers: [] as string[],
    whyILoveRacing: ''
  });

  const totalSteps = 6;
  const popularTracks = ['Eldora Speedway', 'Knoxville Raceway', 'Charlotte Motor Speedway', 'Daytona International', 'Indianapolis Motor Speedway', 'Williams Grove', 'Lincoln Speedway'];

  const handleInputChange = (field: string, value: any) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setSetupData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    try {
      if (!user) return;

      // First, check if profile exists and create it if it doesn't
      console.log('🔍 Checking if profile exists...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error checking profile:', profileError);
        throw profileError;
      }

      if (!existingProfile) {
        console.log('⚠️ Profile not found, creating new profile...');
        // Create the missing profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            user_type: 'fan',
            name: user.name,
            email: user.email,
            profile_complete: false
          }]);

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }
        console.log('✅ Profile created successfully');
      } else {
        console.log('✅ Profile found:', existingProfile);
      }

      // Update main profile with avatar
      await updateProfile(user.id, {
        profile_complete: true,
        avatar: setupData.profilePhoto
      });

      // Update fan profile with setup data
      await createFanProfile({
        id: user.id,
        location: setupData.location,
        favorite_classes: setupData.favoriteClasses,
        favorite_tracks: setupData.favoriteTracks,
        followed_racers: setupData.followedRacers,
        why_i_love_racing: setupData.whyILoveRacing,
        profile_photo_url: setupData.profilePhoto
      });

      console.log('Fan profile updated with photo:', setupData.profilePhoto);

      // Refresh session to update user data
      await refreshSession();

      // Force navigation to fan dashboard
      window.location.href = '/fan-dashboard';
    } catch (error) {
      console.error('Setup completion error:', error);
      alert('Failed to complete setup. Please try again.');
    }
  };

  const stepTitles = [
    'Profile Picture',
    'Your Location',
    'Favorite Classes',
    'Favorite Tracks',
    'Follow Racers',
    'Racing Story'
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-fedex-orange to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">You're now part of the racing family!</h1>
          <p className="text-gray-300">Let's set up your fan profile so you can connect with your favorite racers.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  i + 1 <= currentStep ? 'bg-fedex-orange text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i + 1 <= currentStep ? <CheckCircle className="h-5 w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-full h-1 mx-2 ${
                    i + 1 < currentStep ? 'bg-fedex-orange' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">Step {currentStep}: {stepTitles[currentStep - 1]}</h2>
            <div className="text-gray-400">Progress: {Math.round((currentStep / totalSteps) * 100)}%</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-900 rounded-xl p-8 mb-8">
          {/* Step 1: Profile Picture */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Upload Your Profile Picture</h3>
                <div className="max-w-sm mx-auto">
                  <SupabaseImageUpload
                    type="avatar"
                    currentImage={setupData.profilePhoto}
                    userId={user?.id || ''}
                    onImageChange={(url: string) => handleInputChange('profilePhoto', url)}
                  />
                  <p className="text-sm text-gray-400 mt-2">Or skip to use a default avatar</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Set Your Location</h3>
                <p className="text-gray-400 mb-4">This helps us show you racers and events in your area.</p>
                
                <div className="max-w-md mx-auto">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    City, State
                  </label>
                  <input
                    type="text"
                    value={setupData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                    placeholder="Columbus, Ohio"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Favorite Classes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Choose Your Favorite Racing Classes</h3>
                <p className="text-gray-400 mb-4">Select the types of racing you love to watch.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {raceClasses.map(cls => (
                    <label
                      key={cls}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        setupData.favoriteClasses.includes(cls)
                          ? 'border-fedex-orange bg-fedex-orange/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={setupData.favoriteClasses.includes(cls)}
                        onChange={() => handleArrayToggle('favoriteClasses', cls)}
                        className="sr-only"
                      />
                      <div className="text-center w-full">
                        <div className="font-medium text-white">{cls}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Favorite Tracks */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Select Your Favorite Tracks</h3>
                <p className="text-gray-400 mb-4">Enter the names of tracks you love to follow (one per line).</p>
                
                <div className="max-w-2xl mx-auto">
                  <textarea
                    value={setupData.favoriteTracks.join('\n')}
                    onChange={(e) => {
                      const tracks = e.target.value.split('\n').filter(track => track.trim() !== '');
                      handleInputChange('favoriteTracks', tracks);
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                    rows={8}
                    placeholder="Enter your favorite tracks, one per line:&#10;&#10;Eldora Speedway&#10;Knoxville Raceway&#10;Charlotte Motor Speedway&#10;Daytona International Speedway&#10;Indianapolis Motor Speedway&#10;Williams Grove Speedway&#10;Lincoln Speedway"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Examples: Eldora Speedway, Knoxville Raceway, Charlotte Motor Speedway, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Follow Racers */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Follow Your First Racers</h3>
                <p className="text-gray-400 mb-4">Start following some featured racers to see their content in your feed.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* The racers data is no longer available here, so this section will be empty or need to be refactored */}
                  {/* For now, we'll just show a placeholder message */}
                  <p className="text-gray-400 text-center">Racers data is not available in this context.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Racing Story */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Why Do You Love Racing?</h3>
                <p className="text-gray-400 mb-4">Share your passion for racing with the community (optional).</p>
                
                <textarea
                  value={setupData.whyILoveRacing}
                  onChange={(e) => handleInputChange('whyILoveRacing', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                  rows={6}
                  placeholder="Tell us about your love for racing... What got you started? What keeps you coming back? Share your story with fellow fans and racers!"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`${secondaryButton} space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className={`${outlineButton} space-x-2`}
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={completeSetup}
              className={`${primaryButton} space-x-2`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};