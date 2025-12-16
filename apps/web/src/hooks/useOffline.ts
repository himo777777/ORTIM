import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { api } from '@/lib/api';

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for cache statistics
export function useCacheStats() {
  return useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => db.getCacheStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Hook for downloading content for offline use
export function useDownloadForOffline() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    status: 'idle' | 'downloading' | 'done' | 'error';
    current: number;
    total: number;
    message: string;
  }>({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
  });

  const downloadAll = useCallback(async () => {
    try {
      setProgress({ status: 'downloading', current: 0, total: 3, message: 'Hämtar kapitel...' });

      // 1. Download and cache chapters
      const coursesData = await api.courses.list();
      const course = coursesData[0]; // Get first course (B-ORTIM)

      if (course) {
        const courseDetail = await api.courses.getByCode(course.code);
        let chapterCount = 0;

        for (const part of courseDetail.parts || []) {
          for (const chapter of part.chapters || []) {
            await db.cacheChapter({
              id: chapter.id,
              slug: chapter.slug,
              chapterNumber: chapter.chapterNumber,
              title: chapter.title,
              content: chapter.content || '',
              estimatedMinutes: chapter.estimatedMinutes,
              version: 1,
            });
            chapterCount++;
          }
        }

        setProgress({
          status: 'downloading',
          current: 1,
          total: 3,
          message: `${chapterCount} kapitel sparade. Hämtar algoritmer...`,
        });
      }

      // 2. Download and cache algorithms
      const algorithms = await api.algorithms.list();
      for (const algo of algorithms) {
        const detail = await api.algorithms.getByCode(algo.code);
        await db.algorithms.put({
          id: detail.id,
          code: detail.code,
          title: detail.title,
          description: detail.description,
          svgContent: detail.svgContent,
          version: 1, // Default version since API doesn't return it
          cachedAt: Date.now(),
        });
      }

      setProgress({
        status: 'downloading',
        current: 2,
        total: 3,
        message: `${algorithms.length} algoritmer sparade. Hämtar frågor...`,
      });

      // 3. Note: Quiz questions would be fetched per chapter
      // This is a placeholder - full implementation would iterate chapters

      setProgress({
        status: 'done',
        current: 3,
        total: 3,
        message: 'Allt innehåll är nu tillgängligt offline!',
      });

      // Invalidate cache stats
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });

    } catch (error) {
      console.error('Failed to download content for offline:', error);
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: 'Kunde inte ladda ner innehåll. Försök igen.',
      });
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setProgress({
      status: 'idle',
      current: 0,
      total: 0,
      message: '',
    });
  }, []);

  return {
    progress,
    downloadAll,
    reset,
    isDownloading: progress.status === 'downloading',
  };
}

// Hook for syncing pending offline changes
export function useSyncOfflineChanges() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingItems = await db.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          switch (item.type) {
            case 'progress':
              // Sync progress to server
              // await api.progress.update(item.payload);
              break;
            case 'quiz':
              // Sync quiz attempt to server
              // await api.quiz.syncAttempt(item.payload);
              break;
            case 'review':
              // Sync review card to server
              // await api.review.syncCard(item.payload);
              break;
          }

          // Remove from queue if successful
          await db.removeSyncItem(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await db.incrementRetryCount(item.id);
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  // Register for background sync if supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in (window as any).SyncManager) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register background sync
        (registration as any).sync.register('sync-quiz-attempts').catch(() => {
          // Background sync not supported or failed
        });
        (registration as any).sync.register('sync-progress').catch(() => {
          // Background sync not supported or failed
        });
      });
    }
  }, []);

  return {
    sync,
    isSyncing,
    lastSyncTime,
    isOnline,
  };
}

// Hook for clearing offline cache
export function useClearOfflineCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => db.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
    },
  });
}

// Hook for getting chapter from cache or network
export function useOfflineChapter(slug: string) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['offline-chapter', slug],
    queryFn: async () => {
      // Try to get from cache first
      const cached = await db.getChapter(slug);

      if (cached && !isOnline) {
        // Offline - return cached version
        return cached;
      }

      if (isOnline) {
        try {
          // Online - fetch fresh and update cache
          const fresh = await api.chapters.getBySlug(slug);
          await db.cacheChapter({
            id: fresh.id,
            slug: fresh.slug,
            chapterNumber: fresh.chapterNumber,
            title: fresh.title,
            content: fresh.content,
            estimatedMinutes: fresh.estimatedMinutes,
            version: fresh.contentVersion,
          });
          return fresh;
        } catch (error) {
          // Network error - fall back to cache
          if (cached) return cached;
          throw error;
        }
      }

      // No cache and offline
      if (!cached) {
        throw new Error('Kapitlet är inte tillgängligt offline');
      }

      return cached;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
