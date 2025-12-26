import { Capacitor } from '@capacitor/core';

// Haptic feedback types
export type HapticImpactStyle = 'heavy' | 'medium' | 'light';
export type HapticNotificationType = 'success' | 'warning' | 'error';

// Check if haptics are available
export const isHapticsAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Trigger impact haptic feedback
export const triggerImpact = async (style: HapticImpactStyle = 'medium'): Promise<void> => {
  if (!isHapticsAvailable()) {
    // Fallback to vibration API for web
    if ('vibrate' in navigator) {
      const duration = style === 'heavy' ? 100 : style === 'medium' ? 50 : 20;
      navigator.vibrate(duration);
    }
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const impactStyle = style === 'heavy' 
      ? ImpactStyle.Heavy 
      : style === 'medium' 
        ? ImpactStyle.Medium 
        : ImpactStyle.Light;
    
    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Error triggering impact haptic:', error);
  }
};

// Trigger notification haptic feedback
export const triggerNotification = async (type: HapticNotificationType = 'success'): Promise<void> => {
  if (!isHapticsAvailable()) {
    // Fallback to vibration API for web
    if ('vibrate' in navigator) {
      const pattern = type === 'error' 
        ? [100, 50, 100, 50, 100] 
        : type === 'warning' 
          ? [100, 50, 100] 
          : [50, 30, 50];
      navigator.vibrate(pattern);
    }
    return;
  }

  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const notificationType = type === 'error' 
      ? NotificationType.Error 
      : type === 'warning' 
        ? NotificationType.Warning 
        : NotificationType.Success;
    
    await Haptics.notification({ type: notificationType });
  } catch (error) {
    console.error('Error triggering notification haptic:', error);
  }
};

// Trigger selection haptic feedback
export const triggerSelection = async (): Promise<void> => {
  if (!isHapticsAvailable()) {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    return;
  }

  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch (error) {
    console.error('Error triggering selection haptic:', error);
  }
};

// Trigger vibration pattern (for order alerts)
export const triggerOrderAlertVibration = async (): Promise<void> => {
  if (!isHapticsAvailable()) {
    // Web fallback - distinctive pattern for order alerts
    if ('vibrate' in navigator) {
      // Pattern: long-short-long-short-long (like Zepto/Swiggy)
      navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
    }
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    // Create a distinctive haptic pattern for order alerts
    for (let i = 0; i < 4; i++) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 150));
      await Haptics.impact({ style: ImpactStyle.Light });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Error triggering order alert vibration:', error);
    // Fallback to web vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
    }
  }
};

// Trigger continuous vibration for urgent alerts
export const triggerUrgentVibration = async (durationSeconds: number = 5): Promise<void> => {
  if (!isHapticsAvailable()) {
    if ('vibrate' in navigator) {
      const pattern: number[] = [];
      for (let i = 0; i < durationSeconds * 2; i++) {
        pattern.push(200, 100);
      }
      navigator.vibrate(pattern);
    }
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    const endTime = Date.now() + durationSeconds * 1000;
    while (Date.now() < endTime) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (error) {
    console.error('Error triggering urgent vibration:', error);
  }
};
