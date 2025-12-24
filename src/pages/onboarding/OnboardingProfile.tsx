import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, User, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PhoneVerificationStep = 'input' | 'otp' | 'verified';

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const { user, sendOTP, verifyOTP, isDemoMode } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneVerificationStep>('input');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setOtpLoading(true);
    const fullPhone = `+91${phoneNumber}`;
    const result = await sendOTP(fullPhone);
    setOtpLoading(false);

    if (result.success) {
      setPhoneStep('otp');
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

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setOtpLoading(true);
    const fullPhone = `+91${phoneNumber}`;
    const result = await verifyOTP(fullPhone, otp);
    setOtpLoading(false);

    if (result.success) {
      setPhoneStep('verified');
      setVerifiedPhone(fullPhone);
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully',
      });
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleChangePhone = () => {
    setPhoneStep('input');
    setOtp('');
    setVerifiedPhone('');
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to continue',
        variant: 'destructive',
      });
      return;
    }

    if (name.trim().length < 2) {
      toast({
        title: 'Invalid Name',
        description: 'Name must be at least 2 characters',
        variant: 'destructive',
      });
      return;
    }

    if (phoneStep !== 'verified') {
      toast({
        title: 'Phone Verification Required',
        description: 'Please verify your phone number to continue',
        variant: 'destructive',
      });
      return;
    }

    // Store temporarily and navigate
    sessionStorage.setItem('onboarding_name', name.trim());
    sessionStorage.setItem('onboarding_email', email.trim());
    sessionStorage.setItem('onboarding_phone', verifiedPhone);
    navigate('/onboarding/address');
  };

  const canContinue = name.trim().length >= 2 && phoneStep === 'verified';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/onboarding')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Your Profile</h1>
            <p className="text-sm text-muted-foreground">Step 1 of 2</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-1/2 transition-all" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Tell us about yourself</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This helps us personalize your experience
          </p>
        </div>

        <div className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                maxLength={50}
              />
            </div>
          </div>

          {/* Phone Number Verification */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            
            {phoneStep === 'input' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 bg-muted rounded-md border border-input">
                    <span className="text-sm text-muted-foreground">+91</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      className="pl-10"
                      maxLength={10}
                    />
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={otpLoading || phoneNumber.length !== 10}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
            )}

            {phoneStep === 'otp' && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">+91 {phoneNumber}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 h-auto"
                    onClick={handleChangePhone}
                  >
                    Change
                  </Button>
                </div>
                
                <div className="flex justify-center py-2">
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

                <Button 
                  type="button"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setOtp('');
                    handleSendOTP();
                  }}
                  disabled={otpLoading}
                >
                  Resend OTP
                </Button>
              </div>
            )}

            {phoneStep === 'verified' && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{verifiedPhone}</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-0 h-auto"
                  onClick={handleChangePhone}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                maxLength={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send order updates and offers to this email
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6">
        <Button 
          className="w-full h-12 text-base"
          onClick={handleContinue}
          disabled={loading || !canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingProfile;
