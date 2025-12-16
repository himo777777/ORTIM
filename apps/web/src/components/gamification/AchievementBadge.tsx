import { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGamificationStore, Achievement } from '@/stores/gamificationStore';
import { Progress } from '@/components/ui/progress';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({
  achievement,
  unlocked,
  unlockedAt,
  progress = 0,
  className,
  size = 'md',
}: AchievementBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className={cn(
          'relative rounded-full flex items-center justify-center transition-all',
          'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary',
          unlocked
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/30'
            : 'bg-muted grayscale',
          sizeClasses[size],
          className
        )}
      >
        <span className={cn(!unlocked && 'opacity-50')}>
          {achievement.icon}
        </span>

        {/* Lock overlay for locked achievements */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <Lock className="h-4 w-4 text-white/70" />
          </div>
        )}

        {/* Checkmark for unlocked */}
        {unlocked && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </button>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-3xl',
                  unlocked
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : 'bg-muted grayscale'
                )}
              >
                {achievement.icon}
              </div>
              <div>
                <DialogTitle className="text-left">{achievement.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {achievement.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Framsteg</span>
                <span className="font-medium">
                  {Math.min(progress, achievement.requirement.count)} / {achievement.requirement.count}
                </span>
              </div>
              <Progress
                value={(progress / achievement.requirement.count) * 100}
                className="h-2"
              />
            </div>

            {/* Requirement details */}
            <div className="text-sm text-muted-foreground">
              <p>
                {achievement.requirement.type === 'chapters_completed' && 'Slutför kapitel'}
                {achievement.requirement.type === 'quizzes_passed' && 'Klara quiz'}
                {achievement.requirement.type === 'streak_days' && 'Dagar i rad'}
                {achievement.requirement.type === 'total_xp' && 'Samla XP'}
                {achievement.requirement.type === 'certificates' && 'Få certifikat'}
                {achievement.requirement.type === 'review_cards' && 'Granska repetitionskort'}
              </p>
            </div>

            {/* Unlock date */}
            {unlocked && unlockedAt && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>
                  Upplåst {new Date(unlockedAt).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Grid display for all achievements
interface AchievementGridProps {
  className?: string;
}

export function AchievementGrid({ className }: AchievementGridProps) {
  const { achievements, unlockedAchievements, getAchievementProgress } = useGamificationStore();

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prestationer</h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount} / {totalCount} upplåsta
        </span>
      </div>

      <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {achievements.map((achievement) => {
          const unlocked = unlockedAchievements.find(u => u.id === achievement.id);
          return (
            <div key={achievement.id} className="flex flex-col items-center gap-1">
              <AchievementBadge
                achievement={achievement}
                unlocked={!!unlocked}
                unlockedAt={unlocked?.unlockedAt}
                progress={getAchievementProgress(achievement.id)}
                size="sm"
              />
              <span className="text-[10px] text-center text-muted-foreground truncate w-full">
                {achievement.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
