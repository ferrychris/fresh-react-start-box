import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RacerProfile } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase URL or Anon Key is not defined. Using mock client.');

  // Simple in-memory auth state for mocks
  let mockUser: any = null;
  let mockSession: any = null;

  const makeSession = (user: any) => ({
    access_token: 'mock_access_token',
    token_type: 'bearer',
    user,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock_refresh_token'
  });

  const mockSupabase = {
    from: (table: string) => ({
      select: async (query = '*') => {
        console.log(`Mock select from ${table} with query: ${query}`);
        if (table === 'racers') {
          return { data: [{ id: '1', name: 'Mock Racer' }] as unknown as RacerProfile[], error: null };
        }
        return { data: [], error: null };
      },
      insert: async (data: any) => {
        console.log(`Mock insert into ${table} with data:`, data);
        return { data: [data], error: null };
      },
      update: async (data: any) => {
        console.log(`Mock update in ${table} with data:`, data);
        return { data: [data], error: null };
      },
      delete: async () => {
        console.log(`Mock delete from ${table}`);
        return { data: [], error: null };
      },
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _file: File) => {
          console.log(`Mock upload to ${bucket}/${path}`);
          return { data: { path: `mock/${path}` }, error: null };
        },
        remove: async (paths: string[]) => {
          console.log(`Mock remove from ${bucket}:`, paths);
          return { data: {}, error: null };
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `https://mock.url/${path}` } };
        },
      }),
    },
    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        console.log('[mock] signInWithPassword', email);
        // Accept any email/password in mock; optionally gate on known test accounts
        mockUser = {
          id: 'mock-user-id',
          email,
          user_metadata: { name: email.split('@')[0], user_type: 'fan' },
        };
        mockSession = makeSession(mockUser);
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
        console.log('[mock] signUp', email, options);
        mockUser = {
          id: 'mock-new-user-id',
          email,
          user_metadata: options?.data || {},
        };
        mockSession = makeSession(mockUser);
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      async signOut() {
        mockUser = null;
        mockSession = null;
        return { error: null };
      },
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      refreshSession: async () => ({ data: { session: mockSession }, error: null }),
      onAuthStateChange: (cb: any) => {
        const unsub = () => {};
        // Immediately notify with current session in mock
        try { cb('SIGNED_IN', { session: mockSession }); } catch {}
        return { data: { subscription: { unsubscribe: unsub } }, error: null };
      },
    },
  };

  supabase = mockSupabase as any;
}

export { supabase };
