import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // TEMP: All protected routes disabled as requested by user
  return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but onboarding not completed, redirect to onboarding
  if (user && profile && profile.onboarding_completed === false && location.pathname !== '/onboarding') {
    console.log("Redirecting to onboarding: Profile not completed", {
      path: location.pathname,
      onboarding_completed: profile.onboarding_completed
    });
    return <Navigate to="/onboarding" replace />;
  }

  // If logged in and onboarding completed, but trying to access onboarding page, redirect to dashboard
  if (user && profile && profile.onboarding_completed === true && location.pathname === '/onboarding') {
    console.log("Redirecting to dashboard: Onboarding already completed");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("ProtectedRoute authorized access to:", location.pathname);
  return <>{children}</>;
}