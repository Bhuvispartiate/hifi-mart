import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '@/lib/firestoreService';

interface AuthUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemoMode: boolean;
  onboardingCompleted: boolean | null;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  setOnboardingCompletedLocal: (completed: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo OTP for testing
const DEMO_OTP = '123456';

// Store pending phone number for verification
let pendingPhoneNumber: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const profile = await getUserProfile(user.uid);
      const completed = profile?.onboardingCompleted ?? false;
      setOnboardingCompleted(completed);
      return completed;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  const setOnboardingCompletedLocal = (completed: boolean) => {
    setOnboardingCompleted(completed);
  };

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('grocery_auth_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('grocery_auth_user');
      }
    }
    setLoading(false);
  }, []);

  // Check onboarding status when user changes
  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    } else {
      setOnboardingCompleted(null);
    }
  }, [user?.uid]);

  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    // Validate phone number format (basic validation)
    if (!phoneNumber || phoneNumber.length < 10) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    // Store phone number for verification step
    pendingPhoneNumber = phoneNumber;

    // Simulate OTP send delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    // Verify OTP matches demo OTP
    if (otp === DEMO_OTP) {
      const demoUser: AuthUser = {
        uid: 'demo-user-' + Date.now(),
        phoneNumber: phoneNumber || pendingPhoneNumber || '',
        displayName: 'User',
      };
      setUser(demoUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
      pendingPhoneNumber = null;
      return { success: true };
    }

    return { success: false, error: 'Invalid OTP. Use 123456' };
  };

  const demoLogin = () => {
    const demoUser: AuthUser = {
      uid: 'demo-user-' + Date.now(),
      phoneNumber: '+91 98765 43210',
      displayName: 'Demo User',
    };
    setUser(demoUser);
    localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    setUser(null);
    setOnboardingCompleted(null);
    localStorage.removeItem('grocery_auth_user');
    pendingPhoneNumber = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        onboardingCompleted,
        sendOTP,
        verifyOTP,
        demoLogin,
        logout,
        checkOnboardingStatus,
        setOnboardingCompletedLocal,
      }}
    >
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
