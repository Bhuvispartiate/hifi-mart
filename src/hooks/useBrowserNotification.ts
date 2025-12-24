import { useState, useEffect, useCallback } from 'react';

export const useBrowserNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notificationOptions: NotificationOptions & { vibrate?: number[]; requireInteraction?: boolean } = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      };

      const notification = new Notification(title, notificationOptions);

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, []);

  return {
    permission,
    isSupported: 'Notification' in window,
    isGranted: permission === 'granted',
    requestPermission,
    showNotification,
  };
};

export default useBrowserNotification;
