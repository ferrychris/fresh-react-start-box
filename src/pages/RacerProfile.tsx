import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define the user type to fix TypeScript errors
interface User {
  id: string;
  name?: string;
  role?: string;
}

// Import our new modular components
import { ProfileHeader } from '../components/racer-dashboard/components/ProfileHeader';
import { DashboardNavigation } from '../components/racer-dashboard/components/DashboardNavigation';
import { StatsCards } from '../components/racer-dashboard/components/StatsCards';
import { RecentActivity } from '../components/racer-dashboard/components/RecentActivity';
import { UpcomingRaces } from '../components/racer-dashboard/components/UpcomingRaces';
import { ContentManagement } from '../components/racer-dashboard/components/ContentManagement';
import { MonetizationPanel } from '../components/racer-dashboard/components/MonetizationPanel';

const RacerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Fix TypeScript error by properly typing the auth context
  const auth = useAuth();
  const user = auth?.user as User | undefined;
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content' | 'monetization'>('overview');
  
  // Determine the user ID to display - either from URL params or current user
  const userId = id || user?.id || 'current-user';
  
  // Validate that this is a racer profile
  if (user && user.role !== 'RACER') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You need to be logged in as a Racer to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
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
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4">Activity Feed</h3>
              <p className="text-slate-400">Detailed activity tracking coming soon.</p>
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