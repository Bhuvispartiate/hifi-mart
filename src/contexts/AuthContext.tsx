import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';

interface AuthUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemoMode: boolean;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
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

// Store confirmation result globally for verification step
let confirmationResult: ConfirmationResult | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for stored demo user first
    const storedUser = localStorage.getItem('grocery_auth_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.uid.startsWith('demo')) {
        setUser(parsed);
        setIsDemoMode(true);
        setLoading(false);
        return;
      }
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || '',
          displayName: firebaseUser.displayName || undefined,
        };
        setUser(authUser);
        setIsDemoMode(false);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
      } else {
        // Check if demo user
        const storedUser = localStorage.getItem('grocery_auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.uid.startsWith('demo')) {
            setUser(parsed);
            setIsDemoMode(true);
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

  const setupRecaptcha = useCallback(() => {
    // Clear any existing recaptcha
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Create invisible recaptcha container if it doesn't exist
    let recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      recaptchaContainer = document.createElement('div');
      recaptchaContainer.id = 'recaptcha-container';
      document.body.appendChild(recaptchaContainer);
    }

    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // Reset reCAPTCHA
      },
    });

    return (window as any).recaptchaVerifier;
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    // Check for demo phone number
    if (phoneNumber === '+910000000000' || phoneNumber === '+911234567890') {
      setIsDemoMode(true);
      return { success: true };
    }

    try {
      const appVerifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      confirmationResult = result;
      setIsDemoMode(false);
      return { success: true };
    } catch (error: unknown) {
      console.error('OTP send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('auth/invalid-phone-number')) {
        return { success: false, error: 'Invalid phone number format' };
      }
      if (errorMessage.includes('auth/too-many-requests')) {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
      if (errorMessage.includes('auth/quota-exceeded')) {
        return { success: false, error: 'SMS quota exceeded. Try demo login instead.' };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    // Check for demo OTP
    if (isDemoMode && otp === DEMO_OTP) {
      const demoUser: AuthUser = {
        uid: 'demo-user-' + Date.now(),
        phoneNumber: phoneNumber,
        displayName: 'Demo User',
      };
      setUser(demoUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
      return { success: true };
    }

    // Real Firebase OTP verification
    if (!confirmationResult) {
      return { success: false, error: 'Please request OTP first' };
    }

    try {
      const result = await confirmationResult.confirm(otp);
      if (result.user) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber || '',
          displayName: result.user.displayName || undefined,
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        confirmationResult = null;
      }
      return { success: true };
    } catch (error: unknown) {
      console.error('OTP verify error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP';
      
      if (errorMessage.includes('auth/invalid-verification-code')) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
      }
      if (errorMessage.includes('auth/code-expired')) {
        return { success: false, error: 'OTP expired. Please request a new one.' };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const demoLogin = () => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    localStorage.setItem('grocery_auth_user', JSON.stringify(DEMO_USER));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('grocery_auth_user');
    confirmationResult = null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, sendOTP, verifyOTP, demoLogin, logout }}>
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
