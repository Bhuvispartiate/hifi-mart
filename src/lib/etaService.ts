// ETA Calculation Service
// Provides automated ETA calculation using Mapbox Directions API

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

export interface ETAResult {
  estimatedArrival: Date;
  estimatedDuration: number; // seconds
  estimatedDistance: number; // meters
  durationFormatted: string;
  distanceFormatted: string;
}

export interface RouteInfo {
  duration: number; // seconds
  distance: number; // meters
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const mins = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${mins} min`;
};

/**
 * Format distance in meters to human-readable string
 */
export const formatDistance = (meters: number): string => {
  if (!meters || !Number.isFinite(meters)) return '';
  const km = meters / 1000;
  if (km >= 1) return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  return `${Math.round(meters)} m`;
};

/**
 * Calculate ETA from origin to destination using Mapbox Directions API
 */
export const calculateETA = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<ETAResult | null> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      console.error('Mapbox Directions API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found');
      return null;
    }

    const route = data.routes[0];
    const duration = route.duration; // seconds
    const distance = route.distance; // meters
    
    const estimatedArrival = new Date(Date.now() + duration * 1000);

    return {
      estimatedArrival,
      estimatedDuration: duration,
      estimatedDistance: distance,
      durationFormatted: formatDuration(duration),
      distanceFormatted: formatDistance(distance),
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
};

/**
 * Fetch route with alternatives from Mapbox Directions API
 */
export const fetchRouteWithAlternatives = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteInfo[]> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      console.error('Mapbox Directions API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return [];
    }

    return data.routes.slice(0, 3).map((route: any) => ({
      duration: route.duration,
      distance: route.distance,
      geometry: route.geometry,
    }));
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
};

/**
 * Calculate estimated delivery time based on distance (fallback when location unavailable)
 * Uses average speed of 25 km/h for urban delivery
 */
export const calculateFallbackETA = (distanceKm: number): ETAResult => {
  const averageSpeedKmh = 25; // Average delivery speed in urban areas
  const durationHours = distanceKm / averageSpeedKmh;
  const durationSeconds = durationHours * 3600;
  const estimatedArrival = new Date(Date.now() + durationSeconds * 1000);

  return {
    estimatedArrival,
    estimatedDuration: durationSeconds,
    estimatedDistance: distanceKm * 1000,
    durationFormatted: formatDuration(durationSeconds),
    distanceFormatted: formatDistance(distanceKm * 1000),
  };
};
