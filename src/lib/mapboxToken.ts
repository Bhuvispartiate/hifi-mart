const STORAGE_KEY = 'mapbox_public_token';

// Default Mapbox public token
export const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoiYmh1dmlzcGFydGlhdGUxOCIsImEiOiJjbWppdW9pMGYwaDEzM2pweWQ2YzhlcXQ5In0.raKFyGQP-n51RDUejCyVnA';

export const getMapboxPublicToken = (): string => {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    return token || DEFAULT_MAPBOX_TOKEN;
  } catch {
    return DEFAULT_MAPBOX_TOKEN;
  }
};

export const setMapboxPublicToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
};
