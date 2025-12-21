import { Package, ChevronRight, RefreshCw, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BottomNav } from '@/components/grocery/BottomNav';
import { Link } from 'react-router-dom';

// Mock orders data
const orders = [
  {
    id: 'ORD001',
    date: '21 Dec 2024',
    status: 'delivered',
    total: 456,
    items: [
      { name: 'Fresh Bananas', qty: 2 },
      { name: 'Amul Milk', qty: 1 },
      { name: 'Red Apples', qty: 1 },
    ],
    deliveredAt: '10:32 AM',
  },
  {
    id: 'ORD002',
    date: '20 Dec 2024',
    status: 'on_the_way',
    total: 289,
    items: [
      { name: 'Tomatoes', qty: 1 },
      { name: 'Onions', qty: 2 },
    ],
    eta: '12 mins',
  },
  {
    id: 'ORD003',
    date: '18 Dec 2024',
    status: 'cancelled',
    total: 199,
    items: [{ name: 'Bread', qty: 1 }],
    cancelledReason: 'Item out of stock',
  },
];

const statusConfig = {
  delivered: {
    label: 'Delivered',
    color: 'bg-success text-success-foreground',
    icon: '✓',
  },
  on_the_way: {
    label: 'On the way',
    color: 'bg-accent text-accent-foreground',
    icon: '🚀',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-destructive text-destructive-foreground',
    icon: '✗',
  },
};

const Orders = () => {
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
              const status = statusConfig[order.status as keyof typeof statusConfig];
              return (
                <Card key={order.id} className="p-4 border border-border rounded-xl">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          #{order.id}
                        </span>
                        <Badge className={status.color + ' text-[10px] px-1.5'}>
                          {status.icon} {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
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
                  {order.status === 'on_the_way' && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-foreground">
                        Arriving in <strong>{order.eta}</strong>
                      </span>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <MapPin className="w-4 h-4 text-success" />
                      <span className="text-muted-foreground">
                        Delivered at {order.deliveredAt}
                      </span>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <p className="text-xs text-destructive mb-3">
                      Reason: {order.cancelledReason}
                    </p>
                  )}

                  <Separator className="my-3" />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reorder
                    </Button>
                    <Button variant="ghost" size="sm" className="text-primary">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
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
