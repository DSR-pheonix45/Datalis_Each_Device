import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';
import { Mail, Lock, User, AlertCircle, Check, Loader, Shield, Eye, EyeOff, X } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPrivacyInSignup, setShowPrivacyInSignup] = useState(false);
  const [showTermsInSignup, setShowTermsInSignup] = useState(false);
  const recaptchaRef = useRef(null);

  const siteKey = import.meta.env.VITE_APP_RECAPTCHA_SITE_KEY;
  console.log('Signup siteKey:', siteKey);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Attempting to create account for:', formData.email);

      const result = await signup(formData.email, formData.password, formData.username, formData.fullName);
      console.log('Signup result:', result);

      if (result.success) {
        if (result.requiresEmailVerification) {
          // Show message about email verification
          setSuccess(result.message || 'Account created! Please check your email to verify your account before logging in.');
          // Don't navigate away immediately - let them read the message
          setTimeout(() => {
            navigate('/login');
          }, 5000);
        } else {
          // User signed in successfully
          setSuccess('Account created successfully!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => navigate('/')} /> {/* Click outside to close */}
      <div className="relative z-10 w-full max-w-md space-y-6 bg-[#0a0a0a]/95 backdrop-blur-xl p-8 rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
            Or{' '}
            <Link to="/login" className="font-medium text-[#00FFD1] hover:text-[#00FFD1]/80">
              sign in to existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-md p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500 rounded-md p-3 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5 rounded-md">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                  Username
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="Full Name"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
              </div>
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
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/10 bg-black/40 py-2 pl-10 pr-10 text-white placeholder-gray-500 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#00FFD1] focus:ring-[#00FFD1] focus:ring-offset-gray-800"
              />
            </div>
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsInSignup(true)}
                className="text-[#00FFD1] hover:underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyInSignup(true)}
                className="text-[#00FFD1] hover:underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Terms Overlay Modal */}
          {showTermsInSignup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-4xl h-[80vh] bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                  <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                  <button
                    onClick={() => setShowTermsInSignup(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <TermsOfService isModal={true} />
                 </div>
               </div>
             </div>
           )}
 
           {/* Privacy Overlay Modal */}
           {showPrivacyInSignup && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="relative w-full max-w-4xl h-[80vh] bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                   <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                   <button
                     onClick={() => setShowPrivacyInSignup(false)}
                     className="p-2 text-gray-400 hover:text-white transition-colors"
                   >
                     <X className="h-6 w-6" />
                   </button>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                   <PrivacyPolicy isModal={true} />
                 </div>
               </div>
             </div>
           )}

          <div>
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

            <button
              type="submit"
              disabled={loading || !recaptchaToken}
              className="group relative flex w-full justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md hover:from-teal-400 hover:to-cyan-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            By creating an account, you'll receive updates about new features, promotions, and product announcements.
          </div>
        </form>
      </div>
    </div>
  );
}













