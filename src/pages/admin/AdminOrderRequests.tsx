import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  MapPin, 
  Clock, 
  User,
  ShoppingBag,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus, Order, autoAssignDeliveryPartner } from '@/lib/firestoreService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminOrderRequests = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCountRef = useRef<number>(0);
  const { play: playNotification, stop: stopNotification } = useNotificationSound(4);

  useEffect(() => {
    // Subscribe to pending orders
    const pendingQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    );

    const confirmedQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'confirmed')
    );

    const cancelledQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'cancelled')
    );

    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });
      const sortedOrders = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Play notification if new pending orders arrived
      if (sortedOrders.length > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        if (soundEnabled) {
          playNotification();
        }
        toast({
          title: 'New Order Received!',
          description: `${sortedOrders.length - prevPendingCountRef.current} new order(s) pending review`,
        });
      }
      prevPendingCountRef.current = sortedOrders.length;
      
      setPendingOrders(sortedOrders);
      setLoading(false);
    });

    const unsubConfirmed = onSnapshot(confirmedQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });
      setConfirmedOrders(orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    const unsubCancelled = onSnapshot(cancelledQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });
      setCancelledOrders(orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => {
      unsubPending();
      unsubConfirmed();
      unsubCancelled();
    };
  }, []);

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      // Auto-assign delivery partner when accepting order
      const partner = await autoAssignDeliveryPartner(orderId);
      if (partner) {
        toast({
          title: 'Order Accepted',
          description: `Assigned to ${partner.name}. Awaiting delivery partner acceptance.`,
        });
      } else {
        toast({
          title: 'Order Accepted',
          description: 'No delivery partner available. Order confirmed.',
        });
      }

      const success = await updateOrderStatus(orderId, 'confirmed');
      if (!success) {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept order.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOrderId) return;
    
    setProcessingId(selectedOrderId);
    try {
      const success = await updateOrderStatus(selectedOrderId, 'cancelled', {
        cancelledReason: 'Stock not available',
      });
      if (success) {
        toast({
          title: 'Order Rejected',
          description: 'Order has been cancelled due to stock unavailability.',
        });
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject order.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  const openRejectDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const OrderCard = ({ order, showActions = false }: { order: Order; showActions?: boolean }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {formatDate(order.createdAt)}
          </div>
        </div>
        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
          {order.status === 'pending' && 'Pending Review'}
          {order.status === 'confirmed' && 'Awaiting Pickup'}
          {order.status === 'cancelled' && 'Rejected'}
        </Badge>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{item.name}</span>
              <span className="text-muted-foreground">x{item.qty}</span>
            </div>
            <span className="text-foreground">₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <span className="font-medium text-foreground">Total</span>
        <span className="font-bold text-primary">₹{order.total}</span>
      </div>

      {/* Delivery Address */}
      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground line-clamp-2">{order.deliveryAddress}</p>
      </div>

      {/* Cancelled Reason */}
      {order.status === 'cancelled' && order.cancelledReason && (
        <div className="mt-3 p-2 bg-destructive/10 rounded-md">
          <p className="text-sm text-destructive">Reason: {order.cancelledReason}</p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1"
            onClick={() => handleAccept(order.id)}
            disabled={processingId === order.id}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {processingId === order.id ? 'Processing...' : 'Accept'}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => openRejectDialog(order.id)}
            disabled={processingId === order.id}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Requests</h1>
          <p className="text-muted-foreground">Review and manage incoming orders</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) {
              stopNotification();
            }
          }}
        >
          {soundEnabled ? (
            <><Volume2 className="h-4 w-4 mr-2" /> Sound On</>
          ) : (
            <><VolumeX className="h-4 w-4 mr-2" /> Sound Off</>
          )}
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingOrders.length > 0 && (
              <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed
            {confirmedOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {confirmedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {cancelledOrders.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {cancelledOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending orders to review</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed">
          {confirmedOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No confirmed orders awaiting pickup</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {confirmedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {cancelledOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No rejected orders</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cancelledOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and notify the customer that the items are not available. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrderRequests;
