import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';

const OnboardingComplete = () => {
  const navigate = useNavigate();
  const [showCheck, setShowCheck] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    // Staggered animations
    const checkTimer = setTimeout(() => setShowCheck(true), 200);
    const textTimer = setTimeout(() => setShowText(true), 600);
    const subtextTimer = setTimeout(() => setShowSubtext(true), 900);

    // Redirect to home after 2 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(textTimer);
      clearTimeout(subtextTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full animate-pulse delay-100" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/15 rounded-full animate-pulse delay-200" />
      </div>

      {/* Success animation container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Animated check icon */}
        <div
          className={`relative transition-all duration-500 ease-out ${
            showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          {/* Outer ring animation */}
          <div className="absolute inset-0 w-28 h-28 bg-primary/20 rounded-full animate-ping" />
          
          {/* Main icon container */}
          <div className="relative w-28 h-28 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <CheckCircle2 className="w-14 h-14 text-primary-foreground" strokeWidth={2.5} />
          </div>

          {/* Sparkle decorations */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-bounce" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary/70 animate-bounce delay-150" />
        </div>

        {/* Welcome text */}
        <div
          className={`transition-all duration-500 ease-out delay-100 ${
            showText ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h1>
          <p className="text-lg text-muted-foreground">Welcome to HiFi-Mart</p>
        </div>

        {/* Subtext with logo */}
        <div
          className={`transition-all duration-500 ease-out delay-200 ${
            showSubtext ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-sm">Ponneri's favorite grocery store</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div
          className={`mt-8 transition-all duration-500 ease-out delay-300 ${
            showSubtext ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingComplete;
