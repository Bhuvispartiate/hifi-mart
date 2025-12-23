import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

const MAPBOX_TOKEN_KEY = 'mapbox_public_token';

export const LocationPicker = ({ open, onClose, onLocationSelect, initialLocation }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState(() => localStorage.getItem(MAPBOX_TOKEN_KEY) || '');
  const [isTokenSet, setIsTokenSet] = useState(() => !!localStorage.getItem(MAPBOX_TOKEN_KEY));
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          
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
  }, []);

  // Reverse geocode to get address
  const fetchAddress = async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=IN`
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
  };

  // Initialize map
  useEffect(() => {
    if (!open || !isTokenSet || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const initialLat = initialLocation?.lat || 28.6139;
    const initialLng = initialLocation?.lng || 77.2090;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
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
        fetchAddress(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click to move marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setSelectedLocation({ lat, lng });
      fetchAddress(lat, lng);
    });

    // Get current location on load
    getCurrentLocation();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [open, isTokenSet, mapboxToken, initialLocation, getCurrentLocation]);

  const handleSaveToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, mapboxToken.trim());
      setIsTokenSet(true);
    }
  };

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
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        {!isTokenSet ? (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              To use the map, please enter your Mapbox public token. You can get one for free at{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                mapbox.com
              </a>
            </p>
            <Input
              placeholder="Enter Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button onClick={handleSaveToken} className="w-full">
              Save Token
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Map container */}
            <div ref={mapContainer} className="w-full h-[350px]" />

            {/* Current location button */}
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-24 right-4 rounded-full shadow-lg"
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </Button>

            {/* Selected address display */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">Delivery Location</p>
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
                  disabled={!selectedLocation || !address || isLoadingAddress}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
