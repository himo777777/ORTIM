import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

interface WebSocketHookOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface NotificationEvent {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
}

interface ProgressEvent {
  chapterId: string;
  progress: number;
}

interface ParticipantActivityEvent {
  userId: string;
  userName: string;
  type: 'quiz_completed' | 'chapter_completed' | 'login' | 'osce_scheduled';
  details?: Record<string, unknown>;
}

interface OsceAssessmentEvent {
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score?: number;
}

type EventHandler<T> = (data: T) => void;

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuthStore();

  // Event handlers storage
  const handlersRef = useRef<{
    notification: EventHandler<NotificationEvent>[];
    progress: EventHandler<ProgressEvent>[];
    activity: EventHandler<ParticipantActivityEvent>[];
    osce: EventHandler<OsceAssessmentEvent>[];
  }>({
    notification: [],
    progress: [],
    activity: [],
    osce: [],
  });

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token || !isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;

    socketRef.current = io(`${wsUrl}/ws`, {
      auth: { token },
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', (reason: string) => {
      setIsConnected(false);
      console.log('WebSocket disconnected:', reason);
    });

    socketRef.current.on('connect_error', (err: Error) => {
      setError(err.message);
      console.error('WebSocket connection error:', err);
    });

    // Set up event listeners
    socketRef.current.on('notification', (data: NotificationEvent) => {
      handlersRef.current.notification.forEach((handler) => handler(data));
    });

    socketRef.current.on('progress:updated', (data: ProgressEvent) => {
      handlersRef.current.progress.forEach((handler) => handler(data));
    });

    socketRef.current.on('participant:activity', (data: ParticipantActivityEvent) => {
      handlersRef.current.activity.forEach((handler) => handler(data));
    });

    socketRef.current.on('osce:assessed', (data: OsceAssessmentEvent) => {
      handlersRef.current.osce.forEach((handler) => handler(data));
    });
  }, [token, isAuthenticated, reconnectionAttempts, reconnectionDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Subscribe to course updates
  const subscribeToCourse = useCallback((courseId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:course', { courseId });
    }
  }, []);

  // Subscribe to cohort updates (for instructors)
  const subscribeToCohort = useCallback((cohortId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:cohort', { cohortId });
    }
  }, []);

  // Add event handlers
  const onNotification = useCallback((handler: EventHandler<NotificationEvent>) => {
    handlersRef.current.notification.push(handler);
    return () => {
      handlersRef.current.notification = handlersRef.current.notification.filter(
        (h) => h !== handler
      );
    };
  }, []);

  const onProgressUpdate = useCallback((handler: EventHandler<ProgressEvent>) => {
    handlersRef.current.progress.push(handler);
    return () => {
      handlersRef.current.progress = handlersRef.current.progress.filter((h) => h !== handler);
    };
  }, []);

  const onParticipantActivity = useCallback((handler: EventHandler<ParticipantActivityEvent>) => {
    handlersRef.current.activity.push(handler);
    return () => {
      handlersRef.current.activity = handlersRef.current.activity.filter((h) => h !== handler);
    };
  }, []);

  const onOsceAssessment = useCallback((handler: EventHandler<OsceAssessmentEvent>) => {
    handlersRef.current.osce.push(handler);
    return () => {
      handlersRef.current.osce = handlersRef.current.osce.filter((h) => h !== handler);
    };
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, token, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribeToCourse,
    subscribeToCohort,
    onNotification,
    onProgressUpdate,
    onParticipantActivity,
    onOsceAssessment,
  };
}
