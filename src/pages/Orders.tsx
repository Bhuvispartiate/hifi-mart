import { Package, ChevronRight, RefreshCw, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BottomNav } from '@/components/grocery/BottomNav';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrders } from '@/hooks/useFirestoreData';
import { useProducts } from '@/hooks/useFirestoreData';
import { toast } from 'sonner';

const statusConfig = {
  pending: {
    label: 'Order Placed',
    color: 'bg-muted text-muted-foreground',
    icon: '📦',
    description: 'Checking stock availability',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-accent text-accent-foreground',
    icon: '✓',
    description: 'Awaiting delivery partner acceptance',
  },
  preparing: {
    label: 'Preparing',
    color: 'bg-primary/80 text-primary-foreground',
    icon: '🍳',
    description: 'Delivery partner accepted, preparing order',
  },
  out_for_delivery: {
    label: 'Out For Delivery',
    color: 'bg-primary text-primary-foreground',
    icon: '🚀',
    description: 'Order picked by delivery partner',
  },
  reached_destination: {
    label: 'Reached Destination',
    color: 'bg-accent text-accent-foreground',
    icon: '📍',
    description: 'Delivery partner has arrived',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-success text-success-foreground',
    icon: '✓',
    description: 'Order completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-destructive text-destructive-foreground',
    icon: '✗',
    description: 'Order was cancelled',
  },
};

const Orders = () => {
  const { user } = useAuth();
  const { orders, loading } = useUserOrders(user?.uid);
  const { products } = useProducts();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  const handleReorder = (order: typeof orders[0]) => {
    // Clear cart first
    clearCart();
    
    // Add each item from the order to cart
    order.items.forEach(item => {
      // Find the product in our products list
      const product = products.find(p => p.name === item.name || p.id === item.productId);
      if (product) {
        for (let i = 0; i < item.qty; i++) {
          addItem(product);
        }
      }
    });
    
    toast.success('Items added to cart', {
      description: `${order.items.length} items from order #${order.id.slice(0, 8)}`,
    });
    
    // Navigate to checkout
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasOrders = orders.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground">Track and manage your orders</p>
      </header>

      <main className="p-4">
        {!hasOrders ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start shopping to see your orders here
            </p>
            <Link to="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const displayDate = order.date || new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              });
              
              return (
                <Card key={order.id} className="p-4 border border-border rounded-xl">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge className={status.color + ' text-[10px] px-1.5'}>
                          {status.icon} {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{displayDate}</p>
                    </div>
                    <span className="font-semibold text-foreground">₹{order.total}</span>
                  </div>

                  {/* Order Items */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-0.5">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground">x{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Info */}
                  {order.status === 'preparing' && (
                    <div className="flex items-center gap-2 mb-3 text-sm bg-primary/10 p-2 rounded-lg">
                      <span className="text-foreground">
                        🍳 Delivery partner accepted, preparing your order
                      </span>
                    </div>
                  )}

                  {order.status === 'out_for_delivery' && order.eta && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        Arriving in <strong>{order.eta}</strong>
                      </span>
                    </div>
                  )}

                  {order.status === 'reached_destination' && order.deliveryOtp && (
                    <div className="flex items-center gap-2 mb-3 text-sm bg-primary/10 p-2 rounded-lg">
                      <span className="text-foreground">
                        OTP: <strong className="text-primary text-lg">{order.deliveryOtp}</strong>
                      </span>
                    </div>
                  )}

                  {order.status === 'delivered' && order.deliveredAt && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <MapPin className="w-4 h-4 text-success" />
                      <span className="text-muted-foreground">
                        Delivered at {order.deliveredAt}
                      </span>
                    </div>
                  )}

                  {order.status === 'cancelled' && order.cancelledReason && (
                    <p className="text-xs text-destructive mb-3">
                      Reason: {order.cancelledReason}
                    </p>
                  )}

                  <Separator className="my-3" />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order)}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reorder
                    </Button>
                    <Link to={`/order/${order.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        {(order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'reached_destination') ? 'Track Order' : 'View Details'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
