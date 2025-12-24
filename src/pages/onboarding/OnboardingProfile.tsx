import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Store temporarily and navigate
    sessionStorage.setItem('onboarding_name', name.trim());
    sessionStorage.setItem('onboarding_email', email.trim());
    navigate('/onboarding/address');
  };

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

        <div className="bg-muted/50 rounded-xl p-4 mt-6">
          <p className="text-sm text-muted-foreground">
            📱 Phone: <span className="font-medium text-foreground">{user?.phoneNumber || 'Not set'}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6">
        <Button 
          className="w-full h-12 text-base"
          onClick={handleContinue}
          disabled={loading || !name.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingProfile;
