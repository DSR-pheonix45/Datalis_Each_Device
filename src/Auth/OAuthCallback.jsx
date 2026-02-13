import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // After successful auth, redirect to dashboard
        // ProtectedRoute will handle onboarding redirection if needed
        navigate('/dashboard');
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        navigate('/login?error=auth_callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
      <p className="text-gray-400">Please wait while we complete your sign-in.</p>
    </div>
  );
}
