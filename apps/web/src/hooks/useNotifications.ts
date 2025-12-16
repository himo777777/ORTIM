import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  sentAt: string;
  readAt: string | null;
}

// Query keys
const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  vapidKey: ['notifications', 'vapid-key'] as const,
};

// Get all notifications
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => api.notifications.getAll(),
  });
}

// Get unread notifications
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => api.notifications.getUnread(),
  });
}

// Get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => api.notifications.getUnreadCount(),
    refetchInterval: 60000, // Refetch every minute
  });
}

// Get VAPID public key
export function useVapidPublicKey() {
  return useQuery({
    queryKey: notificationKeys.vapidKey,
    queryFn: () => api.notifications.getVapidPublicKey(),
    staleTime: Infinity, // Never refetch
  });
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

// Subscribe to push notifications
export function useSubscribePush() {
  return useMutation({
    mutationFn: (subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }) => api.notifications.subscribe(subscription),
  });
}

// Unsubscribe from push notifications
export function useUnsubscribePush() {
  return useMutation({
    mutationFn: (endpoint: string) => api.notifications.unsubscribe(endpoint),
  });
}

// Unsubscribe all
export function useUnsubscribeAllPush() {
  return useMutation({
    mutationFn: () => api.notifications.unsubscribeAll(),
  });
}

// Send test notification
export function useSendTestNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.sendTest(),
    onSuccess: () => {
      // Refetch notifications after sending test
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      }, 1000);
    },
  });
}

// Send notification (admin)
export function useSendNotification() {
  return useMutation({
    mutationFn: (data: {
      userIds?: string[];
      role?: 'PARTICIPANT' | 'INSTRUCTOR' | 'ADMIN';
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }) => api.notifications.send(data),
  });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Hook to manage push subscription
export function usePushSubscription() {
  const { data: vapidData } = useVapidPublicKey();
  const subscribeMutation = useSubscribePush();
  const unsubscribeMutation = useUnsubscribePush();

  const subscribe = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    if (!vapidData?.vapidPublicKey) {
      console.warn('VAPID key not available');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        console.error('Failed to get subscription keys');
        return false;
      }

      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation.mutateAsync(subscription.endpoint);
        await subscription.unsubscribe();
      }

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  };

  const getSubscriptionStatus = async (): Promise<'granted' | 'denied' | 'default' | 'unsupported'> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  };

  const isSubscribed = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  };

  return {
    subscribe,
    unsubscribe,
    getSubscriptionStatus,
    isSubscribed,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}
