import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Clock, Package, CheckCircle, Truck, MapPin, Navigation, Loader2, KeyRound, Home, ChefHat, UserCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRealtimeOrder } from '@/hooks/useRealtimeOrders';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

// Status configuration with order, icons, labels, and descriptions
const statusFlow = [
  { 
    key: 'pending', 
    label: 'Order Placed', 
    description: 'Waiting for admin to confirm availability',
    icon: Package 
  },
  { 
    key: 'confirmed', 
    label: 'Confirmed', 
    description: 'Awaiting delivery partner acceptance',
    icon: CheckCircle 
  },
  { 
    key: 'preparing', 
    label: 'Preparing', 
    description: 'Delivery partner accepted, preparing order',
    icon: ChefHat 
  },
  { 
    key: 'out_for_delivery', 
    label: 'Out for Delivery', 
    description: 'Order picked by delivery partner',
    icon: Truck 
  },
  { 
    key: 'reached_destination', 
    label: 'Reached Destination', 
    description: 'Delivery partner has arrived',
    icon: MapPin 
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    description: 'Order delivered successfully',
    icon: CheckCircle 
  },
];

const OrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, loading } = useRealtimeOrder(orderId || null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get current status index for timeline
  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    if (order.status === 'cancelled') return -1;
    return statusFlow.findIndex(s => s.key === order.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  // Initialize map if coordinates are available
  useEffect(() => {
    if (!order?.deliveryCoordinates || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const { lat, lng } = order.deliveryCoordinates;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
      interactive: false,
    });

    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
      <div style="
        width: 36px; 
        height: 36px; 
        background: hsl(130, 85%, 28%); 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 16px;">📍</div>
      </div>
    `;

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([lng, lat])
      .addTo(map.current);

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [order?.deliveryCoordinates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Order not found</h2>
          <Button onClick={() => navigate('/orders')} variant="outline">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  // Get current status display info
  const getCurrentStatusInfo = () => {
    if (order.status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-destructive text-destructive-foreground', icon: XCircle };
    }
    const status = statusFlow.find(s => s.key === order.status);
    return status || statusFlow[0];
  };

  const currentStatus = getCurrentStatusInfo();

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground">Track your order</p>
          </div>
          <Badge className={order.status === 'cancelled' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}>
            {currentStatus.label}
          </Badge>
        </div>
      </div>

      {/* Status-specific Cards */}
      
      {/* Pending Status Card */}
      {order.status === 'pending' && (
        <div className="p-4">
          <Card className="p-4 bg-muted/50 border-muted">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-foreground">Order Received</p>
                <p className="text-sm text-muted-foreground">Waiting for admin to confirm availability</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmed Status Card */}
      {order.status === 'confirmed' && (
        <div className="p-4">
          <Card className="p-4 bg-accent/10 border-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-accent-foreground animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-foreground">Finding Delivery Partner</p>
                <p className="text-sm text-muted-foreground">Awaiting delivery partner to accept your order</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preparing Status Card */}
      {order.status === 'preparing' && (
        <div className="p-4">
          <Card className="p-4 bg-primary/10 border-primary/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <p className="font-medium text-foreground">Preparing Your Order</p>
                <p className="text-sm text-muted-foreground">Delivery partner accepted and is preparing pickup</p>
              </div>
            </div>
            {order.deliveryPartner && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {order.deliveryPartner.name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-foreground">{order.deliveryPartner.name} will pick up soon</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Out for Delivery - ETA Card */}
      {order.status === 'out_for_delivery' && (
        <div className="p-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {order.eta ? 'Arriving in' : 'On the way'}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {order.eta || 'Soon'}
                  </p>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground">Live</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* OTP Card - Only shown when delivery partner has reached destination */}
      {order.status === 'reached_destination' && order.deliveryOtp && (
        <div className="p-4 pb-0">
          <Card className="p-4 bg-success/10 border-success/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <KeyRound className="h-7 w-7 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Your Delivery OTP</p>
                <p className="text-3xl font-bold text-foreground tracking-widest">{order.deliveryOtp}</p>
                <p className="text-xs text-muted-foreground mt-1">Share this code with the delivery partner</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reached Destination Banner */}
      {order.status === 'reached_destination' && (
        <div className="px-4 pt-4">
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Delivery partner has arrived!</p>
                <p className="text-sm text-muted-foreground">Please share the OTP to receive your order</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delivered Success Card */}
      {order.status === 'delivered' && (
        <div className="p-4">
          <Card className="p-4 bg-success/10 border-success/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Order Delivered!</p>
                <p className="text-sm text-muted-foreground">
                  {order.deliveredAt ? `Delivered at ${order.deliveredAt}` : 'Thank you for ordering'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Delivery Partner Card - Show for preparing, out_for_delivery, reached_destination */}
        {order.deliveryPartner && ['preparing', 'out_for_delivery', 'reached_destination'].includes(order.status) && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {order.deliveryPartner.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{order.deliveryPartner.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>⭐ {order.deliveryPartner.rating}</span>
                    <span>• Delivery Partner</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full" asChild>
                  <a href={`tel:${order.deliveryPartner.phone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Delivery Location Map - Show for out_for_delivery and reached_destination */}
        {order.deliveryCoordinates && ['out_for_delivery', 'reached_destination'].includes(order.status) && (
          <Card className="overflow-hidden">
            <div className="relative">
              <div 
                ref={mapContainer} 
                className="w-full h-[180px] bg-muted"
              />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Delivery Location</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Delivery Address Card - Show for other statuses */}
        {!['out_for_delivery', 'reached_destination'].includes(order.status) && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Delivery Address</p>
                <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Order Timeline - Dynamic based on current status */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Order Progress</h3>
          <div className="relative">
            {order.status === 'cancelled' ? (
              // Cancelled order timeline
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
                    <XCircle className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-destructive">Order Cancelled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.cancelledReason || 'This order was cancelled'}
                  </p>
                </div>
              </div>
            ) : (
              // Normal order timeline
              statusFlow.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isLast = index === statusFlow.length - 1;
                const Icon = status.icon;

                return (
                  <div key={status.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                        <Icon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-10 transition-all ${
                          isCompleted && index < currentStatusIndex ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                    <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`font-medium ${
                        isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {status.label}
                        {isCurrent && (
                          <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {status.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">x{item.qty}</span>
                </div>
                <span className="text-sm font-medium text-foreground">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-foreground">₹{order.total}</span>
          </div>
        </Card>

        {/* Help Button */}
        <Button variant="outline" className="w-full">
          Need Help with this Order?
        </Button>
      </div>
    </div>
  );
};

export default OrderStatus;
