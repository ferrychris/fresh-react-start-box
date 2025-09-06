import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaEnvelope, 
  FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaEdit, 
  FaCamera, FaUpload, FaTimes, FaBolt, FaChevronDown, 
  FaChevronUp, FaEye, FaCog, FaPlus, FaSave, FaDollarSign, 
  FaUsers, FaHeart, FaCrown, FaImage, FaTrophy 
} from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../integrations/supabase/client';
import { 
  getRacerProfile, 
  updateProfile, 
  updateRacerProfile, 
  getRacerEarnings, 
  getRacerFanStats, 
  getRacerPosts 
} from '../../lib/supabase/profiles';
import type { RacerEarnings, FanStats } from '../../lib/supabase/types';
import { PostCreator } from '../PostCreator';
import { PostCard, type Post } from '../PostCard';
import { SupabaseImageUpload } from '../SupabaseImageUpload';
import { ConnectAccountSetup } from '../ConnectAccountSetup';
import { MonetizationDashboard } from '../MonetizationDashboard';
import { raceClasses } from '../../data/raceClasses';

export const Dashboard: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [fanStats, setFanStats] = useState<FanStats>({ 
    fan_id: '', 
    total_tips: 0, 
    active_subscriptions: 0, 
    support_points: 0, 
    activity_streak: 0, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(), 
    total_fans: 0, 
    super_fans: 0 
  });
  const [earnings, setEarnings] = useState<RacerEarnings | null>(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [profileViews, setProfileViews] = useState(0);
  const [avgEngagement, setAvgEngagement] = useState(0);
  const [racerSocialLinks, setRacerSocialLinks] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [showQuickStats, setShowQuickStats] = useState(false);
  
  interface SocialLinks {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  }

  // Function to parse achievements from string to array of Award objects
  const parseAchievements = useCallback((achievementsStr: string | null | undefined): Award[] => {
    if (!achievementsStr) return [];
    
    try {
      // Try to parse as JSON first in case it's already stored as JSON
      const parsed = JSON.parse(achievementsStr);
      if (Array.isArray(parsed)) {
        return parsed.map(award => ({
          id: award.id || crypto.randomUUID(),
          title: award.title || '',
          year: award.year || '',
          description: award.description || ''
        }));
      }
    } catch {
      // Not valid JSON, treat as legacy string format
    }
    
    // If it's a legacy string format, convert to array with one item
    if (achievementsStr.trim()) {
      return [{
        id: crypto.randomUUID(),
        title: 'Legacy Award',
        year: '',
        description: achievementsStr
      }];
    }
    
    return [];
  }, []);

  // Function to stringify achievements array for database storage
  const stringifyAchievements = useCallback((achievements: Award[]): string => {
    return JSON.stringify(achievements);
  }, []);

  const uploadImage = async (file: File, bucket: string, folderPath: string): Promise<{ url: string | null, error: Error | null }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { url: data.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  };

  // Record a profile view in Supabase by incrementing view_count
  // Table schema expected: profile_views(profile_id uuid primary key, view_count int)
  const recordProfileView = async (profileId: string) => {
    try {
      // Ensure Supabase is configured
      if (!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)) return;

      // Try to fetch existing row
      const { data, error: selErr } = await supabase
        .from('profile_views')
        .select('view_count')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (selErr) {
        // Handle case where table doesn't exist in schema cache
        if (selErr.code === 'PGRST002' || selErr.code === 'PGRST204' || selErr.message?.includes('relation') || selErr.message?.includes('does not exist')) {
          console.warn('⚠️ profile_views table not available; skipping view record');
          return;
        }
        throw selErr;
      }

      if (data) {
        // Update to increment existing count
        const next = (data.view_count || 0) + 1;
        const { error: updErr } = await supabase
          .from('profile_views')
          .update({ view_count: next })
          .eq('profile_id', profileId);
        if (updErr) console.warn('⚠️ Failed to update profile view count:', updErr);
      } else {
        // Insert new row with count = 1
        const { error: insErr } = await supabase
          .from('profile_views')
          .insert([{ profile_id: profileId, view_count: 1 }]);
        if (insErr) console.warn('⚠️ Failed to insert profile view row:', insErr);
      }
    } catch (e) {
      console.error('Error recording profile view:', e);
    }
  };

  // Country/State options
  const countryOptions = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Nigeria'
  ];
  const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];
  const CA_PROVINCES = [
    'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
  ];
  interface Award {
    id: string;
    title: string;
    year: string;
    description: string;
  }

  const [profileData, setProfileData] = useState<{
    name: string;
    bio: string;
    carNumber: string;
    racingClass: string;
    teamName: string;
    phone: string;
    address: string; // address_line1
    city: string;
    state: string;
    postalCode: string;
    country: string;
    profilePhoto: string;
    bannerPhoto: string;
    carPhotos: string[];
    socialLinks: SocialLinks;
    careerHistory: string;
    highlights: string;
    achievements: Award[];
  }>({
    name: '',
    bio: '',
    carNumber: '',
    racingClass: '',
    teamName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    profilePhoto: '',
    bannerPhoto: '',
    carPhotos: [],
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: ''
    },
    careerHistory: '',
    highlights: '',
    achievements: []
  });

  useEffect(() => {
    // Sync tab/editMode with URL query params
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const edit = params.get('edit');
    if (tab && ['overview', 'profile', 'posts', 'fans', 'earnings', 'analytics', 'sponsorship'].includes(tab)) {
      setActiveTab(tab);
    }
    if (edit === 'contact' && tab === 'profile') {
      setEditMode(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      const fetchRacerProfile = async () => {
        const profile = await getRacerProfile(user.id);
        if (profile) {
          setProfileData({
            name: profile.username || user.name || '',
            bio: profile.bio || '',
            carNumber: profile.car_number || '',
            racingClass: profile.racing_class || '',
            teamName: profile.team_name || '',
            phone: profile.phone || '',
            address: profile.address_line1 || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postal_code || '',
            country: profile.country || '',
            profilePhoto: profile.profile_photo_url || (user as any).avatar || '',
            bannerPhoto: profile.banner_photo_url || (user as any).banner_image || '',
            carPhotos: profile.car_photos || [],
            socialLinks: {
              instagram: profile.social_links?.instagram || profile.instagram_url || '',
              facebook: profile.social_links?.facebook || profile.facebook_url || '',
              tiktok: profile.social_links?.tiktok || profile.tiktok_url || '',
              youtube: profile.social_links?.youtube || profile.youtube_url || ''
            },
            careerHistory: profile.career_history || '',
            highlights: profile.highlights || '',
            achievements: parseAchievements(profile.achievements)
          });
        }
      };
      fetchRacerProfile();
    }
  }, [user, parseAchievements]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load earnings data
      const earningsData = await getRacerEarnings(user.id);
      setEarnings(earningsData);
      
      // Load fan statistics
      const fanStatsData = await getRacerFanStats(user.id);
      setFanStats(fanStatsData);
      
      // Load total views using profile_view_events (unique per-day viewer events)
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const { count, error } = await supabase
          .from('profile_view_events')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', user.id);

        if (error) {
          console.warn('⚠️ Failed to load total views from profile_view_events, trying legacy profile_views:', error);
          // Fallback: use legacy aggregate from profile_views table if available
          const { data: legacy, error: legacyErr } = await supabase
            .from('profile_views')
            .select('view_count')
            .eq('profile_id', user.id)
            .maybeSingle();
          if (legacyErr) {
            console.warn('⚠️ Legacy profile_views not available either, defaulting to 0:', legacyErr);
            setProfileViews(0);
          } else {
            setProfileViews(legacy?.view_count || 0);
          }
        } else {
          setProfileViews(count || 0);
        }
      } else {
        // Supabase not configured, default to 0
        setProfileViews(0);
      }
      
      // Calculate engagement rate based on fan activity
      const engagementRate = fanStatsData.total_fans > 0 
        ? Math.min(((fanStatsData.super_fans / fanStatsData.total_fans) * 100) + Math.random() * 5, 100)
        : 0;
      setAvgEngagement(Math.round(engagementRate * 10) / 10);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setEarnings(null);
      setFanStats({ total_fans: 0, super_fans: 0 });
      setProfileViews(0);
      setAvgEngagement(0);
    }
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      const racerPosts = await getRacerPosts(user.id);
      setPosts(racerPosts.map(post => ({
        ...post,
        post_type: (post.post_type || 'text') as 'text' | 'video' | 'photo' | 'gallery',
        media_urls: post.media_urls || [],
        visibility: (post.visibility || 'public') as 'public' | 'fans_only',
        comments_count: post.comments_count || 0,
        total_tips: post.total_tips || 0,
        allow_tips: post.allow_tips !== false
      })));
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadPosts();
      // Load racer profile for contact info
      (async () => {
        try {
          const profile = await getRacerProfile(user.id);
          const sl = (profile?.social_links as Record<string, string>) || {};
          setRacerSocialLinks(sl);
          setContactPhone(sl.phone || '');
          setContactAddress(sl.address || '');
        } catch {
          // non-fatal
          console.warn('Unable to load racer profile for contact info');
        }
      })();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, loadDashboardData, loadPosts]);

  // Removed profile view recording here to avoid counting dashboard visits as profile views.

  const handleInputChange = (field: string, value: string | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update main profile
      await updateProfile(user.id, {
        avatar: profileData.profilePhoto,
        banner_image: profileData.bannerPhoto
      });

      // Update racer profile
      await updateRacerProfile(user.id, {
        username: profileData.name.replace(/\s+/g, '').toLowerCase(),
        bio: profileData.bio,
        car_number: profileData.carNumber,
        racing_class: profileData.racingClass,
        phone: profileData.phone,
        address_line1: profileData.address,
        city: profileData.city,
        state: profileData.state,
        postal_code: profileData.postalCode,
        country: profileData.country,
        team_name: profileData.teamName,
        profile_photo_url: profileData.profilePhoto,
        banner_photo_url: profileData.bannerPhoto,
        car_photos: profileData.carPhotos,
        social_links: profileData.socialLinks,
        // Save to new individual columns too
        instagram_url: profileData.socialLinks?.instagram || undefined,
        facebook_url: profileData.socialLinks?.facebook || undefined,
        tiktok_url: profileData.socialLinks?.tiktok || undefined,
        youtube_url: profileData.socialLinks?.youtube || undefined,
        // Career fields
        career_history: profileData.careerHistory,
        highlights: profileData.highlights,
        achievements: stringifyAchievements(profileData.achievements)
      });

      // Profile updated successfully

      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats with real-time updates
  const earningsAmount = earnings?.total_earnings_cents || 0;
  const fansCount = fanStats.total_fans || 0;
  const totalViews = profileViews || 0;
  const engagement = avgEngagement || 0;

  // Calculate percentage changes (mock data for demo)
  const earningsChange = earningsAmount > 0 ? 12.5 : 0;
  const fansChange = fansCount > 0 ? 8.2 : 0;
  const viewsChange = totalViews > 0 ? 15.7 : 0;
  const engagementChange = engagement > 0 ? 5.3 : 0;

  // Profile completion status: require name, car number, racing class, phone, profile photo, at least 1 car photo, bio, and >= 2 social links
  const socialLinksCount = Object.values(profileData.socialLinks || {}).filter(v => (v ?? '').toString().trim().length > 0).length;
  const isProfileComplete = Boolean(
    (profileData.name || '').trim() &&
    (profileData.carNumber || '').trim() &&
    (profileData.racingClass || '').trim() &&
    (profileData.phone || '').trim() &&
    (profileData.profilePhoto || '').toString().trim() &&
    (profileData.carPhotos?.length || 0) > 0 &&
    (profileData.bio || '').trim() &&
    socialLinksCount >= 2
  );
  const needsProfileCompletion = user?.user_metadata?.user_type === 'racer' && !isProfileComplete;

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6">
      <div className="max-w-7xl mx-auto px-4">
        {needsProfileCompletion && (
          <div className="mb-4 rounded-xl border border-yellow-700/40 bg-yellow-500/10 text-yellow-200 p-4 flex items-start justify-between">
            <div className="pr-4">
              <div className="font-semibold mb-1">Complete your profile</div>
              <p className="text-sm opacity-90">Complete your profile: name, car number, racing class, phone, profile photo, at least 1 car photo, bio, and at least 2 social links.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompleteProfileModal(true)}
                className="px-4 py-2 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white font-medium transition-colors"
              >
                Add details
              </button>
              <button
                onClick={() => setShowCompleteProfileModal(false)}
                className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm"
              >
                Remind me later
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Racer Dashboard</h1>
            <p className="text-gray-400">Manage your profile and connect with fans</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to={`/racer/${user.id}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <FaEye className="h-4 w-4" />
              <span>View Profile</span>
            </Link>
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <FaCog className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Overview - Updated to start at zero and show real-time data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <FaDollarSign className="h-6 w-6 text-green-500" />
              </div>
              {earningsChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <FiTrendingUp className="h-4 w-4 mr-1" />
                  +{earningsChange}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">${(earningsAmount / 100).toFixed(2)}</div>
            <div className="text-gray-400 text-sm">Total Earnings</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-500" />
              </div>
              {fansChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <FiTrendingUp className="h-4 w-4 mr-1" />
                  +{fansChange}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{fansCount}</div>
            <div className="text-gray-400 text-sm">Total Fans</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <FaEye className="h-6 w-6 text-purple-500" />
              </div>
              {viewsChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <FiTrendingUp className="h-4 w-4 mr-1" />
                  +{viewsChange}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{totalViews.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Views</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <FaHeart className="h-6 w-6 text-orange-500" />
              </div>
              {engagementChange > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <FiTrendingUp className="h-4 w-4 mr-1" />
                  +{engagementChange}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{engagement}%</div>
            <div className="text-gray-400 text-sm">Avg Engagement</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 bg-gray-900 p-1 rounded-lg overflow-x-auto">
          {['overview', 'profile', 'posts', 'fans', 'earnings', 'analytics', 'sponsorship'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 py-2 px-3 rounded-md font-medium transition-all text-sm capitalize ${
                activeTab === tab
                  ? 'bg-fedex-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab === 'sponsorship' ? 'Sponsorship' : tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="p-4 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors text-left"
                    >
                      <FaPlus className="h-6 w-6 mb-2" />
                      <div>Create Post</div>
                      <div className="text-sm opacity-80">Share with fans</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-left"
                    >
                      <FaEdit className="h-6 w-6 mb-2" />
                      <div>Edit Profile</div>
                      <div className="text-sm opacity-80">Update your info</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('earnings')}
                      className="p-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-left"
                    >
                      <FaDollarSign className="h-6 w-6 mb-2" />
                      <div>View Earnings</div>
                      <div className="text-sm opacity-80">Track your income</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                  <div className="space-y-2">
                    {fanStats.total_fans > 0 ? (
                      <>
                        <div className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                          <div className="p-2 rounded-lg bg-blue-600/20">
                            <FaUsers className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">You have {fanStats.total_fans} fan{fanStats.total_fans !== 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-400">Keep posting to grow your fanbase!</p>
                          </div>
                        </div>
                        {fanStats.super_fans > 0 && (
                          <div className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                            <div className="p-2 rounded-lg bg-purple-600/20">
                              <FaCrown className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{fanStats.super_fans} super fan{fanStats.super_fans !== 1 ? 's' : ''}</p>
                              <p className="text-sm text-gray-400">Your most dedicated supporters</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <FaUsers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-semibold mb-2">No fans yet</p>
                        <p className="text-sm">Start posting content to attract your first fans!</p>
                      </div>
                    )}
                    
                    {earningsAmount > 0 && (
                      <div className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                        <div className="p-2 rounded-lg bg-green-600/20">
                          <FaDollarSign className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Total earnings: ${(earningsAmount / 100).toFixed(2)}</p>
                          <p className="text-sm text-gray-400">Keep engaging with fans to increase earnings</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Fan Growth</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">This Month</span>
                          <span className="text-green-400">+{Math.max(0, Math.floor(fansCount * 0.3))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">This Week</span>
                          <span className="text-green-400">+{Math.max(0, Math.floor(fansCount * 0.1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Conversion Rate</span>
                          <span className="text-white">{fansCount > 0 ? Math.round((fanStats.super_fans / fansCount) * 100) : 0}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-3">Content Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Avg Likes per Post</span>
                          <span className="text-white">{Math.max(0, Math.floor(fansCount * 0.6))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Avg Comments</span>
                          <span className="text-white">{Math.max(0, Math.floor(fansCount * 0.1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Share Rate</span>
                          <span className="text-white">{engagement > 0 ? Math.round(engagement * 0.5) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* Profile Editor */}
                {editMode ? (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Edit Profile</h3>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Car Photos */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-full max-w-md">
                          <div className="relative">
                            {/* Car Photo Section */}
                            <div className="rounded-2xl px-4 py-3 cursor-pointer transition-all mx-auto w-full max-w-[300px] hover:bg-fedex-orange/5">
                              <div className="flex flex-col items-center justify-center text-center w-full">
                                <p className="text-sm text-gray-300 mb-2 font-medium">Showcase your car or team</p>
                                
                                {/* Car Photos Preview - Inside the showcase box */}
                                {profileData.carPhotos.length > 0 ? (
                                  <div className="w-full mb-2">
                                    <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-1">
                                      {profileData.carPhotos.map((photo, index) => (
                                        <div key={index} className="relative group cursor-pointer">
                                          <img 
                                            src={photo} 
                                            alt={`Car photo ${index + 1}`} 
                                            className="w-full h-24 object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <button 
                                              className="bg-fedex-orange text-white px-2 py-1 rounded text-xs mr-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const fileInput = document.createElement('input');
                                                fileInput.type = 'file';
                                                fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                                                fileInput.onchange = async (e) => {
                                                  const file = (e.target as HTMLInputElement).files?.[0];
                                                  if (!file) return;
                                                  
                                                  // Validate file type
                                                  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                                  if (!validTypes.includes(file.type)) {
                                                    alert('Invalid file type. Please upload a JPG, PNG, or WebP image.');
                                                    return;
                                                  }
                                                  
                                                  // Validate file size (5MB max)
                                                  if (file.size > 5 * 1024 * 1024) {
                                                    alert('File is too large. Maximum size is 5MB.');
                                                    return;
                                                  }
                                                  
                                                  try {
                                                    setUploading(true);
                                                    const { url, error } = await uploadImage(file, 'car-photos', `${user.id}`);
                                                    
                                                    if (error) {
                                                      console.error('Error uploading image:', error);
                                                      alert('Error uploading image. Please try again.');
                                                      return;
                                                    }
                                                    
                                                    if (url) {
                                                      // Replace the photo at this index
                                                      const updatedPhotos = [...profileData.carPhotos];
                                                      updatedPhotos[index] = url;
                                                      setProfileData(prev => ({ ...prev, carPhotos: updatedPhotos }));
                                                      
                                                      // Update in database
                                                      await updateRacerProfile(user.id, { car_photos: updatedPhotos });
                                                    }
                                                  } catch (error) {
                                                    console.error('Error in upload process:', error);
                                                    alert('An error occurred during upload. Please try again.');
                                                  } finally {
                                                    setUploading(false);
                                                  }
                                                };
                                                fileInput.click();
                                              }}
                                            >
                                              Change
                                            </button>
                                            <button 
                                              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedPhotos = profileData.carPhotos.filter((_, i) => i !== index);
                                                setProfileData(prev => ({ ...prev, carPhotos: updatedPhotos }));
                                                updateRacerProfile(user.id, { car_photos: updatedPhotos });
                                              }}
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="flex flex-col items-center justify-center w-full h-32 mb-2 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:border-fedex-orange transition-colors mx-auto"
                                    onClick={() => {
                                      const fileInput = document.createElement('input');
                                      fileInput.type = 'file';
                                      fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                                      fileInput.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (!file) return;
                                        
                                        // Validate file type
                                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                        if (!validTypes.includes(file.type)) {
                                          alert('Invalid file type. Please upload a JPG, PNG, or WebP image.');
                                          return;
                                        }
                                        
                                        // Validate file size (5MB max)
                                        if (file.size > 5 * 1024 * 1024) {
                                          alert('File is too large. Maximum size is 5MB.');
                                          return;
                                        }
                                        
                                        try {
                                          setUploading(true);
                                          const { url, error } = await uploadImage(file, 'car-photos', `${user.id}`);
                                          
                                          if (error) {
                                            console.error('Error uploading image:', error);
                                            alert('Error uploading image. Please try again.');
                                            return;
                                          }
                                          
                                          if (url) {
                                            const updatedPhotos = [...profileData.carPhotos, url];
                                            setProfileData(prev => ({ ...prev, carPhotos: updatedPhotos }));
                                            
                                            // Update in database
                                            await updateRacerProfile(user.id, { car_photos: updatedPhotos });
                                          }
                                        } catch (error) {
                                          console.error('Error in upload process:', error);
                                          alert('An error occurred during upload. Please try again.');
                                        } finally {
                                          setUploading(false);
                                        }
                                      };
                                      fileInput.click();
                                    }}
                                  >
                                    <FaPlus className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-400">Click to add a car photo</p>
                                  </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-2">JPG, PNG, WebP • Max 5MB</p>
                              </div>
                            </div>
                            
                            {/* Profile Image positioned at bottom left */}
                            <div className="absolute bottom-0 left-0 transform translate-y-1/4">
                              <div className="rounded-full px-1 py-1 cursor-pointer transition-all max-w-[80px] hover:bg-fedex-orange/5">
                                <div className="flex flex-col items-center justify-center text-center py-1 w-full">
                                  <div className="rounded-full overflow-hidden">
                  <SupabaseImageUpload
                                      type="avatar"
                                      currentImage={profileData.profilePhoto}
                                      userId={user.id}
                                      onImageChange={(url) => setProfileData(prev => ({ ...prev, profilePhoto: url }))}
                                      compact={true}
                                      hidePreview={true}
                                      maxSize={80}
                                      className="max-w-[80px] max-h-[80px]"
                                    />
                                  </div>
                                  <p className="text-[10px] text-gray-300 mt-1">Update profile</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Car Number</label>
                          <input
                            type="text"
                            value={profileData.carNumber}
                            onChange={(e) => handleInputChange('carNumber', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Racing Class</label>
                          <select
                            value={profileData.racingClass}
                            onChange={(e) => handleInputChange('racingClass', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          >
                            <option value="">Select Class</option>
                            {raceClasses.map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            placeholder="e.g. +1 555-123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                          <input
                            type="text"
                            value={profileData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                          <input
                            type="text"
                            value={profileData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
                          {profileData.country === 'United States' ? (
                            <select
                              value={profileData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            >
                              <option value="">Select State</option>
                              {US_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : profileData.country === 'Canada' ? (
                            <select
                              value={profileData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            >
                              <option value="">Select Province</option>
                              {CA_PROVINCES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={profileData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              placeholder="State or Province"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">ZIP/Postal Code</label>
                          <input
                            type="text"
                            value={profileData.postalCode}
                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                            placeholder="ZIP or Postal Code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                          <select
                            value={profileData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          >
                            <option value="">Select Country</option>
                            {countryOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                          <input
                            type="text"
                            value={profileData.teamName}
                            onChange={(e) => handleInputChange('teamName', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => {
                            const words = e.target.value.trim().split(/\s+/);
                            if (words.length <= 500 || e.target.value.length < profileData.bio.length) {
                              handleInputChange('bio', e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                          rows={4}
                          placeholder="Tell fans about your racing journey... (max 500 words)"
                          maxLength={5000}
                        />
                        <div className="text-xs text-gray-400 mt-1 text-right">
                          {profileData.bio.trim().split(/\s+/).filter(Boolean).length} / 500 words
                        </div>
                      </div>

                      {/* Social Media */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Social Media Links</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Instagram</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.instagram}
                              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              placeholder="https://instagram.com/yourhandle"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Facebook</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.facebook}
                              onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              placeholder="https://facebook.com/yourpage"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">TikTok</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.tiktok}
                              onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              placeholder="https://tiktok.com/@yourhandle"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">YouTube</label>
                            <input
                              type="url"
                              value={profileData.socialLinks.youtube}
                              onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              placeholder="https://youtube.com/yourchannel"
                            />
                          </div>
                        </div>
                      </div>

                      {/* My Career Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">My Career</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Career History</label>
                            <textarea
                              value={profileData.careerHistory}
                              onChange={(e) => handleInputChange('careerHistory', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              rows={4}
                              placeholder="Tell your racing story - how you got started, key milestones, memorable races..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Share your racing journey from the beginning</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Career Highlights</label>
                            <textarea
                              value={profileData.highlights}
                              onChange={(e) => handleInputChange('highlights', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                              rows={3}
                              placeholder="Your most memorable racing moments, best finishes, special victories..."
                            />
                            <p className="text-xs text-gray-400 mt-1">What are you most proud of in your racing career?</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Achievements & Awards</label>
                            <div className="space-y-3">
                              {(profileData.achievements || []).map((award, index) => (
                                <div key={award.id} className="bg-gray-800 rounded-lg p-3 relative">
                                  <button 
                                    onClick={() => {
                                      const updatedAwards = [...profileData.achievements];
                                      updatedAwards.splice(index, 1);
                                      setProfileData(prev => ({ ...prev, achievements: updatedAwards }));
                                    }}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                    aria-label="Remove award"
                                  >
                                    <FaTimes className="h-4 w-4" />
                                  </button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1">Award Title</label>
                                      <input
                                        type="text"
                                        value={award.title}
                                        onChange={(e) => {
                                          const updatedAwards = [...profileData.achievements];
                                          updatedAwards[index] = { ...award, title: e.target.value };
                                          setProfileData(prev => ({ ...prev, achievements: updatedAwards }));
                                        }}
                                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                                        placeholder="Championship, Rookie of the Year, etc."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
                                      <input
                                        type="text"
                                        value={award.year}
                                        onChange={(e) => {
                                          const updatedAwards = [...profileData.achievements];
                                          updatedAwards[index] = { ...award, year: e.target.value };
                                          setProfileData(prev => ({ ...prev, achievements: updatedAwards }));
                                        }}
                                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                                        placeholder="2023"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                      value={award.description}
                                      onChange={(e) => {
                                        const updatedAwards = [...profileData.achievements];
                                        updatedAwards[index] = { ...award, description: e.target.value };
                                        setProfileData(prev => ({ ...prev, achievements: updatedAwards }));
                                      }}
                                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                                      rows={2}
                                      placeholder="Details about this achievement..."
                                    />
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                onClick={() => {
                                  const newAward: Award = {
                                    id: crypto.randomUUID(),
                                    title: '',
                                    year: '',
                                    description: ''
                                  };
                                  setProfileData(prev => ({
                                    ...prev,
                                    achievements: [...(prev.achievements || []), newAward]
                                  }));
                                }}
                                className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-lg text-gray-300 flex items-center justify-center gap-2 transition-colors"
                              >
                                <FaPlus className="h-3 w-3" />
                                <span className="text-sm">Add Achievement</span>
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Add your awards, trophies, or special recognitions</p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FaSave className="h-4 w-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Profile Information</h3>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                      >
                        <FaEdit className="inline h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={profileData.profilePhoto || user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                          className="w-14 h-14 object-cover"
                          style={{ borderRadius: '50%' }}
                        />
                        <div>
                          <h4 className="text-xl font-bold">{profileData.name || user.name}</h4>
                          <p className="text-gray-400">#{(profileData.carNumber || '').trim() || 'TBD'} • {(profileData.racingClass || '').trim() || 'Racing'}</p>
                          <p className="text-gray-400">{
                            ([profileData.city, profileData.state, profileData.country].filter(Boolean) as string[]).join(', ') || 'Location not set'
                          }</p>
                        </div>
                      </div>
                      <p className="text-gray-300">{(profileData.bio || '').trim() || 'No bio added yet.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-6">
                <PostCreator racerId={user.id} onPostCreated={loadPosts} />
                
                {postsLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gray-800 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-800 rounded w-1/4" />
                          </div>
                        </div>
                        <div className="h-4 bg-gray-800 rounded w-3/4 mb-4" />
                        <div className="h-64 bg-gray-800 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onPostUpdate={loadPosts}
                      onPostDeleted={loadPosts}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 bg-gray-900 rounded-xl">
                    <FaImage className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-400 mb-6">Share your first racing moment with your fans!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <ConnectAccountSetup racerId={user.id} />
                
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Earnings Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Total Earnings</div>
                      <div className="text-2xl font-bold text-green-400">
                        ${(earningsAmount / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">This Month</div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${Math.max(0, (earningsAmount * 0.3 / 100)).toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Pending Payout</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        ${((earnings?.pending_payout_cents || 0) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <MonetizationDashboard racerId={user.id} />
            )}

            {activeTab === 'sponsorship' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Sponsorship Opportunities</h3>
                    <Link
                      to={`/racer/${user.id}/sponsorship`}
                      className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                    >
                      <Target className="inline h-4 w-4 mr-2" />
                      Manage Spots
                    </Link>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Set up sponsorship spots on your car to attract sponsors and increase earnings.
                  </p>
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Click "Manage Spots" to set up your sponsorship opportunities</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
              
              <div className="mt-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Profile Complete</span>
                  <span className="text-fedex-orange font-semibold">
                    {Math.round(([
                      (profileData.name || '').trim(),
                      (profileData.carNumber || '').trim(),
                      (profileData.racingClass || '').trim(),
                      (profileData.phone || '').trim(),
                      (profileData.profilePhoto || '').toString().trim(),
                      (profileData.carPhotos?.length || 0) > 0,
                      (profileData.bio || '').trim(),
                      socialLinksCount >= 2
                    ].filter(Boolean).length / 8) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-fedex-orange h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${([
                        (profileData.name || '').trim(),
                        (profileData.carNumber || '').trim(),
                        (profileData.racingClass || '').trim(),
                        (profileData.phone || '').trim(),
                        (profileData.profilePhoto || '').toString().trim(),
                        (profileData.carPhotos?.length || 0) > 0,
                        (profileData.bio || '').trim(),
                        socialLinksCount >= 2
                      ].filter(Boolean).length / 8) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowQuickStats(!showQuickStats)}>
                <h3 className="text-lg font-semibold">Quick Stats</h3>
                {showQuickStats ? (
                  <FaChevronUp className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                ) : (
                  <FaChevronDown className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                )}
              </div>
              {showQuickStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fans</span>
                    <span className="font-semibold">{fansCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Super Fans</span>
                    <span className="font-semibold text-purple-400">{fanStats.super_fans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Earnings</span>
                    <span className="font-semibold text-green-400">${(earningsAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Growth Tips */}
            <div className="bg-gradient-to-br from-fedex-orange to-red-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">💡 Growth Tip</h3>
              <p className="text-sm text-orange-100 mb-3">
                {fansCount === 0 
                  ? "Post your first content to start attracting fans!"
                  : fansCount < 10
                  ? "Share your profile on social media to reach more fans!"
                  : fanStats.super_fans === 0
                  ? "Engage with your fans to convert them to super fans!"
                  : "Keep posting regularly to maintain fan engagement!"
                }
              </p>
              <button
                onClick={() => setActiveTab(fansCount === 0 ? 'posts' : 'profile')}
                className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
              >
                <FaBolt className="inline h-4 w-4 mr-2" />
                {fansCount === 0 ? 'Create First Post' : 'Optimize Profile'}
              </button>
            </div>

            {/* Achievements & Awards Card */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🏆 Achievements & Awards</h3>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                >
                  Edit
                </button>
              </div>
              
              {profileData.achievements && profileData.achievements.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {profileData.achievements.map((award) => (
                    <div key={award.id} className="bg-gray-800 rounded-lg p-3 border-l-4 border-fedex-orange">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white">{award.title || 'Untitled Award'}</h4>
                        {award.year && <span className="text-xs font-medium bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">{award.year}</span>}
                      </div>
                      {award.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-3">{award.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-3">
                    <FaTrophy className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-sm">No achievements added yet</p>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="mt-3 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                  >
                    Add Your First Achievement
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Complete Profile Modal */}
          {showCompleteProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/70" onClick={() => !savingContact && setShowCompleteProfileModal(false)} />
              <div className="relative z-10 w-full max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Complete Your Profile</h3>
                  <button
                    onClick={() => !savingContact && setShowCompleteProfileModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-800"
                    disabled={savingContact}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Profile Completion Progress */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Profile Completion</span>
                      <span className="text-sm text-fedex-orange font-semibold">{Math.round((socialLinksCount >= 2 ? 8 : 7) / 8 * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div 
                        className="bg-fedex-orange h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round((socialLinksCount >= 2 ? 8 : 7) / 8 * 100)}%` }}
                      ></div>
                    </div>
                    
                    {/* Completion Checklist */}
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 ${(profileData.name || '').trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.name || '').trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.name || '').trim() && <span className="text-xs">✓</span>}
                        </div>
                        Name
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.carNumber || '').trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.carNumber || '').trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.carNumber || '').trim() && <span className="text-xs">✓</span>}
                        </div>
                        Car Number
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.racingClass || '').trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.racingClass || '').trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.racingClass || '').trim() && <span className="text-xs">✓</span>}
                        </div>
                        Racing Class
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.phone || '').trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.phone || '').trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.phone || '').trim() && <span className="text-xs">✓</span>}
                        </div>
                        Phone Number
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.profilePhoto || '').toString().trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.profilePhoto || '').toString().trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.profilePhoto || '').toString().trim() && <span className="text-xs">✓</span>}
                        </div>
                        Profile Photo
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.carPhotos?.length || 0) > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.carPhotos?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.carPhotos?.length || 0) > 0 && <span className="text-xs">✓</span>}
                        </div>
                        Car Photo (at least 1)
                      </div>
                      <div className={`flex items-center gap-2 ${(profileData.bio || '').trim() ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(profileData.bio || '').trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {(profileData.bio || '').trim() && <span className="text-xs">✓</span>}
                        </div>
                        Bio
                      </div>
                      <div className={`flex items-center gap-2 ${socialLinksCount >= 2 ? 'text-green-400' : 'text-gray-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${socialLinksCount >= 2 ? 'bg-green-500' : 'bg-gray-600'}`}>
                          {socialLinksCount >= 2 && <span className="text-xs">✓</span>}
                        </div>
                        Social Links (at least 2) - {socialLinksCount}/2
                      </div>
                    </div>
                  </div>
                </div>
                {/* Contact Info Fields */}
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                      placeholder="e.g. +1 555-123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-xs"
                      placeholder="Street address"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCompleteProfileModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
                    disabled={savingContact}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveContactInfo}
                    disabled={savingContact}
                    className="px-4 py-2 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold flex items-center gap-2"
                  >
                    {savingContact ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Contact Info</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteProfileModal(false);
                      // Scroll to edit profile section
                      const editSection = document.querySelector('[data-edit-profile]');
                      if (editSection) {
                        editSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                    disabled={savingContact}
                  >
                    Edit Full Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};