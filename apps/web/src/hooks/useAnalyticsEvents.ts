import { useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Event types
export type EventType =
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'search'
  | 'quiz_start'
  | 'quiz_submit'
  | 'chapter_start'
  | 'chapter_complete'
  | 'download'
  | 'share'
  | 'error';

export interface TrackEventParams {
  eventType: EventType;
  eventName: string;
  properties?: Record<string, unknown>;
  pageUrl?: string;
  referrer?: string;
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const eventApi = {
  trackEvent: async (event: TrackEventParams & { sessionId?: string }) => {
    try {
      const response = await fetch('/api/analytics/events/track', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(event),
      });
      return response.ok;
    } catch {
      console.error('[Analytics] Failed to track event');
      return false;
    }
  },

  trackBatch: async (events: (TrackEventParams & { sessionId?: string })[]) => {
    try {
      const response = await fetch('/api/analytics/events/batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(events),
      });
      return response.ok;
    } catch {
      console.error('[Analytics] Failed to track batch events');
      return false;
    }
  },
};

// Configuration
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 seconds

/**
 * Hook för händelsespårning
 */
export function useAnalyticsEvents() {
  const { isAuthenticated } = useAuthStore();
  const eventQueueRef = useRef<(TrackEventParams & { sessionId?: string })[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Hämta session ID från sessionStorage
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('analytics_session_id');
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId;
    }
  }, []);

  // Skicka batch
  const flushBatch = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    await eventApi.trackBatch(events);
  }, []);

  // Starta batch-timer
  useEffect(() => {
    batchTimerRef.current = setInterval(flushBatch, BATCH_INTERVAL);

    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }
      // Skicka kvarvarande events vid unmount
      flushBatch();
    };
  }, [flushBatch]);

  // Spåra händelse
  const trackEvent = useCallback((params: TrackEventParams) => {
    if (!isAuthenticated) return;

    const event = {
      ...params,
      sessionId: sessionIdRef.current || undefined,
      pageUrl: params.pageUrl || window.location.pathname,
      referrer: params.referrer || document.referrer,
    };

    eventQueueRef.current.push(event);

    // Skicka direkt om batch är full
    if (eventQueueRef.current.length >= BATCH_SIZE) {
      flushBatch();
    }
  }, [isAuthenticated, flushBatch]);

  // Fördefinierade spårningsfunktioner
  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'page_view',
      eventName: pageName,
      properties,
    });
  }, [trackEvent]);

  const trackClick = useCallback((elementName: string, properties?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'click',
      eventName: elementName,
      properties,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultCount?: number) => {
    trackEvent({
      eventType: 'search',
      eventName: 'search',
      properties: { query, resultCount },
    });
  }, [trackEvent]);

  const trackVideoPlay = useCallback((videoId: string, videoTitle?: string) => {
    trackEvent({
      eventType: 'video_play',
      eventName: videoId,
      properties: { videoTitle },
    });
  }, [trackEvent]);

  const trackVideoComplete = useCallback((videoId: string, watchDuration?: number) => {
    trackEvent({
      eventType: 'video_complete',
      eventName: videoId,
      properties: { watchDuration },
    });
  }, [trackEvent]);

  const trackQuizStart = useCallback((quizId: string, quizType?: string) => {
    trackEvent({
      eventType: 'quiz_start',
      eventName: quizId,
      properties: { quizType },
    });
  }, [trackEvent]);

  const trackQuizSubmit = useCallback((quizId: string, score: number, passed: boolean) => {
    trackEvent({
      eventType: 'quiz_submit',
      eventName: quizId,
      properties: { score, passed },
    });
  }, [trackEvent]);

  const trackChapterStart = useCallback((chapterId: string, chapterTitle?: string) => {
    trackEvent({
      eventType: 'chapter_start',
      eventName: chapterId,
      properties: { chapterTitle },
    });
  }, [trackEvent]);

  const trackChapterComplete = useCallback((chapterId: string, timeSpent?: number) => {
    trackEvent({
      eventType: 'chapter_complete',
      eventName: chapterId,
      properties: { timeSpent },
    });
  }, [trackEvent]);

  const trackDownload = useCallback((fileName: string, fileType?: string) => {
    trackEvent({
      eventType: 'download',
      eventName: fileName,
      properties: { fileType },
    });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, stack?: string) => {
    trackEvent({
      eventType: 'error',
      eventName: errorType,
      properties: { errorMessage, stack },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackSearch,
    trackVideoPlay,
    trackVideoComplete,
    trackQuizStart,
    trackQuizSubmit,
    trackChapterStart,
    trackChapterComplete,
    trackDownload,
    trackError,
    flushBatch,
  };
}

/**
 * Hook för automatisk sidvisningsspårning
 */
export function usePageViewTracking(pageName: string, properties?: Record<string, unknown>) {
  const { trackPageView } = useAnalyticsEvents();

  useEffect(() => {
    trackPageView(pageName, properties);
  }, [pageName, trackPageView, properties]);
}

export { eventApi };
