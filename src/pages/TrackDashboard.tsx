import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Trophy, 
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
  Megaphone,
  Trash2,
  Save,
  X,
  CheckCircle,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SupabaseImageUpload } from '../components/SupabaseImageUpload';
import { TrackingDashboard } from '../components/TrackingDashboard';
import { raceClasses } from '../data/raceClasses';
import { ImageUpload } from '../components/ImageUpload';
import { PostCreator } from '../components/PostCreator';
import { useApp } from '../App';
import { 
  updateTrackProfile, 
  type TrackProfile,
  uploadImage,
  saveImageToAvatarsTable,
  addRaceSchedule,
  createTrackPost,
  getTrackFollowerCount,
  getRacerPosts,
  supabase,
  deleteUserProfile,
  getTrackProfile
} from '../lib/supabase';

export const TrackDashboard: React.FC = () => {
  const { user, racers } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackProfile, setTrackProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [customClassInput, setCustomClassInput] = useState('');
  const [showEventSuccess, setShowEventSuccess] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [stats, setStats] = useState({
    followers: 0,
    featuredRacers: 0,
    upcomingEvents: 0,
    totalEvents: 0
  });
  const [followerCount, setFollowerCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [featuredRacerCount, setFeaturedRacerCount] = useState(0);
  const [upcomingEventCount, setUpcomingEventCount] = useState(0);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [profileData, setProfileData] = useState({
    trackName: '',
    trackType: '',
    location: '',
    contactEmail: '',
    website: '',
    classesHosted: [] as string[],
    trackLogo: '',
    bannerPhoto: '',
    description: ''
  });
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    classes: [] as string[],
    payout: '',
    entryFee: '',
    description: '',
    flyer: '',
    eventTitle: '',
    selectedClasses: [] as string[],
    customClasses: [] as string[],
    eventDescription: '',
    eventFlyer: ''
  });

  React.useEffect(() => {
    if (user) {
      loadTrackProfile();
      loadTrackEvents();
      loadTrackStats();
    }
  }, [user]);

  const loadTrackEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('race_schedules')
        .select('*')
        .eq('track_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading track events:', error);
      setEvents([]);
    }
  };

  const loadTrackStats = async () => {
    if (!user) return;
    
    try {
      // Get follower count
      const { data: followerData, error: followerError } = await supabase
        .from('track_followers')
        .select('id')
        .eq('track_id', user.id)
        .eq('is_active', true);

      if (followerError) throw followerError;

      // Get upcoming events count
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('race_schedules')
        .select('id')
        .eq('track_id', user.id)
        .gte('event_date', today);

      if (upcomingError) throw upcomingError;

      // Get total events count
      const { data: totalData, error: totalError } = await supabase
        .from('race_schedules')
        .select('id')
        .eq('track_id', user.id);

      if (totalError) throw totalError;

      setStats({
        followers: followerData?.length || 0,
        featuredRacers: trackProfile?.featured_racers?.length || 0,
        upcomingEvents: upcomingData?.length || 0,
        totalEvents: totalData?.length || 0
      });

      // Load real follower count
      const followers = await getTrackFollowerCount(user.id);
      setFollowerCount(followers);
      
      // Load upcoming events count
      const { data: upcomingEvents } = await supabase
        .from('race_schedules')
        .select('id')
        .eq('track_id', user.id)
        .gte('event_date', new Date().toISOString().split('T')[0]);
      setUpcomingEventCount(upcomingEvents?.length || 0);
      
      // Load total events count
      const { data: totalEvents } = await supabase
        .from('race_schedules')
        .select('id')
        .eq('track_id', user.id);
      setTotalEventCount(totalEvents?.length || 0);
      
      // Load featured racers count
      if (trackProfile?.featured_racers) {
        setFeaturedRacerCount(trackProfile.featured_racers.length);
      }
      
      // Load post count
      const { data: posts } = await supabase
        .from('racer_posts')
        .select('id')
        .eq('racer_id', user.id);
      setPostCount(posts?.length || 0);
      
    } catch (error) {
      console.error('Error loading track stats:', error);
      setStats({
        followers: 0,
        featuredRacers: 0,
        upcomingEvents: 0,
        totalEvents: 0
      });
    }
  };

  const loadTrackProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getTrackProfile(user.id);
      setTrackProfile(profile);
      setProfileData({
        trackName: profile?.track_name || '',
        trackType: profile?.track_type || '',
        location: profile?.location || '',
        contactEmail: profile?.contact_email || '',
        website: profile?.website || '',
        classesHosted: profile?.classes_hosted || [],
        trackLogo: profile?.track_logo_url || '',
        bannerPhoto: profile?.banner_photo_url || '',
        description: profile?.description || ''
      });
    } catch (error) {
      console.error('Error loading track profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateTrackProfile(user.id, {
        track_name: profileData.trackName,
        track_type: profileData.trackType,
        location: profileData.location,
        contact_email: profileData.contactEmail,
        website: profileData.website,
        classes_hosted: profileData.classesHosted,
        track_logo_url: profileData.trackLogo,
        banner_photo_url: profileData.bannerPhoto
      });

      setEditMode(false);
      await loadTrackProfile();
      await loadTrackStats();
      alert('Track profile updated successfully!');
    } catch (error) {
      console.error('Error updating track profile:', error);
      alert('Failed to update track profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async () => {
    if (!user || !eventForm.eventName || !eventForm.eventDate) {
      alert('Please fill in event name and date');
      return;
    }

    setLoading(true);
    try {
      await addRaceSchedule({
        racer_id: null, // Track event, not racer-specific
        track_id: user.id,
        event_name: eventForm.eventName,
        track_name: profileData.trackName || user.trackName || 'Track',
        event_date: eventForm.eventDate,
        event_time: eventForm.eventTime,
        location: profileData.location || user.location
      });

      // Reset form
      setEventForm({
        eventName: '',
        eventDate: '',
        eventTime: '',
        classes: [],
        payout: '',
        entryFee: '',
        description: '',
        flyer: '',
        eventTitle: '',
        selectedClasses: [],
        customClasses: [],
        eventDescription: '',
        eventFlyer: ''
      });

      alert('Event created successfully!');
      await loadTrackStats(); // Refresh stats after creating event
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      `Are you absolutely sure you want to delete your track profile?\n\n` +
      `This will permanently delete:\n` +
      `• Your track profile and all data\n` +
      `• All posts and content\n` +
      `• Event listings and schedules\n` +
      `• Follower connections\n` +
      `• Your account access\n\n` +
      `This action CANNOT be undone!`
    );
    
    if (!confirmDelete) return;
    
    const finalConfirm = window.confirm(
      `FINAL CONFIRMATION:\n\n` +
      `Type "DELETE" in the next prompt to confirm permanent deletion of your track profile.`
    );
    
    if (!finalConfirm) return;
    
    const deleteConfirmation = window.prompt(
      `Type "DELETE" (all caps) to permanently delete your track profile:`
    );
    
    if (deleteConfirmation !== 'DELETE') {
      alert('Profile deletion cancelled. You must type "DELETE" exactly.');
      return;
    }
    
    setLoading(true);
    try {
      await deleteUserProfile(user.id);
      alert('Your track profile has been permanently deleted.');
      window.location.href = '/';
    } catch (error) {
      console.error('Delete profile error:', error);
      alert('Failed to delete profile. Please contact support.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleEventFormChange = (field: string, value: any) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClassToggle = (className: string) => {
    setEventForm(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(className)
        ? prev.selectedClasses.filter(c => c !== className)
        : [...prev.selectedClasses, className],
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  const handleAddCustomClass = () => {
    if (customClassInput.trim() && !eventForm.customClasses.includes(customClassInput.trim())) {
      setEventForm(prev => ({
        ...prev,
        customClasses: [...prev.customClasses, customClassInput.trim()]
      }));
      setCustomClassInput('');
    }
  };

  const handleRemoveCustomClass = (className: string) => {
    setEventForm(prev => ({
      ...prev,
      customClasses: prev.customClasses.filter(c => c !== className)
    }));
  };

  const handleEventFlyerUpload = async (file: File) => {
    if (!user?.id) return;
    
    try {
      const folderPath = `event-flyers/${user.id}`;
      const { url, error } = await uploadImage(file, 'avatar', folderPath);
      
      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      setEventForm(prev => ({ ...prev, eventFlyer: url }));
      
      // Save to avatars table
      try {
        const { error: dbError } = await saveImageToAvatarsTable(
          user.id,
          url,
          'banner',
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

  const handlePublishEvent = async () => {
    if (!user || !eventForm.eventTitle || !eventForm.eventDate) {
      alert('Please fill in the event title and date');
      return;
    }

    setEventLoading(true);
    try {
      // Combine selected and custom classes
      const allClasses = [...eventForm.selectedClasses, ...eventForm.customClasses];
      
      // Create event in race_schedules
      const { data: newEvent, error: eventError } = await supabase
        .from('race_schedules')
        .insert({
          track_id: user.id,
          event_name: eventForm.eventTitle,
          track_name: trackProfile?.track_name || user.name,
          event_date: eventForm.eventDate,
          event_time: eventForm.eventTime || null,
          location: trackProfile?.location || 'Unknown',
          metadata: {
            entry_fee: eventForm.entryFee,
            payout: eventForm.payout,
            classes: allClasses,
            description: eventForm.eventDescription,
            flyer_url: eventForm.eventFlyer
          }
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create a post about the new event to share in the feed
      const eventPost = {
        racer_id: user.id,
        content: `🏁 NEW EVENT ALERT! 🏁\n\n${eventForm.eventTitle}\n📅 ${new Date(eventForm.eventDate).toLocaleDateString()}\n${eventForm.eventTime ? `⏰ ${eventForm.eventTime}\n` : ''}${eventForm.entryFee ? `💰 Entry: $${eventForm.entryFee}\n` : ''}${eventForm.payout ? `🏆 Payout: $${eventForm.payout}\n` : ''}${allClasses.length > 0 ? `🏎️ Classes: ${allClasses.join(', ')}\n` : ''}\n${eventForm.eventDescription ? `\n${eventForm.eventDescription}\n` : ''}\nSee you at the track! 🏁`,
        media_urls: eventForm.eventFlyer ? [eventForm.eventFlyer] : [],
        post_type: eventForm.eventFlyer ? 'photo' : 'text',
        visibility: 'public',
        allow_tips: false
      };

      const { error: postError } = await supabase
        .from('racer_posts')
        .insert(eventPost);

      if (postError) {
        console.warn('Failed to create event post:', postError);
        // Don't fail the whole process if post creation fails
      }

      // Reset form
      setEventForm({
        eventTitle: '',
        eventDate: '',
        eventTime: '',
        entryFee: '',
        payout: '',
        selectedClasses: [],
        customClasses: [],
        eventDescription: '',
        eventFlyer: '',
        eventName: '',
        classes: [],
        description: '',
        flyer: ''
      });
      setCustomClassInput('');

      // Reload events and stats
      await loadTrackEvents();
      await loadTrackStats();

      setShowEventSuccess(true);
      setTimeout(() => setShowEventSuccess(false), 3000);

    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event. Please try again.');
    } finally {
      setEventLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    // Save as draft (you can implement this to save incomplete events)
    alert('Draft saved! You can continue editing later.');
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventInputChange = (field: string, value: any) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter((item: string) => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const trackStats = {
    followers: followerCount,
    featuredRacers: featuredRacerCount,
    upcomingEvents: upcomingEventCount,
    totalEvents: totalEventCount,
    posts: postCount
  };

  const upcomingEvents = [
    {
      id: 1,
      title: 'Friday Night Thunder',
      date: 'Feb 15, 2025',
      time: '7:00 PM',
      classes: ['Sprint Car', 'Late Model'],
      payout: '$5,000',
      status: 'published'
    },
    {
      id: 2,
      title: 'Saturday Showdown',
      date: 'Feb 16, 2025',
      time: '6:00 PM',
      classes: ['Modified', 'Stock Car'],
      payout: '$3,500',
      status: 'draft'
    }
  ];

  const featuredRacers = racers.slice(0, 6);

  const recentActivity = [
    { type: 'follow', user: 'Racing Fan #123', action: 'started following your track', time: '2h ago' },
    { type: 'racer', user: 'Jake Rodriguez', action: 'tagged your track in a post', time: '4h ago' },
    { type: 'event', user: 'System', action: 'Friday Night Thunder event published', time: '1d ago' }
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Track Dashboard</h1>
            <p className="text-gray-400">Manage your track events and racer community</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to={`/track/${user?.id}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </Link>
            <button className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors">
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
              {stats.followers > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{stats.followers}</div>
            <div className="text-gray-400 text-sm">Track Followers</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-fedex-orange/20 rounded-lg">
                <Trophy className="h-6 w-6 text-fedex-orange" />
              </div>
              {stats.featuredRacers > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +8.2%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{stats.featuredRacers}</div>
            <div className="text-gray-400 text-sm">Featured Racers</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              {stats.upcomingEvents > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15.7%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{stats.upcomingEvents}</div>
            <div className="text-gray-400 text-sm">Upcoming Events</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Flag className="h-6 w-6 text-purple-500" />
              </div>
              {stats.totalEvents > 0 && (
                <div className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15.7%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalEvents}</div>
            <div className="text-gray-400 text-sm">Total Events</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
          {['overview', 'edit-profile', 'posts', 'events', 'followers', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-fedex-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab === 'edit-profile' ? 'Edit Profile' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('events')}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <Plus className="h-6 w-6 text-fedex-orange mb-2" />
                      <h4 className="font-semibold mb-1">Create Event</h4>
                      <p className="text-sm text-gray-400">Schedule a new race event</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <MessageCircle className="h-6 w-6 text-blue-500 mb-2" />
                      <h4 className="font-semibold mb-1">Create Post</h4>
                      <p className="text-sm text-gray-400">Share track updates with followers</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('promotion')}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <Megaphone className="h-6 w-6 text-blue-500 mb-2" />
                      <h4 className="font-semibold mb-1">Promote Track</h4>
                      <p className="text-sm text-gray-400">Market your facility to racers</p>
                    </button>
                    
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <Edit3 className="h-6 w-6 text-green-500 mb-2" />
                      <h4 className="font-semibold mb-1">Edit Profile</h4>
                      <p className="text-sm text-gray-400">Update track information</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <BarChart3 className="h-6 w-6 text-purple-500 mb-2" />
                      <h4 className="font-semibold mb-1">View Analytics</h4>
                      <p className="text-sm text-gray-400">Track performance metrics</p>
                    </button>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Upcoming Events</h3>
                    <button className="text-fedex-orange hover:text-fedex-orange-light transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{event.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {event.date}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {event.time}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            event.status === 'published' 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {event.status}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {event.classes.map(cls => (
                            <span key={cls} className="px-2 py-1 bg-fedex-purple/20 text-sm rounded">
                              {cls}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-green-400 font-semibold">
                            Payout: {event.payout}
                          </div>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                              <Edit3 className="inline h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button className="px-3 py-1 bg-fedex-orange hover:bg-fedex-orange-dark rounded text-sm transition-colors">
                              <Eye className="inline h-3 w-3 mr-1" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'follow' ? 'bg-blue-600/20' :
                          activity.type === 'racer' ? 'bg-fedex-orange/20' : 'bg-green-600/20'
                        }`}>
                          {activity.type === 'follow' && <Users className="h-4 w-4 text-blue-400" />}
                          {activity.type === 'racer' && <Trophy className="h-4 w-4 text-fedex-orange" />}
                          {activity.type === 'event' && <Calendar className="h-4 w-4 text-green-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-gray-400">{activity.action}</p>
                        </div>
                        <span className="text-sm text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Track Post Creator */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Share Track Updates</h3>
                  <PostCreator 
                    racerId={user?.id || ''} // Using racerId field for trackId
                    onPostCreated={() => {
                      // Refresh feed or show success message
                      alert('Track post published successfully! It will appear in the main feed.');
                    }}
                    isTrack={true}
                  />
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Create New Event */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Event Title</label>
                        <input
                          type="text"
                          value={eventForm.eventName}
                          onChange={(e) => handleEventInputChange('eventName', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                          placeholder="Friday Night Thunder"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Event Date</label>
                        <input
                          type="date"
                          value={eventForm.eventDate}
                          onChange={(e) => handleEventInputChange('eventDate', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Event Time</label>
                        <input
                          type="time"
                          value={eventForm.eventTime}
                          onChange={(e) => handleEventInputChange('eventTime', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Entry Fee</label>
                        <input
                          type="text"
                          value={eventForm.entryFee}
                          onChange={(e) => handleEventInputChange('entryFee', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                          placeholder="$50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Payout</label>
                        <input
                          type="text"
                          value={eventForm.payout}
                          onChange={(e) => handleEventInputChange('payout', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                          placeholder="$5,000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Classes</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {raceClasses.slice(0, 12).map(cls => (
                          <label key={cls} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={eventForm.classes.includes(cls)}
                              onChange={() => handleClassToggle(cls)}
                              className="w-4 h-4 text-fedex-orange bg-gray-800 border-gray-700 rounded focus:ring-fedex-orange"
                            />
                            <span className="text-gray-300">{cls}</span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Custom Class Input */}
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Add Custom Racing Class
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter custom racing class..."
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const customClass = input.value.trim();
                                if (customClass && !profileData.classesHosted.includes(customClass)) {
                                  handleArrayToggle('classesHosted', customClass);
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                              const customClass = input.value.trim();
                              if (customClass && !profileData.classesHosted.includes(customClass)) {
                                handleArrayToggle('classesHosted', customClass);
                                input.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg text-white font-medium transition-colors text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Press Enter or click Add to include custom racing classes not in the list above
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Description</label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => handleEventInputChange('description', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                        rows={3}
                        placeholder="Event details, rules, and additional information..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Flyer</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-fedex-orange transition-colors">
                        {eventForm.flyer ? (
                          <div className="space-y-2">
                            <img 
                              src={eventForm.flyer} 
                              alt="Event flyer" 
                              className="max-w-full h-32 object-contain mx-auto rounded"
                            />
                            <button 
                              onClick={() => handleEventInputChange('flyer', '')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
                            >
                              Remove Flyer
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-400 mb-2">Click to upload event flyer</p>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Convert to base64 for storage
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    handleEventInputChange('flyer', reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="event-flyer-upload"
                            />
                            <label 
                              htmlFor="event-flyer-upload"
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors cursor-pointer"
                            >
                              Choose File
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // Save as draft functionality
                          alert('Event saved as draft!');
                        }}
                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={handleEventSubmit}
                        disabled={loading || !eventForm.eventName || !eventForm.eventDate}
                        className="flex-1 px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                      >
                        {loading ? 'Publishing...' : 'Publish Event'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Events List */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Events</h3>
                  <div className="space-y-4">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map(event => (
                        <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{event.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {event.date}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {event.time}
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              event.status === 'published' 
                                ? 'bg-green-600/20 text-green-400' 
                                : 'bg-yellow-600/20 text-yellow-400'
                            }`}>
                              {event.status}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.classes.map((cls: string) => (
                              <span key={cls} className="px-2 py-1 bg-fedex-purple/20 text-sm rounded">
                                {cls}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-green-400 font-semibold">
                              Payout: {event.payout}
                            </div>
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                                <Edit3 className="inline h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button className="px-3 py-1 bg-fedex-orange hover:bg-fedex-orange-dark rounded text-sm transition-colors">
                                <Eye className="inline h-3 w-3 mr-1" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No events created yet. Create your first event above!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit-profile' && (
              <div className="space-y-6">
                {/* Track Profile Editor */}
                {editMode ? (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Edit Track Profile</h3>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Track Photos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="relative">
                            <SupabaseImageUpload
                              type="avatar"
                              currentImage={profileData.trackLogo}
                              userId={user?.id || ''}
                              onImageChange={(url) => handleInputChange('trackLogo', url)}
                              className="w-full"
                            />
                            <div className="mt-2 text-xs text-gray-400">
                              Recommended: Square format (400x400px) • Max 5MB
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="relative">
                            <SupabaseImageUpload
                              type="banner"
                              currentImage={profileData.bannerPhoto}
                              userId={user?.id || ''}
                              onImageChange={(url) => handleInputChange('bannerPhoto', url)}
                              className="w-full"
                            />
                            <div className="mt-2 text-xs text-gray-400">
                              Recommended: Wide format (1200x400px) • Max 5MB
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Track Name</label>
                          <input
                            type="text"
                            value={profileData.trackName}
                            onChange={(e) => handleInputChange('trackName', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                            placeholder="Your Track Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Track Type</label>
                          <select
                            value={profileData.trackType}
                            onChange={(e) => handleInputChange('trackType', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                          >
                            <option value="">Select Track Type</option>
                            <option value="Dirt Oval">Dirt Oval</option>
                            <option value="Asphalt Oval">Asphalt Oval</option>
                            <option value="Drag Strip">Drag Strip</option>
                            <option value="Road Course">Road Course</option>
                            <option value="Kart Track">Kart Track</option>
                            <option value="Figure 8">Figure 8</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                            placeholder="City, State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fedex-orange"
                            placeholder="https://yourtrack.com"
                          />
                        </div>
                      </div>

                      {/* Classes Hosted */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Classes Hosted</label>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                          {raceClasses.map(cls => (
                            <label key={cls} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={profileData.classesHosted.includes(cls)}
                                onChange={() => {
                                  const newClasses = profileData.classesHosted.includes(cls)
                                    ? profileData.classesHosted.filter(c => c !== cls)
                                    : [...profileData.classesHosted, cls];
                                  handleInputChange('classesHosted', newClasses);
                                }}
                                className="mr-2 w-4 h-4 text-fedex-orange bg-gray-700 border-gray-600 rounded focus:ring-fedex-orange"
                              />
                              <span className="text-gray-300">{cls}</span>
                            </label>
                          ))}
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
                            <span>Save Track Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Track Profile</h3>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                      >
                        <Edit3 className="inline h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Profile Display */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={profileData.trackLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.trackName || 'Track'}`}
                          alt="Track Logo"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="text-xl font-bold">{profileData.trackName || user?.trackName || 'Track Name'}</h4>
                          <p className="text-gray-400">{profileData.trackType || 'Track Type'} • {profileData.location || 'Location'}</p>
                          {profileData.website && (
                            <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-fedex-orange hover:text-fedex-orange-light text-sm">
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {profileData.classesHosted.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Classes Hosted</h5>
                          <div className="flex flex-wrap gap-2">
                            {profileData.classesHosted.map(cls => (
                              <span key={cls} className="px-2 py-1 bg-fedex-purple/20 text-sm rounded">
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tracking' && (
              <TrackingDashboard trackId={user?.id || ''} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors text-left">
                  <Plus className="inline h-4 w-4 mr-2" />
                  Create Event
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <Upload className="inline h-4 w-4 mr-2" />
                  Upload Results
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <Trophy className="inline h-4 w-4 mr-2" />
                  Feature Racer
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left">
                  <MessageCircle className="inline h-4 w-4 mr-2" />
                  Send Update
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-left"
                >
                  <Trash2 className="inline h-4 w-4 mr-2" />
                  Delete Profile
                </button>
              </div>
            </div>

            {/* Track Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Track Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Track Type</span>
                  <span>Dirt Oval</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Location</span>
                  <span>{user?.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span className="font-semibold">{trackStats.followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Events This Year</span>
                  <span>{trackStats.totalEvents}</span>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                <Edit3 className="inline h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>

            {/* Recent Followers */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Followers</h3>
              <div className="space-y-3">
                {[
                  { name: 'Racing Fan #4567', time: '2h ago' },
                  { name: 'Speed Enthusiast', time: '4h ago' },
                  { name: 'Track Master', time: '6h ago' },
                  { name: 'Jake Rodriguez', time: '1d ago' }
                ].map((follower, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{follower.name}</div>
                    </div>
                    <span className="text-gray-400">{follower.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion */}
            <div className="bg-gradient-to-br from-fedex-orange to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">💡 Track Tip</h3>
              <p className="text-sm text-orange-100 mb-3">
                Regular event posting and racer engagement can increase bookings by up to 60%!
              </p>
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors">
                <Plus className="inline h-4 w-4 mr-2" />
                Create Event Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Profile Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl bg-gray-900 border border-gray-700">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Track Profile</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> This will permanently delete your entire track profile, 
                  all posts, events, follower connections, and account access.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-white"
                >
                  {loading ? 'Deleting...' : 'Delete Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};