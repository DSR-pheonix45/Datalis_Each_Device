import { createContext, useContext, useState, useEffect } from 'react';
import { signOut, getCurrentUser, onAuthStateChange, supabase } from '../lib/supabase';

// Create context with default values
const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
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
          // Try to fetch with plans join first
          const { data, error } = await supabase
            .from('profiles')
            .select('*, plan:plans(*)')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setProfile(data);
          } else if (error) {
            // If the error is "no rows found", it's a new user
            if (error.code === 'PGRST116') {
              console.log('No profile found for user, initializing new user profile state');
              setProfile({ 
                id: user.id, 
                email: user.email, 
                plans: { name: 'Free' },
                onboarding_completed: false 
              });
              return;
            }

            // If join fails (e.g. 500) but profile might exist, try fetching profile without join
            console.warn('Profile join with plans failed, trying without join:', error.message);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (!profileError && profileData) {
              setProfile({ ...profileData, plans: { name: 'Free' } }); // Default plan
            } else if (profileError?.code === 'PGRST116') {
              // No profile found even without join
              setProfile({ 
                id: user.id, 
                email: user.email, 
                plans: { name: 'Free' },
                onboarding_completed: false 
              });
            } else {
              console.error('Failed to fetch profile due to database error:', profileError);
              // Do NOT set onboarding_completed to false here, as it might be a temporary DB error
              // for an existing user. Keep profile as null or set a loading/error state.
              // For now, we'll keep it as null to avoid accidental onboarding triggers.
              setProfile(null);
            }
          }
        } catch (err) {
          console.error('Error fetching profile in AuthContext:', err);
          // Do not assume onboarding is not completed on generic error
          setProfile(null);
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

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
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
