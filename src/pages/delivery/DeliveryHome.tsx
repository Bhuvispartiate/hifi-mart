import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Package, Store, Clock, CheckCircle2, Navigation, Phone, X, KeyRound, Loader2, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { Order, subscribeToAllOrders, updateOrderStatus, verifyDeliveryOtp, setDeliveryOtp } from '@/lib/firestoreService';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type DeliveryStatus = 'waiting' | 'assigned' | 'pickup' | 'navigating' | 'reached';

type LineStringGeometry = { type: 'LineString'; coordinates: number[][] };

type RouteOption = {
  duration: number; // seconds
  distance: number; // meters
  geometry: LineStringGeometry;
};

const ROUTE_SOURCE_ID = 'route-selected';
const ALT_ROUTE_SOURCE_ID = 'route-alternatives';
const ROUTE_LAYER_ID = 'route-selected-layer';
const ALT_ROUTE_LAYER_ID = 'route-alt-layer';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

const formatDuration = (seconds: number) => {
  const mins = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h} hr ${m} min`;
  return `${mins} min`;
};

const formatDistance = (meters: number) => {
  if (!Number.isFinite(meters)) return '';
  const km = meters / 1000;
  if (km >= 1) return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  return `${Math.round(meters)} m`;
};

// Helper to find nearest point on a route to snap marker to road
const findNearestPointOnRoute = (
  position: { lat: number; lng: number },
  routeCoords: number[][]
): [number, number] => {
  if (!routeCoords.length) return [position.lng, position.lat];

  let minDist = Infinity;
  let nearestPoint: [number, number] = [position.lng, position.lat];

  for (const coord of routeCoords) {
    const dx = coord[0] - position.lng;
    const dy = coord[1] - position.lat;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearestPoint = [coord[0], coord[1]];
    }
  }

  return nearestPoint;
};

export default function DeliveryHome() {
  const navigate = useNavigate();
  const { deliveryPartner } = useDeliveryAuth();
  const [status, setStatus] = useState<DeliveryStatus>('waiting');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const startCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const endCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Subscribe to real-time orders assigned to this delivery partner
  useEffect(() => {
    if (!deliveryPartner?.id) return;

    const unsubscribe = subscribeToAllOrders((allOrders) => {
      setOrders(allOrders);
      
      // Find active order assigned to this delivery partner (not delivered/cancelled)
      const myActiveOrder = allOrders.find(o => 
        o.deliveryPartner?.id === deliveryPartner.id &&
        !['delivered', 'cancelled'].includes(o.status)
      );
      
      if (myActiveOrder) {
        setCurrentOrder(myActiveOrder);
        
        // Set UI status based on order status
        if (myActiveOrder.status === 'confirmed') {
          setStatus('assigned');
        } else if (myActiveOrder.status === 'preparing') {
          setStatus('pickup');
        } else if (myActiveOrder.status === 'out_for_delivery') {
          setStatus('navigating');
        } else if (myActiveOrder.status === 'reached_destination') {
          setStatus('reached');
        }
      } else {
        // No active order for this partner
        setCurrentOrder(null);
        setStatus('waiting');
      }
    });

    return () => unsubscribe();
  }, [deliveryPartner?.id]);

  // Initialize map when navigating
  useEffect(() => {
    if (status !== 'navigating' || !mapContainer.current) return;

    setRouteOptions([]);
    setSelectedRouteIndex(0);

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Use delivery coordinates if available, otherwise use default destination
    const destinationCoords = currentOrder?.deliveryCoordinates || { lat: 13.1067, lng: 80.0923 }; // Default to Ponneri area

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        startCoordsRef.current = currentPos;
        endCoordsRef.current = destinationCoords;
        initializeMap(currentPos, destinationCoords);
      },
      () => {
        // Fallback if geolocation fails - use Chennai area coordinates
        const fallbackStart = { lat: 13.0827, lng: 80.2707 };
        startCoordsRef.current = fallbackStart;
        endCoordsRef.current = destinationCoords;
        initializeMap(fallbackStart, destinationCoords);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [status, currentOrder?.id]);

  const applyRoutesToMap = useCallback((routes: RouteOption[], selectedIndex: number, opts?: { fit?: boolean }) => {
    if (!map.current) return;

    const selected = routes[selectedIndex];
    if (!selected) return;

    const run = () => {
      if (!map.current) return;

      const selectedFeature = {
        type: 'Feature',
        properties: { selected: true },
        geometry: selected.geometry,
      };

      const altCollection = {
        type: 'FeatureCollection',
        features: routes
          .map((r, idx) => ({
            type: 'Feature',
            properties: { selected: false, idx },
            geometry: r.geometry,
          }))
          .filter((_, idx) => idx !== selectedIndex),
      };

      const selectedSource = map.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (selectedSource) {
        selectedSource.setData(selectedFeature as any);
      } else {
        map.current.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: selectedFeature as any });
      }

      const altSource = map.current.getSource(ALT_ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (altSource) {
        altSource.setData(altCollection as any);
      } else {
        map.current.addSource(ALT_ROUTE_SOURCE_ID, { type: 'geojson', data: altCollection as any });
      }

      if (!map.current.getLayer(ALT_ROUTE_LAYER_ID)) {
        map.current.addLayer({
          id: ALT_ROUTE_LAYER_ID,
          type: 'line',
          source: ALT_ROUTE_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#94A3B8',
            'line-width': 4,
            'line-opacity': 0.5,
          },
        });
      }

      if (!map.current.getLayer(ROUTE_LAYER_ID)) {
        map.current.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 6,
            'line-opacity': 0.85,
          },
        });
      }

      const shouldFit = opts?.fit ?? false;
      if (shouldFit) {
        const coordinates = selected.geometry.coordinates;
        if (coordinates?.length) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]);
          for (const coord of coordinates) bounds.extend(coord as [number, number]);
          map.current.fitBounds(bounds, { padding: 80, maxZoom: 16 });
        }
      }
    };

    if (map.current.loaded()) run();
    else map.current.once('load', run);
  }, []);

  const initializeMap = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [(start.lng + end.lng) / 2, (start.lat + end.lat) / 2],
        zoom: 13,
      });

      // Create clean scooter/delivery marker
      const bikeEl = document.createElement('div');
      bikeEl.style.width = '40px';
      bikeEl.style.height = '40px';
      bikeEl.style.borderRadius = '50%';
      bikeEl.style.backgroundColor = '#3B82F6';
      bikeEl.style.display = 'flex';
      bikeEl.style.alignItems = 'center';
      bikeEl.style.justifyContent = 'center';
      bikeEl.style.boxShadow = '0 2px 8px rgba(59,130,246,0.5)';
      bikeEl.style.border = '3px solid white';
      bikeEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5" cy="17" r="3"/>
        <circle cx="19" cy="17" r="3"/>
        <path d="M8.5 17h7"/>
        <path d="M5.5 14L7 7h4l3 7"/>
        <path d="M16 14l-1-5h-4"/>
        <path d="M12 6V4"/>
        <circle cx="12" cy="3" r="1"/>
      </svg>`;

      deliveryMarkerRef.current = new mapboxgl.Marker({ element: bikeEl, anchor: 'center' })
        .setLngLat([start.lng, start.lat])
        .addTo(map.current);

      new mapboxgl.Marker({ color: '#22C55E' }).setLngLat([end.lng, end.lat]).addTo(map.current);

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );

      fetchRoute(start, end, true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const fetchRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }, fitBounds = false) => {
    if (!map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?alternatives=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`);
      }

      const data = await response.json();

      const routes: RouteOption[] = (data.routes ?? [])
        .slice(0, 3)
        .map((r: any) => ({
          duration: typeof r.duration === 'number' ? r.duration : 0,
          distance: typeof r.distance === 'number' ? r.distance : 0,
          geometry: r.geometry as LineStringGeometry,
        }))
        .filter((r) => r.geometry?.coordinates?.length);

      if (!routes.length) throw new Error('No routes returned');

      setRouteOptions(routes);
      setSelectedRouteIndex((prev) => (prev < routes.length ? prev : 0));
      applyRoutesToMap(routes, selectedRouteIndex < routes.length ? selectedRouteIndex : 0, { fit: fitBounds });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching route:', error);
      toast({
        title: 'Route unavailable',
        description: 'Unable to load navigation route. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Live ETA refresh every 30 seconds
  useEffect(() => {
    if (status !== 'navigating') return;

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          startCoordsRef.current = currentPos;

          // Snap marker to the nearest point on the selected route
          if (deliveryMarkerRef.current && routeOptions[selectedRouteIndex]) {
            const routeCoords = routeOptions[selectedRouteIndex].geometry.coordinates;
            const snappedPoint = findNearestPointOnRoute(currentPos, routeCoords);
            deliveryMarkerRef.current.setLngLat(snappedPoint);
          }

          if (endCoordsRef.current) {
            fetchRoute(currentPos, endCoordsRef.current, false);
          }
        },
        () => {
          // If geolocation fails, use stored coords
          if (startCoordsRef.current && endCoordsRef.current) {
            fetchRoute(startCoordsRef.current, endCoordsRef.current, false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [status, selectedRouteIndex, routeOptions]);

  useEffect(() => {
    if (status !== 'navigating') return;
    if (!routeOptions.length) return;

    applyRoutesToMap(routeOptions, selectedRouteIndex);
  }, [applyRoutesToMap, routeOptions, selectedRouteIndex, status]);

  const handleAcceptOrder = async () => {
    if (!currentOrder) return;
    
    try {
      // Update status to "preparing" when delivery partner accepts
      await updateOrderStatus(currentOrder.id, 'preparing');
      setStatus('pickup');
      toast({ title: 'Order accepted', description: 'Proceed to pickup the order' });
    } catch (error) {
      toast({ title: 'Error accepting order', variant: 'destructive' });
    }
  };

  const handlePickupComplete = async () => {
    if (!currentOrder) return;
    
    try {
      // Update status to "out_for_delivery" when pickup is complete
      await updateOrderStatus(currentOrder.id, 'out_for_delivery');
      setStatus('navigating');
      toast({ title: 'Pickup complete', description: 'Navigate to customer location' });
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleReachedDestination = async () => {
    if (!currentOrder) return;
    
    try {
      // Generate OTP first
      const otp = await setDeliveryOtp(currentOrder.id);
      if (otp) {
        console.log('OTP generated:', otp);
      }
      
      // Then update status
      await updateOrderStatus(currentOrder.id, 'reached_destination');
      setStatus('reached');
      toast({ title: 'Customer has been notified', description: 'OTP sent to customer. Wait for verification.' });
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!currentOrder || !otpInput) return;
    
    setVerifying(true);
    try {
      const success = await verifyDeliveryOtp(currentOrder.id, otpInput);
      
      if (success) {
        toast({ title: 'Delivery completed!', description: 'OTP verified successfully' });
        setStatus('waiting');
        setCurrentOrder(null);
        setOtpInput('');
        navigate('/delivery/orders');
      } else {
        toast({ title: 'Invalid OTP', description: 'Please check and try again', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Verification failed', variant: 'destructive' });
    }
    setVerifying(false);
  };

  const handleEndNavigation = () => {
    setStatus('pickup');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {status === 'navigating' && currentOrder ? (
        // Full screen navigation mode
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div ref={mapContainer} className="w-full flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }} />
          
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Badge variant="secondary" className="bg-success/20 text-success">
                    <Navigation className="w-3 h-3 mr-1" />
                    Navigating to Customer
                  </Badge>
                </div>

                <p className="text-sm font-medium">{currentOrder.deliveryAddress}</p>

                {routeOptions[selectedRouteIndex] && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDuration(routeOptions[selectedRouteIndex].duration)} •{' '}
                    {formatDistance(routeOptions[selectedRouteIndex].distance)}
                  </p>
                )}

                {routeOptions.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {routeOptions.map((r, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant={idx === selectedRouteIndex ? 'secondary' : 'outline'}
                        size="sm"
                        className="shrink-0"
                        onClick={() => setSelectedRouteIndex(idx)}
                      >
                        {formatDuration(r.duration)} • {formatDistance(r.distance)}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="absolute bottom-6 left-4 right-4 z-10">
            <Card className="bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="font-medium">{currentOrder.items.length} items</p>
                    <p className="text-sm text-muted-foreground">₹{currentOrder.total}</p>
                  </div>
                  {currentOrder.deliveryPartner?.phone && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={`tel:${currentOrder.deliveryPartner.phone}`}>
                        <Phone className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
                <Button className="w-full" size="lg" onClick={handleReachedDestination}>
                  <MapPin className="w-5 h-5 mr-2" />
                  I've Reached Destination
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : status === 'reached' && currentOrder ? (
        // OTP Verification Mode
        <div className="min-h-screen bg-background">
          <div className="bg-primary text-primary-foreground p-4 pt-12">
            <h1 className="text-xl font-bold">Verify Delivery</h1>
            <p className="text-sm opacity-90">Enter OTP from customer</p>
          </div>

          <div className="p-4 space-y-4">
            <Card className="border-primary border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Enter Customer OTP</p>
                    <p className="text-sm text-muted-foreground">Ask the customer for 4-digit code</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit OTP"
                    className="text-center text-2xl tracking-widest h-14"
                  />
                  
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleVerifyOtp}
                    disabled={otpInput.length !== 4 || verifying}
                  >
                    {verifying && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Verify & Complete Delivery
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Delivering to:</p>
                <p className="font-medium">{currentOrder.deliveryAddress}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {currentOrder.items.length} items • ₹{currentOrder.total}
                </p>
              </CardContent>
            </Card>
          </div>

          <DeliveryBottomNav />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 pt-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Welcome back</p>
                <h1 className="text-xl font-bold">{deliveryPartner?.name || 'Delivery Partner'}</h1>
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
            {status === 'assigned' && currentOrder && (
              <div className="space-y-4">
                <Card className="border-primary border-2 bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">New Order Assigned!</span>
                      <Badge variant="secondary" className="ml-auto">
                        #{currentOrder.id.slice(0, 8).toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Store Pickup</p>
                          <p className="text-sm text-muted-foreground">Collect items from store</p>
                        </div>
                      </div>
                      
                      <div className="border-l-2 border-dashed border-border h-4 ml-4" />
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">Customer Location</p>
                          <p className="text-sm text-muted-foreground">{currentOrder.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Items: </span>
                        <span className="font-medium">{currentOrder.items.length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium text-primary">₹{currentOrder.total}</span>
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
                      setCurrentOrder(null);
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
            {status === 'pickup' && currentOrder && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Order Accepted</span>
                      <Badge variant="secondary" className="ml-auto">
                        #{currentOrder.id.slice(0, 8).toUpperCase()}
                      </Badge>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Pickup Location</span>
                      </div>
                      <p className="font-medium">Store</p>
                      <p className="text-sm text-muted-foreground">Collect all items</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items to pickup</span>
                        <span className="font-medium">{currentOrder.items.length} items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order Value</span>
                        <span className="font-medium">₹{currentOrder.total}</span>
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
                    <p className="text-sm text-muted-foreground">{currentOrder.deliveryAddress}</p>
                  </CardContent>
                </Card>

                <Button className="w-full" size="lg" onClick={handlePickupComplete}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Mark as Picked Up & Navigate
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
