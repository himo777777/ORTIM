/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Precache and route assets from the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache chapter content with CacheFirst
registerRoute(
  ({ url }) => url.pathname.includes('/chapters/'),
  new CacheFirst({
    cacheName: 'chapter-content',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache algorithms with CacheFirst
registerRoute(
  ({ url }) => url.pathname.includes('/algorithms/'),
  new CacheFirst({
    cacheName: 'algorithms',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache API requests with NetworkFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      data: data.data,
      tag: data.tag || 'bortim-notification',
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Route based on notification type
  if (data?.type === 'certificate') {
    url = '/certificates';
  } else if (data?.type === 'enrollment') {
    url = '/course';
  } else if (data?.type === 'osce' || data?.type === 'osce_result') {
    url = '/instructor/osce';
  } else if (data?.type === 'reminder') {
    url = '/course';
  } else if (data?.action === 'open_course' || data?.action === 'continue_course') {
    url = '/course';
  } else if (data?.action === 'view_certificate') {
    url = '/certificates';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if no existing window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync interface (not in standard TS defs)
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

// Background sync for quiz attempts
// @ts-expect-error - 'sync' is part of Background Sync API, not in standard TS defs
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-quiz-attempts') {
    event.waitUntil(syncQuizAttempts());
  } else if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncQuizAttempts() {
  console.log('Syncing quiz attempts...');
  // Implementation will sync offline quiz attempts
}

async function syncProgress() {
  console.log('Syncing progress...');
  // Implementation will sync offline progress updates
}

// Skip waiting and claim clients immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
