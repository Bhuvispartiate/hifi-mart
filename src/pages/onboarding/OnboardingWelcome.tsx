import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, Truck, Clock } from 'lucide-react';

const OnboardingWelcome = () => {
  const navigate = useNavigate();

  const features = [
    { icon: MapPin, title: 'Local Delivery', description: 'Serving Ponneri & nearby areas' },
    { icon: Truck, title: 'Fast Delivery', description: 'Get groceries in 10-15 mins' },
    { icon: Clock, title: 'Fresh Always', description: 'Farm fresh products daily' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <ShoppingBag className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to HiFi-Mart
        </h1>
        <p className="text-muted-foreground mb-8">
          Ponneri's favorite hyper-local grocery store
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 space-y-3">
        <Button 
          className="w-full h-12 text-base"
          onClick={() => navigate('/onboarding/profile')}
        >
          Get Started
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
