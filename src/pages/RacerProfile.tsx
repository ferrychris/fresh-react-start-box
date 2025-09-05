import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

// Import our new modular components
import { ProfileHeader } from '../components/racer-dashboard/components/ProfileHeader';
import { DashboardNavigation } from '../components/racer-dashboard/components/DashboardNavigation';
import { StatsCards } from '../components/racer-dashboard/components/StatsCards';
import { RecentActivity } from '../components/racer-dashboard/components/RecentActivity';
import { UpcomingRaces } from '../components/racer-dashboard/components/UpcomingRaces';
import { ContentManagement } from '../components/racer-dashboard/components/ContentManagement';
import { MonetizationPanel } from '../components/racer-dashboard/components/MonetizationPanel';

interface RacerProfileProps {
  racerId?: string;
}

const RacerProfile: React.FC<RacerProfileProps> = ({ racerId }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content' | 'monetization'>('overview');
  
  // Determine the user ID to display - either from props, URL params, or current user
  const userId = racerId || id || user?.id || 'current-user';
  
  // Validate that this is a racer profile - allow viewing other racers but restrict actions to racers
  const isOwnProfile = user?.id === userId;
  const isRacer = user?.user_type === 'racer';
  
  if (isOwnProfile && user && user.user_type !== 'racer') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need to be logged in as a Racer to view this dashboard.</p>
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