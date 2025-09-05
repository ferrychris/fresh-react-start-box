import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

// Import our new modular components
import { ProfileHeader } from '../components/racer-dashboard/components/ProfileHeader';
import { DashboardNavigation } from '../components/racer-dashboard/components/DashboardNavigation';
import { StatsCards } from '../components/racer-dashboard/components/StatsCards';
import { RecentActivity } from '../components/racer-dashboard/components/RecentActivity';
import { UpcomingRaces } from '../components/racer-dashboard/components/UpcomingRaces';
import { ContentManagement } from '../components/racer-dashboard/components/ContentManagement';
import { MonetizationPanel } from '../components/racer-dashboard/components/MonetizationPanel';

interface Profile {
  id: string;
  name: string;
  user_type: string;
}

const RacerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content' | 'monetization'>('overview');
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const targetUserId = id || currentUser?.id;
      if (!targetUserId) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, name, user_type')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(profileData);
      }
      setLoading(false);
    };

    if (currentUser || id) {
      fetchProfile();
    }
  }, [currentUser, id]);
  
  // Determine the user ID to display - either from URL params or current user
  const userId = id || currentUser?.id || 'current-user';
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Validate that this is a racer profile
  if (profile && profile.user_type !== 'racer') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This profile is not a racer profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with profile info */}
      <ProfileHeader userId={userId} />
      
      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <DashboardNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <StatsCards userId={userId} />
              
              {/* Recent Activity and Upcoming Races */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity userId={userId} />
                <UpcomingRaces userId={userId} />
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Activity Feed</h3>
              <p className="text-muted-foreground">Detailed activity tracking coming soon.</p>
            </div>
          )}
          
          {activeTab === 'content' && (
            <ContentManagement userId={userId} />
          )}
          
          {activeTab === 'monetization' && (
            <MonetizationPanel userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RacerProfile;