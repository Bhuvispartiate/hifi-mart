import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Demo OTP for testing
const DEMO_OTP = '123456';

// Store pending phone number for verification
let pendingPhoneNumber: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

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

  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    // Validate phone number format (basic validation)
    if (!phoneNumber || phoneNumber.length < 10) {
      return { success: false, error: 'Please enter a valid phone number' };
    }
    
    // Store phone number for verification step
    pendingPhoneNumber = phoneNumber;
    
    // Simulate OTP send delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    localStorage.removeItem('grocery_auth_user');
    pendingPhoneNumber = null;
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
