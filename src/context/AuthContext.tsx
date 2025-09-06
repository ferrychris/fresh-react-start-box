import { supabase } from '../integrations/supabase/client';
import { recordActivityForStreak } from '../integrations/supabase/streaks';

// Lightweight adapter used by components in src/components/auth/
// Provides login(email, password) and register(payload) methods.
// Does not manage React state; App and UserContext already handle session and profile loading.

export type UserType = 'FAN' | 'RACER' | 'TRACK' | 'SERIES';

interface RegisterPayload {
  email: string;
  password: string;
  // Common
  name?: string;
  username?: string;
  // Optional extras (ignored by backend for now)
  [key: string]: any;
  role: UserType; // From UI, maps to profiles.user_type (lowercase)
}

export const useAuth = () => {
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Update daily streak on successful login
    try {
      const userId = data?.user?.id;
      if (userId) {
        await recordActivityForStreak(userId);
      }
    } catch (e) {
      // Non-fatal: do not block login on streak failure
      console.warn('streak update on login failed', e);
    }
    return data;
  };

  const register = async (payload: RegisterPayload) => {
    const { email, password, name, role } = payload;
    // Map UI role (e.g., 'RACER') to DB user_type (e.g., 'racer')
    const user_type = (role || 'FAN').toLowerCase();

    // 1) Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split('@')[0], user_type },
      },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    // 2) Ensure profile record exists
    const profile = {
      id: authData.user.id,
      user_type,
      name: name || email.split('@')[0],
      email,
      profile_complete: false,
    };

    const { error: profileError } = await supabase.from('profiles').insert(profile);
    // If duplicate (e.g., user recreated), ignore unique violation
    if (profileError && !profileError.message.toLowerCase().includes('duplicate')) {
      // Best-effort cleanup
      try { await supabase.auth.signOut(); } catch {}
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // 3) Record initial streak day on successful registration (optional)
    try {
      await recordActivityForStreak(authData.user.id);
    } catch (e) {
      console.warn('streak update on register failed', e);
    }

    // 4) Optionally create racer/track/series specifics later during setup
    return { user: authData.user };
  };

  return { login, register };
};
