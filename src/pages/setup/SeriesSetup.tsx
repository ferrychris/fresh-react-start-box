import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Trophy, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe,
  DollarSign,
  Flag,
  Image
} from 'lucide-react';
import { useApp } from '../../App';
import { updateProfile, updateSeriesProfile, supabase } from '../../lib/supabase';
import { SupabaseImageUpload } from '../../components/SupabaseImageUpload';
import { raceClasses } from '../../data/raceClasses';
import { primaryButton, secondaryButton, outlineButton } from '../../styles/buttons';

export const SeriesSetup: React.FC = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState({
    seriesLogo: '',
    bannerPhoto: '',
    seriesName: '',
    description: '',
    seriesType: 'Sprint Car',
    headquarters: '',
    founded: new Date().getFullYear(),
    website: '',
    contactPerson: '',
    contactPhone: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    featuredRacers: [] as string[],
    featuredTracks: [] as string[],
    totalPurse: 0,
    championshipPurse: 0,
    events: [] as any[]
  });

  const totalSteps = 6;
  const seriesTypes = ['Sprint Car', 'Late Model', 'Modified', 'Midget', 'Stock Car', 'Drag Racing', 'Road Course'];

  const handleInputChange = (field: string, value: any) => {
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
      console.log('🏆 Starting series setup completion...');
      console.log('👤 Current user:', user);
      console.log('📝 Setup data:', setupData);

      // Validate required fields
      if (!setupData.seriesName || setupData.seriesName.trim() === '') {
        throw new Error('Series name is required');
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
        // Create the missing profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            user_type: 'series',
            name: setupData.seriesName,
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
        avatar: setupData.seriesLogo,
        banner_image: setupData.bannerPhoto
      });
      console.log('✅ Main profile updated');

      // Update series profile
      console.log('🏆 Creating/updating series profile...');
      const seriesProfileData = {
        id: user.id,
        series_name: setupData.seriesName,
        description: setupData.description,
        series_type: setupData.seriesType,
        headquarters: setupData.headquarters,
        founded: setupData.founded,
        contact_email: user.email,
        website: setupData.website,
        contact_person: setupData.contactPerson,
        contact_phone: setupData.contactPhone,
        series_logo_url: setupData.seriesLogo,
        banner_photo_url: setupData.bannerPhoto,
        social_links: setupData.socialLinks,
        featured_racers: setupData.featuredRacers,
        featured_tracks: setupData.featuredTracks,
        total_purse_cents: setupData.totalPurse * 100,
        championship_purse_cents: setupData.championshipPurse * 100,
        total_events: setupData.events.length,
        profile_published: true
      };
      
      console.log('🏆 Series profile data:', seriesProfileData);
      await createSeriesProfile(seriesProfileData);
      console.log('✅ Series profile created/updated successfully');

      // Add events to race_schedules if any
      if (setupData.events.length > 0) {
        console.log('📅 Adding events to race schedule...');
        for (const event of setupData.events) {
          await supabase
            .from('race_schedules')
            .insert({
              racer_id: null,
              track_id: null,
              event_name: event.name,
              track_name: event.track,
              event_date: event.date,
              event_time: event.time,
              location: event.location
            });
        }
        console.log('✅ Events added to schedule');
      }

      // Update local user state
      setUser({
        ...user,
        profilePicture: setupData.seriesLogo,
        bannerImage: setupData.bannerPhoto,
        profileComplete: true
      });
      console.log('✅ Local user state updated');

      // Navigate to series dashboard
      console.log('🚀 Redirecting to series dashboard...');
      window.location.href = '/series-dashboard';
    } catch (error) {
      console.error('Series setup error:', error);
      alert(`Failed to complete setup: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Series Branding',
    'Series Information', 
    'Contact & Social',
    'Featured Content',
    'Events & Schedule',
    'Preview Profile'
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fedex-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to OnlyRaceFans!</h1>
          <p className="text-gray-300">Let's set up your racing series profile to connect with racers and fans.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  i + 1 <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i + 1 <= currentStep ? <CheckCircle className="h-5 w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-full h-1 mx-2 ${
                    i + 1 < currentStep ? 'bg-purple-600' : 'bg-gray-700'
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
          {/* Step 1: Series Branding */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-3">Upload Series Branding</h3>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">Add your series logo and banner to create a professional presence</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Series Logo */}
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-purple-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Series Logo <span className="text-red-400">*</span>
                    </h4>
                    <p className="text-gray-400 text-sm">This will be your main series logo</p>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <div className="w-40 h-40">
                      <SupabaseImageUpload
                        type="avatar"
                        currentImage={setupData.seriesLogo}
                        userId={user?.id || ''}
                        onImageChange={(url) => handleInputChange('seriesLogo', url)}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Photo */}
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image className="h-8 w-8 text-purple-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Series Banner
                    </h4>
                    <p className="text-gray-400 text-sm">Showcase your series branding</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="w-full h-28">
                      <SupabaseImageUpload
                        type="banner"
                        currentImage={setupData.bannerPhoto}
                        userId={user?.id || ''}
                        onImageChange={(url) => handleInputChange('bannerPhoto', url)}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Series Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Series Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Series Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={setupData.seriesName}
                    onChange={(e) => handleInputChange('seriesName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="World of Outlaws Sprint Car Series"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Series Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={setupData.seriesType}
                    onChange={(e) => handleInputChange('seriesType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {seriesTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Headquarters <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={setupData.headquarters}
                    onChange={(e) => handleInputChange('headquarters', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Concord, NC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={setupData.founded}
                    onChange={(e) => handleInputChange('founded', parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="1978"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Series Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={setupData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  rows={4}
                  placeholder="Describe your racing series, its history, and what makes it special..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Season Purse
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={setupData.totalPurse}
                      onChange={(e) => handleInputChange('totalPurse', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="2500000"
                      step="1000"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Total prize money for the season</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Championship Purse
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={setupData.championshipPurse}
                      onChange={(e) => handleInputChange('championshipPurse', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="200000"
                      step="1000"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Championship prize money</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Social */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information & Social Media</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Person <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={setupData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={setupData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={setupData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="https://worldofoutlaws.com"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Social Media Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Facebook</label>
                    <input
                      type="url"
                      value={setupData.socialLinks.facebook}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://facebook.com/yourseries"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                    <input
                      type="url"
                      value={setupData.socialLinks.instagram}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://instagram.com/yourseries"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X</label>
                    <input
                      type="url"
                      value={setupData.socialLinks.twitter}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://twitter.com/yourseries"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">YouTube</label>
                    <input
                      type="url"
                      value={setupData.socialLinks.youtube}
                      onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="https://youtube.com/yourseries"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Featured Content */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Featured Racers & Tracks</h3>
              <p className="text-gray-400 mb-4">Select racers and tracks to feature on your series profile.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Featured Racers */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Featured Racers</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-400 mb-2">Select racers to feature (coming soon - will load from database)</p>
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Racer selection will be available once racers are loaded</p>
                    </div>
                  </div>
                </div>

                {/* Featured Tracks */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Featured Tracks</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-400 mb-2">Select tracks to feature (coming soon - will load from database)</p>
                    <div className="text-center py-8 text-gray-500">
                      <Flag className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Track selection will be available once tracks are loaded</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Events & Schedule */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add Series Events</h3>
              <p className="text-gray-400 mb-4">Add your race schedule so fans can follow your events.</p>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="font-semibold text-white mb-4">Add New Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Kings Royal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Track Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Eldora Speedway"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Rossburg, OH"
                    />
                  </div>
                </div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                  Add Event
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {setupData.events.map((event, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-white">{event.name}</h5>
                        <p className="text-sm text-gray-400">{event.track} • {event.date}</p>
                      </div>
                      <button
                        onClick={() => {
                          const newEvents = setupData.events.filter((_, i) => i !== index);
                          handleInputChange('events', newEvents);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Preview */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preview Your Series Profile</h3>
              <p className="text-gray-400 mb-6">Here's how your series profile will look to visitors:</p>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    {setupData.seriesLogo ? (
                      <img src={setupData.seriesLogo} alt="Series logo" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <Trophy className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{setupData.seriesName || 'Your Series Name'}</h4>
                    <p className="text-purple-400">{setupData.seriesType} Series</p>
                    <p className="text-gray-400">{setupData.headquarters}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">{setupData.description || 'Your series description will appear here...'}</p>
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-bold text-purple-400">Est. {setupData.founded}</div>
                    <div className="text-gray-400">Founded</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-400">${(setupData.totalPurse / 1000000).toFixed(1)}M</div>
                    <div className="text-gray-400">Season Purse</div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-400">{setupData.events.length}</div>
                    <div className="text-gray-400">Events</div>
                  </div>
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
              disabled={loading}
              className={`${primaryButton} space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Publish Series Profile</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};