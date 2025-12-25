// Geofencing configuration
// Center point: 13.308798940760282, 80.17290657335155
// Default radius: 5 KM

import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';

export interface GeofenceConfig {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  updatedAt?: Date;
}

// Default geofence configuration
const DEFAULT_GEOFENCE: GeofenceConfig = {
  centerLat: 13.308798940760282,
  centerLng: 80.17290657335155,
  radiusKm: 5,
};

const GEOFENCE_DOC_ID = 'geofence_settings';

// In-memory cache for geofence config
let cachedConfig: GeofenceConfig | null = null;
let unsubscribe: (() => void) | null = null;

// Initialize real-time listener for geofence changes
export const initGeofenceListener = (callback?: (config: GeofenceConfig) => void): void => {
  if (unsubscribe) return; // Already listening

  const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
  unsubscribe = onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      cachedConfig = {
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        radiusKm: data.radiusKm,
        updatedAt: data.updatedAt?.toDate(),
      };
    } else {
      // Document doesn't exist - create it with default values
      console.log('Geofence config not found in listener, creating default...');
      try {
        await setDoc(docRef, {
          ...DEFAULT_GEOFENCE,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Error creating default geofence config:', error);
      }
      cachedConfig = DEFAULT_GEOFENCE;
    }
    callback?.(cachedConfig);
  }, (error) => {
    console.error('Error listening to geofence config:', error);
    cachedConfig = DEFAULT_GEOFENCE;
  });
};

// Stop listening to geofence changes
export const stopGeofenceListener = (): void => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

// Get current geofence configuration (sync - uses cache)
export const getGeofenceConfig = (): GeofenceConfig => {
  return cachedConfig || DEFAULT_GEOFENCE;
};

// Get geofence config from Firestore (async) - creates default if doesn't exist
export const fetchGeofenceConfig = async (): Promise<GeofenceConfig> => {
  try {
    const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      cachedConfig = {
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        radiusKm: data.radiusKm,
        updatedAt: data.updatedAt?.toDate(),
      };
      return cachedConfig;
    } else {
      // Document doesn't exist - create it with default values
      console.log('Geofence config not found, creating default...');
      await setDoc(docRef, {
        ...DEFAULT_GEOFENCE,
        updatedAt: Timestamp.now(),
      });
      cachedConfig = DEFAULT_GEOFENCE;
      return cachedConfig;
    }
  } catch (error) {
    console.error('Error fetching geofence config:', error);
  }
  return DEFAULT_GEOFENCE;
};

// Update geofence radius (admin only)
export const updateGeofenceRadius = async (radiusKm: number): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
    const currentConfig = await fetchGeofenceConfig();
    await setDoc(docRef, {
      ...currentConfig,
      radiusKm,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating geofence radius:', error);
    return false;
  }
};

// Update geofence center (admin only)
export const updateGeofenceCenter = async (lat: number, lng: number): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
    const currentConfig = await fetchGeofenceConfig();
    await setDoc(docRef, {
      ...currentConfig,
      centerLat: lat,
      centerLng: lng,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating geofence center:', error);
    return false;
  }
};

// Update full geofence config (admin only)
export const updateGeofenceConfig = async (config: Partial<GeofenceConfig>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
    const currentConfig = await fetchGeofenceConfig();
    await setDoc(docRef, {
      ...currentConfig,
      ...config,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating geofence config:', error);
    return false;
  }
};

// Reset to default geofence (admin only)
export const resetGeofenceToDefault = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, 'settings', GEOFENCE_DOC_ID);
    await setDoc(docRef, {
      ...DEFAULT_GEOFENCE,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error resetting geofence:', error);
    return false;
  }
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Check if a location is within the geofence
export const isWithinGeofence = (lat: number, lng: number): boolean => {
  const config = getGeofenceConfig();
  const distance = calculateDistance(config.centerLat, config.centerLng, lat, lng);
  return distance <= config.radiusKm;
};

// Get distance from geofence center
export const getDistanceFromCenter = (lat: number, lng: number): number => {
  const config = getGeofenceConfig();
  return calculateDistance(config.centerLat, config.centerLng, lat, lng);
};
