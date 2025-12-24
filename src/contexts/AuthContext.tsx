import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { getUserProfile } from '@/lib/firestoreService';
import { loadOTPlessSDK, OTPLESS_APP_ID, OTPlessCallback, OTPlessUser } from '@/lib/otpless';

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
  initWhatsAppAuth: () => Promise<{ success: boolean; error?: string }>;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  setOnboardingCompletedLocal: (completed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo OTP for testing when OTPless fails
const DEMO_OTP = '123456';

// Store OTPless SDK instance
let otplessInstance: any = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const pendingPhoneRef = useRef<string | null>(null);
  const authCallbackRef = useRef<((user: OTPlessUser) => void) | null>(null);

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

  // Handle OTPless callback
  const handleOTPlessCallback = useCallback((result: OTPlessCallback) => {
    console.log('[OTPless] Callback received:', result);
    
    if (result.responseType === 'ONETAP' || result.responseType === 'OTP' || result.responseType === 'OAUTH') {
      if (result.response) {
        const otplessUser = result.response;
        const phoneIdentity = otplessUser.identities?.find(
          (id) => id.identityType === 'MOBILE' || id.identityType === 'PHONE'
        );
        const whatsappIdentity = otplessUser.identities?.find(
          (id) => id.channel === 'WHATSAPP'
        );
        
        const identity = whatsappIdentity || phoneIdentity || otplessUser.identities?.[0];
        
        const authUser: AuthUser = {
          uid: otplessUser.userId || 'otpless-user-' + Date.now(),
          phoneNumber: identity?.identityValue || pendingPhoneRef.current || '',
          displayName: identity?.name || 'User',
          accessToken: otplessUser.token,
        };
        
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
        pendingPhoneRef.current = null;
        
        if (authCallbackRef.current) {
          authCallbackRef.current(otplessUser);
        }
      }
    }
  }, []);

  // Initialize OTPless SDK
  useEffect(() => {
    const initOTPless = async () => {
      try {
        await loadOTPlessSDK();
        
        // Set up callback
        (window as any).otpless = handleOTPlessCallback;
        
        // Initialize OTPless instance
        if ((window as any).OTPless) {
          otplessInstance = new (window as any).OTPless(handleOTPlessCallback);
          console.log('[OTPless] Initialized successfully');
        }
      } catch (error) {
        console.error('[OTPless] Initialization failed:', error);
        setIsDemoMode(true);
      }
    };

    initOTPless();
  }, [handleOTPlessCallback]);

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

  // WhatsApp OAuth flow
  const initWhatsAppAuth = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[OTPless] Initiating WhatsApp OAuth...');
      
      if (!otplessInstance) {
        console.log('[OTPless] SDK not initialized, falling back to demo mode');
        setIsDemoMode(true);
        return { success: true };
      }

      // Initiate WhatsApp OAuth
      await otplessInstance.initiate({
        channel: 'WHATSAPP',
        channelType: 'WHATSAPP',
      });

      return { success: true };
    } catch (error: any) {
      console.error('[OTPless] WhatsApp auth error:', error);
      setIsDemoMode(true);
      return { success: true };
    }
  };

  // Phone OTP flow (fallback)
  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    pendingPhoneRef.current = phoneNumber;

    try {
      console.log('[OTPless] Sending OTP to:', phoneNumber);
      
      if (!otplessInstance) {
        console.log('[OTPless] SDK not initialized, falling back to demo mode');
        setIsDemoMode(true);
        return { success: true };
      }

      // Extract country code and phone
      const countryCode = phoneNumber.startsWith('+') ? phoneNumber.slice(0, 3) : '+91';
      const phone = phoneNumber.replace(/^\+\d{1,3}/, '');

      await otplessInstance.initiate({
        channel: 'PHONE',
        phone: phone,
        countryCode: countryCode,
      });

      setIsDemoMode(false);
      return { success: true };
    } catch (error: any) {
      console.error('[OTPless] sendOTP ERROR:', error);
      console.log('[OTPless] Falling back to demo mode. Use OTP: 123456');
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
      console.log('[OTPless] Verifying OTP:', otp);
      
      if (!otplessInstance) {
        throw new Error('OTPless not initialized');
      }

      const countryCode = phoneNumber.startsWith('+') ? phoneNumber.slice(0, 3) : '+91';
      const phone = phoneNumber.replace(/^\+\d{1,3}/, '');

      // Create a promise to wait for callback
      const verifyPromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Verification timeout. Please try again.' });
        }, 30000);

        authCallbackRef.current = () => {
          clearTimeout(timeout);
          resolve({ success: true });
        };
      });

      await otplessInstance.verify({
        channel: 'PHONE',
        phone: phone,
        otp: otp,
        countryCode: countryCode,
      });

      return await verifyPromise;
    } catch (error: any) {
      console.error('[OTPless] verifyOTP ERROR:', error);
      
      // If OTPless verification fails, try demo OTP as fallback
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        onboardingCompleted,
        initWhatsAppAuth,
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
