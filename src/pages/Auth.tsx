import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Phone, ArrowLeft, Sparkles } from 'lucide-react';

type AuthStep = 'phone' | 'otp';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, sendOTP, verifyOTP, demoLogin, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    if (user) {
      navigate(returnUrl, { replace: true });
    }
  }, [user, navigate, returnUrl]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const fullPhone = `+91${phoneNumber}`;
    setFullPhoneNumber(fullPhone);
    const result = await sendOTP(fullPhone);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: isDemoMode ? 'Use 123456 as demo OTP' : 'Please check your phone for OTP',
      });
    } else {
      toast({
        title: 'Failed to send OTP',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await verifyOTP(fullPhoneNumber, otp);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome!',
        description: 'You have successfully logged in',
      });
      navigate(returnUrl, { replace: true });
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    toast({
      title: 'Demo Login',
      description: 'Logged in as Demo User',
    });
    navigate(returnUrl, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-4">
      
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">FreshMart</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {step === 'otp' && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={() => {
                setStep('phone');
                setOtp('');
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <CardTitle className="text-xl">
            {step === 'phone' ? 'Login or Sign Up' : 'Verify OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Enter your mobile number to continue'
              : `We've sent a code to +91 ${phoneNumber}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-3 bg-muted rounded-md border border-input">
                  <span className="text-sm text-muted-foreground">+91</span>
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || phoneNumber.length !== 10}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {isDemoMode && (
                <p className="text-sm text-center text-muted-foreground">
                  Demo mode: Use OTP <span className="font-mono font-bold text-primary">123456</span>
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setOtp('');
                  handlePhoneSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
              >
                Resend OTP
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDemoLogin}
          >
            <Sparkles className="h-4 w-4" />
            Quick Demo Login
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
