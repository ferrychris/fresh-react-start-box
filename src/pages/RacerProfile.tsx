import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase/client';
import { Camera, Instagram, Facebook, Youtube, BadgeInfo, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [racerLoading, setRacerLoading] = useState<boolean>(false);
  const [racerError, setRacerError] = useState<string | null>(null);
  const [racerDetails, setRacerDetails] = useState<{
    username: string | null;
    team_name: string | null;
    car_number: string | null;
    racing_class: string | null;
    bio: string | null;
    car_photos: string[];
    profile_photo_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    career_wins: number | null;
    podiums: number | null;
    championships: number | null;
    years_racing: number | null;
    career_history: string | null;
    highlights: string | null;
    achievements: string | null;
  } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

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

  // Load racer profile details
  useEffect(() => {
    let cancelled = false;
    const loadRacer = async () => {
      try {
        setRacerLoading(true);
        setRacerError(null);
        if (!userId || userId === 'current-user') return;
        const { data, error } = await supabase
          .from('racer_profiles')
          .select(`
            username, team_name, car_number, racing_class, bio, car_photos, profile_photo_url,
            instagram_url, facebook_url, tiktok_url, youtube_url,
            career_wins, podiums, championships, years_racing,
            career_history, highlights, achievements
          `)
          .eq('id', userId)
          .single();
        if (error) throw error;
        if (cancelled) return;
        const photos = Array.isArray(data?.car_photos)
          ? (data.car_photos as string[]).filter((u) => typeof u === 'string')
          : [];
        setRacerDetails({
          username: data?.username ?? null,
          team_name: data?.team_name ?? null,
          car_number: data?.car_number ?? null,
          racing_class: data?.racing_class ?? null,
          bio: data?.bio ?? null,
          car_photos: photos,
          profile_photo_url: data?.profile_photo_url ?? null,
          instagram_url: data?.instagram_url ?? null,
          facebook_url: data?.facebook_url ?? null,
          tiktok_url: data?.tiktok_url ?? null,
          youtube_url: data?.youtube_url ?? null,
          career_wins: data?.career_wins ?? null,
          podiums: data?.podiums ?? null,
          championships: data?.championships ?? null,
          years_racing: data?.years_racing ?? null,
          career_history: data?.career_history ?? null,
          highlights: data?.highlights ?? null,
          achievements: data?.achievements ?? null,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setRacerError('Failed to load racer details');
      } finally {
        if (!cancelled) setRacerLoading(false);
      }
    };
    loadRacer();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Close lightbox with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => {
        const total = racerDetails?.car_photos?.length || 0;
        return total ? (i + 1) % total : i;
      });
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => {
        const total = racerDetails?.car_photos?.length || 0;
        return total ? (i - 1 + total) % total : i;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, racerDetails?.car_photos?.length]);

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

          {/* Lightbox Overlay */}
          {lightboxOpen && racerDetails?.car_photos?.length ? (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="absolute left-4 md:left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLightboxIndex((i) => ((i - 1 + (racerDetails.car_photos.length)) % racerDetails.car_photos.length))}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
                <img
                  src={racerDetails.car_photos[lightboxIndex]}
                  alt={`Car ${lightboxIndex + 1}`}
                  className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
              <button
                type="button"
                className="absolute right-4 md:right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLightboxIndex((i) => ((i + 1) % (racerDetails.car_photos.length)))}
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          ) : null}
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
            <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Racing Info</h3>

              {/* Loading / Error States */}
              {racerLoading && (
                <div className="text-sm text-muted-foreground">Loading racer details...</div>
              )}
              {racerError && (
                <div className="text-sm text-red-400">{racerError}</div>
              )}

              

              {/* Car Photos (First) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-lg font-semibold text-foreground">Car Photos</h4>
                  </div>
                  {isOwner && (
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-muted-foreground"
                      onClick={() => navigate('/settings/profile')}
                    >
                      Update
                    </button>
                  )}
                </div>
                {racerDetails?.car_photos && racerDetails.car_photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {racerDetails.car_photos.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="group aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 cursor-zoom-in"
                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                        aria-label={`Zoom car photo ${idx + 1}`}
                      >
                        <img src={url} alt={`Car ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" /> No car photos yet.
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {racerDetails?.bio || 'No bio provided yet.'}
                </p>
              </div>

              {/* Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Username</div>
                  <div className="text-foreground font-medium">{racerDetails?.username || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Team</div>
                  <div className="text-foreground font-medium">{racerDetails?.team_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Car Number</div>
                  <div className="text-foreground font-medium">{racerDetails?.car_number || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Class</div>
                  <div className="text-foreground font-medium">{racerDetails?.racing_class || '—'}</div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Social Links</h4>
                <div className="flex flex-wrap gap-2">
                  {racerDetails?.instagram_url && (
                    <a className="text-sm px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-foreground" href={racerDetails.instagram_url} target="_blank" rel="noreferrer">Instagram</a>
                  )}
                  {racerDetails?.facebook_url && (
                    <a className="text-sm px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-foreground" href={racerDetails.facebook_url} target="_blank" rel="noreferrer">Facebook</a>
                  )}
                  {racerDetails?.tiktok_url && (
                    <a className="text-sm px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-foreground" href={racerDetails.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>
                  )}
                  {racerDetails?.youtube_url && (
                    <a className="text-sm px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-foreground" href={racerDetails.youtube_url} target="_blank" rel="noreferrer">YouTube</a>
                  )}
                  {!racerDetails?.instagram_url && !racerDetails?.facebook_url && !racerDetails?.tiktok_url && !racerDetails?.youtube_url && (
                    <div className="text-sm text-muted-foreground">No social links provided.</div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Stats</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-muted-foreground">Career Wins</div>
                    <div className="text-foreground text-lg font-bold">{racerDetails?.career_wins ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-muted-foreground">Podiums</div>
                    <div className="text-foreground text-lg font-bold">{racerDetails?.podiums ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-muted-foreground">Championships</div>
                    <div className="text-foreground text-lg font-bold">{racerDetails?.championships ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-muted-foreground">Years Racing</div>
                    <div className="text-foreground text-lg font-bold">{racerDetails?.years_racing ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Career */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Career History</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{racerDetails?.career_history || '—'}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Highlights & Achievements</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><span className="text-foreground font-medium">Highlights:</span> <span className="whitespace-pre-wrap">{racerDetails?.highlights || '—'}</span></div>
                    <div><span className="text-foreground font-medium">Achievements:</span> <span className="whitespace-pre-wrap">{racerDetails?.achievements || '—'}</span></div>
                  </div>
                </div>
              </div>
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