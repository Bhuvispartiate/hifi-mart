import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getDeliveryPartners, DeliveryPartner } from '@/lib/firestoreService';

interface DeliveryAuthContextType {
  firebaseUser: User | null;
  deliveryPartner: DeliveryPartner | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const DeliveryAuthContext = createContext<DeliveryAuthContextType | undefined>(undefined);

export function DeliveryAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if email is a registered delivery partner
  const checkDeliveryPartner = async (email: string): Promise<DeliveryPartner | null> => {
    try {
      const partners = await getDeliveryPartners();
      const partner = partners.find(p => p.email?.toLowerCase() === email.toLowerCase());
      
      if (partner && partner.isActive) {
        return partner;
      }
      return null;
    } catch (err) {
      console.error('Error checking delivery partner:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user && user.email) {
        // Check if this user is a delivery partner
        const partner = await checkDeliveryPartner(user.email);
        
        if (partner) {
          setDeliveryPartner(partner);
          setIsAuthenticated(true);
        } else {
          // User is logged in but not a delivery partner
          setDeliveryPartner(null);
          setIsAuthenticated(false);
        }
      } else {
        setDeliveryPartner(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user.email) {
        await signOut(auth);
        return { success: false, error: 'No email associated with this Google account' };
      }

      // Check if the user is a registered delivery partner
      const partner = await checkDeliveryPartner(result.user.email);
      
      if (!partner) {
        await signOut(auth);
        return { 
          success: false, 
          error: 'You are not registered as a delivery partner. Please contact admin.' 
        };
      }

      if (!partner.isActive) {
        await signOut(auth);
        return { 
          success: false, 
          error: 'Your account is currently inactive. Please contact admin.' 
        };
      }

      setDeliveryPartner(partner);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.code === 'auth/popup-closed-by-user'
        ? 'Sign in was cancelled'
        : err.code === 'auth/popup-blocked'
        ? 'Popup was blocked. Please allow popups for this site.'
        : 'Login failed. Please try again.';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setDeliveryPartner(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <DeliveryAuthContext.Provider
      value={{
        firebaseUser,
        deliveryPartner,
        isAuthenticated,
        loading,
        error,
        loginWithGoogle,
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
