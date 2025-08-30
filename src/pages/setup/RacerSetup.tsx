import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Camera,
  Search,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../App';
import { updateProfile, updateRacerProfile, supabase } from '../../lib/supabase';
import { SupabaseImageUpload } from '../../components/SupabaseImageUpload';
import { raceClasses } from '../../data/raceClasses';
import { primaryButton, secondaryButton, outlineButton } from '../../styles/buttons';

export const RacerSetup: React.FC = () => {
  const { user, setUser } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showRacingClassDropdown, setShowRacingClassDropdown] = useState(false);
  const [racingClassSearch, setRacingClassSearch] = useState('');
  const [setupData, setSetupData] = useState({
    profilePhoto: '',
    bannerPhoto: '',
    sponsorPhoto: '',
    bio: '',
    carNumber: '',
    racingClass: '',
    hometown: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    teamName: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: ''
    },
    careerWins: 0,
    podiums: 0,
    championships: 0,
    yearsRacing: 1,
    careerHistory: '',
    highlights: '',
    achievements: ''
  });
  
  // State for keyboard navigation in racing class dropdown
  const [focusedClassIndex, setFocusedClassIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusedItemRef = useRef<HTMLDivElement>(null);

  // Filter racing classes based on search
  const filteredRacingClasses = racingClassSearch
    ? raceClasses.filter(cls => 
        cls.toLowerCase().includes(racingClassSearch.toLowerCase()))
    : raceClasses;
    
  // Reset focused index when filtered list changes
  useEffect(() => {
    setFocusedClassIndex(-1);
  }, [racingClassSearch]);
  
  // Scroll focused item into view when navigating with keyboard
  useEffect(() => {
    if (focusedClassIndex >= 0 && focusedItemRef.current) {
      focusedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedClassIndex]);
    
  // Ref for dropdown to detect outside clicks
  const racingClassDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (racingClassDropdownRef.current && 
          !racingClassDropdownRef.current.contains(event.target as Node)) {
        setShowRacingClassDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (showRacingClassDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showRacingClassDropdown]);

  const totalSteps = 7;

  const handleInputChange = (field: string, value: string | number | Record<string, string>) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSetupData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
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
    if (!user) return;

    setLoading(true);
    try {
      console.log('🏁 Starting racer setup completion...');
      console.log('👤 Current user:', user);
      console.log('📝 Setup data:', setupData);

      // Validate required fields
      if (!setupData.profilePhoto) {
        alert('Profile photo is required');
        setLoading(false);
        return;
      }
      if (!setupData.addressLine1 || !setupData.city || !setupData.state || !setupData.postalCode || !setupData.country) {
        alert('Address is required (Street, City, State, Postal Code, Country).');
        setLoading(false);
        return;
      }
      if (!setupData.phone) {
        alert('Best phone number is required.');
        setLoading(false);
        return;
      }

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
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            user_type: 'racer',
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

      // Update main profile
      console.log('📝 Updating main profile...');
      await updateProfile(user.id, {
        profile_complete: true,
        avatar: setupData.profilePhoto,
        banner_image: setupData.bannerPhoto
      });
      console.log('✅ Main profile updated');

      // Update racer profile
      console.log('🏁 Creating/updating racer profile...');
      const racerProfileData = {
        id: user.id,
        username: user.name.replace(/\s+/g, '').toLowerCase(),
        bio: setupData.bio,
        car_number: setupData.carNumber,
        racing_class: setupData.racingClass,
        hometown: setupData.hometown,
        address_line1: setupData.addressLine1,
        city: setupData.city,
        state: setupData.state,
        postal_code: setupData.postalCode,
        country: setupData.country,
        phone: setupData.phone,
        team_name: setupData.teamName,
        profile_photo_url: setupData.profilePhoto,
        banner_photo_url: setupData.bannerPhoto,
        main_sponsor_photo_url: setupData.sponsorPhoto,
        car_photos: setupData.sponsorPhoto ? [setupData.sponsorPhoto] : [],
        monetization_enabled: true,
        social_links: setupData.socialLinks,
        career_wins: setupData.careerWins,
        podiums: setupData.podiums,
        championships: setupData.championships,
        years_racing: setupData.yearsRacing,
        career_history: setupData.careerHistory,
        highlights: setupData.highlights,
        achievements: setupData.achievements,
        profile_published: true
      };
      
      console.log('🏁 Racer profile data:', racerProfileData);
      await updateRacerProfile(user.id, racerProfileData);
      console.log('✅ Racer profile created/updated successfully');

      // Update local user state
      setUser({
        ...user,
        ...setupData,
        profilePicture: setupData.profilePhoto,
        bannerImage: setupData.bannerPhoto,
        profileComplete: true
      });
      console.log('✅ Local user state updated');

      // Navigate to dashboard
      console.log('🚀 Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Racer setup error:', error);
      alert(`Failed to complete setup: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Profile Photos',
    'Basic Information',
    'Address',
    'Racing Details',
    'Social Media',
    'Racing Stats',
    'My Career'
  ];

  const getStepProgress = () => Math.round((currentStep / totalSteps) * 100);

  // Word limit handling for Racing Bio
  const MAX_BIO_WORDS = 500;
  const limitWords = (text: string, max: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= max) {
      return { text, count: words.length };
    }
    return { text: words.slice(0, max).join(' '), count: max };
  };
  const bioWordCount = setupData.bio.trim()
    ? setupData.bio.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-fedex-orange to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Complete Your Racer Profile</h1>
          <p className="text-gray-300 text-sm sm:text-base">Set up your profile to start connecting with fans and sponsors</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                  i + 1 <= currentStep ? 'bg-fedex-orange text-white scale-110' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i + 1 <= currentStep ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded-full transition-all ${
                    i + 1 < currentStep ? 'bg-fedex-orange' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Step {currentStep}: {stepTitles[currentStep - 1]}</h2>
            <div className="text-gray-400 text-sm">Progress: {getStepProgress()}%</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-700 max-w-2xl mx-auto">
          {/* Step 1: Profile Photos */}
          {currentStep === 1 && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                
                <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">Add photos to make your profile stand out to fans and sponsors</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
                {/* Profile Photo Section - Heading and Upload Side by Side */}
                <div className="flex flex-col items-center gap-2">
                 
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40">
                      <SupabaseImageUpload
                        type="avatar"
                        currentImage={setupData.profilePhoto}
                        userId={user?.id || ''}
                        onImageChange={(url) => handleInputChange('profilePhoto', url)}
                        className="w-full h-full"
                        context="racer"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => {
                        const fileInput = document.querySelector('.w-40.h-40 input[type="file"]');
                        if (fileInput && fileInput instanceof HTMLInputElement) {
                          fileInput.setAttribute('capture', 'environment');
                          fileInput.click();
                          setTimeout(() => fileInput.removeAttribute('capture'), 1000);
                        }
                      }} className="md:hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2 text-sm">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Banner Photo Section */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40">
                      <SupabaseImageUpload
                        type="avatar"
                        currentImage={setupData.bannerPhoto}
                        userId={user?.id || ''}
                        onImageChange={(url) => handleInputChange('bannerPhoto', url)}
                        className="w-full h-full"
                        context="racer"
                        titleOverride="Cover Banner"
                        descriptionOverride="Showcase your car or team"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => {
                        const fileInput = document.querySelector('.flex-col.sm\\:flex-row:nth-child(2) .w-40.h-40 input[type="file"]');
                        if (fileInput && fileInput instanceof HTMLInputElement) {
                          fileInput.setAttribute('capture', 'environment');
                          fileInput.click();
                          setTimeout(() => fileInput.removeAttribute('capture'), 1000);
                        }
                      }} className="md:hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2 text-sm">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sponsor Photo Section */}
                <div className="flex flex-col items-center gap-2">
                
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40">
                      <SupabaseImageUpload
                        type="avatar"
                        currentImage={setupData.sponsorPhoto}
                        userId={user?.id || ''}
                        onImageChange={(url) => handleInputChange('sponsorPhoto', url)}
                        className="w-full h-full"
                        context="racer"
                        titleOverride="Sponsor/Car"
                        descriptionOverride="Highlight a sponsor logo or your car"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => {
                        const fileInput = document.querySelector('.flex-col.sm\\:flex-row:nth-child(3) .w-40.h-40 input[type="file"]');
                        if (fileInput && fileInput instanceof HTMLInputElement) {
                          fileInput.setAttribute('capture', 'environment');
                          fileInput.click();
                          setTimeout(() => fileInput.removeAttribute('capture'), 1000);
                        }
                      }} className="md:hidden px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2 text-sm">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Tips */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">Use high-quality images with good lighting</p>
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">Tell Us About Yourself</h3>
                <p className="text-gray-400 text-sm sm:text-base">Share your racing story with fans</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Racing Bio <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={setupData.bio}
                    onChange={(e) => {
                      const { text } = limitWords(e.target.value, MAX_BIO_WORDS);
                      handleInputChange('bio', text);
                    }}
                    className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange min-h-[120px] max-h-60 sm:max-h-72 overflow-y-auto resize-none"
                    rows={4}
                    placeholder="Tell fans about your racing journey, what drives you, and what makes you unique..."
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">This will be displayed on your profile</p>
                    <p className={`text-xs ${bioWordCount >= MAX_BIO_WORDS ? 'text-red-400' : 'text-gray-400'}`}>
                      {bioWordCount}/{MAX_BIO_WORDS} words
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Hometown <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.hometown}
                      onChange={(e) => handleInputChange('hometown', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="Columbus, Ohio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={setupData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="Team Thunder Racing"
                    />
                  </div>

                  
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">Where Can Partners Reach You?</h3>
                <p className="text-gray-400 text-sm sm:text-base">Your address helps with shipping merch and sponsorship materials.</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Address Line 1 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="Charlotte"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      State/Region <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="NC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Postal Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="28202"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="United States"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Best Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={setupData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="(555) 123-4567"
                    />
                    <p className="text-xs text-gray-400 mt-1">Only visible to you and for account-related communication.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Racing Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Racing Information</h3>
                <p className="text-gray-400 text-sm sm:text-base">Help fans and sponsors find you</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Car Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.carNumber}
                      onChange={(e) => handleInputChange('carNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="82"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Racing Class <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div 
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white flex items-center justify-between cursor-pointer"
                        onClick={() => setShowRacingClassDropdown(!showRacingClassDropdown)}
                        role="combobox"
                        aria-expanded={showRacingClassDropdown}
                        aria-haspopup="listbox"
                        aria-controls="racing-class-listbox"
                      >
                        <div className="flex-1 truncate">
                          {setupData.racingClass || <span className="text-gray-400">Select Racing Class</span>}
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      {showRacingClassDropdown && (
                        <div 
                          className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                          id="racing-class-listbox"
                          role="listbox"
                          aria-label="Racing Classes"
                        >
                          <div className="sticky top-0 bg-gray-800 p-2 border-b border-gray-700">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                ref={searchInputRef}
                                type="text"
                                value={racingClassSearch}
                                onChange={(e) => setRacingClassSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-fedex-orange"
                                placeholder="Search racing classes..."
                                aria-label="Search racing classes"
                                aria-autocomplete="list"
                                aria-controls="racing-class-listbox"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  const keyHandlers: Record<string, () => void> = {
                                    ArrowDown: () => {
                                      e.preventDefault();
                                      setFocusedClassIndex(prev => 
                                        prev < filteredRacingClasses.length - 1 ? prev + 1 : 0
                                      );
                                    },
                                    ArrowUp: () => {
                                      e.preventDefault();
                                      setFocusedClassIndex(prev => 
                                        prev > 0 ? prev - 1 : filteredRacingClasses.length - 1
                                      );
                                    },
                                    Enter: () => {
                                      e.preventDefault();
                                      if (focusedClassIndex >= 0 && focusedClassIndex < filteredRacingClasses.length) {
                                        handleInputChange('racingClass', filteredRacingClasses[focusedClassIndex]);
                                        setShowRacingClassDropdown(false);
                                        setRacingClassSearch('');
                                      }
                                    },
                                    Escape: () => {
                                      e.preventDefault();
                                      setShowRacingClassDropdown(false);
                                    }
                                  };
                                  
                                  const handler = keyHandlers[e.key];
                                  if (handler) handler();
                                }}
                              />
                            </div>
                          </div>
                          <div className="py-1">
                            {filteredRacingClasses.length > 0 ? (
                              filteredRacingClasses.map((cls) => (
                                <div
                                  key={cls}
                                  ref={filteredRacingClasses.indexOf(cls) === focusedClassIndex ? focusedItemRef : null}
                                  className={`px-4 py-2 hover:bg-gray-700 cursor-pointer ${
                                    setupData.racingClass === cls ? 'bg-fedex-orange/20 text-fedex-orange' : 
                                    filteredRacingClasses.indexOf(cls) === focusedClassIndex ? 'bg-gray-700 text-white' : 'text-white'
                                  }`}
                                  onClick={() => {
                                    handleInputChange('racingClass', cls);
                                    setShowRacingClassDropdown(false);
                                    setRacingClassSearch('');
                                  }}
                                  onMouseEnter={() => setFocusedClassIndex(filteredRacingClasses.indexOf(cls))}
                                  role="option"
                                  aria-selected={setupData.racingClass === cls}
                                  id={`racing-class-option-${cls.replace(/\s+/g, '-').toLowerCase()}`}
                                >
                                  {cls}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-400 text-center">No results found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Social Media */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Connect Your Social Media</h3>
                <p className="text-gray-400 text-sm sm:text-base">Link your social accounts to grow your fanbase</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                  <input
                    type="url"
                    value={setupData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facebook</label>
                  <input
                    type="url"
                    value={setupData.socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">TikTok</label>
                  <input
                    type="url"
                    value={setupData.socialLinks.tiktok}
                    onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">YouTube</label>
                  <input
                    type="url"
                    value={setupData.socialLinks.youtube}
                    onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                    placeholder="https://youtube.com/yourchannel"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Racing Stats */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Racing Achievements</h3>
                <p className="text-gray-400 text-sm sm:text-base">Share your racing accomplishments</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Career Wins</label>
                    <input
                      type="number"
                      value={setupData.careerWins}
                      onChange={(e) => handleInputChange('careerWins', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="0"
                      min="0"
                      max="12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Podium Finishes</label>
                    <input
                      type="number"
                      value={setupData.podiums}
                      onChange={(e) => handleInputChange('podiums', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="0"
                      min="0"
                      max="12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Championships</label>
                    <input
                      type="number"
                      value={setupData.championships}
                      onChange={(e) => handleInputChange('championships', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="0"
                      min="0"
                      max="12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Years Racing <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      value={setupData.yearsRacing}
                      onChange={(e) => handleInputChange('yearsRacing', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-6 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm text-center">
                    💡 Don't worry if you're just starting out - every champion started with zero wins!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: My Career */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">My Career</h3>
                <p className="text-gray-400 text-sm sm:text-base">Share your racing journey and accomplishments</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Career History
                  </label>
                  <textarea
                    value={setupData.careerHistory}
                    onChange={(e) => handleInputChange('careerHistory', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange min-h-[120px] resize-none"
                    rows={4}
                    placeholder="Tell your racing story - how you got started, key milestones, memorable races..."
                  />
                  <p className="text-xs text-gray-400 mt-1">Share your racing journey from the beginning</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Career Highlights
                  </label>
                  <textarea
                    value={setupData.highlights}
                    onChange={(e) => handleInputChange('highlights', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange min-h-[100px] resize-none"
                    rows={3}
                    placeholder="Your most memorable racing moments, best finishes, special victories..."
                  />
                  <p className="text-xs text-gray-400 mt-1">What are you most proud of in your racing career?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Achievements & Awards
                  </label>
                  <textarea
                    value={setupData.achievements}
                    onChange={(e) => handleInputChange('achievements', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange focus:border-fedex-orange min-h-[100px] resize-none"
                    rows={3}
                    placeholder="Awards, recognitions, special honors, rookie of the year, etc..."
                  />
                  <p className="text-xs text-gray-400 mt-1">List any awards, trophies, or special recognitions</p>
                </div>

                <div className="mt-6 bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm text-center">
                    🏁 This information helps fans and sponsors understand your racing background and experience
                  </p>
                </div>
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
              disabled={currentStep === 1 && !setupData.profilePhoto}
              className={`${outlineButton} space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={completeSetup}
              disabled={loading || !setupData.profilePhoto || !setupData.bio || !setupData.carNumber || !setupData.racingClass || !setupData.hometown || setupData.yearsRacing < 1}
              className={`${primaryButton} space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Setup</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Required Fields Notice */}
        {currentStep === totalSteps && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              * Profile photo, bio, car number, racing class, and hometown are required
            </p>
          </div>
        )}
      </div>
    </div>
  );
};