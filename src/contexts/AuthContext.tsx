import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getUserProfile } from '@/lib/firestoreService';
import { MOJOAUTH_API_KEY } from '@/lib/mojoauth';

interface AuthUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  accessToken?: string;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo OTP for testing when MojoAuth fails
const DEMO_OTP = '123456';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const mojoAuthRef = useRef<any>(null);
  const pendingPhoneRef = useRef<string | null>(null);

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
    // Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    pendingPhoneRef.current = phoneNumber;

    try {
      // Dynamically import MojoAuth SDK
      const MojoAuth = (await import('mojoauth-web-sdk')).default;
      
      const config = {
        language: 'en',
        source: [{ type: 'phone' as const, feature: 'otp' as const }],
      };

      mojoAuthRef.current = new MojoAuth(MOJOAUTH_API_KEY, config);
      
      // Send OTP using MojoAuth
      await mojoAuthRef.current.signInWithPhone(phoneNumber);
      
      setIsDemoMode(false);
      return { success: true };
    } catch (error: any) {
      console.error('MojoAuth sendOTP error:', error);
      // Fall back to demo mode if MojoAuth fails
      setIsDemoMode(true);
      return { success: true };
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    // If in demo mode, check demo OTP
    if (isDemoMode) {
      if (otp === DEMO_OTP) {
        const demoUser: AuthUser = {
          uid: 'demo-user-' + Date.now(),
          phoneNumber: phoneNumber || pendingPhoneRef.current || '',
          displayName: 'User',
        };
        setUser(demoUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
        pendingPhoneRef.current = null;
        return { success: true };
      }
      return { success: false, error: 'Invalid OTP. Use 123456' };
    }

    try {
      // Verify OTP using MojoAuth
      if (!mojoAuthRef.current) {
        throw new Error('MojoAuth not initialized');
      }

      const response = await mojoAuthRef.current.verifyOTP(otp, phoneNumber);
      
      if (response && response.authenticated) {
        const authUser: AuthUser = {
          uid: response.user?.user_id || 'mojo-user-' + Date.now(),
          phoneNumber: phoneNumber || pendingPhoneRef.current || '',
          displayName: 'User',
          accessToken: response.oauth?.access_token,
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        pendingPhoneRef.current = null;
        return { success: true };
      }

      return { success: false, error: 'Verification failed. Please try again.' };
    } catch (error: any) {
      console.error('MojoAuth verifyOTP error:', error);
      
      // If MojoAuth verification fails, try demo OTP as fallback
      if (otp === DEMO_OTP) {
        const demoUser: AuthUser = {
          uid: 'demo-user-' + Date.now(),
          phoneNumber: phoneNumber || pendingPhoneRef.current || '',
          displayName: 'User',
        };
        setUser(demoUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
        pendingPhoneRef.current = null;
        setIsDemoMode(true);
        return { success: true };
      }
      
      return { success: false, error: error.message || 'Verification failed. Please try again.' };
    }
  };

  const demoLogin = () => {
    const demoUser: AuthUser = {
      uid: 'demo-user-' + Date.now(),
      phoneNumber: '+91 98765 43210',
      displayName: 'Demo User',
    };
    setUser(demoUser);
    setIsDemoMode(true);
    localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    setUser(null);
    setOnboardingCompleted(null);
    setIsDemoMode(false);
    localStorage.removeItem('grocery_auth_user');
    pendingPhoneRef.current = null;
    mojoAuthRef.current = null;
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
