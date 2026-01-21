import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, AlertCircle, Loader, Info, Shield, RefreshCw } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../lib/supabase';
import { enhancedLogin } from '../services/authService';
import PasswordResetModal from '../components/PasswordResetModal';
import BrandLogo from '../components/common/BrandLogo';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Login() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const recaptchaRef = useRef(null);

  const siteKey = import.meta.env.VITE_APP_RECAPTCHA_SITE_KEY;
  console.log('Login siteKey:', siteKey);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (verificationMessage) setVerificationMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setVerificationMessage('');

      const result = await enhancedLogin(formData.email, formData.password);

      if (result.success) {
        // Reset form and reCAPTCHA
        setFormData({ email: '', password: '' });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Handle specific error cases
        if (result.requiresEmailVerification) {
          setVerificationMessage(result.error);
        } else if (result.isLocked) {
          setError(result.error);
        } else {
          setError(result.error || 'Invalid email or password');
          
          // Show remaining attempts if available
          if (result.remainingAttempts !== undefined) {
            setError(prev => `${prev} (${result.remainingAttempts} attempts remaining)`);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth/callback`
        }
      });

      if (error) {
        setError('Failed to sign in with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => navigate('/')} /> {/* Click outside to close */}
      <div className="w-full max-w-md space-y-8 bg-[#0a0a0a]/95 backdrop-blur-xl p-8 rounded-xl shadow-2xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-200">
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{' '}
            <Link to="/signup" className="font-medium text-[#00FFD1] hover:text-[#00FFD1]/80">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-md p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {verificationMessage && (
          <div className="bg-blue-900/30 border border-blue-500 rounded-md p-3 flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-400">{verificationMessage}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 pr-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="Email address"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 pr-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <Shield className="h-3.5 w-3.5 mr-1" />
                Your password is encrypted in transit and at rest.
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="py-2">
              <div className="w-full flex justify-center scale-90">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                  onError={() => setRecaptchaToken(null)}
                  theme="dark"
                />
              </div>
            </div>
          </div>

          <div className="relative my-4">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-2 px-4 rounded-md hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-70"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#00FFD1] focus:ring-[#00FFD1] focus:ring-offset-gray-800"
                />
              </div>
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember this device
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsPasswordResetModalOpen(true)}
                className="font-medium text-[#00FFD1] hover:text-[#00FFD1]/80 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                    Sending...
                  </>
                ) : (
                  'Forgot your password?'
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-md hover:from-teal-400 hover:to-cyan-500 transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsPasswordResetModalOpen(true)}
              className="text-sm text-[#00FFD1] hover:text-[#00FFD1]/80"
            >
              Forgot your password?
            </button>
          </div>
        </form>

        {/* Password Reset Modal */}
        <PasswordResetModal
          isOpen={isPasswordResetModalOpen}
          onClose={() => setIsPasswordResetModalOpen(false)}
        />
      </div>
    </div>
  );
}







