import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          const authUser: AuthUser = {
            uid: session.user.id,
            phoneNumber: session.user.phone || '',
            displayName: session.user.user_metadata?.display_name || undefined,
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
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          uid: session.user.id,
          phoneNumber: session.user.phone || '',
          displayName: session.user.user_metadata?.display_name || undefined,
        };
        setUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      console.error('OTP send error:', error);
      return { success: false, error: errorMessage };
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    // Check for demo OTP first
    if (otp === DEMO_OTP && phoneNumber === '+910000000000') {
      const demoUser: AuthUser = {
        uid: 'demo-user-' + Date.now(),
        phoneNumber: '+91 00000 00000',
        displayName: 'Demo User',
      };
      setUser(demoUser);
      localStorage.setItem('grocery_auth_user', JSON.stringify(demoUser));
      return { success: true };
    }

    // Real Supabase OTP verification
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        const authUser: AuthUser = {
          uid: data.user.id,
          phoneNumber: data.user.phone || '',
          displayName: data.user.user_metadata?.display_name || undefined,
        };
        setUser(authUser);
        localStorage.setItem('grocery_auth_user', JSON.stringify(authUser));
      }
      
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
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setSession(null);
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
