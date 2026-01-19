import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Types
export interface SessionInfo {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  pageViews: number;
  actions: number;
  deviceType: string | null;
  isActive: boolean;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  averageDuration: number;
  averagePageViews: number;
  averageActions: number;
  deviceBreakdown: Record<string, number>;
}

// Configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_TIMEOUT = 60000; // 1 minute of inactivity

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const sessionApi = {
  startSession: async (): Promise<SessionInfo> => {
    const response = await fetch('/api/analytics/session/start', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  },

  heartbeat: async (
    sessionId: string,
    pageView: boolean = false,
    action: boolean = false,
  ): Promise<SessionInfo | null> => {
    const response = await fetch('/api/analytics/session/heartbeat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, pageView, action }),
    });
    if (!response.ok) return null;
    return response.json();
  },

  endSession: async (sessionId: string): Promise<SessionInfo | null> => {
    const response = await fetch('/api/analytics/session/end', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) return null;
    return response.json();
  },

  getActiveSession: async (): Promise<SessionInfo | null> => {
    const response = await fetch('/api/analytics/session/active', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return response.json();
  },

  getSessionStats: async (days: number = 30): Promise<SessionStats> => {
    const response = await fetch(`/api/analytics/session/stats?days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get session stats');
    return response.json();
  },

  getSessionHistory: async (limit: number = 20): Promise<SessionInfo[]> => {
    const response = await fetch(`/api/analytics/session/history?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get session history');
    return response.json();
  },

  getActiveUsersCount: async (): Promise<{ count: number }> => {
    const response = await fetch('/api/analytics/session/active-users', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get active users count');
    return response.json();
  },
};

/**
 * Hook för automatisk sessionsspårning
 * Startar session vid inloggning, skickar heartbeats och avslutar vid utloggning
 */
export function useSessionTracking() {
  const { isAuthenticated, user } = useAuthStore();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string | null>(null);

  // Rensa alla timers
  const clearTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  // Starta session
  const startSession = useCallback(async () => {
    if (sessionIdRef.current || !isAuthenticated) return;

    try {
      const newSession = await sessionApi.startSession();
      setSession(newSession);
      sessionIdRef.current = newSession.id;
      setIsTracking(true);

      // Starta heartbeat interval
      heartbeatIntervalRef.current = setInterval(async () => {
        if (sessionIdRef.current) {
          const updated = await sessionApi.heartbeat(sessionIdRef.current);
          if (updated) {
            setSession(updated);
          }
        }
      }, HEARTBEAT_INTERVAL);

      console.log('[SessionTracking] Session started:', newSession.id);
    } catch (error) {
      console.error('[SessionTracking] Failed to start session:', error);
    }
  }, [isAuthenticated]);

  // Avsluta session
  const endSession = useCallback(async () => {
    clearTimers();

    if (sessionIdRef.current) {
      try {
        await sessionApi.endSession(sessionIdRef.current);
        console.log('[SessionTracking] Session ended:', sessionIdRef.current);
      } catch (error) {
        console.error('[SessionTracking] Failed to end session:', error);
      }
    }

    sessionIdRef.current = null;
    setSession(null);
    setIsTracking(false);
  }, [clearTimers]);

  // Registrera sidvisning
  const trackPageView = useCallback(async () => {
    if (sessionIdRef.current) {
      lastActivityRef.current = Date.now();
      const updated = await sessionApi.heartbeat(sessionIdRef.current, true, false);
      if (updated) {
        setSession(updated);
      }
    }
  }, []);

  // Registrera användaraktion
  const trackAction = useCallback(async () => {
    if (sessionIdRef.current) {
      lastActivityRef.current = Date.now();
      const updated = await sessionApi.heartbeat(sessionIdRef.current, false, true);
      if (updated) {
        setSession(updated);
      }
    }
  }, []);

  // Hantera aktivitet (för inaktivitetsdetektering)
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Återställ inaktivitetstimeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      // Användaren har varit inaktiv - sluta skicka heartbeats men behåll sessionen
      console.log('[SessionTracking] User inactive');
    }, ACTIVITY_TIMEOUT);
  }, []);

  // Effekt för att hantera autentisering
  useEffect(() => {
    if (isAuthenticated && user && !sessionIdRef.current) {
      startSession();
    } else if (!isAuthenticated && sessionIdRef.current) {
      endSession();
    }
  }, [isAuthenticated, user, startSession, endSession]);

  // Effekt för att lyssna på aktivitet
  useEffect(() => {
    if (!isTracking) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isTracking, handleActivity]);

  // Effekt för att avsluta session vid stängning av fönster
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Använd sendBeacon för att säkerställa att requesten går iväg
        const data = JSON.stringify({ sessionId: sessionIdRef.current });
        navigator.sendBeacon('/api/analytics/session/end', data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionIdRef.current) {
        // Skicka heartbeat när användaren lämnar fliken
        sessionApi.heartbeat(sessionIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup vid unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (sessionIdRef.current) {
        // Försök avsluta sessionen
        sessionApi.endSession(sessionIdRef.current).catch(() => {});
      }
    };
  }, [clearTimers]);

  return {
    session,
    isTracking,
    trackPageView,
    trackAction,
    startSession,
    endSession,
  };
}

/**
 * Hook för att hämta sessionsstatistik (för admin)
 */
export function useSessionStats(days: number = 30) {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await sessionApi.getSessionStats(days);
        setStats(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch stats'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [days]);

  return { stats, isLoading, error };
}

/**
 * Hook för att hämta sessionshistorik för användaren
 */
export function useSessionHistory(limit: number = 20) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await sessionApi.getSessionHistory(limit);
        setSessions(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch history'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [limit]);

  return { sessions, isLoading, error };
}

/**
 * Hook för att hämta antal aktiva användare
 */
export function useActiveUsersCount() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await sessionApi.getActiveUsersCount();
        setCount(data.count);
      } catch (e) {
        console.error('Failed to fetch active users count:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Uppdatera var 30:e sekund
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return { count, isLoading };
}

export { sessionApi };
