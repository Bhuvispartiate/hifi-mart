import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDeliveryPartners, DeliveryPartner } from '@/lib/firestoreService';

interface DeliveryAuthContextType {
  deliveryPartner: DeliveryPartner | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const DeliveryAuthContext = createContext<DeliveryAuthContextType | undefined>(undefined);

export function DeliveryAuthProvider({ children }: { children: ReactNode }) {
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('delivery_partner');
    if (stored) {
      try {
        const partner = JSON.parse(stored);
        setDeliveryPartner(partner);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('delivery_partner');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      
      // Fetch all delivery partners and find matching email
      const partners = await getDeliveryPartners();
      const partner = partners.find(p => p.email?.toLowerCase() === email.toLowerCase());
      
      if (!partner) {
        return { success: false, error: 'No delivery partner found with this email' };
      }

      if (!partner.isActive) {
        return { success: false, error: 'Your account is currently inactive. Please contact admin.' };
      }

      // For demo purposes, password is the phone number
      // In production, you'd use proper Firebase Auth
      if (password !== partner.phone.replace(/\s/g, '')) {
        return { success: false, error: 'Invalid password. Use your phone number as password.' };
      }

      // Store session
      localStorage.setItem('delivery_partner', JSON.stringify(partner));
      setDeliveryPartner(partner);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('delivery_partner');
    setDeliveryPartner(null);
    setIsAuthenticated(false);
  };

  return (
    <DeliveryAuthContext.Provider
      value={{
        deliveryPartner,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth() {
  const context = useContext(DeliveryAuthContext);
  if (context === undefined) {
    throw new Error('useDeliveryAuth must be used within a DeliveryAuthProvider');
  }
  return context;
}
