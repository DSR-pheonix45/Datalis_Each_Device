import { supabase } from '../lib/supabase';
import { 
  isValidEmail, 
  isStrongPassword, 
  isCommonPassword, 
  sanitizeInput, 
  isValidName,
  isDisposableEmail,
  hasValidMxRecord 
} from '../utils/validation';

// Track failed login attempts
const failedLoginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Track signup attempts for rate limiting
const signupAttempts = new Map();
const MAX_SIGNUPS_PER_HOUR = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// Enhanced signup with validation and security checks
export const enhancedSignup = async (email, password, username, fullName) => {
  try {
    // Input validation
    if (!email || !password || !username || !fullName) {
      return { success: false, error: 'All fields are required' };
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedFullName = sanitizeInput(fullName);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Check for disposable email
    if (await isDisposableEmail(sanitizedEmail)) {
      return { success: false, error: 'Disposable email addresses are not allowed' };
    }

    // Check MX record (in a real app, this would be a server-side check)
    const hasMX = await hasValidMxRecord(sanitizedEmail);
    if (!hasMX) {
      return { success: false, error: 'Invalid email domain' };
    }

    // Validate name
    if (!isValidName(sanitizedFullName)) {
      return { success: false, error: 'Name contains invalid characters' };
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return { 
        success: false, 
        error: 'Password must be at least 12 characters long and include uppercase, lowercase, number, and special character' 
      };
    }

    // Check for common passwords
    if (isCommonPassword(password)) {
      return { success: false, error: 'This password is too common. Please choose a stronger password.' };
    }

    // Rate limiting for signups
    const ip = await getClientIP(); // You'll need to implement this or get it from your backend
    const now = Date.now();
    const signupAttemptsForIP = signupAttempts.get(ip) || [];
    
    // Remove attempts older than our window
    const recentAttempts = signupAttemptsForIP.filter(timestamp => now - timestamp < SIGNUP_WINDOW_MS);
    
    if (recentAttempts.length >= MAX_SIGNUPS_PER_HOUR) {
      return { 
        success: false, 
        error: 'Too many signup attempts. Please try again later.' 
      };
    }
    
    // Add current attempt
    signupAttempts.set(ip, [...recentAttempts, now]);

    // Proceed with signup
    const { user, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          username: sanitizedUsername,
          full_name: sanitizedFullName,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      user,
      requiresEmailVerification: true,
      message: 'Please check your email to verify your account.'
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'An unexpected error occurred during signup.' };
  }
};

// Enhanced login with security checks
export const enhancedLogin = async (email, password) => {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Sanitize input
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Check for account lockout
    const ip = await getClientIP(); // You'll need to implement this or get it from your backend
    const now = Date.now();
    const attempts = failedLoginAttempts.get(ip) || [];
    
    // Remove attempts older than lockout duration
    const recentAttempts = attempts.filter(timestamp => now - timestamp < LOCKOUT_DURATION);
    
    // Check if account is locked
    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      const timeLeft = Math.ceil((LOCKOUT_DURATION - (now - recentAttempts[0])) / 60000);
      return { 
        success: false, 
        error: `Too many failed attempts. Please try again in ${timeLeft} minutes.`,
        isLocked: true
      };
    }

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      // Track failed attempt
      failedLoginAttempts.set(ip, [...recentAttempts, now]);
      
      // Generic error message to prevent user enumeration
      return { 
        success: false, 
        error: 'Invalid email or password',
        remainingAttempts: MAX_LOGIN_ATTEMPTS - (recentAttempts.length + 1)
      };
    }

    // Reset failed attempts on successful login
    failedLoginAttempts.delete(ip);

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      // Optionally, you can resend verification email here
      return {
        success: false,
        requiresEmailVerification: true,
        error: 'Please verify your email before logging in. Check your inbox for a verification link.'
      };
    }

    return { 
      success: true, 
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
};

// Get client IP (simplified - in a real app, this would be handled by your backend)
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error getting client IP:', error);
    return 'unknown';
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Don't reveal if the email exists or not
      console.error('Password reset error:', error);
      return { 
        success: true, // Always return success to prevent email enumeration
        message: 'If an account exists with this email, you will receive a password reset link.'
      };
    }

    return { 
      success: true, 
      message: 'If an account exists with this email, you will receive a password reset link.'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: 'An error occurred while processing your request. Please try again.'
    };
  }
};

// Update user password
export const updatePassword = async (newPassword) => {
  try {
    if (!isStrongPassword(newPassword)) {
      return { 
        success: false, 
        error: 'Password must be at least 12 characters long and include uppercase, lowercase, number, and special character' 
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: 'An error occurred while updating your password.' };
  }
};
