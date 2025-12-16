import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface Announcement {
  id: string;
  message: string;
  politeness: 'polite' | 'assertive';
}

interface LiveRegionContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useLiveRegion must be used within a LiveRegionProvider');
  }
  return context;
}

interface LiveRegionProviderProps {
  children: ReactNode;
}

/**
 * Provider for accessible live region announcements.
 * Use this to announce dynamic content changes to screen readers.
 *
 * Example:
 * ```tsx
 * const { announce } = useLiveRegion();
 * announce('Din progress har sparats');
 * ```
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const id = Math.random().toString(36).substring(7);
    setAnnouncements((prev) => [...prev, { id, message, politeness }]);

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }, 1000);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.politeness === 'polite')
          .map((a) => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.politeness === 'assertive')
          .map((a) => (
            <p key={a.id}>{a.message}</p>
          ))}
      </div>
    </LiveRegionContext.Provider>
  );
}
