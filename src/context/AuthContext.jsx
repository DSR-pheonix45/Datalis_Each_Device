import { createContext, useContext, useState, useEffect } from 'react';
import { signUp, signIn, signOut, getCurrentUser, onAuthStateChange, supabase } from '../lib/supabase';

// Create context with default values
const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  signup: async () => ({ success: false }),
  login: async () => ({ success: false }),
  signOut: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, plans(*)')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setProfile(data);
          }
        } catch (err) {
          console.error('Error fetching profile in AuthContext:', err);
        }
      } else {
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error && error !== 'Auth session missing!') {
          console.error('Error getting initial session:', error);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes. onAuthStateChange may return a structure like
    // { data: { subscription } } or a no-op/stub where data may be null.
    // Avoid destructuring into null to prevent runtime errors.
    const listener = typeof onAuthStateChange === 'function'
      ? onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);

          if (event === 'SIGNED_IN') {
            setUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            setUser(session.user);
          }

          setLoading(false);
        })
      : null;

    // Try to find a subscription object or an unsubscribe function in the
    // returned listener to clean up when component unmounts.
    const subscription = listener?.data?.subscription ?? null;

    return () => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (listener && typeof listener.unsubscribe === 'function') {
          // Some implementations return an object with an unsubscribe method
          listener.unsubscribe();
        } else if (typeof listener === 'function') {
          // Some libraries return an unsubscribe function directly
          listener();
        }
      } catch (err) {
        // Swallow errors in cleanup to avoid throwing during unmount
        console.warn('Failed to unsubscribe auth listener:', err);
      }
    };
  }, []);

  const signup = async (email, password, username, fullName) => {
    try {
      setLoading(true);
      const result = await signUp(email, password, { username, full_name: fullName });

      if (result.success) {
        // If signup successful but needs email verification
        if (result.user && !result.user.email_confirmed_at) {
          return {
            success: true,
            requiresEmailVerification: true,
            message: 'Account created! Please check your email to verify your account before logging in.'
          };
        }
        // If email confirmation is disabled in Supabase, user might be signed in immediately
        return result;
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred during signup.' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await signIn(email, password);

      if (result.success) {
        // User will be set by the onAuthStateChange listener
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login.' };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const result = await signOut();

      if (result.success) {
        // User will be cleared by the onAuthStateChange listener
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An unexpected error occurred during sign out.' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    profile,
    setProfile,
    loading,
    signup,
    login,
    signOut: handleSignOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
