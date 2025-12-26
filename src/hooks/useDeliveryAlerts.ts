import { useCallback, useEffect, useState } from 'react';
import { playOrderAlertSound, playOrderRingtone, playSuccessSound, playDeliveryUpdateSound, stopNotificationSound } from '@/lib/notificationSounds';
import { triggerOrderAlertVibration, triggerImpact, triggerNotification } from '@/lib/haptics';

interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  orderAlertSound: boolean;
  deliveryUpdateSound: boolean;
  backgroundLocationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 80,
  orderAlertSound: true,
  deliveryUpdateSound: true,
  backgroundLocationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const useDeliveryAlerts = (deliveryPartnerId?: string) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Load preferences on mount
  useEffect(() => {
    if (deliveryPartnerId) {
      const savedPrefs = localStorage.getItem(`delivery_prefs_${deliveryPartnerId}`);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, [deliveryPartnerId]);

  // Check if current time is within quiet hours
  const isQuietHours = useCallback((): boolean => {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }, [preferences.quietHoursEnabled, preferences.quietHoursStart, preferences.quietHoursEnd]);

  // Play order alert (new order assigned)
  const playOrderAlert = useCallback(async () => {
    // Always play for order alerts, even during quiet hours
    if (preferences.soundEnabled && preferences.orderAlertSound) {
      playOrderRingtone({ volume: preferences.volume / 100 });
    }
    
    if (preferences.vibrationEnabled) {
      await triggerOrderAlertVibration();
    }
  }, [preferences]);

  // Play short order notification sound
  const playOrderNotification = useCallback(async () => {
    if (isQuietHours()) return;

    if (preferences.soundEnabled && preferences.orderAlertSound) {
      playOrderAlertSound({ volume: preferences.volume / 100 });
    }
    
    if (preferences.vibrationEnabled) {
      await triggerImpact('heavy');
    }
  }, [preferences, isQuietHours]);

  // Play delivery update sound
  const playUpdateNotification = useCallback(async () => {
    if (isQuietHours()) return;

    if (preferences.soundEnabled && preferences.deliveryUpdateSound) {
      playDeliveryUpdateSound({ volume: preferences.volume / 100 });
    }
    
    if (preferences.vibrationEnabled) {
      await triggerImpact('medium');
    }
  }, [preferences, isQuietHours]);

  // Play success sound (order completed, etc.)
  const playSuccessNotification = useCallback(async () => {
    if (isQuietHours()) return;

    if (preferences.soundEnabled) {
      playSuccessSound({ volume: preferences.volume / 100 });
    }
    
    if (preferences.vibrationEnabled) {
      await triggerNotification('success');
    }
  }, [preferences, isQuietHours]);

  // Stop all sounds
  const stopAlerts = useCallback(() => {
    stopNotificationSound();
  }, []);

  return {
    preferences,
    isQuietHours,
    playOrderAlert,
    playOrderNotification,
    playUpdateNotification,
    playSuccessNotification,
    stopAlerts,
  };
};

export default useDeliveryAlerts;
