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
      tag: data.tag || 'ortac-notification',
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

  try {
    const db = await openDatabase();
    const tx = db.transaction(['syncQueue', 'quizAttempts'], 'readwrite');
    const syncStore = tx.objectStore('syncQueue');
    const quizStore = tx.objectStore('quizAttempts');

    // Get all quiz sync items
    const allItems = await getAllFromStore(syncStore);
    const quizItems = allItems.filter((item: SyncQueueItem) => item.type === 'quiz');

    for (const item of quizItems) {
      try {
        const response = await fetch('/api/quiz/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          // Remove from sync queue
          await deleteFromStore(syncStore, item.id);

          // Update quiz attempt status
          const attemptId = (item.payload as { id?: string }).id;
          if (attemptId) {
            const attempt = await getFromStore(quizStore, attemptId) as Record<string, unknown> | undefined;
            if (attempt) {
              attempt.syncStatus = 'synced';
              await putToStore(quizStore, attempt);
            }
          }
          console.log(`Synced quiz attempt: ${item.id}`);
        } else {
          console.error(`Failed to sync quiz attempt: ${response.status}`);
          await incrementRetryCount(syncStore, item);
        }
      } catch (error) {
        console.error('Error syncing quiz attempt:', error);
        await incrementRetryCount(syncStore, item);
      }
    }

    db.close();
  } catch (error) {
    console.error('Error accessing database for quiz sync:', error);
  }
}

async function syncProgress() {
  console.log('Syncing progress...');

  try {
    const db = await openDatabase();
    const tx = db.transaction(['syncQueue', 'progress'], 'readwrite');
    const syncStore = tx.objectStore('syncQueue');
    const progressStore = tx.objectStore('progress');

    // Get all progress sync items
    const allItems = await getAllFromStore(syncStore);
    const progressItems = allItems.filter((item: SyncQueueItem) => item.type === 'progress');

    for (const item of progressItems) {
      try {
        const response = await fetch('/api/progress/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          // Remove from sync queue
          await deleteFromStore(syncStore, item.id);

          // Update progress status
          const chapterId = (item.payload as { chapterId?: string }).chapterId;
          if (chapterId) {
            const progress = await getFromStore(progressStore, chapterId) as Record<string, unknown> | undefined;
            if (progress) {
              progress.syncStatus = 'synced';
              await putToStore(progressStore, progress);
            }
          }
          console.log(`Synced progress: ${item.id}`);
        } else {
          console.error(`Failed to sync progress: ${response.status}`);
          await incrementRetryCount(syncStore, item);
        }
      } catch (error) {
        console.error('Error syncing progress:', error);
        await incrementRetryCount(syncStore, item);
      }
    }

    db.close();
  } catch (error) {
    console.error('Error accessing database for progress sync:', error);
  }
}

// IndexedDB helpers for service worker context
interface SyncQueueItem {
  id: string;
  type: 'progress' | 'quiz' | 'review';
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ortac', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store: IDBObjectStore): Promise<SyncQueueItem[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getFromStore<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function putToStore<T>(store: IDBObjectStore, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.put(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function deleteFromStore(store: IDBObjectStore, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function incrementRetryCount(store: IDBObjectStore, item: SyncQueueItem): Promise<void> {
  item.retryCount += 1;
  if (item.retryCount < 5) {
    await putToStore(store, item);
  } else {
    // Remove after 5 failed attempts
    console.warn(`Removing sync item ${item.id} after 5 failed attempts`);
    await deleteFromStore(store, item.id);
  }
}

// Skip waiting and claim clients immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
