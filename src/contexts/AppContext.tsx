import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getSubscriptionTiersForRacers, getFanCountsForRacers } from '@/lib/supabase';
import { getJSONCookie, setJSONCookie, deleteCookie } from '@/lib/cookies';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  type: 'fan' | 'racer' | 'track' | 'series' | 'admin';
  user_type: 'fan' | 'racer' | 'track' | 'series' | 'admin';
  profilePicture?: string;
  profileComplete?: boolean;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  racers: any[];
  racersLoading: boolean;
  setRacers: (racers: any[]) => void;
  loadRacers: () => Promise<void>;
  redirectToSetup: (userType: string) => void;
  refreshSession: () => Promise<boolean>;
  sessionChecked: boolean;
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [racers, setRacers] = useState<any[]>([]);
  const [racersLoading, setRacersLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  const checkSession = async () => {
    try {
      // Step 1: quick local check (no network)
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.debug('[AppContext] getSession error (non-fatal):', sessionErr.message);
      }
      if (session?.user) {
        const uid = session.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
        if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            type: profile.user_type,
            user_type: profile.user_type,
            profilePicture: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
            profileComplete: profile.profile_complete,
          };
          setUser(userData);
          return; // done
        }
        // If no profile, treat as signed-out for now
        setUser(null);
        return;
      }

      // Step 2: fallback to getUser with a longer, quieter timeout (network may refresh session)
      const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => {
        return new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('auth_timeout')), ms);
          p.then((v) => { clearTimeout(t); resolve(v); })
           .catch((e) => { clearTimeout(t); reject(e); });
        });
      };
      try {
        const res = await withTimeout(supabase.auth.getUser() as Promise<{ data: { user: { id: string } | null } }>, 10000);
        const authUser = res?.data?.user;
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          if (profile) {
            const userData: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              type: profile.user_type,
              user_type: profile.user_type,
              profilePicture: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
              profileComplete: profile.profile_complete,
            };
            setUser(userData);
            return;
          }
        }
        setUser(null);
      } catch (err) {
        if ((err as Error)?.message === 'auth_timeout') {
          // Downgrade to debug: tests may run without session; avoid noisy warnings
          console.debug('[AppContext] getUser timed out; continuing without session');
        } else {
          console.error('Error checking session via getUser:', err);
        }
        setUser(null);
      }
    } finally {
      setSessionChecked(true);
    }
  };

  const isLoadingRacersRef = useRef(false);

  // Prime user from cookie to reduce first-paint flicker on repeat visits
  useEffect(() => {
    try {
      if (!user) {
        const cached = getJSONCookie<User>('app_user');
        if (cached && cached.id) {
          setUser(cached);
        }
      }
    } catch {/* ignore cookie parse errors */}
    // no deps: run once at mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a small user snapshot in cookies (1 hour TTL)
  useEffect(() => {
    try {
      if (user) {
        const snapshot: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          user_type: user.user_type,
          profilePicture: user.profilePicture,
          profileComplete: user.profileComplete,
        };
        setJSONCookie('app_user', snapshot, 60 * 60);
      } else {
        deleteCookie('app_user');
      }
    } catch {/* ignore cookie write errors */}
  }, [user]);

  const loadRacers = useCallback(async () => {
    if (isLoadingRacersRef.current) return;
    isLoadingRacersRef.current = true;
    setRacersLoading(true);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, profile_complete, avatar, banner_image, racer_profiles(*)')
        .eq('user_type', 'racer')
        // Order by most recently updated racer profile (fresh racers first)
        .order('updated_at', { ascending: false, foreignTable: 'racer_profiles' })
        .limit(24);

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        const racerIds = profiles.map((p: any) => p.id);
        const [tiersByRacer, fanCountsByRacer] = await Promise.all([
          getSubscriptionTiersForRacers(racerIds),
          getFanCountsForRacers(racerIds)
        ]);

        const racersMapped = profiles.map((profile: any) => {
          const rp = Array.isArray(profile.racer_profiles)
            ? profile.racer_profiles[0]
            : profile.racer_profiles;
          return {
            id: profile.id,
            name: rp?.username || profile.name || 'Racer',
            class: rp?.racing_class || 'Racing',
            location: rp?.team_name || '—',
            bio: rp?.bio || '',
            fanCount: fanCountsByRacer?.[profile.id] ?? 0,
            bannerImage: profile.banner_image ?? null,
            profilePicture: profile.avatar || rp?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
            // expose raw for internal consumers if needed
            _profile: profile,
            _racerProfile: rp,
          };
        });
        setRacers(racersMapped);
      }
    } catch (error) {
      console.error('Error loading racers:', error);
      setRacers([]);
    } finally {
      setRacersLoading(false);
      isLoadingRacersRef.current = false;
    }
  }, []);

  const redirectToSetup = (userType: string) => {
    const path = `/setup/${userType}`;
    window.location.href = path;
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        setUser(null);
        return false;
      }
      await checkSession();
      return true;
    } catch (error) {
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    checkSession();
    loadRacers();

    const handleOpenAuthModal = () => setShowAuthModal(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
  }, [loadRacers]);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      showAuthModal,
      setShowAuthModal,
      racers,
      racersLoading,
      setRacers,
      loadRacers,
      redirectToSetup,
      refreshSession,
      sessionChecked
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
