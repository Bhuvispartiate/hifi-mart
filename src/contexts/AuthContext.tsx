import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemoMode: boolean;
  sendOTP: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for testing
const DEMO_USER: AuthUser = {
  uid: 'demo-user-123',
  phoneNumber: '+91 98765 43210',
  displayName: 'Demo User',
};

// Demo OTP for testing
const DEMO_OTP = '123456';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || '',
          displayName: firebaseUser.displayName || undefined,
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
      } else {
        // Check for demo user
        const storedUser = localStorage.getItem('grocery_auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.uid.startsWith('demo')) {
            setUser(parsed);
          } else {
            setUser(null);
            localStorage.removeItem('grocery_auth_user');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendOTP = async (phoneNumber: string, recaptchaContainerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clear existing recaptcha if any
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
      
      setRecaptchaVerifier(verifier);
      
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      console.error('OTP send error:', error);
      return { success: false, error: errorMessage };
    }
  };

  const verifyOTP = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    // Check for demo OTP first
    if (otp === DEMO_OTP && !confirmationResult) {
      const demoUser: AuthUser = {
        uid: 'demo-user-' + Date.now(),
        phoneNumber: '+91 00000 00000',
        displayName: 'Demo User',
      };
      setUser(demoUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
      return { success: true };
    }

    // Real Firebase OTP verification
    try {
      if (!confirmationResult) {
        return { success: false, error: 'Please request OTP first' };
      }
      
      const result = await confirmationResult.confirm(otp);
      const authUser: AuthUser = {
        uid: result.user.uid,
        phoneNumber: result.user.phoneNumber || '',
        displayName: result.user.displayName || undefined,
      };
      setUser(authUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
      setConfirmationResult(null);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP';
      return { success: false, error: errorMessage };
    }
  };

  const demoLogin = () => {
    setUser(DEMO_USER);
    localStorage.setItem('grocery_auth_user', JSON.stringify(DEMO_USER));
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setConfirmationResult(null);
    localStorage.removeItem('grocery_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode: false, sendOTP, verifyOTP, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
