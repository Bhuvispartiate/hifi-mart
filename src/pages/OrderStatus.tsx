import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Phone, MessageCircle, Clock, Package, CheckCircle, Truck, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface DeliveryPartner {
  name: string;
  phone: string;
  rating: number;
}

interface TimelineStep {
  status: string;
  time: string;
  completed: boolean;
}

interface Location {
  lat: number;
  lng: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryPartner?: DeliveryPartner;
  timeline: TimelineStep[];
  eta?: string;
  partnerLocation?: Location;
  destinationLocation?: Location;
  cancelledReason?: string;
}

// Mock order data with tracking info
const mockOrderData: Record<string, Order> = {
  'ORD001': {
    id: 'ORD001',
    status: 'delivered',
    total: 456,
    items: [
      { name: 'Fresh Bananas', qty: 2, price: 45 },
      { name: 'Amul Milk', qty: 1, price: 28 },
      { name: 'Red Apples', qty: 1, price: 180 },
    ],
    deliveryAddress: '123, Green Valley Apartments, Koramangala, Bangalore - 560034',
    deliveryPartner: { name: 'Rajesh Kumar', phone: '+91 98765 43210', rating: 4.8 },
    timeline: [
      { status: 'Order Placed', time: '10:00 AM', completed: true },
      { status: 'Order Confirmed', time: '10:02 AM', completed: true },
      { status: 'Preparing', time: '10:05 AM', completed: true },
      { status: 'Out for Delivery', time: '10:20 AM', completed: true },
      { status: 'Delivered', time: '10:32 AM', completed: true },
    ],
  },
  'ORD002': {
    id: 'ORD002',
    status: 'out_for_delivery',
    total: 289,
    eta: '12 mins',
    items: [
      { name: 'Tomatoes', qty: 1, price: 35 },
      { name: 'Onions', qty: 2, price: 40 },
    ],
    deliveryAddress: '456, Palm Grove Society, HSR Layout, Bangalore - 560102',
    deliveryPartner: { name: 'Suresh Babu', phone: '+91 87654 32109', rating: 4.9 },
    partnerLocation: { lat: 12.9352, lng: 77.6245 },
    destinationLocation: { lat: 12.9141, lng: 77.6411 },
    timeline: [
      { status: 'Order Placed', time: '11:30 AM', completed: true },
      { status: 'Order Confirmed', time: '11:32 AM', completed: true },
      { status: 'Preparing', time: '11:35 AM', completed: true },
      { status: 'Out for Delivery', time: '11:50 AM', completed: true },
      { status: 'Delivered', time: '', completed: false },
    ],
  },
  'ORD003': {
    id: 'ORD003',
    status: 'cancelled',
    total: 199,
    items: [{ name: 'Bread', qty: 1, price: 45 }],
    deliveryAddress: '789, Lake View Residency, Whitefield, Bangalore - 560066',
    cancelledReason: 'Item out of stock',
    timeline: [
      { status: 'Order Placed', time: '09:00 AM', completed: true },
      { status: 'Cancelled', time: '09:05 AM', completed: true },
    ],
  },
};

const OrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const partnerMarker = useRef<mapboxgl.Marker | null>(null);
  
const [isMapReady, setIsMapReady] = useState(false);
  const [partnerLocation, setPartnerLocation] = useState({ lat: 12.9352, lng: 77.6245 });

  const order = mockOrderData[orderId as keyof typeof mockOrderData];

  // Simulate delivery partner movement
  useEffect(() => {
    if (order?.status !== 'out_for_delivery' || !isMapReady) return;

    const destination = order.destinationLocation;
    const interval = setInterval(() => {
      setPartnerLocation(prev => {
        const latDiff = destination.lat - prev.lat;
        const lngDiff = destination.lng - prev.lng;
        
        // Move 5% closer to destination each time
        return {
          lat: prev.lat + latDiff * 0.05,
          lng: prev.lng + lngDiff * 0.05,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [order?.status, isMapReady]);

  // Update marker position when partner moves
  useEffect(() => {
    if (partnerMarker.current && isMapReady) {
      partnerMarker.current.setLngLat([partnerLocation.lng, partnerLocation.lat]);
    }
  }, [partnerLocation, isMapReady]);

  // Initialize map with public demo token
  useEffect(() => {
    if (!mapContainer.current || order?.status !== 'out_for_delivery') return;

    // Using a public demo token for live tracking
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtNjVxd3BxbjBhMGoya3B0cTZpNnRqMGwifQ.demo';

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [order.partnerLocation!.lng, order.partnerLocation!.lat],
        zoom: 14,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        // Add destination marker
        new mapboxgl.Marker({ color: '#0C831F' })
          .setLngLat([order.destinationLocation!.lng, order.destinationLocation!.lat])
          .setPopup(new mapboxgl.Popup().setHTML('<p class="font-medium">Delivery Location</p>'))
          .addTo(map.current!);

        // Add delivery partner marker (bike icon)
        const el = document.createElement('div');
        el.className = 'delivery-marker';
        el.innerHTML = `
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"></circle>
              <circle cx="5.5" cy="17.5" r="3.5"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
            </svg>
          </div>
        `;

        partnerMarker.current = new mapboxgl.Marker(el)
          .setLngLat([order.partnerLocation!.lng, order.partnerLocation!.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<p class="font-medium">${order.deliveryPartner!.name}</p>`))
          .addTo(map.current!);

        setIsMapReady(true);

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend([order.partnerLocation!.lng, order.partnerLocation!.lat])
          .extend([order.destinationLocation!.lng, order.destinationLocation!.lat]);
        
        map.current!.fitBounds(bounds, { padding: 60 });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [order]);

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

  const showMap = order.status === 'out_for_delivery';

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Order #{order.id}</h1>
            <p className="text-xs text-muted-foreground">Track your order</p>
          </div>
        </div>
      </div>

      {/* Map Section for Out for Delivery */}
      {showMap && (
        <div className="relative h-64">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* ETA Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-card rounded-xl p-3 shadow-lg border border-border">
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
          </div>
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

        {/* Order Timeline */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
          <div className="relative">
            {order.timeline.map((step, index) => {
              const isLast = index === order.timeline.length - 1;
              const Icon = step.status === 'Delivered' ? CheckCircle :
                          step.status === 'Out for Delivery' ? Truck :
                          step.status === 'Preparing' ? Package :
                          step.status === 'Cancelled' ? CheckCircle : Clock;
              
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
                      <div className={`w-0.5 h-10 ${
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
                    {step.time && (
                      <p className="text-sm text-muted-foreground">{step.time}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Delivery Address */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
            </div>
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
