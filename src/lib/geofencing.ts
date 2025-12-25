// Geofencing configuration
// Center point: 13.308798940760282, 80.17290657335155
// Default radius: 5 KM

export interface GeofenceConfig {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

// Default geofence configuration
const DEFAULT_GEOFENCE: GeofenceConfig = {
  centerLat: 13.308798940760282,
  centerLng: 80.17290657335155,
  radiusKm: 5,
};

const GEOFENCE_STORAGE_KEY = 'geofence_config';

// Get current geofence configuration
export const getGeofenceConfig = (): GeofenceConfig => {
  try {
    const stored = localStorage.getItem(GEOFENCE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading geofence config:', error);
  }
  return DEFAULT_GEOFENCE;
};

// Update geofence radius (admin only)
export const updateGeofenceRadius = (radiusKm: number): void => {
  const config = getGeofenceConfig();
  config.radiusKm = radiusKm;
  localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(config));
};

// Update geofence center (admin only)
export const updateGeofenceCenter = (lat: number, lng: number): void => {
  const config = getGeofenceConfig();
  config.centerLat = lat;
  config.centerLng = lng;
  localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(config));
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
