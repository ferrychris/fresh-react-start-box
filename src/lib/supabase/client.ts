import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RacerProfile } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase URL or Anon Key is not defined. Using mock client.');

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
        upload: async (path: string, file: File) => {
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
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (_cb: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
    },
  };

  supabase = mockSupabase as any;
}

export { supabase };
