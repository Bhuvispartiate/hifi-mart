import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useFCM } from './useFCM';
import { useNativePush } from './useNativePush';
import { CHANNEL_IDS } from '@/lib/notificationChannels';

/**
 * Unified push notification hook that automatically selects
 * between web FCM and native Capacitor push notifications
 */
export const usePushNotifications = () => {
  const isNative = Capacitor.isNativePlatform();
  
  // Web FCM hook
  const fcm = useFCM();
  
  // Native push hook
  const nativePush = useNativePush();

  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Sync state based on platform
  useEffect(() => {
    if (isNative) {
      setToken(nativePush.token);
      setIsSupported(nativePush.isSupported);
      setPermissionGranted(nativePush.permissionGranted);
    } else {
      setToken(fcm.fcmToken);
      setIsSupported(fcm.isSupported);
      setPermissionGranted(fcm.isGranted);
    }
  }, [
    isNative,
    nativePush.token,
    nativePush.isSupported,
    nativePush.permissionGranted,
    fcm.fcmToken,
    fcm.isSupported,
    fcm.isGranted,
  ]);

  // Request permission and get token
  const requestPermissionAndGetToken = useCallback(async (): Promise<string | null> => {
    if (isNative) {
      const nativeToken = await nativePush.requestPermissionAndGetToken();
      setToken(nativeToken);
      return nativeToken;
    } else {
      const webToken = await fcm.requestPermissionAndGetToken();
      setToken(webToken);
      return webToken;
    }
  }, [isNative, nativePush, fcm]);

  // Setup foreground message handler
  const setupForegroundHandler = useCallback((
    onMessageReceived: (payload: any) => void
  ) => {
    if (isNative) {
      return nativePush.setupListeners(
        (notification) => {
          onMessageReceived({
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: notification.data,
          });
        },
        (action) => {
          console.log('Notification action:', action);
        }
      );
    } else {
      return fcm.setupForegroundMessageHandler(onMessageReceived);
    }
  }, [isNative, nativePush, fcm]);

  // Send notification
  const sendNotification = useCallback(async (
    targetToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    channelId: string = CHANNEL_IDS.ORDER_ALERTS
  ) => {
    if (isNative) {
      return nativePush.sendNotification(targetToken, title, body, data, channelId);
    } else {
      return fcm.sendNotification(targetToken, title, body, data);
    }
  }, [isNative, nativePush, fcm]);

  return {
    token,
    isNative,
    isSupported,
    permissionGranted,
    requestPermissionAndGetToken,
    setupForegroundHandler,
    sendNotification,
  };
};

export default usePushNotifications;
