import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8e86ba9f9ae54901b6a9570fff4f3eac',
  appName: 'hifi-mart',
  webDir: 'dist',
  server: {
    url: 'https://8e86ba9f-9ae5-4901-b6a9-570fff4f3eac.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
