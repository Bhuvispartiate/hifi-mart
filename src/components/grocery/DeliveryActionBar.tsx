import { Package, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface ActiveDelivery {
  orderId: string;
  status: 'preparing' | 'on_the_way' | 'nearby';
  eta: number;
  itemCount: number;
}

export const DeliveryActionBar = () => {
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Simulated active delivery - in production, this would come from backend
    const mockDelivery: ActiveDelivery = {
      orderId: 'ORD-001',
      status: 'on_the_way',
      eta: 8,
      itemCount: 4,
    };
    setActiveDelivery(mockDelivery);
  }, []);

  if (!activeDelivery || dismissed) return null;

  const statusConfig = {
    preparing: {
      icon: Package,
      text: 'Preparing your order',
      color: 'bg-amber-500',
    },
    on_the_way: {
      icon: MapPin,
      text: 'Out for delivery',
      color: 'bg-primary',
    },
    nearby: {
      icon: Clock,
      text: 'Arriving soon!',
      color: 'bg-green-500',
    },
  };

  const config = statusConfig[activeDelivery.status];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-2 safe-area-pb">
      <div className={`${config.color} rounded-2xl shadow-lg overflow-hidden`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center justify-center w-10 h-10 bg-background/20 rounded-full">
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-foreground">
              {config.text}
            </p>
            <p className="text-xs text-primary-foreground/80">
              {activeDelivery.itemCount} items • ETA {activeDelivery.eta} mins
            </p>
          </div>
          <Link to={`/order/${activeDelivery.orderId}`}>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0 font-semibold"
            >
              Track
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-background/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
