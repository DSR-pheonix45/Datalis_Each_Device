import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we are on localhost to bypass maintenance mode
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname === '';

function createNoopSupabase() {
  return {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      signOut: async () => ({ error: { message: 'Services under maintenance' } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      update: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      delete: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      eq() { return this; },
      single: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
      order() { return this; },
      limit() { return this; },
    }),
    functions: {
      invoke: async () => ({ data: null, error: { message: 'Services under maintenance' } }),
    },
  };
}

// Initialize Supabase client
const supabase = isLocalhost 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabase();

export { supabase };

// AUTH HELPERS
export const signOut = async () => {
  if (!isLocalhost) return;
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  if (!isLocalhost) return { user: null, error: null };
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const onAuthStateChange = (callback) => {
  if (!isLocalhost) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
};
