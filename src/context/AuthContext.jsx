import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextBase';
import { signOut, getCurrentUser, onAuthStateChange, supabase } from '../lib/supabase';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile safely
   */
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    console.log("[DEBUG] AuthProvider: Fetching profile for", userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[DEBUG] AuthProvider: Profile fetch error:', error);
        setProfile(null);
      } else if (!data) {
        console.log("[DEBUG] AuthProvider: Profile missing, using partial fallback");
        setProfile({
          user_id: userId,
          status: 'partial',
          role: 'founder'
        });
      } else {
        console.log("[DEBUG] AuthProvider: Profile response:", data);
        setProfile(data);
      }
    } catch (err) {
      console.error('[DEBUG] AuthProvider: Unexpected profile fetch error:', err);
      setProfile(null);
    }
  };

  /**
   * Initial session check
   */
  useEffect(() => {
    const initAuth = async () => {
      console.log("[DEBUG] AuthProvider: initAuth starting...");
      try {
        const { user, error } = await getCurrentUser();

        if (error && error !== 'Auth session missing!') {
          console.error('[DEBUG] AuthProvider: Error getting session:', error);
        }

        if (user) {
          console.log("[DEBUG] AuthProvider: User found in session:", user.id);
          setUser(user);
          await fetchUserProfile(user.id);
        } else {
          console.log("[DEBUG] AuthProvider: No user session found");
        }
      } catch (err) {
        console.error('[DEBUG] AuthProvider: Unexpected init error:', err);
      } finally {
        console.log("[DEBUG] AuthProvider: initAuth complete, setting loading to false");
        setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          console.log("[DEBUG] AuthProvider: Handling SIGNED_IN/UPDATE, setting loading=true");
          setLoading(true);
          setUser(session.user);
          fetchUserProfile(session.user.id).finally(() => {
            console.log("[DEBUG] AuthProvider: Profile fetch complete, setting loading=false");
            setLoading(false);
          });
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  /**
   * Sign out handler
   */
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false };
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
