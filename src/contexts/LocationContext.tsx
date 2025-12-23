import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

interface Location {
  lat: number;
  lng: number;
  address: string;
  label: string;
}

interface LocationContextType {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => void;
  setLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocationState] = useState<Location | null>(() => {
    const saved = localStorage.getItem('userLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = useCallback(async (lat: number, lng: number): Promise<{ address: string; label: string }> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=IN&types=address,locality,place,neighborhood`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const address = feature.place_name;
        
        // Try to extract a short label (neighborhood or locality)
        const neighborhood = data.features.find((f: any) => f.place_type?.includes('neighborhood'));
        const locality = data.features.find((f: any) => f.place_type?.includes('locality'));
        const place = data.features.find((f: any) => f.place_type?.includes('place'));
        
        const label = neighborhood?.text || locality?.text || place?.text || 'Current Location';
        
        return { address, label };
      }
      return { address: 'Location detected', label: 'Current Location' };
    } catch (err) {
      console.error('Geocoding error:', err);
      return { address: 'Location detected', label: 'Current Location' };
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { address, label } = await fetchAddress(latitude, longitude);
        
        const newLocation: Location = {
          lat: latitude,
          lng: longitude,
          address,
          label,
        };
        
        setLocationState(newLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Unable to get your location');
        setIsLoading(false);
        
        // Set default location if geolocation fails and no saved location
        if (!location) {
          const defaultLocation: Location = {
            lat: 28.6139,
            lng: 77.2090,
            address: 'New Delhi, India',
            label: 'New Delhi',
          };
          setLocationState(defaultLocation);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchAddress, location]);

  const setLocation = useCallback((newLocation: Location) => {
    setLocationState(newLocation);
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
  }, []);

  // Get location on mount if not already saved
  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        refreshLocation: getCurrentLocation,
        setLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
