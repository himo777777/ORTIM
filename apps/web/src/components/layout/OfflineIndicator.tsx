import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, setOnline } = useUIStore();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 py-2 px-4 text-center text-sm font-medium z-50 transition-all duration-300',
        'md:bottom-4 md:left-4 md:right-auto md:rounded-lg md:shadow-lg md:max-w-xs',
        !isOnline && 'bg-yellow-500 text-yellow-900',
        showReconnected && 'bg-green-500 text-white'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Du är offline. Ändringar sparas lokalt.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Ansluten igen!</span>
          </>
        )}
      </div>
    </div>
  );
}
