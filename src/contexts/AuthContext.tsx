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

// Store state ID from MojoAuth for OTP verification
let pendingStateId: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
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
      console.log('[MojoAuth] Sending OTP to:', phoneNumber);
      console.log('[MojoAuth] Using API Key:', MOJOAUTH_API_KEY);
      
      // Use MojoAuth REST API to send OTP
      const response = await fetch('https://api.mojoauth.com/users/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': MOJOAUTH_API_KEY,
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });

      console.log('[MojoAuth] Response status:', response.status);
      const data = await response.json();
      console.log('[MojoAuth] Response data:', JSON.stringify(data, null, 2));

      if (response.ok && data.state_id) {
        pendingStateId = data.state_id;
        console.log('[MojoAuth] OTP sent successfully, state_id:', data.state_id);
        setIsDemoMode(false);
        return { success: true };
      } else {
        console.error('[MojoAuth] API Error:', data);
        // Fall back to demo mode
        console.log('[MojoAuth] Falling back to demo mode. Use OTP: 123456');
        setIsDemoMode(true);
        return { success: true };
      }
    } catch (error: any) {
      console.error('[MojoAuth] ❌ sendOTP ERROR:', error);
      console.error('[MojoAuth] Error message:', error?.message);
      
      // Fall back to demo mode if MojoAuth fails
      console.log('[MojoAuth] Falling back to demo mode. Use OTP: 123456');
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
        pendingStateId = null;
        return { success: true };
      }
      return { success: false, error: 'Invalid OTP. Use 123456' };
    }

    try {
      console.log('[MojoAuth] Verifying OTP:', otp);
      console.log('[MojoAuth] State ID:', pendingStateId);
      
      if (!pendingStateId) {
        throw new Error('No pending verification. Please request OTP again.');
      }

      // Use MojoAuth REST API to verify OTP
      const response = await fetch('https://api.mojoauth.com/users/phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': MOJOAUTH_API_KEY,
        },
        body: JSON.stringify({
          state_id: pendingStateId,
          otp: otp,
        }),
      });

      console.log('[MojoAuth] Verify response status:', response.status);
      const data = await response.json();
      console.log('[MojoAuth] Verify response data:', JSON.stringify(data, null, 2));

      if (response.ok && data.authenticated) {
        const authUser: AuthUser = {
          uid: data.user?.user_id || 'mojo-user-' + Date.now(),
          phoneNumber: phoneNumber || pendingPhoneRef.current || '',
          displayName: 'User',
          accessToken: data.oauth?.access_token,
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        pendingPhoneRef.current = null;
        pendingStateId = null;
        return { success: true };
      }

      return { success: false, error: data.message || 'Verification failed. Please try again.' };
    } catch (error: any) {
      console.error('[MojoAuth] ❌ verifyOTP ERROR:', error);
      console.error('[MojoAuth] Error message:', error?.message);
      
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
        pendingStateId = null;
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
    pendingStateId = null;
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
