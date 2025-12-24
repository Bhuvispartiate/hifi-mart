import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

// VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
// This is a public key and safe to include in client code
const VAPID_KEY = 'BDEhiNeQzLlCja0yS27OYaMceF0I2AV0dV7FC1AjdxCe-aZ1_5p7iU6CveZ5lxAEk6JQklx33-k5toyiqslBRZo';

export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if FCM is supported
    const checkSupport = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
          setIsSupported(true);
          setPermission(Notification.permission);
        }
      } catch (error) {
        console.error('FCM not supported:', error);
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const requestPermissionAndGetToken = useCallback(async () => {
    if (!isSupported) {
      console.warn('FCM is not supported in this browser');
      return null;
    }

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Get FCM token
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        setFcmToken(token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }, [isSupported]);

  const setupForegroundMessageHandler = useCallback((onMessageReceived: (payload: any) => void) => {
    if (!isSupported) return () => {};

    try {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        onMessageReceived(payload);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message handler:', error);
      return () => {};
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: { token, title, body, data },
      });

      if (error) {
        console.error('Error sending FCM notification:', error);
        throw error;
      }

      console.log('FCM notification sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
      throw error;
    }
  }, []);

  return {
    fcmToken,
    permission,
    isSupported,
    isGranted: permission === 'granted',
    requestPermissionAndGetToken,
    setupForegroundMessageHandler,
    sendNotification,
  };
};

export default useFCM;
