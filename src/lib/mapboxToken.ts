const STORAGE_KEY = 'mapbox_public_token';

export const getMapboxPublicToken = (): string | undefined => {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    return token || undefined;
  } catch {
    return undefined;
  }
};

export const setMapboxPublicToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
};
