import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If environment variables are missing, create a safe no-op stub to avoid uncaught
// errors during app initialization. This allows the app to surface a friendly
// warning and fail gracefully at runtime where actions require an authenticated
// Supabase session.
function createNoopSupabase() {
  // Minimal stub that mirrors commonly-used supabase methods used across the app.

  return {
    // Auth helpers
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: null }),
    },

    // Basic table/query stub: returns chainable object with select/insert/update/delete
    from: () => {
      const res = {
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        eq() { return this; },
        single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        order() { return this; },
        limit() { return this; },
      };
      return res;
    },

    // Edge functions stub
    functions: {
      invoke: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    },
  };
}

let supabase;
if (!supabaseUrl || !supabaseAnonKey) {
  // Warn once and export the noop client so imports don't throw during module init
  // (fixes "Uncaught Error: supabaseUrl is required" when env isn't set).
  // Developers should set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in their
  // `.env` or environment for the app to work fully.
  console.warn(
    'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined. Supabase client is a no-op stub.'
  );
  supabase = createNoopSupabase();
} else {
  // Create Supabase client with proper configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

export { supabase };

// =====================================================
// AUTH HELPERS

// Sign up with email and password
export const signUp = async (email, password, userMetadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: data.user
    };
  } catch (error) {
    console.error('Signup network error:', error);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase signin error:', error);
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Email not confirmed. Please check your email for verification link.' };
      }
      if (error.message.includes('Invalid login credentials') || error.message.includes('user not found')) {
        return { success: false, error: 'Email not registered. Please sign up first.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Signin network error:', error);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

// Reset password (forgot password) - Uses Supabase Auth
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Password reset email sent! Please check your email for instructions.'
    };
  } catch (error) {
    console.error('Password reset network error:', error);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Don't log error for missing session - this is normal when not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Get current user error:', error);
      }
      return { user: null, error: error.message };
    }
    return { user, error: null };
  } catch (error) {
    // Handle network errors gracefully
    console.error('Get current user network error:', error);
    return { user: null, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// =====================================================
// DATABASE HELPERS
// =====================================================

// Get user profile
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Get profile error:', error);
    return { profile: null, error: error.message };
  }

  return { profile: data, error: null };
};

// Update user profile
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update profile error:', error);
    return { profile: null, error: error.message };
  }

  return { profile: data, error: null };
};

// =====================================================
// RBAC HELPERS
// =====================================================

// Check if user has a specific permission
export const userHasPermission = async (userId) => {
  // For now, just check if user is superadmin
  const isAdmin = await isSuperadmin(userId);
  return isAdmin;
};

// Get user role
export const getUserRole = async (userId) => {
  try {
    // For now, get the profile and return the role
    const { profile, error } = await getProfile(userId);
    if (error || !profile) {
      console.error('Get user role error:', error);
      return null;
    }

    return profile.role;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
};

// Check if user is superadmin
export const isSuperadmin = async (userId) => {
  try {
    // For now, get the profile and check if role is superadmin
    const { profile, error } = await getProfile(userId);
    if (error || !profile) {
      console.error('Superadmin check error:', error);
      return false;
    }

    return profile.role === 'superadmin';
  } catch (error) {
    console.error('Superadmin check error:', error);
    return false;
  }
};

// Get platform stats (for superadmin)
export const getPlatformStats = async () => {
  try {
    // For now, just return basic stats from profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, created_at, last_login_at');

    if (error) {
      console.error('Get platform stats error:', error);
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = data.length;
    const activeUsersToday = data.filter(p => p.last_login_at && new Date(p.last_login_at) >= today).length;
    const recentSignups = data.filter(p => new Date(p.created_at) >= weekAgo).length;

    return {
      total_users: totalUsers,
      active_users_today: activeUsersToday,
      recent_signups: recentSignups
    };
  } catch (error) {
    console.error('Get platform stats error:', error);
    return null;
  }
};












