import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LevelUpModal } from './LevelUpModal';
import { BadgeEarnedToast, useBadgeNotification, Badge } from './BadgeEarnedToast';

interface GamificationContextType {
  showLevelUp: (level: number, xpGained?: number, unlockedFeatures?: string[]) => void;
  showBadgeEarned: (badge: Badge) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamificationCelebrations() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationCelebrations must be used within GamificationProvider');
  }
  return context;
}

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  // Level up modal state
  const [levelUpData, setLevelUpData] = useState<{
    open: boolean;
    level: number;
    xpGained?: number;
    unlockedFeatures?: string[];
  }>({
    open: false,
    level: 1,
  });

  // Badge notification hook
  const { badge, showBadge, closeBadge } = useBadgeNotification();

  const showLevelUp = useCallback(
    (level: number, xpGained?: number, unlockedFeatures?: string[]) => {
      setLevelUpData({
        open: true,
        level,
        xpGained,
        unlockedFeatures,
      });
    },
    []
  );

  const closeLevelUp = useCallback(() => {
    setLevelUpData((prev) => ({ ...prev, open: false }));
  }, []);

  const showBadgeEarned = useCallback(
    (badge: Badge) => {
      showBadge(badge);
    },
    [showBadge]
  );

  return (
    <GamificationContext.Provider value={{ showLevelUp, showBadgeEarned }}>
      {children}

      {/* Level Up Modal */}
      <LevelUpModal
        open={levelUpData.open}
        onClose={closeLevelUp}
        level={levelUpData.level}
        xpGained={levelUpData.xpGained}
        unlockedFeatures={levelUpData.unlockedFeatures}
      />

      {/* Badge Earned Toast */}
      <BadgeEarnedToast badge={badge} onClose={closeBadge} />
    </GamificationContext.Provider>
  );
}
