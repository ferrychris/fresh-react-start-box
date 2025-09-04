import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
  profile_complete: boolean;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  isLoading: boolean;
  refreshSession: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth check if Supabase not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Database not configured. Please set up Supabase environment variables.');
      setIsLoading(false);
      return;
    }

    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session check failed:', error.message);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
          // If user is already logged in and lands on auth pages, route to grandstand
          try {
            const path = window.location.pathname;
            if (["/", "/login", "/signin"].includes(path)) {
              window.location.href = "/grandstand";
            }
          } catch (e) {
            // Best-effort redirect; ignore errors in non-browser environments
            console.debug('Redirect to /grandstand skipped:', e);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.warn('Session check error:', error.message);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
          // Redirect to grandstand immediately after login
          try {
            window.location.href = "/grandstand";
          } catch (e) {
            // Best-effort redirect; ignore errors in non-browser environments
            console.debug('Redirect to /grandstand skipped:', e);
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured. User profile features disabled.');
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          user_type: profile.user_type || '',
          profile_complete: profile.profile_complete || false,
          avatar: profile.avatar || ''
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle network/connection errors gracefully
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Unable to connect to Supabase. Please check your environment variables.');
        console.warn('📝 Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.');
      }
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Redirect to home after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error || !session) {
        console.error('Failed to refresh session:', error);
        setUser(null);
        return false;
      }
      
      // Fetch user profile after session refresh
      await fetchUserProfile(session.user.id);
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      return false;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading, refreshSession }}>
      {children}
    </UserContext.Provider>
  );
};