import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

export default function OAuthCallback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('Processing OAuth callback...');
        
        // Supabase PKCE flow usually handles the code exchange automatically
        // but we can ensure the session is established.
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('OAuth session error:', sessionError);
          setError(`Authentication failed: ${sessionError.message}`);
          return;
        }

        if (data.session?.user) {
          console.log('User session found, redirecting to dashboard...');
          // Optional: Wait a moment for database triggers if needed
          // await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/dashboard', { replace: true });
        } else {
          console.warn('No session found in callback');
          // If no session, try to get the user directly just in case
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            navigate('/dashboard', { replace: true });
          } else {
            setError('Could not establish a session. Please try logging in again.');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
          }
        }
      } catch (err) {
        console.error('Unexpected OAuth callback error:', err);
        setError('An unexpected error occurred during sign in.');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B14] p-4">
      <div className="w-full max-w-md bg-[#0B1221] p-8 rounded-xl shadow-lg border border-gray-800 text-center">
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 animate-spin text-[#00FFD1] mb-4" />
            <p className="text-white">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
