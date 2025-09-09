import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

// Header with banner + metrics
import { ProfileHeader } from '../components/racer-dashboard/components/ProfileHeader';
// Tabs + sections
import NavigationTabs from '../components/fan-dashboard/NavigationTabs';
import { UpcomingRaces } from '../components/racer-dashboard/components/UpcomingRaces';
import { RacerPostsList } from '../components/racer-dashboard/components/RacerPostsList';
import { PostCreator } from '../components/PostCreator';
import { TeamsPanel } from '../components/racer-dashboard/components/TeamsPanel';
import { AuthModal } from '@/components/auth/AuthModal';

const RacerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'activity' | 'feeds' | 'racing-info' | 'schedule' | 'teams'>('feeds');
  const [reloadToken, setReloadToken] = useState(0);
  const [headerLoading, setHeaderLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Tabs configuration matching FanDashboard style
  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'feeds', label: 'Feeds' },
    { id: 'racing-info', label: 'Racing Info' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' }
  ];

  const handleTabChange = (tabId: string) => {
    // Narrow the type from string to our union
    if (
      tabId === 'activity' ||
      tabId === 'feeds' ||
      tabId === 'racing-info' ||
      tabId === 'schedule' ||
      tabId === 'teams'
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
          {/* Guest banner: encourage sign-in for engagement actions */}
          {!user && (
            <div className="mb-4 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between text-sm">
              <p className="text-slate-300">Viewing a shared profile — sign in to tip, comment, or follow.</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="ml-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white font-medium"
              >
                Sign In
              </button>
            </div>
          )}
          {/* Owner actions are now shown inside the header */}
          {/* Navigation Tabs (Fan Dashboard style) */}
          <div className="mb-6">
            <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Tab Content */}
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

          {/* Removed Sponsorship Slots section as requested */}
        </div>
      </div>
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default RacerProfile;