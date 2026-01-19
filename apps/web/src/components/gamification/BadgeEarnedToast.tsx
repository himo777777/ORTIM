import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';
  xpReward: number;
}

interface BadgeEarnedToastProps {
  badge: Badge | null;
  onClose: () => void;
}

const categoryColors = {
  PROGRESS: 'from-blue-500 to-cyan-500',
  ACHIEVEMENT: 'from-amber-500 to-yellow-500',
  STREAK: 'from-orange-500 to-red-500',
  SPECIAL: 'from-purple-500 to-pink-500',
};

const categoryLabels = {
  PROGRESS: 'Framsteg',
  ACHIEVEMENT: 'Prestation',
  STREAK: 'Streak',
  SPECIAL: 'Special',
};

export function BadgeEarnedToast({ badge, onClose }: BadgeEarnedToastProps) {
  if (!badge) return null;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border overflow-hidden">
            {/* Gradient accent */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                categoryColors[badge.category]
              )}
            />

            <div className="p-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-4">
                {/* Badge icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 10 }}
                  className="relative flex-shrink-0"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg',
                      categoryColors[badge.category]
                    )}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </motion.div>
                </motion.div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Ny badge intjänad!
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {badge.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {badge.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r text-white',
                        categoryColors[badge.category]
                      )}
                    >
                      {categoryLabels[badge.category]}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      +{badge.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing badge notifications
import { useState, useCallback, useEffect } from 'react';

export function useBadgeNotification() {
  const [badge, setBadge] = useState<Badge | null>(null);
  const [queue, setQueue] = useState<Badge[]>([]);

  const showBadge = useCallback((newBadge: Badge) => {
    setQueue((prev) => [...prev, newBadge]);
  }, []);

  const closeBadge = useCallback(() => {
    setBadge(null);
  }, []);

  // Process queue
  useEffect(() => {
    if (!badge && queue.length > 0) {
      const [next, ...rest] = queue;
      setBadge(next);
      setQueue(rest);

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setBadge(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [badge, queue]);

  return { badge, showBadge, closeBadge };
}
