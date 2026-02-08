import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';
import { AlertCircle, Loader } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth/callback`
        }
      });

      if (error) {
        setError('Failed to sign up with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => navigate('/')} /> {/* Click outside to close */}
      <div className="relative z-10 w-full max-w-md space-y-6 bg-[#0a0a0a]/95 backdrop-blur-xl p-8 rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Link to="/" className="inline-block">
              <BrandLogo
                label="Dabby"
                iconSize={48}
                textClassName="text-3xl font-semibold tracking-tight text-white"
                iconClassName="text-[#00FFD1]"
              />
            </Link>
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join Dabby today and transform your data into insights.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-md p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-md hover:bg-gray-100 transition-all disabled:opacity-70 font-semibold shadow-lg"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <FcGoogle className="w-6 h-6" />
            )}
            <span>{loading ? 'Creating Account...' : 'Sign up with Google'}</span>
          </button>

          <div className="space-y-4">
            <p className="text-center text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-[#00FFD1] hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#00FFD1] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <div className="text-center border-t border-white/10 pt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#00FFD1] hover:text-[#00FFD1]/80">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}













