import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GeofenceConfig, initGeofenceListener, stopGeofenceListener, fetchGeofenceConfig, calculateDistance } from '@/lib/geofencing';

interface GeofenceContextType {
  config: GeofenceConfig | null;
  isLoading: boolean;
  isWithinZone: (lat: number, lng: number) => boolean;
  getDistanceFromStore: (lat: number, lng: number) => number;
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

export const GeofenceProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<GeofenceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchGeofenceConfig().then((fetchedConfig) => {
      setConfig(fetchedConfig);
      setIsLoading(false);
    });

    // Set up real-time listener
    initGeofenceListener((updatedConfig) => {
      console.log('Geofence config updated in real-time:', updatedConfig);
      setConfig(updatedConfig);
      setIsLoading(false);
    });

    return () => {
      stopGeofenceListener();
    };
  }, []);

  const isWithinZone = (lat: number, lng: number): boolean => {
    if (!config) return true; // Default to true if config not loaded
    const distance = calculateDistance(config.centerLat, config.centerLng, lat, lng);
    return distance <= config.radiusKm;
  };

  const getDistanceFromStore = (lat: number, lng: number): number => {
    if (!config) return 0;
    return calculateDistance(config.centerLat, config.centerLng, lat, lng);
  };

  return (
    <GeofenceContext.Provider value={{ config, isLoading, isWithinZone, getDistanceFromStore }}>
      {children}
    </GeofenceContext.Provider>
  );
};

export const useGeofence = () => {
  const context = useContext(GeofenceContext);
  if (context === undefined) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
};
