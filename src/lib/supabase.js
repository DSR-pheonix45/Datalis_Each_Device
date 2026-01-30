// Supabase client is currently disabled for maintenance.
// All methods return no-op stubs.

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

const supabase = createNoopSupabase();

export { supabase };

// AUTH HELPERS (Stubs)
export const signUp = async () => ({ success: false, error: 'Services under maintenance' });
export const signIn = async () => ({ success: false, error: 'Services under maintenance' });
export const signOut = async () => {};
export const getCurrentUser = async () => ({ user: null, error: null });
export const onAuthStateChange = (callback) => {
  // Return a dummy subscription
  return { data: { subscription: { unsubscribe: () => {} } } };
};
