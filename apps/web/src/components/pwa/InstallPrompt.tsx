import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check dismissal
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION) {
        return;
      }
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after user has interacted with the app
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds delay
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show instructions after delay
    if (ios) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 60000); // 1 minute delay for iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isIOS ? (
                  <Smartphone className="h-5 w-5 text-primary" />
                ) : (
                  <Download className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Installera ORTAC</h3>
                {isIOS ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>Lägg till på hemskärmen:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>
                        Tryck på{' '}
                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          Dela
                        </span>
                      </li>
                      <li>Välj "Lägg till på hemskärmen"</li>
                    </ol>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Installera appen för snabbare åtkomst och offline-läsning.
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {!isIOS && (
                    <Button size="sm" onClick={handleInstall}>
                      <Download className="h-4 w-4 mr-1" />
                      Installera
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {isIOS ? 'Stäng' : 'Inte nu'}
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
