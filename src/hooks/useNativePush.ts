import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { NOTIFICATION_CHANNELS, CHANNEL_IDS } from '@/lib/notificationChannels';
import { supabase } from '@/integrations/supabase/client';

export interface NativePushState {
  token: string | null;
  isNative: boolean;
  isSupported: boolean;
  permissionGranted: boolean;
}

export const useNativePush = () => {
  const [state, setState] = useState<NativePushState>({
    token: null,
    isNative: Capacitor.isNativePlatform(),
    isSupported: false,
    permissionGranted: false,
  });

  const isNative = Capacitor.isNativePlatform();

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (!isNative) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      try {
        // On native platforms, push notifications are always available
        setState(prev => ({ ...prev, isSupported: true }));
      } catch (error) {
        console.error('Error checking push support:', error);
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };

    checkSupport();
  }, [isNative]);

  // Create notification channels for Android
  const createNotificationChannels = useCallback(async () => {
    if (!isNative || Capacitor.getPlatform() !== 'android') return;

    try {
      for (const channel of NOTIFICATION_CHANNELS) {
        await PushNotifications.createChannel({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          importance: channel.importance === 'high' ? 5 : 3, // 5 = MAX, 3 = DEFAULT
          visibility: channel.visibility === 'public' ? 1 : 0,
          sound: channel.sound || undefined,
          vibration: channel.vibration,
          lights: channel.lights,
        });
        console.log(`Created notification channel: ${channel.id}`);
      }
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }, [isNative]);

  // Request permission and get token
  const requestPermissionAndGetToken = useCallback(async (): Promise<string | null> => {
    if (!isNative) {
      console.warn('Native push not available on web');
      return null;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive !== 'granted') {
        console.warn('Push notification permission denied');
        setState(prev => ({ ...prev, permissionGranted: false }));
        return null;
      }

      setState(prev => ({ ...prev, permissionGranted: true }));

      // Create notification channels before registering
      await createNotificationChannels();

      // Register for push notifications
      await PushNotifications.register();

      // The token will be received via the 'registration' event listener
      // Return a promise that resolves when we get the token
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Token registration timeout');
          resolve(null);
        }, 10000);

        PushNotifications.addListener('registration', (token: Token) => {
          clearTimeout(timeout);
          console.log('Push registration success, token:', token.value.substring(0, 20) + '...');
          setState(prev => ({ ...prev, token: token.value }));
          resolve(token.value);
        });
      });
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return null;
    }
  }, [isNative, createNotificationChannels]);

  // Setup notification listeners
  const setupListeners = useCallback((
    onNotificationReceived?: (notification: PushNotificationSchema) => void,
    onNotificationAction?: (action: ActionPerformed) => void
  ) => {
    if (!isNative) return () => {};

    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success:', token.value.substring(0, 20) + '...');
      setState(prev => ({ ...prev, token: token.value }));
    });

    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        onNotificationAction?.(action);
      }
    );

    // Return cleanup function
    return async () => {
      (await registrationListener).remove();
      (await registrationErrorListener).remove();
      (await notificationListener).remove();
      (await actionListener).remove();
    };
  }, [isNative]);

  // Send notification via edge function
  const sendNotification = useCallback(async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    channelId: string = CHANNEL_IDS.ORDER_ALERTS
  ) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          token,
          title,
          body,
          data: {
            ...data,
            channelId, // Include channel ID for native handling
          },
        },
      });

      if (error) {
        console.error('Error sending notification:', error);
        throw error;
      }

      console.log('Notification sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    requestPermissionAndGetToken,
    setupListeners,
    sendNotification,
    createNotificationChannels,
  };
};

export default useNativePush;
