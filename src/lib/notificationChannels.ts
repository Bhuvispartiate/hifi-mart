// Android Notification Channel Configuration
// These channels are created when the app initializes on Android

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'high' | 'default' | 'low' | 'min';
  visibility: 'public' | 'private' | 'secret';
  sound?: string;
  vibration?: boolean;
  lights?: boolean;
}

export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    id: 'order_alerts',
    name: 'Order Alerts',
    description: 'Critical notifications for new order assignments',
    importance: 'high',
    visibility: 'public',
    sound: 'default',
    vibration: true,
    lights: true,
  },
  {
    id: 'delivery_updates',
    name: 'Delivery Updates',
    description: 'Updates about your delivery status',
    importance: 'high',
    visibility: 'public',
    sound: 'default',
    vibration: true,
    lights: true,
  },
  {
    id: 'customer_notifications',
    name: 'Customer Notifications',
    description: 'Order confirmations and delivery updates for customers',
    importance: 'high',
    visibility: 'public',
    sound: 'default',
    vibration: true,
    lights: true,
  },
  {
    id: 'admin_alerts',
    name: 'Admin Alerts',
    description: 'Critical admin notifications for new orders',
    importance: 'high',
    visibility: 'private',
    sound: 'default',
    vibration: true,
    lights: true,
  },
];

// Channel IDs for quick reference
export const CHANNEL_IDS = {
  ORDER_ALERTS: 'order_alerts',
  DELIVERY_UPDATES: 'delivery_updates',
  CUSTOMER_NOTIFICATIONS: 'customer_notifications',
  ADMIN_ALERTS: 'admin_alerts',
} as const;

// Get channel by ID
export const getChannelById = (id: string): NotificationChannel | undefined => {
  return NOTIFICATION_CHANNELS.find(channel => channel.id === id);
};

// Get importance level number for Android
export const getImportanceLevel = (importance: NotificationChannel['importance']): number => {
  switch (importance) {
    case 'high':
      return 4; // IMPORTANCE_HIGH
    case 'default':
      return 3; // IMPORTANCE_DEFAULT
    case 'low':
      return 2; // IMPORTANCE_LOW
    case 'min':
      return 1; // IMPORTANCE_MIN
    default:
      return 3;
  }
};
