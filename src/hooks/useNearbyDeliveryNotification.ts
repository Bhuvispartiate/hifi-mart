import { useEffect, useRef, useCallback } from 'react';
import { Order } from '@/lib/firestoreService';
import { useFCM } from '@/hooks/useFCM';
import { toast } from 'sonner';

const NEARBY_DISTANCE_METERS = 500;
const NEARBY_DURATION_SECONDS = 120; // 2 minutes

// Calculate distance between two coordinates in meters using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useNearbyDeliveryNotification = (order: Order | null) => {
  const notifiedRef = useRef(false);
  const { isSupported, isGranted, sendNotification, requestPermissionAndGetToken } = useFCM();

  const checkAndNotify = useCallback(async () => {
    if (!order || notifiedRef.current) return;

    // Only check for out_for_delivery orders
    if (order.status !== 'out_for_delivery') return;

    const isNearby = checkIfNearby(order);

    if (isNearby) {
      notifiedRef.current = true;

      // Show toast notification
      toast.success('🚴 Your delivery is almost here!', {
        description: 'Your delivery partner is nearby and will arrive soon.',
        duration: 10000,
      });

      // Try to send push notification if permission granted
      if (isSupported && isGranted) {
        try {
          const fcmToken = localStorage.getItem('fcm_token');
          if (fcmToken) {
            await sendNotification(
              fcmToken,
              '🚴 Delivery Almost Here!',
              'Your delivery partner is nearby and will arrive in about 2 minutes.',
              { orderId: order.id, type: 'nearby_delivery' }
            );
          }
        } catch (error) {
          console.error('Failed to send push notification:', error);
        }
      }
    }
  }, [order, isSupported, isGranted, sendNotification]);

  // Check if delivery partner is nearby
  const checkIfNearby = (order: Order): boolean => {
    // Check by estimated duration (within 2 minutes)
    if (order.estimatedDuration && order.estimatedDuration <= NEARBY_DURATION_SECONDS) {
      return true;
    }

    // Check by estimated distance (within 500m)
    if (order.estimatedDistance && order.estimatedDistance <= NEARBY_DISTANCE_METERS) {
      return true;
    }

    // Check by actual location if available
    if (order.deliveryPartnerLocation && order.deliveryCoordinates) {
      const distance = calculateDistance(
        order.deliveryPartnerLocation.lat,
        order.deliveryPartnerLocation.lng,
        order.deliveryCoordinates.lat,
        order.deliveryCoordinates.lng
      );
      if (distance <= NEARBY_DISTANCE_METERS) {
        return true;
      }
    }

    return false;
  };

  // Reset notification flag when order changes or status changes
  useEffect(() => {
    if (!order || order.status !== 'out_for_delivery') {
      notifiedRef.current = false;
    }
  }, [order?.id, order?.status]);

  // Check for nearby delivery whenever order updates
  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  // Request notification permission on mount
  useEffect(() => {
    if (isSupported && !isGranted) {
      requestPermissionAndGetToken().then(token => {
        if (token) {
          localStorage.setItem('fcm_token', token);
        }
      });
    }
  }, [isSupported, isGranted, requestPermissionAndGetToken]);

  return {
    isNearby: order ? checkIfNearby(order) : false,
    hasNotified: notifiedRef.current,
  };
};

export default useNearbyDeliveryNotification;
