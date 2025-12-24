import { Navigate, useLocation } from 'react-router-dom';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { Loader2 } from 'lucide-react';

interface DeliveryProtectedRouteProps {
  children: React.ReactNode;
}

const DeliveryProtectedRoute = ({ children }: DeliveryProtectedRouteProps) => {
  const { isAuthenticated, loading } = useDeliveryAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/delivery/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default DeliveryProtectedRoute;
