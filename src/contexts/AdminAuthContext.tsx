import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { checkUserRole } from '@/lib/firestoreService';

interface AdminAuthContextType {
  adminUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo admin in localStorage
    const demoAdmin = localStorage.getItem('demo_admin');
    if (demoAdmin) {
      setIsAdmin(true);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAdminUser(user);
      
      if (user) {
        const hasAdminRole = await checkUserRole(user.uid, 'admin');
        setIsAdmin(hasAdminRole);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const hasAdminRole = await checkUserRole(userCredential.user.uid, 'admin');
      
      if (!hasAdminRole) {
        await signOut(auth);
        return { success: false, error: 'Access denied. You do not have admin privileges.' };
      }
      
      setIsAdmin(true);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : err.code === 'auth/user-not-found'
        ? 'User not found'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please try again later.'
        : 'Login failed. Please try again.';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const demoLogin = () => {
    localStorage.setItem('demo_admin', 'true');
    setIsAdmin(true);
    setIsDemoMode(true);
  };

  const logout = async () => {
    try {
      if (isDemoMode) {
        localStorage.removeItem('demo_admin');
        setIsDemoMode(false);
      } else {
        await signOut(auth);
      }
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
        isDemoMode,
        login,
        demoLogin,
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
