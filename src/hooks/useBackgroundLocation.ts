import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, WatchPositionCallback } from '@capacitor/geolocation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BackgroundLocationState {
  isTracking: boolean;
  currentPosition: Position | null;
  error: string | null;
  lastUpdate: Date | null;
}

export interface BackgroundLocationOptions {
  deliveryPartnerId: string;
  orderId?: string;
  enableHighAccuracy?: boolean;
  updateInterval?: number; // in milliseconds
}

export const useBackgroundLocation = (options?: BackgroundLocationOptions) => {
  const [state, setState] = useState<BackgroundLocationState>({
    isTracking: false,
    currentPosition: null,
    error: null,
    lastUpdate: null,
  });

  const watchIdRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Update delivery partner location in Firestore
  const updateLocationInFirestore = useCallback(async (position: Position) => {
    if (!options?.deliveryPartnerId) return;

    try {
      // Update delivery partner tracking
      const trackingRef = doc(db, 'deliveryPartnerTracking', options.deliveryPartnerId);
      await updateDoc(trackingRef, {
        currentLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        heading: position.coords.heading,
        speed: position.coords.speed,
        accuracy: position.coords.accuracy,
        updatedAt: new Date(),
      });

      // If there's an active order, update order tracking too
      if (options.orderId) {
        const orderRef = doc(db, 'orders', options.orderId);
        await updateDoc(orderRef, {
          deliveryLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          locationUpdatedAt: new Date(),
        });
      }

      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      console.error('Error updating location in Firestore:', error);
    }
  }, [options?.deliveryPartnerId, options?.orderId]);

  // Start tracking location
  const startTracking = useCallback(async () => {
    try {
      // Check/request permissions
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          setState(prev => ({ 
            ...prev, 
            error: 'Location permission denied',
            isTracking: false 
          }));
          return false;
        }
      }

      // Start watching position
      const callback: WatchPositionCallback = (position, err) => {
        if (err) {
          console.error('Location watch error:', err);
          setState(prev => ({ ...prev, error: err.message }));
          return;
        }

        if (position) {
          setState(prev => ({
            ...prev,
            currentPosition: position,
            error: null,
          }));

          // Update Firestore with new position
          updateLocationInFirestore(position);
        }
      };

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: 10000,
          maximumAge: 0,
        },
        callback
      );

      watchIdRef.current = watchId;
      setState(prev => ({ ...prev, isTracking: true, error: null }));

      console.log('Background location tracking started');
      return true;
    } catch (error: any) {
      console.error('Error starting location tracking:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to start tracking',
        isTracking: false 
      }));
      return false;
    }
  }, [options?.enableHighAccuracy, updateLocationInFirestore]);

  // Stop tracking location
  const stopTracking = useCallback(async () => {
    try {
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      setState(prev => ({ ...prev, isTracking: false }));
      console.log('Background location tracking stopped');
    } catch (error: any) {
      console.error('Error stopping location tracking:', error);
    }
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<Position | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      setState(prev => ({ ...prev, currentPosition: position, error: null }));
      return position;
    } catch (error: any) {
      console.error('Error getting current position:', error);
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isNative,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
};

export default useBackgroundLocation;
