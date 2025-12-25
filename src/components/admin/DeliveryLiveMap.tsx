import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DeliveryPartner, subscribeToDeliveryPartners } from '@/lib/firestoreService';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation, Phone, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  idle: '#6b7280',      // gray
  offline: '#9ca3af',   // light gray
  assigned: '#3b82f6',  // blue
  pickup: '#8b5cf6',    // purple
  navigating: '#22c55e', // green
  reached: '#f97316',   // orange
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const formatDistance = (meters?: number): string => {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const DeliveryLiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [mapboxToken] = useState<string>(getMapboxPublicToken());
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to delivery partners
  useEffect(() => {
    const unsubscribe = subscribeToDeliveryPartners((updatedPartners) => {
      setPartners(updatedPartners);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.5946, 12.9716], // Bangalore center
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when partners change
  useEffect(() => {
    if (!map.current) return;

    const activePartnerIds = new Set<string>();

    partners.forEach(partner => {
      if (!partner.currentLocation) return;
      
      activePartnerIds.add(partner.id);
      const { lat, lng } = partner.currentLocation;

      let marker = markersRef.current.get(partner.id);

      if (marker) {
        // Update existing marker position
        marker.setLngLat([lng, lat]);
        // Update marker color
        const el = marker.getElement();
        const svg = el.querySelector('svg circle');
        if (svg) {
          svg.setAttribute('fill', statusColors[partner.currentStatus] || statusColors.idle);
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'delivery-marker';
        el.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="15" fill="${statusColors[partner.currentStatus] || statusColors.idle}" stroke="white" stroke-width="3"/>
            <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">🚴</text>
          </svg>
        `;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => setSelectedPartner(partner));

        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current.set(partner.id, marker);
      }
    });

    // Remove markers for partners no longer present
    markersRef.current.forEach((marker, partnerId) => {
      if (!activePartnerIds.has(partnerId)) {
        marker.remove();
        markersRef.current.delete(partnerId);
      }
    });
  }, [partners]);

  // Focus on selected partner
  useEffect(() => {
    if (selectedPartner?.currentLocation && map.current) {
      map.current.flyTo({
        center: [selectedPartner.currentLocation.lng, selectedPartner.currentLocation.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedPartner]);

  const activePartners = partners.filter(p => p.currentLocation && p.isActive);
  const navigatingPartners = partners.filter(p => p.currentStatus === 'navigating');

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          <MapPin className="w-3 h-3 mr-1" />
          {activePartners.length} Active
        </Badge>
        <Badge variant="secondary" className="bg-background/90 backdrop-blur text-green-600">
          <Navigation className="w-3 h-3 mr-1" />
          {navigatingPartners.length} Navigating
        </Badge>
      </div>

      {/* Partners List */}
      <div className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100%-2rem)] overflow-hidden flex flex-col">
        <Card className="bg-background/95 backdrop-blur overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Delivery Partners</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : partners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No delivery partners found</p>
            ) : (
              <div className="divide-y divide-border">
                {partners.map(partner => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner)}
                    className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                      selectedPartner?.id === partner.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: statusColors[partner.currentStatus] || statusColors.idle }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{partner.name}</span>
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {partner.currentStatus}
                          </Badge>
                        </div>
                        {partner.currentLocation ? (
                          <div className="mt-1 space-y-0.5">
                            {partner.estimatedArrival && partner.currentStatus === 'navigating' && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Clock className="w-3 h-3" />
                                <span>ETA: {format(partner.estimatedArrival, 'h:mm a')}</span>
                                {partner.estimatedDistance && (
                                  <span className="text-muted-foreground">
                                    ({formatDistance(partner.estimatedDistance)})
                                  </span>
                                )}
                              </div>
                            )}
                            {partner.lastLocationUpdate && (
                              <p className="text-xs text-muted-foreground">
                                Updated {format(partner.lastLocationUpdate, 'h:mm:ss a')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">No location data</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Partner Details */}
      {selectedPartner && (
        <div className="absolute bottom-4 left-4 right-4 z-10 md:left-auto md:right-4 md:w-80">
          <Card className="bg-background/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{selectedPartner.name}</h3>
                  <Badge 
                    variant="outline" 
                    className="mt-1 capitalize"
                    style={{ borderColor: statusColors[selectedPartner.currentStatus] }}
                  >
                    {selectedPartner.currentStatus}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPartner(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{selectedPartner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{selectedPartner.vehicleType} • {selectedPartner.totalDeliveries} deliveries</span>
                </div>
                {selectedPartner.currentOrderId && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Order: {selectedPartner.currentOrderId.slice(0, 8)}...</span>
                  </div>
                )}
                {selectedPartner.estimatedArrival && selectedPartner.currentStatus === 'navigating' && (
                  <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        ETA: {format(selectedPartner.estimatedArrival, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-green-600 dark:text-green-500">
                      <span>{formatDuration(selectedPartner.estimatedDuration)}</span>
                      <span>{formatDistance(selectedPartner.estimatedDistance)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden md:block">
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Status Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs capitalize">{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryLiveMap;
