import { useState } from 'react';
import { Package, MapPin, Clock, IndianRupee, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';

interface CompletedOrder {
  id: string;
  shopName: string;
  customerName: string;
  customerAddress: string;
  itemCount: number;
  earning: number;
  distance: string;
  completedAt: Date;
}

// Mock data for completed orders
const mockOrders: CompletedOrder[] = [
  {
    id: 'ORD-2024-001',
    shopName: 'Fresh Mart Grocery',
    customerName: 'Rahul Kumar',
    customerAddress: '456 Green Avenue, Sector 22',
    itemCount: 8,
    earning: 45,
    distance: '3.2 km',
    completedAt: new Date(),
  },
  {
    id: 'ORD-2024-002',
    shopName: 'Fresh Mart Grocery',
    customerName: 'Priya Sharma',
    customerAddress: '789 Blue Street, Sector 18',
    itemCount: 5,
    earning: 35,
    distance: '2.1 km',
    completedAt: new Date(),
  },
  {
    id: 'ORD-2024-003',
    shopName: 'Fresh Mart Grocery',
    customerName: 'Amit Patel',
    customerAddress: '321 Red Lane, Sector 25',
    itemCount: 12,
    earning: 55,
    distance: '4.5 km',
    completedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'ORD-2024-004',
    shopName: 'Fresh Mart Grocery',
    customerName: 'Sneha Reddy',
    customerAddress: '654 Yellow Road, Sector 30',
    itemCount: 6,
    earning: 40,
    distance: '2.8 km',
    completedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'ORD-2024-005',
    shopName: 'Fresh Mart Grocery',
    customerName: 'Vikram Singh',
    customerAddress: '987 Purple Ave, Sector 12',
    itemCount: 10,
    earning: 50,
    distance: '3.8 km',
    completedAt: new Date(Date.now() - 86400000 * 10),
  },
];

const filterOrdersByPeriod = (orders: CompletedOrder[], period: string): CompletedOrder[] => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return orders.filter(order => order.completedAt >= startOfDay);
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return orders.filter(order => order.completedAt >= weekAgo);
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      return orders.filter(order => order.completedAt >= monthAgo);
    case 'all':
    default:
      return orders;
  }
};

const calculateStats = (orders: CompletedOrder[]) => {
  return {
    count: orders.length,
    earnings: orders.reduce((sum, o) => sum + o.earning, 0),
    distance: orders.reduce((sum, o) => sum + parseFloat(o.distance), 0).toFixed(1),
  };
};

export default function DeliveryOrders() {
  const [activeTab, setActiveTab] = useState('today');

  const filteredOrders = filterOrdersByPeriod(mockOrders, activeTab);
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.count}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">₹{stats.earnings}</p>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.distance} km</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
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
                        <Badge variant="secondary" className="mb-1">{order.id}</Badge>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{order.earning}</p>
                        <p className="text-xs text-muted-foreground">{order.distance}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{order.customerAddress}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(order.completedAt)} • {formatTime(order.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{order.itemCount} items</span>
                      </div>
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
