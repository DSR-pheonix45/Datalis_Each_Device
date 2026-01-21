import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Shield, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { resetPassword } from '../lib/supabase';

export default function PasswordResetModal({ isOpen, onClose }) {
  const [step, setStep] = useState('forgot'); // 'forgot' or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [captchaDirection, setCaptchaDirection] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');

  // Generate random direction for captcha
  const generateCaptchaDirection = () => {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  };

  useEffect(() => {
    if (isOpen && step === 'forgot') {
      setCaptchaDirection(generateCaptchaDirection());
      setSelectedDirection('');
      setCaptcha('');
    }
  }, [isOpen, step]);

  const directions = [
    { key: 'up', icon: ArrowUp, label: '↑' },
    { key: 'down', icon: ArrowDown, label: '↓' },
    { key: 'left', icon: ArrowLeft, label: '←' },
    { key: 'right', icon: ArrowRight, label: '→' }
  ];

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!selectedDirection) {
      setError('Please select the correct direction to verify you\'re human');
      return;
    }

    if (selectedDirection !== captchaDirection) {
      setError('Incorrect direction selected. Please try again.');
      setCaptchaDirection(generateCaptchaDirection());
      setSelectedDirection('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Use Supabase directly instead of custom backend
      const { data, error } = await resetPassword(email);

      if (error) {
        throw new Error(error);
      }

      setSuccess('Password reset email sent! Please check your email for instructions.');
      
      // With Supabase, the user follows a link in their email, 
      // so we can close the modal or show a success state.
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // handleResetPassword is no longer needed in the modal because 
  // Supabase redirects to a page (e.g., /reset-password-confirm) where the 
  // user sets their new password.
  const handleResetPassword = () => {
    // This is now handled by src/Auth/ResetPasswordConfirm.jsx
    setStep('forgot');
  };

  const resetModal = () => {
    setStep('forgot');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCaptcha('');
    setError('');
    setSuccess('');
    setResetToken('');
    setSelectedDirection('');
    setCaptchaDirection(generateCaptchaDirection());
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0B1221] rounded-xl shadow-lg border border-gray-800 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#00FFD1] rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#0B1221]" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {step === 'forgot' ? 'Reset Password' : 'Set New Password'}
            </h2>
          </div>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded-md p-3 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500 rounded-md p-3 flex items-center gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {step === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
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
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Direction-based Captcha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Verify you're human - Click the {captchaDirection?.toUpperCase()} arrow
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {directions.map((direction) => {
                    const IconComponent = direction.icon;
                    const isSelected = selectedDirection === direction.key;
                    const isCorrect = captchaDirection === direction.key;

                    return (
                      <button
                        key={direction.key}
                        type="button"
                        onClick={() => setSelectedDirection(direction.key)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          isSelected
                            ? isCorrect
                              ? 'border-green-500 bg-green-500/20 text-green-400'
                              : 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <IconComponent className="h-8 w-8" />
                        <span className="text-xs font-medium">{direction.label}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedDirection && selectedDirection !== captchaDirection && (
                  <button
                    type="button"
                    onClick={() => {
                      setCaptchaDirection(generateCaptchaDirection());
                      setSelectedDirection('');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Try again with new directions
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00FFD1] text-black py-2 px-4 rounded-md hover:bg-[#00FFD1]/90 disabled:opacity-70 font-medium"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 bg-gray-700 py-2 pl-10 pr-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFD1]"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-md border-0 bg-gray-700 py-2 pl-10 pr-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00FFD1]"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00FFD1] text-black py-2 px-4 rounded-md hover:bg-[#00FFD1]/90 disabled:opacity-70 font-medium"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="w-full text-gray-400 hover:text-white text-sm"
              >
                ← Back to email entry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
