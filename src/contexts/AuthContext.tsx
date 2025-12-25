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
  onboardingCompleted: boolean | null;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  setOnboardingCompletedLocal: (completed: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store pending phone number for verification
let pendingPhoneNumber: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
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
    // For now, validate OTP format only (6 digits)
    // TODO: Implement real OTP verification with Firebase
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      const newUser: AuthUser = {
        uid: 'user-' + Date.now(),
        phoneNumber: phoneNumber || pendingPhoneNumber || '',
        displayName: 'User',
      };
      setUser(newUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(newUser));
      pendingPhoneNumber = null;
      return { success: true };
    }

    return { success: false, error: 'Invalid OTP. Please enter a valid 6-digit code.' };
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
        onboardingCompleted,
        sendOTP,
        verifyOTP,
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
