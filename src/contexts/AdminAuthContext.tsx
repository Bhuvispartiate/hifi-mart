import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

// Hardcoded admin email
const ADMIN_EMAIL = 'bhuvi.flarenet@gmail.com';

interface AdminAuthContextType {
  adminUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      
      if (user && user.email) {
        // Check if the email matches the admin email
        const hasAdminAccess = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(hasAdminAccess);
      } else {
        setIsAdmin(false);
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

      // Check if the email matches the admin email
      if (result.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        return { 
          success: false, 
          error: 'Access denied. You are not authorized as an admin.' 
        };
      }

      setIsAdmin(true);
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
      setIsAdmin(false);
      setAdminUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdmin,
        loading,
        error,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
