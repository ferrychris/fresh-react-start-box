import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Flag, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { useApp } from '../../App';
import { updateProfile, updateTrackProfile, uploadImage, saveImageToAvatarsTable, supabase } from '../../lib/supabase';
import { SupabaseImageUpload } from '../../components/SupabaseImageUpload';
import { raceClasses } from '../../data/raceClasses';
import { primaryButton, secondaryButton, outlineButton } from '../../styles/buttons';

export const TrackSetup: React.FC = () => {
  const { user, setUser, racers } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    trackLogo: '',
    bannerPhoto: '',
    trackName: '',
    contactPerson: '',
    trackType: '',
    location: '',
    contactEmail: '',
    website: '',
    classesHosted: [] as string[],
    schedule: [] as any[],
    featuredRacers: [] as string[],
    sponsors: [] as any[]
  });

  // Event flyer and sponsor logo states
  const [eventFlyer, setEventFlyer] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');

  const totalSteps = 5;
  const trackTypes = ['Dirt Oval', 'Asphalt Oval', 'Drag Strip', 'Road Course', 'Kart Track', 'Figure 8'];

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

  const handleEventFlyerUpload = async (file: File) => {
    if (!user?.id) return;
    
    try {
      const folderPath = `event-flyers/${user.id}`;
      const { url, error } = await uploadImage(file, 'avatars', folderPath);
      
      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      setEventFlyer(url);
      
      // Save to avatars table
      try {
        const { error: dbError } = await saveImageToAvatarsTable(
          user.id,
          url,
          'avatar', // Using avatar type for event flyer
          file.name
        );
        if (dbError) {
          console.warn('Warning: Failed to save event flyer to avatars table:', dbError);
        }
      } catch (avatarsError) {
        console.warn('Warning: Avatars table not available for event flyer:', avatarsError);
      }
    } catch (error) {
      console.error('Error uploading event flyer:', error);
      alert('Error uploading event flyer. Please try again.');
    }
  };

  const handleSponsorLogoUpload = async (file: File) => {
    if (!user?.id) return;
    
    try {
      const folderPath = `sponsor-logos/${user.id}`;
      const { url, error } = await uploadImage(file, 'avatars', folderPath);
      
      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      setSponsorLogo(url);
      
      // Save to avatars table
      try {
        const { error: dbError } = await saveImageToAvatarsTable(
          user.id,
          url,
          'avatar', // Using avatar type for sponsor logo
          file.name
        );
        if (dbError) {
          console.warn('Warning: Failed to save sponsor logo to avatars table:', dbError);
        }
      } catch (avatarsError) {
        console.warn('Warning: Avatars table not available for sponsor logo:', avatarsError);
      }
    } catch (error) {
      console.error('Error uploading sponsor logo:', error);
      alert('Error uploading sponsor logo. Please try again.');
    }
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
            user_type: 'track',
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

      // Update main profile with avatar and banner
      await updateProfile(user.id, {
        profile_complete: true,
        avatar: setupData.trackLogo,
        banner_image: setupData.bannerPhoto
      });

      // Update track profile with setup data
      await updateTrackProfile(user.id, {
        track_name: user.trackName || setupData.trackName,
        contact_person: user.contactPerson || setupData.contactPerson,
        track_type: setupData.trackType,
        location: setupData.location,
        contact_email: setupData.contactEmail,
        website: setupData.website,
        classes_hosted: setupData.classesHosted,
        track_logo_url: setupData.trackLogo,
        banner_photo_url: setupData.bannerPhoto,
        featured_racers: setupData.featuredRacers,
        sponsors: setupData.sponsors
      });

      console.log('Track profile updated with photos:', {
        logo: setupData.trackLogo,
        banner: setupData.bannerPhoto
      });

      // Update local user state with avatar and banner
      setUser({
        ...user,
        ...setupData,
        profilePicture: setupData.trackLogo,
        bannerImage: setupData.bannerPhoto,
        profileComplete: true
      });

      // Force navigation to track dashboard
      window.location.href = '/track-dashboard';
    } catch (error) {
      console.error('Setup completion error:', error);
      alert('Failed to complete setup. Please try again.');
    }
  };

  const stepTitles = [
    'Track Branding',
    'Track Information',
    'Race Schedule',
    'Featured Racers',
    'Track Sponsors'
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/onlyracefans-logo.png" 
              alt="OnlyRaceFans" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to OnlyRaceFans!</h1>
          <p className="text-gray-300">Let's get your track ready to post events and connect with racers.</p>
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
          {/* Step 1: Track Branding */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Upload Track Logo & Banner</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Track Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Track Logo <span className="text-red-400">*</span>
                    </label>
                    <SupabaseImageUpload
                      type="avatar"
                      currentImage={setupData.trackLogo}
                      userId={user?.id || ''}
                      onImageChange={(url: string) => handleInputChange('trackLogo', url)}
                    />
                    <p className="text-xs text-gray-400 mt-2">Recommended: Square format (400x400px)</p>
                  </div>

                  {/* Banner Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Track Banner <span className="text-red-400">*</span>
                    </label>
                    <SupabaseImageUpload
                      type="banner"
                      currentImage={setupData.bannerPhoto}
                      userId={user?.id || ''}
                      onImageChange={(url: string) => handleInputChange('bannerPhoto', url)}
                    />
                    <p className="text-xs text-gray-400 mt-2">Recommended: Wide format (1200x400px)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Track Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Track Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Track Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.trackName}
                      onChange={(e) => handleInputChange('trackName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      placeholder="Eldora Speedway"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Person <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Track Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={setupData.trackType}
                      onChange={(e) => handleInputChange('trackType', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                    >
                      <option value="">Select Track Type</option>
                      {trackTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={setupData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      placeholder="info@yourtrack.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={setupData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      placeholder="https://yourtrack.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Race Classes Hosted
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {raceClasses.map(cls => (
                      <label
                        key={cls}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          setupData.classesHosted.includes(cls)
                            ? 'border-fedex-orange bg-fedex-orange/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={setupData.classesHosted.includes(cls)}
                          onChange={() => handleArrayToggle('classesHosted', cls)}
                          className="sr-only"
                        />
                        <span className="text-sm text-white">{cls}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Upload Race Schedule</h3>
                <p className="text-gray-400 mb-4">Add your upcoming events to attract racers and fans.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        placeholder="Friday Night Thunder"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Classes</label>
                      <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange">
                        <option>Sprint Car</option>
                        <option>Late Model</option>
                        <option>Modified</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Event Flyer (Optional)</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-fedex-orange transition-colors">
                      {eventFlyer ? (
                        <div className="space-y-2">
                          <img 
                            src={eventFlyer} 
                            alt="Event flyer" 
                            className="max-w-full h-32 object-contain mx-auto rounded"
                          />
                          <button 
                            onClick={() => setEventFlyer('')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400 mb-2">Upload event flyer</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleEventFlyerUpload(file);
                              }
                            }}
                            className="hidden"
                            id="event-flyer-input"
                          />
                          <label 
                            htmlFor="event-flyer-input"
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors cursor-pointer"
                          >
                            Choose File
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-white font-medium transition-colors">
                    Add Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Featured Racers */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Feature Racers</h3>
                <p className="text-gray-400 mb-4">Select racers from your region to showcase on your track profile.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {racers.slice(0, 6).map(racer => (
                    <div
                      key={racer.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        setupData.featuredRacers.includes(racer.id)
                          ? 'border-fedex-orange bg-fedex-orange/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handleArrayToggle('featuredRacers', racer.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={racer.profilePicture}
                          alt={racer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{racer.name}</h4>
                          <p className="text-sm text-gray-400">#{racer.carNumber} • {racer.class}</p>
                          <p className="text-xs text-gray-500">{racer.location}</p>
                        </div>
                        {setupData.featuredRacers.includes(racer.id) && (
                          <CheckCircle className="h-5 w-5 text-fedex-orange" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Sponsors */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add Track Sponsors (Optional)</h3>
                <p className="text-gray-400 mb-4">Showcase your sponsors and link to their websites.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sponsor Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        placeholder="FastLane Racing Parts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        placeholder="https://fastlane.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sponsor Logo</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-fedex-orange transition-colors">
                      {sponsorLogo ? (
                        <div className="space-y-2">
                          <img 
                            src={sponsorLogo} 
                            alt="Sponsor logo" 
                            className="max-w-full h-32 object-contain mx-auto rounded"
                          />
                          <button 
                            onClick={() => setSponsorLogo('')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400 mb-2">Upload sponsor logo</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleSponsorLogoUpload(file);
                              }
                            }}
                            className="hidden"
                            id="sponsor-logo-input"
                          />
                          <label 
                            htmlFor="sponsor-logo-input"
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors cursor-pointer"
                          >
                            Choose File
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-white font-medium transition-colors">
                    Add Sponsor
                  </button>
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