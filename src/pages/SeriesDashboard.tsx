import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Plus, 
  Settings, 
  Eye,
  MessageCircle,
  Star,
  TrendingUp,
  Flag,
  Upload,
  Edit3,
  Clock,
  BarChart3,
  DollarSign,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { 
  getSeriesProfile, 
  updateSeriesProfile, 
  updateProfile,
  supabase,
  type SeriesProfile 
} from '../lib/supabase';
import { SupabaseImageUpload } from '../components/SupabaseImageUpload';

export const SeriesDashboard: React.FC = () => {
  const { user, setUser } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seriesProfile, setSeriesProfile] = useState<SeriesProfile | null>(null);
  const [profileData, setProfileData] = useState({
    seriesName: '',
    description: '',
    seriesType: 'Sprint Car',
    headquarters: '',
    founded: new Date().getFullYear(),
    website: '',
    contactPerson: '',
    contactPhone: '',
    seriesLogo: '',
    bannerPhoto: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    totalPurse: 0,
    championshipPurse: 0
  });

  useEffect(() => {
    if (user) {
      loadSeriesProfile();
    }
  }, [user]);

  const loadSeriesProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getSeriesProfile(user.id);
      setSeriesProfile(profile);
      setProfileData({
        seriesName: profile?.series_name || '',
        description: profile?.description || '',
        seriesType: profile?.series_type || 'Sprint Car',
        headquarters: profile?.headquarters || '',
        founded: profile?.founded || new Date().getFullYear(),
        website: profile?.website || '',
        contactPerson: profile?.contact_person || '',
        contactPhone: profile?.contact_phone || '',
        seriesLogo: profile?.series_logo_url || '',
        bannerPhoto: profile?.banner_photo_url || '',
        socialLinks: profile?.social_links || {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        },
        totalPurse: (profile?.total_purse_cents || 0) / 100,
        championshipPurse: (profile?.championship_purse_cents || 0) / 100
      });
    } catch (error) {
      console.error('Error loading series profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update main profile
      await updateProfile(user.id, {
        avatar: profileData.seriesLogo,
        banner_image: profileData.bannerPhoto
      });

      // Update series profile
      await updateSeriesProfile(user.id, {
        series_name: profileData.seriesName,
        description: profileData.description,
        series_type: profileData.seriesType,
        headquarters: profileData.headquarters,
        founded: profileData.founded,
        website: profileData.website,
        contact_person: profileData.contactPerson,
        contact_phone: profileData.contactPhone,
        series_logo_url: profileData.seriesLogo,
        banner_photo_url: profileData.bannerPhoto,
        social_links: profileData.socialLinks,
        total_purse_cents: profileData.totalPurse * 100,
        championship_purse_cents: profileData.championshipPurse * 100,
        profile_published: true
      });

      setEditMode(false);
      await loadSeriesProfile();
      alert('Series profile updated successfully!');
    } catch (error) {
      console.error('Error updating series profile:', error);
      alert('Failed to update series profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const seriesStats = {
    followers: 0, // Will be calculated from database
    featuredRacers: seriesProfile?.featured_racers?.length || 0,
    upcomingEvents: 0, // Will be calculated from race_schedules
    totalEvents: seriesProfile?.total_events || 0,
    totalPurse: seriesProfile?.total_purse_cents || 0,
    championshipPurse: seriesProfile?.championship_purse_cents || 0
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Series Dashboard</h1>
            <p className="text-gray-400">Manage your racing series and connect with the community</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to={`/series/${user?.id}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </Link>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors">
              <Plus className="inline h-4 w-4 mr-2" />
              New Event
            </button>
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-green-400 text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{seriesStats.followers.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Series Followers</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              {seriesStats.featuredRacers > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Active
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{seriesStats.featuredRacers}</div>
            <div className="text-gray-400 text-sm">Featured Racers</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              {seriesStats.upcomingEvents > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Scheduled
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{seriesStats.upcomingEvents}</div>
            <div className="text-gray-400 text-sm">Upcoming Events</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
              {seriesStats.totalPurse > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Season
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">${((seriesStats.totalPurse || 0) / 100 / 1000000).toFixed(1)}M</div>
            <div className="text-gray-400 text-sm">Total Purse</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
          {['overview', 'profile', 'events', 'racers', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Create New Event */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="Championship Series Round 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Track Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="Eldora Speedway"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="Rossburg, OH"
                      />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                    Add Event
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'racers' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Manage Featured Racers</h3>
                  <p className="text-gray-400 mb-4">Select racers to feature in your series.</p>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Racer management coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Series Analytics</h3>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Analytics dashboard coming soon</p>
                  </div>
                </div>

                {/* Series Overview */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Series Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Series Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Series Name:</span>
                          <span className="text-white">{profileData.seriesName || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white">{profileData.seriesType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Headquarters:</span>
                          <span className="text-white">{profileData.headquarters || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Founded:</span>
                          <span className="text-white">{profileData.founded}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-3">Financial Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Season Purse:</span>
                          <span className="text-green-400 font-semibold">${profileData.totalPurse.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Championship Purse:</span>
                          <span className="text-yellow-400 font-semibold">${profileData.championshipPurse.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Events:</span>
                          <span className="text-white">{seriesStats.totalEvents}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Series Profile Editor */}
                {editMode ? (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Edit Series Profile</h3>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Series Photos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Series Logo</label>
                          <SupabaseImageUpload
                            type="avatar"
                            currentImage={profileData.seriesLogo}
                            userId={user?.id || ''}
                            onImageChange={(url) => handleInputChange('seriesLogo', url)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Banner Photo</label>
                          <SupabaseImageUpload
                            type="banner"
                            currentImage={profileData.bannerPhoto}
                            userId={user?.id || ''}
                            onImageChange={(url) => handleInputChange('bannerPhoto', url)}
                          />
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Series Name</label>
                          <input
                            type="text"
                            value={profileData.seriesName}
                            onChange={(e) => handleInputChange('seriesName', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="World of Outlaws Sprint Car Series"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Series Type</label>
                          <select
                            value={profileData.seriesType}
                            onChange={(e) => handleInputChange('seriesType', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="Sprint Car">Sprint Car</option>
                            <option value="Late Model">Late Model</option>
                            <option value="Modified">Modified</option>
                            <option value="Midget">Midget</option>
                            <option value="Stock Car">Stock Car</option>
                            <option value="Drag Racing">Drag Racing</option>
                            <option value="Road Course">Road Course</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Headquarters</label>
                          <input
                            type="text"
                            value={profileData.headquarters}
                            onChange={(e) => handleInputChange('headquarters', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="Concord, NC"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Founded Year</label>
                          <input
                            type="number"
                            value={profileData.founded}
                            onChange={(e) => handleInputChange('founded', parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Series Description</label>
                        <textarea
                          value={profileData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                          rows={4}
                          placeholder="Describe your racing series, its history, and what makes it special..."
                        />
                      </div>

                      {/* Contact & Website */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person</label>
                          <input
                            type="text"
                            value={profileData.contactPerson}
                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="John Smith"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
                          <input
                            type="tel"
                            value={profileData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="https://worldofoutlaws.com"
                          />
                        </div>
                      </div>

                      {/* Purse Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Total Season Purse</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              value={profileData.totalPurse}
                              onChange={(e) => handleInputChange('totalPurse', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="2500000"
                              step="1000"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Championship Purse</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              value={profileData.championshipPurse}
                              onChange={(e) => handleInputChange('championshipPurse', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="200000"
                              step="1000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Social Media */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Social Media Links</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Facebook</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.facebook}
                              onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="https://facebook.com/yourseries"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.instagram}
                              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="https://instagram.com/yourseries"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.twitter}
                              onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="https://twitter.com/yourseries"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">YouTube</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.youtube}
                              onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="https://youtube.com/yourseries"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>Save Series Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Series Profile</h3>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                      >
                        <Edit3 className="inline h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Profile Display */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={profileData.seriesLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.seriesName || 'Series'}`}
                          alt="Series Logo"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="text-xl font-bold">{profileData.seriesName || 'Series Name'}</h4>
                          <p className="text-gray-400">{profileData.seriesType} Series • {profileData.headquarters}</p>
                          {profileData.website && (
                            <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-300">{profileData.description || 'No description added yet.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Series Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Series Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Series Type</span>
                  <span>{profileData.seriesType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Headquarters</span>
                  <span>{profileData.headquarters || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Founded</span>
                  <span>{profileData.founded}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="font-semibold">{seriesStats.followers}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-left"
                >
                  <Edit3 className="inline h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <Plus className="inline h-4 w-4 mr-2" />
                  Add Event
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <Users className="inline h-4 w-4 mr-2" />
                  Manage Racers
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <MessageCircle className="inline h-4 w-4 mr-2" />
                  Send Update
                </button>
              </div>
            </div>

            {/* Promotion */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">💡 Series Tip</h3>
              <p className="text-sm text-purple-100 mb-3">
                Regular updates and racer features can increase series following by up to 80%!
              </p>
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors">
                <Plus className="inline h-4 w-4 mr-2" />
                Feature Racer Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};