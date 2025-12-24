import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
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

    setLoading(true);
    // Store name in session storage for later use
    sessionStorage.setItem('onboarding_name', name.trim());
    setLoading(false);
    navigate('/onboarding/address');
  };

  const canContinue = name.trim().length >= 2;

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
          <h2 className="text-xl font-semibold text-foreground">What's your name?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This helps us personalize your experience
          </p>
        </div>

        <div className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                maxLength={50}
                autoFocus
              />
            </div>
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
