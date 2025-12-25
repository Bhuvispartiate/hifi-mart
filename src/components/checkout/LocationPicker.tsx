import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getGeofenceConfig, isWithinGeofence, getDistanceFromCenter, fetchGeofenceConfig, GeofenceConfig } from '@/lib/geofencing';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

export const LocationPicker = ({ open, onClose, onLocationSelect, initialLocation }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isOutsideZone, setIsOutsideZone] = useState(false);
  const [distanceFromStore, setDistanceFromStore] = useState<number | null>(null);
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig | null>(null);

  // Helper function to generate circle coordinates for geofence visualization
  const createGeoJSONCircle = (center: [number, number], radiusKm: number, points: number = 64) => {
    const coords: [number, number][] = [];
    const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]); // Close the circle

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords],
      },
      properties: {},
    };
  };

  // Reverse geocode to get address
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=IN`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress('Location selected');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
        const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          setIsOutsideZone(!isWithinGeofence(latitude, longitude));
          setDistanceFromStore(getDistanceFromCenter(latitude, longitude));
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 16,
              duration: 1500,
            });
            
            if (marker.current) {
              marker.current.setLngLat([longitude, latitude]);
            }
          }
          
          fetchAddress(latitude, longitude);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to a location in India if geolocation fails
          const defaultLat = 28.6139;
          const defaultLng = 77.2090;
          setSelectedLocation({ lat: defaultLat, lng: defaultLng });
          fetchAddress(defaultLat, defaultLng);
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, [fetchAddress]);

  // Fetch geofence config when dialog opens
  useEffect(() => {
    if (open) {
      fetchGeofenceConfig().then(setGeofenceConfig);
    }
  }, [open]);

  // Initialize map when dialog opens and geofence config is loaded
  useEffect(() => {
    if (!open) {
      // Cleanup when dialog closes
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
        setMapLoaded(false);
      }
      return;
    }

    if (!geofenceConfig) return; // Wait for geofence config

    // Small delay to ensure the container is rendered
    const initTimeout = setTimeout(() => {
      if (!mapContainer.current || map.current) return;

      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const initialLat = initialLocation?.lat || 28.6139;
        const initialLng = initialLocation?.lng || 77.2090;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [initialLng, initialLat],
          zoom: 14,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div style="
            width: 40px; 
            height: 40px; 
            background: hsl(130, 85%, 28%); 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            <div style="transform: rotate(45deg); color: white; font-size: 18px;">📍</div>
          </div>
        `;

        // Add draggable marker
        marker.current = new mapboxgl.Marker({
          element: markerEl,
          draggable: true,
        })
          .setLngLat([initialLng, initialLat])
          .addTo(map.current);

        // Handle marker drag end
        marker.current.on('dragend', () => {
          const lngLat = marker.current?.getLngLat();
          if (lngLat) {
            setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
            setIsOutsideZone(!isWithinGeofence(lngLat.lat, lngLat.lng));
            setDistanceFromStore(getDistanceFromCenter(lngLat.lat, lngLat.lng));
            fetchAddress(lngLat.lat, lngLat.lng);
          }
        });

        // Handle map click to move marker
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          marker.current?.setLngLat([lng, lat]);
          setSelectedLocation({ lat, lng });
          setIsOutsideZone(!isWithinGeofence(lat, lng));
          setDistanceFromStore(getDistanceFromCenter(lat, lng));
          fetchAddress(lat, lng);
        });

        // Map load event
        map.current.on('load', () => {
          setMapLoaded(true);
          
          // Add geofence circle visualization (use the config from state)
          if (!geofenceConfig) return;
          const circleData = createGeoJSONCircle(
            [geofenceConfig.centerLng, geofenceConfig.centerLat],
            geofenceConfig.radiusKm
          );

          map.current?.addSource('geofence', {
            type: 'geojson',
            data: circleData,
          });

          // Add fill layer (semi-transparent green)
          map.current?.addLayer({
            id: 'geofence-fill',
            type: 'fill',
            source: 'geofence',
            paint: {
              'fill-color': '#0C831F',
              'fill-opacity': 0.1,
            },
          });

          // Add border layer (solid green line)
          map.current?.addLayer({
            id: 'geofence-border',
            type: 'line',
            source: 'geofence',
            paint: {
              'line-color': '#0C831F',
              'line-width': 3,
              'line-opacity': 0.8,
            },
          });

          // Add center marker for store location
          const storeMarkerEl = document.createElement('div');
          storeMarkerEl.innerHTML = `
            <div style="
              width: 32px; 
              height: 32px; 
              background: #0C831F; 
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
            ">
              <span style="font-size: 16px;">🏪</span>
            </div>
          `;

          new mapboxgl.Marker({ element: storeMarkerEl })
            .setLngLat([geofenceConfig.centerLng, geofenceConfig.centerLat])
            .addTo(map.current!);

          // Get current location after map loads
          getCurrentLocation();
        });

      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [open, initialLocation, getCurrentLocation, fetchAddress, geofenceConfig]);

  const handleConfirmLocation = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" aria-describedby="location-picker-description">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Delivery Location
          </DialogTitle>
          <DialogDescription id="location-picker-description" className="sr-only">
            Pin your delivery location on the map by tapping or dragging the marker
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Map container */}
          <div 
            ref={mapContainer} 
            className="w-full h-[350px] bg-muted"
            style={{ minHeight: '350px' }}
          />

          {/* Loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading map...</span>
              </div>
            </div>
          )}

          {/* Current location button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-24 right-4 rounded-full shadow-lg z-10"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </Button>

          {/* Outside zone warning */}
          {isOutsideZone && selectedLocation && (
            <div className="absolute top-4 left-4 right-4 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Outside delivery zone</span>
            </div>
          )}

          {/* Selected address display */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOutsideZone ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {isOutsideZone ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <MapPin className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm ${isOutsideZone ? 'text-destructive' : 'text-foreground'}`}>
                    {isOutsideZone ? 'Outside Delivery Zone' : 'Delivery Location'}
                  </p>
                  {distanceFromStore !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOutsideZone ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {distanceFromStore < 1 
                        ? `${Math.round(distanceFromStore * 1000)}m from store` 
                        : `${distanceFromStore.toFixed(1)} km from store`}
                    </span>
                  )}
                </div>
                {isLoadingAddress ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching address...
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {address || 'Tap on map to select location'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmLocation} 
                className="flex-1"
                disabled={!selectedLocation || !address || isLoadingAddress || isOutsideZone}
                variant={isOutsideZone ? "destructive" : "default"}
              >
                {isOutsideZone ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Outside Zone
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
