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
  const [pendingPhone, setPendingPhone] = useState<string>('');

  useEffect(() => {
    // Check for stored demo session
    const storedUser = localStorage.getItem('grocery_auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    setPendingPhone(phoneNumber);
    // Demo mode - simulate OTP sent
    return { success: true };
  };

  const verifyOTP = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    // Demo mode - check for demo OTP
    if (otp === DEMO_OTP) {
      const demoUser: AuthUser = {
        uid: 'user-' + Date.now(),
        phoneNumber: pendingPhone,
        displayName: 'User',
      };
      setUser(demoUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid OTP. Use 123456 for demo.' };
  };

  const demoLogin = () => {
    setUser(DEMO_USER);
    localStorage.setItem('grocery_auth_user', JSON.stringify(DEMO_USER));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('grocery_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode: true, sendOTP, verifyOTP, demoLogin, logout }}>
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
