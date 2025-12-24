import { useState, useEffect } from 'react';
import { Package, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { Order, subscribeToAllOrders } from '@/lib/firestoreService';

const filterOrdersByPeriod = (orders: Order[], period: string): Order[] => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return orders.filter(order => order.createdAt >= startOfDay);
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return orders.filter(order => order.createdAt >= weekAgo);
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      return orders.filter(order => order.createdAt >= monthAgo);
    case 'all':
    default:
      return orders;
  }
};

const calculateStats = (orders: Order[]) => {
  return {
    count: orders.length,
    earnings: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  };
};

export default function DeliveryOrders() {
  const [activeTab, setActiveTab] = useState('today');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const { deliveryPartner } = useDeliveryAuth();

  // Subscribe to real-time orders for this delivery partner
  useEffect(() => {
    const unsubscribe = subscribeToAllOrders((orders) => {
      // Filter orders that were delivered by this partner
      const myOrders = orders.filter(order => 
        order.status === 'delivered' && 
        order.deliveryPartner?.id === deliveryPartner?.id
      );
      setAllOrders(myOrders);
    });

    return () => unsubscribe();
  }, [deliveryPartner?.id]);

  const filteredOrders = filterOrdersByPeriod(allOrders, activeTab);
  const stats = calculateStats(filteredOrders);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-12">
        <h1 className="text-xl font-bold">Completed Orders</h1>
        <p className="text-sm opacity-90">View your delivery history</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {/* Stats Card */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.count}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">₹{stats.earnings}</p>
                  <p className="text-xs text-muted-foreground">Order Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="mt-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders found for this period</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="secondary" className="mb-1">#{order.id.slice(0, 8).toUpperCase()}</Badge>
                        <p className="font-medium">{order.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{order.total}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(order.createdAt)} • {formatTime(order.createdAt)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Delivered</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Tabs>
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
