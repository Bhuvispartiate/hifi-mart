import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Clock, Package, CheckCircle, Truck, MapPin, Navigation, Loader2, KeyRound, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrder } from '@/hooks/useFirestoreData';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

const OrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, loading } = useOrder(orderId);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground">Track your order</p>
          </div>
        </div>
      </div>

      {/* ETA Card for Out for Delivery */}
      {order.status === 'out_for_delivery' && order.eta && (
        <div className="p-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arriving in</p>
                  <p className="text-xl font-bold text-foreground">{order.eta}</p>
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
                <p className="text-xs text-muted-foreground mt-1">Share this code with the delivery partner to complete delivery</p>
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
                <p className="text-sm text-muted-foreground">Please share the OTP shown above to receive your order</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Delivery Partner Card */}
        {order.deliveryPartner && order.status === 'out_for_delivery' && (
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
                <Button variant="outline" size="icon" className="rounded-full">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Delivery Location Map */}
        {order.deliveryCoordinates && (
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

        {/* Delivery Address (only if no coordinates) */}
        {!order.deliveryCoordinates && (
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

        {/* Order Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
            <div className="relative">
              {order.timeline.map((step, index) => {
                const isLast = index === order.timeline.length - 1;
                const Icon = step.status === 'Delivered' ? CheckCircle :
                            step.status === 'Reached Destination' ? MapPin :
                            step.status === 'Out for Delivery' ? Truck :
                            step.status === 'Order Confirmed' ? CheckCircle :
                            step.status === 'Order Placed' ? Package :
                            step.status === 'Cancelled' ? CheckCircle : Clock;
                
                // Get description for each status
                const getStatusDescription = (status: string) => {
                  switch (status) {
                    case 'Order Placed':
                      return 'Checking for stock availability';
                    case 'Order Confirmed':
                      return 'Awaiting for delivery partner';
                    case 'Out for Delivery':
                      return 'Order picked by delivery partner';
                    case 'Reached Destination':
                      return 'Delivery partner has arrived';
                    case 'Delivered':
                      return 'Order delivered successfully';
                    case 'Cancelled':
                      return 'Order was cancelled';
                    default:
                      return '';
                  }
                };
                
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? step.status === 'Cancelled' 
                            ? 'bg-destructive text-destructive-foreground' 
                            : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-12 ${
                          step.completed ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`font-medium ${
                        step.completed ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getStatusDescription(step.status)}
                      </p>
                      {step.time && (
                        <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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

        {/* Cancelled Reason */}
        {order.status === 'cancelled' && order.cancelledReason && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <p className="text-sm text-destructive">
              <strong>Cancellation Reason:</strong> {order.cancelledReason}
            </p>
          </Card>
        )}

        {/* Help Button */}
        <Button variant="outline" className="w-full">
          Need Help with this Order?
        </Button>
      </div>
    </div>
  );
};

export default OrderStatus;
