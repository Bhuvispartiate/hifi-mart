import { Package, Clock, MapPin, Truck, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { subscribeToUserOrders, Order } from '@/lib/firestoreService';
import { AuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { formatDuration } from '@/lib/etaService';

export const DeliveryActionBar = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setActiveOrder(null);
      return;
    }

    const unsubscribe = subscribeToUserOrders(user.uid, (orders) => {
      // Find active orders with status: confirmed, preparing, out_for_delivery, reached_destination
      const activeStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'reached_destination'];
      const active = orders.find(order => activeStatuses.includes(order.status));
      setActiveOrder(active || null);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (!activeOrder) return null;

  const statusConfig: Record<string, { icon: typeof Package; text: string; color: string }> = {
    confirmed: {
      icon: Package,
      text: 'Order confirmed',
      color: 'bg-primary',
    },
    preparing: {
      icon: Package,
      text: 'Preparing your order',
      color: 'bg-amber-500',
    },
    out_for_delivery: {
      icon: Truck,
      text: 'Out for delivery',
      color: 'bg-primary',
    },
    reached_destination: {
      icon: MapPin,
      text: 'Delivery partner arrived!',
      color: 'bg-green-500',
    },
  };

  const config = statusConfig[activeOrder.status] || statusConfig.confirmed;
  const Icon = config.icon;

  // Show ETA if available for out_for_delivery
  const showEta = activeOrder.status === 'out_for_delivery' && activeOrder.estimatedArrival;

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
            {showEta ? (
              <div className="flex items-center gap-1 text-xs text-primary-foreground/90">
                <Clock className="w-3 h-3" />
                <span>
                  Arriving {format(activeOrder.estimatedArrival!, 'h:mm a')}
                  {activeOrder.estimatedDuration && (
                    <span className="ml-1">({formatDuration(activeOrder.estimatedDuration)})</span>
                  )}
                </span>
              </div>
            ) : (
              <p className="text-xs text-primary-foreground/80">
                {activeOrder.items.length} items • ₹{activeOrder.total}
              </p>
            )}
          </div>
          <Link to={`/order/${activeOrder.id}`}>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0 font-semibold"
            >
              Track
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};