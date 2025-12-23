import { useState, useEffect } from 'react';
import { Tag, Clock, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/grocery/BottomNav';
import { DeliveryActionBar } from '@/components/grocery/DeliveryActionBar';
import { useOffers } from '@/hooks/useFirestoreData';
import { useToast } from '@/hooks/use-toast';

const Offers = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { offers, loading } = useOffers();

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({
      title: 'Coupon copied!',
      description: `Use code ${code} at checkout`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Countdown timer for flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 32, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Offers & Deals</h1>
        <p className="text-sm text-muted-foreground">Save big on your orders</p>
      </header>

      <main className="p-4 space-y-6">
        {/* Flash Sale Banner */}
        <Card className="bg-gradient-to-r from-discount to-accent p-4 rounded-xl overflow-hidden relative">
          <div className="relative z-10">
            <Badge className="bg-card/20 text-card border-0 mb-2">
              ⚡ Flash Sale
            </Badge>
            <h2 className="text-xl font-bold text-card mb-1">
              Up to 60% OFF
            </h2>
            <p className="text-sm text-card/90 mb-3">
              On fresh fruits & vegetables
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-card" />
              <div className="flex gap-1">
                <span className="bg-card/20 text-card px-2 py-1 rounded text-sm font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-card">:</span>
                <span className="bg-card/20 text-card px-2 py-1 rounded text-sm font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-card">:</span>
                <span className="bg-card/20 text-card px-2 py-1 rounded text-sm font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Coupon Cards */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Available Coupons
          </h2>
          <div className="space-y-3">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="p-4 border border-border rounded-xl bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">
                        {offer.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {offer.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-dashed border-primary text-primary font-mono text-xs"
                      >
                        {offer.code}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Min order ₹{offer.minOrder}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={copiedId === offer.id ? 'secondary' : 'default'}
                    onClick={() => handleCopyCode(offer.code, offer.id)}
                    className="shrink-0"
                  >
                    {copiedId === offer.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Bank Offers */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Bank Offers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4 bg-secondary/50 border-0 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <h3 className="font-medium text-foreground">10% Cashback</h3>
                  <p className="text-xs text-muted-foreground">
                    On HDFC Credit Cards
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-secondary/50 border-0 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center text-2xl">
                  📱
                </div>
                <div>
                  <h3 className="font-medium text-foreground">₹50 Cashback</h3>
                  <p className="text-xs text-muted-foreground">
                    Pay via PhonePe UPI
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <DeliveryActionBar />
      <BottomNav />
    </div>
  );
};

export default Offers;
