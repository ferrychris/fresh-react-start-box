import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getSubscriptionTiersForRacers, getFanCountsForRacers } from '@/lib/supabase';

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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            type: profile.user_type,
            user_type: profile.user_type,
            profilePicture: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
            profileComplete: profile.profile_complete
          };
          setUser(userData);
        } else {
          setUser(null); // Or handle as needed
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setSessionChecked(true);
    }
  };

  const isLoadingRacersRef = useRef(false);

  const loadRacers = useCallback(async () => {
    if (isLoadingRacersRef.current) return;
    isLoadingRacersRef.current = true;
    setRacersLoading(true);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, profile_complete, avatar, banner_image, racer_profiles(*)')
        .eq('user_type', 'racer');

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        const racerIds = profiles.map((p: any) => p.id);
        const [tiersByRacer, fanCountsByRacer] = await Promise.all([
          getSubscriptionTiersForRacers(racerIds),
          getFanCountsForRacers(racerIds)
        ]);

        const racersMapped = profiles.map((profile: any) => ({
          id: profile.id,
          name: profile.name,
          // ... other fields mapping
        }));
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
