import { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Store, Clock, CheckCircle2, Navigation, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type DeliveryStatus = 'waiting' | 'assigned' | 'pickup' | 'navigating';

interface AssignedOrder {
  id: string;
  shopName: string;
  shopAddress: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  itemCount: number;
  totalAmount: number;
  estimatedDistance: string;
  estimatedEarning: number;
  shopCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
}

export default function DeliveryHome() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DeliveryStatus>('waiting');
  const [order, setOrder] = useState<AssignedOrder | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Simulate order assignment after 5 seconds for demo
  useEffect(() => {
    if (status === 'waiting') {
      const timer = setTimeout(() => {
        setOrder({
          id: 'ORD-2024-001',
          shopName: 'Fresh Mart Grocery',
          shopAddress: '123 Market Street, Sector 15',
          customerName: 'Rahul Kumar',
          customerAddress: '456 Green Avenue, Sector 22',
          customerPhone: '+91 98765 43210',
          itemCount: 8,
          totalAmount: 547,
          estimatedDistance: '3.2 km',
          estimatedEarning: 45,
          shopCoords: { lat: 12.9716, lng: 77.5946 },
          deliveryCoords: { lat: 12.9784, lng: 77.6408 },
        });
        setStatus('assigned');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Initialize map when navigating
  useEffect(() => {
    if (status !== 'navigating' || !mapContainer.current || !order) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNxcXBiNGkwMmt4MmtvOXRtY3d4M2RlIn0.v1fT8IOkVRnKPzKlQUL_Eg';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        initializeMap(currentPos, order.deliveryCoords);
      },
      () => {
        // Fallback to shop coords if geolocation fails
        initializeMap(order.shopCoords, order.deliveryCoords);
      }
    );

    return () => {
      map.current?.remove();
    };
  }, [status, order]);

  const initializeMap = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [start.lng, start.lat],
      zoom: 14,
      pitch: 45,
    });

    // Add current location marker
    new mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([start.lng, start.lat])
      .addTo(map.current);

    // Add destination marker
    new mapboxgl.Marker({ color: '#22C55E' })
      .setLngLat([end.lng, end.lat])
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    // Fetch and display route
    fetchRoute(start, end);
  };

  const fetchRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0].geometry;

        const addRouteLayer = () => {
          if (!map.current || map.current.getSource('route')) return;

          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route,
            },
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 6,
              'line-opacity': 0.8,
            },
          });

          // Fit map to show entire route
          const coordinates = route.coordinates;
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          for (const coord of coordinates) {
            bounds.extend(coord);
          }
          map.current.fitBounds(bounds, { padding: 80 });
        };

        if (map.current.loaded()) {
          addRouteLayer();
        } else {
          map.current.on('load', addRouteLayer);
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const handleAcceptOrder = () => {
    setStatus('pickup');
  };

  const handlePickupComplete = () => {
    setStatus('navigating');
  };

  const handleDeliveryComplete = () => {
    navigate('/delivery/orders');
    setStatus('waiting');
    setOrder(null);
  };

  const handleEndNavigation = () => {
    setStatus('pickup');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {status === 'navigating' && order ? (
        // Full screen navigation mode
        <div className="fixed inset-0 z-50 bg-background">
          <div ref={mapContainer} className="w-full h-full" />
          
          {/* Navigation overlay */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                    <Navigation className="w-3 h-3 mr-1" />
                    Navigating to Customer
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={handleEndNavigation}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-sm font-medium">{order.customerAddress}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Delivering to {order.customerName}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom action */}
          <div className="absolute bottom-6 left-4 right-4 z-10">
            <Card className="bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.itemCount} items • ₹{order.totalAmount}</p>
                  </div>
                  <Button variant="outline" size="icon" asChild>
                    <a href={`tel:${order.customerPhone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <Button className="w-full" size="lg" onClick={handleDeliveryComplete}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Mark as Delivered
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 pt-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Good Morning</p>
                <h1 className="text-xl font-bold">Delivery Partner</h1>
              </div>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                Online
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Waiting for Order State */}
            {status === 'waiting' && (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Clock className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Waiting for Orders</h2>
                  <p className="text-muted-foreground mb-4">
                    Stay online to receive new delivery requests
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Your location is being shared</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Assigned State */}
            {status === 'assigned' && order && (
              <div className="space-y-4">
                <Card className="border-primary border-2 bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">New Order Assigned!</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{order.shopName}</p>
                          <p className="text-sm text-muted-foreground">{order.shopAddress}</p>
                        </div>
                      </div>
                      
                      <div className="border-l-2 border-dashed border-border h-4 ml-4" />
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Distance: </span>
                        <span className="font-medium">{order.estimatedDistance}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Earning: </span>
                        <span className="font-medium text-primary">₹{order.estimatedEarning}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setStatus('waiting');
                      setOrder(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button className="flex-1" onClick={handleAcceptOrder}>
                    Accept Order
                  </Button>
                </div>
              </div>
            )}

            {/* Pickup from Shop State */}
            {status === 'pickup' && order && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Order Accepted</span>
                      <Badge variant="secondary" className="ml-auto">
                        {order.id}
                      </Badge>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Pickup Location</span>
                      </div>
                      <p className="font-medium">{order.shopName}</p>
                      <p className="text-sm text-muted-foreground">{order.shopAddress}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items to pickup</span>
                        <span className="font-medium">{order.itemCount} items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order Value</span>
                        <span className="font-medium">₹{order.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Earning</span>
                        <span className="font-medium text-primary">₹{order.estimatedEarning}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-accent" />
                      <span className="font-semibold">Delivery Location</span>
                    </div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                  </CardContent>
                </Card>

                <Button className="w-full" size="lg" onClick={handlePickupComplete}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Mark as Picked Up
                </Button>
              </div>
            )}

            {/* Today's Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Today's Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">5</p>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">₹225</p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">12.5 km</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DeliveryBottomNav />
        </>
      )}
    </div>
  );
}
