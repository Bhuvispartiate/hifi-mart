// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBcYaAk-uwyUSCoE0b9gYItPURsAVyTfqI",
  authDomain: "groceries-addd0.firebaseapp.com",
  projectId: "groceries-addd0",
  storageBucket: "groceries-addd0.firebasestorage.app",
  messagingSenderId: "102335990086",
  appId: "1:102335990086:web:a23864c23491039c00bd47",
  measurementId: "G-NSCVWMDLFH"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Custom notification sound (two-tone ringtone)
const audioContext = new (self.AudioContext || self.webkitAudioContext)();

function playCustomRingtone() {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.value = 880;
  oscillator2.frequency.value = 1320;
  oscillator1.type = 'sine';
  oscillator2.type = 'sine';
  gainNode.gain.value = 0.3;

  const now = audioContext.currentTime;
  
  // Play repeating two-tone pattern
  for (let i = 0; i < 4; i++) {
    const startTime = now + (i * 0.6);
    oscillator1.frequency.setValueAtTime(880, startTime);
    oscillator1.frequency.setValueAtTime(0, startTime + 0.15);
    oscillator2.frequency.setValueAtTime(0, startTime);
    oscillator2.frequency.setValueAtTime(1320, startTime + 0.15);
    oscillator2.frequency.setValueAtTime(0, startTime + 0.3);
  }

  oscillator1.start(now);
  oscillator2.start(now);
  oscillator1.stop(now + 2.5);
  oscillator2.stop(now + 2.5);

  // Fade out
  gainNode.gain.setValueAtTime(0.3, now + 2);
  gainNode.gain.linearRampToValueAtTime(0, now + 2.5);
}

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Order';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'order-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: payload.data,
  };

  // Try to play custom sound
  try {
    playCustomRingtone();
  } catch (e) {
    console.log('Could not play custom sound in SW:', e);
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/admin/order-requests';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
