import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get access token using service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
  };

  // Base64url encode
  const base64url = (data: any) => {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token exchange error:', tokenData);
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const { token, title, body, data, sound, channelId, priority } = await req.json();

    if (!token) {
      throw new Error('FCM token is required');
    }

    console.log('Getting access token...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained');

    // Determine channel ID - default to high priority for delivery/order notifications
    const androidChannelId = channelId || data?.channelId || 'order_alerts';
    const notificationPriority = priority || 'high';

    // Build FCM message with enhanced Android configuration
    const message: any = {
      message: {
        token: token,
        notification: {
          title: title || 'New Notification',
          body: body || 'You have a new notification',
        },
        data: {
          ...data,
          channelId: androidChannelId,
          priority: notificationPriority,
          timestamp: new Date().toISOString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        // Android-specific configuration for high-priority heads-up notifications
        android: {
          priority: 'high', // Message delivery priority
          ttl: '86400s', // Time to live - 24 hours
          notification: {
            sound: sound || 'default',
            channel_id: androidChannelId, // Must match created channel in app
            priority: 'max', // Notification display priority - shows as heads-up
            visibility: 'public',
            default_sound: true,
            default_vibrate_timings: true,
            default_light_settings: true,
            notification_count: 1,
            // For Zepto/Swiggy-like persistent alerts
            sticky: androidChannelId === 'order_alerts',
            // Vibration pattern for urgent notifications (ms)
            vibrate_timings: ['0s', '0.3s', '0.1s', '0.3s', '0.1s', '0.3s'],
            // Light settings for LED notifications
            light_settings: {
              color: {
                red: 1,
                green: 0.5,
                blue: 0,
                alpha: 1,
              },
              light_on_duration: '0.5s',
              light_off_duration: '0.5s',
            },
          },
          // Direct boot mode - show notification even when device is locked
          direct_boot_ok: true,
        },
        // Web push configuration
        webpush: {
          headers: {
            Urgency: 'high',
            TTL: '86400',
          },
          notification: {
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            renotify: true,
            tag: `${androidChannelId}_${Date.now()}`,
          },
          fcm_options: {
            link: data?.url || '/',
          },
        },
        // iOS/APNs configuration
        apns: {
          headers: {
            'apns-priority': '10', // Immediate delivery
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              sound: sound || 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
              // Critical alert for high-priority notifications (requires entitlement)
              // 'sound': {
              //   critical: 1,
              //   name: 'default',
              //   volume: 1.0
              // },
              alert: {
                title: title,
                body: body,
              },
            },
          },
        },
      },
    };

    console.log('Sending FCM message to:', token.substring(0, 20) + '...', 'Channel:', androidChannelId);

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('FCM send error:', fcmResult);
      throw new Error(fcmResult.error?.message || 'Failed to send FCM notification');
    }

    console.log('FCM notification sent successfully:', fcmResult);

    return new Response(
      JSON.stringify({ success: true, messageId: fcmResult.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-fcm-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
