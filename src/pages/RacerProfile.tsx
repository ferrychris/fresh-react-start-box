import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { TeamsPanel } from '../components/racer-dashboard/components/TeamsPanel';

const RacerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'feeds' | 'monetization' | 'racing-info' | 'schedule' | 'teams' | 'sponsorship-slots'>('overview');
  const [reloadToken, setReloadToken] = useState(0);

  // Tabs configuration matching FanDashboard style
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'feeds', label: 'Feeds' },
    { id: 'monetization', label: 'Monetization' },
    { id: 'racing-info', label: 'Racing Info' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' },
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
      tabId === 'teams' ||
      tabId === 'sponsorship-slots'
    ) {
      setActiveTab(tabId);
    }
  };

  // Prefer route :id when present, else current user
  const userId = id || user?.id || 'current-user';
  const isOwner = user && (userId === user.id || userId === 'current-user');

  return (
    <div className="min-h-screen bg-background">
      {/* Header with banner + metrics */}
      <ProfileHeader 
        userId={userId}
        isOwner={Boolean(isOwner)}
        onEditProfile={() => navigate('/settings/profile')}
        onPreviewProfile={() => navigate(`/racer/${user?.id}`)}
      />

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Owner actions are now shown inside the header */}
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
              <UpcomingRaces userId={userId} canEdit={Boolean(isOwner)} />
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Teams</h3>
              <TeamsPanel />
            </div>
          )}

          {activeTab === 'sponsorship-slots' && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">Sponsorship Slots</h3>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Coming Soon</span>
                </div>
                <button
                  onClick={() => navigate('/sponsorships')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  Browse Sponsors
                </button>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-5">
                <p className="text-muted-foreground">
                  We’re building a streamlined way to create and manage sponsorship placements on your profile and content. 
                  Set packages, inventory, and pricing, and let sponsors book directly. This feature will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacerProfile;