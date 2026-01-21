import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Try to use Supabase's password reset functionality
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`,
      });
      
      if (resetError) {
        console.error('Password reset error:', resetError);
        setError('Unable to send reset email. Please try again later.');
      } else {
        setSuccess('Password reset instructions have been sent to your email. Please check your inbox and spam folder.');
        // Don't automatically navigate away - let the user read the message
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#070B14]">
      <div className="w-full max-w-md space-y-8 bg-[#0B1221] p-8 rounded-xl shadow-lg border border-gray-800">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-semibold tracking-tight text-white">
              Datalis
            </span>
          </Link>
          
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email address and we'll send you instructions to reset your password.
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
            <Info className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 bg-gray-700 py-2 pl-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFD1]"
                placeholder="Email address"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-[#00FFD1] px-3 py-2 text-sm font-semibold text-black hover:bg-[#00FFD1]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFD1] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Sending instructions...
                </>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-[#00FFD1] hover:text-[#00FFD1]/80">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

