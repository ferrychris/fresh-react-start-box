import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

// Header with banner + metrics
import { ProfileHeader } from '../components/racer-dashboard/components/ProfileHeader';
// Tabs + sections
import NavigationTabs from '../components/fan-dashboard/NavigationTabs';
import { StatsCards } from '../components/racer-dashboard/components/StatsCards';
import { RecentActivity } from '../components/racer-dashboard/components/RecentActivity';
import { UpcomingRaces } from '../components/racer-dashboard/components/UpcomingRaces';
import { RacerPostsList } from '../components/racer-dashboard/components/RacerPostsList';
import { MonetizationPanel } from '../components/racer-dashboard/components/MonetizationPanel';
import { PostCreator } from '../components/PostCreator';

const RacerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'feeds' | 'monetization' | 'racing-info' | 'schedule' | 'sponsors' | 'sponsorship-slots'>('overview');
  const [reloadToken, setReloadToken] = useState(0);

  // Tabs configuration matching FanDashboard style
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'feeds', label: 'Feeds' },
    { id: 'monetization', label: 'Monetization' },
    { id: 'racing-info', label: 'Racing Info' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'sponsorship-slots', label: 'Sponsorship Slots' }
  ];

  const handleTabChange = (tabId: string) => {
    // Narrow the type from string to our union
    if (
      tabId === 'overview' ||
      tabId === 'activity' ||
      tabId === 'feeds' ||
      tabId === 'monetization' ||
      tabId === 'racing-info' ||
      tabId === 'schedule' ||
      tabId === 'sponsors' ||
      tabId === 'sponsorship-slots'
    ) {
      setActiveTab(tabId);
    }
  };

  // Prefer route :id when present, else current user
  const userId = id || user?.id || 'current-user';

  return (
    <div className="min-h-screen bg-background">
      {/* Header with banner + metrics */}
      <ProfileHeader userId={userId} />

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Tabs (Fan Dashboard style) */}
          <div className="mb-6">
            <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <StatsCards userId={userId} />
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

          {activeTab === 'feeds' && (
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              {/* Inline composer for owner */}
              {user && (userId === user.id || userId === 'current-user') && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                  <PostCreator
                    racerId={user.id}
                    onPostCreated={() => setReloadToken((t) => t + 1)}
                    isFan={false}
                  />
                </div>
              )}
              <RacerPostsList userId={userId} reloadToken={reloadToken} />
            </div>
          )}

          {activeTab === 'monetization' && <MonetizationPanel userId={userId} />}

          {activeTab === 'racing-info' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Racing Info</h3>
              <p className="text-muted-foreground">Car, class, team, equipment, and track preferences will appear here.</p>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Schedule</h3>
              <UpcomingRaces userId={userId} />
            </div>
          )}

          {activeTab === 'sponsors' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Sponsors</h3>
              <p className="text-muted-foreground">Current sponsors and partner highlights will be listed here.</p>
            </div>
          )}

          {activeTab === 'sponsorship-slots' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Sponsorship Slots</h3>
              <p className="text-muted-foreground">Configure available sponsorship placements, prices, and inventory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacerProfile;