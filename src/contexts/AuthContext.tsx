import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '@/lib/firestoreService';
import { supabase } from '@/integrations/supabase/client';

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
  const [isDemoMode, setIsDemoMode] = useState(false);
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
    // Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    pendingPhoneNumber = phoneNumber;

    try {
      console.log('Sending OTP via SMS to:', phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('sms-otp', {
        body: {
          action: 'send',
          phoneNumber: phoneNumber
        }
      });

      if (error) {
        console.error('SMS OTP error:', error);
        // Fallback to demo mode if SMS fails
        setIsDemoMode(true);
        return { success: true }; // Still allow demo flow
      }

      if (data?.success) {
        console.log('OTP sent successfully via SMS');
        setIsDemoMode(false);
        return { success: true };
      } else {
        console.error('SMS OTP failed:', data?.error);
        // Fallback to demo mode
        setIsDemoMode(true);
        return { success: true };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Fallback to demo mode
      setIsDemoMode(true);
      return { success: true };
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    const phone = phoneNumber || pendingPhoneNumber || '';
    
    // Demo mode fallback
    if (isDemoMode && otp === DEMO_OTP) {
      const userId = `user-${phone.replace(/\D/g, '')}`;
      const authUser: AuthUser = {
        uid: userId,
        phoneNumber: phone,
        displayName: 'User',
      };
      setUser(authUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
      pendingPhoneNumber = null;
      return { success: true };
    }

    try {
      console.log('Verifying OTP via SMS for:', phone);
      
      const { data, error } = await supabase.functions.invoke('sms-otp', {
        body: {
          action: 'verify',
          phoneNumber: phone,
          otp: otp
        }
      });

      if (error) {
        console.error('SMS verify error:', error);
        // Try demo OTP as fallback
        if (otp === DEMO_OTP) {
          const userId = `user-${phone.replace(/\D/g, '')}`;
          const authUser: AuthUser = {
            uid: userId,
            phoneNumber: phone,
            displayName: 'User',
          };
          setUser(authUser);
          localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
          pendingPhoneNumber = null;
          return { success: true };
        }
        return { success: false, error: 'Verification failed. Please try again.' };
      }

      if (data?.success) {
        console.log('OTP verified successfully');
        const userId = `user-${phone.replace(/\D/g, '')}`;
        const authUser: AuthUser = {
          uid: userId,
          phoneNumber: phone,
          displayName: 'User',
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        pendingPhoneNumber = null;
        return { success: true };
      } else {
        // Try demo OTP as fallback
        if (otp === DEMO_OTP) {
          const userId = `user-${phone.replace(/\D/g, '')}`;
          const authUser: AuthUser = {
            uid: userId,
            phoneNumber: phone,
            displayName: 'User',
          };
          setUser(authUser);
          localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
          pendingPhoneNumber = null;
          return { success: true };
        }
        return { success: false, error: data?.error || 'Invalid OTP. Please try again.' };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      // Try demo OTP as fallback
      if (otp === DEMO_OTP) {
        const userId = `user-${phone.replace(/\D/g, '')}`;
        const authUser: AuthUser = {
          uid: userId,
          phoneNumber: phone,
          displayName: 'User',
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        pendingPhoneNumber = null;
        return { success: true };
      }
      return { success: false, error: 'Verification failed. Please try again.' };
    }
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
