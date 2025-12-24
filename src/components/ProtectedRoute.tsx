import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps) => {
  // TESTING MODE: Bypass all authentication checks
  const TESTING_MODE = true;

  const { user, loading, onboardingCompleted } = useAuth();
  const location = useLocation();

  // Check if current path is an onboarding route
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  // If testing mode is enabled, skip all auth checks
  if (TESTING_MODE) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to={`/auth?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Still checking onboarding status
  if (onboardingCompleted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If onboarding is required and not completed, redirect to onboarding
  if (requireOnboarding && !onboardingCompleted && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding is completed and user is on onboarding route, redirect to home
  if (onboardingCompleted && isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
