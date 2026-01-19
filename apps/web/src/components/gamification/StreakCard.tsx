import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGamificationStats, useRecordActivity } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface StreakCardProps {
  className?: string;
  compact?: boolean;
}

export function StreakCard({ className, compact = false }: StreakCardProps) {
  const { data, isLoading } = useGamificationStats();
  const recordActivity = useRecordActivity();

  // Record activity on mount to update streak
  useEffect(() => {
    recordActivity.mutate();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className={compact ? 'p-4' : 'p-6'}>
          <div className="space-y-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { currentStreak, longestStreak } = data;
  const isOnFire = currentStreak >= 7;
  const isNewRecord = currentStreak > 0 && currentStreak === longestStreak;

  // Generate flame color based on streak
  const getFlameColor = () => {
    if (currentStreak >= 30) return 'from-purple-500 to-pink-500';
    if (currentStreak >= 14) return 'from-orange-500 to-red-500';
    if (currentStreak >= 7) return 'from-amber-500 to-orange-500';
    return 'from-amber-400 to-amber-500';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Daglig streak
            </p>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentStreak}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn('font-bold', compact ? 'text-3xl' : 'text-4xl')}
              >
                {currentStreak}
              </motion.span>
              <span className="text-muted-foreground">
                {currentStreak === 1 ? 'dag' : 'dagar'}
              </span>
            </div>
            {longestStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Längsta: {longestStreak} dagar
                {isNewRecord && (
                  <span className="ml-1 text-amber-500 font-medium">Nytt rekord!</span>
                )}
              </p>
            )}
          </div>

          {/* Flame icon */}
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{
              scale: isOnFire ? [1, 1.1, 1] : 1,
              rotate: isOnFire ? [-5, 5, -5] : 0,
            }}
            transition={{
              repeat: isOnFire ? Infinity : 0,
              duration: 0.5,
            }}
            className={cn(
              'rounded-full p-3',
              currentStreak > 0
                ? `bg-gradient-to-br ${getFlameColor()}`
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Flame
              className={cn(
                compact ? 'w-6 h-6' : 'w-8 h-8',
                currentStreak > 0 ? 'text-white' : 'text-gray-400'
              )}
              fill={currentStreak > 0 ? 'currentColor' : 'none'}
            />
          </motion.div>
        </div>

        {/* Streak progress visualization */}
        {!compact && currentStreak > 0 && (
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'flex-1 h-2 rounded-full',
                  i < (currentStreak % 7 || 7)
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            ))}
          </div>
        )}

        {/* Motivational message */}
        {currentStreak === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            Slutför en aktivitet idag för att starta din streak!
          </p>
        )}
        {currentStreak > 0 && currentStreak < 7 && (
          <p className="text-sm text-muted-foreground mt-3">
            {7 - currentStreak} dagar kvar till veckobonus!
          </p>
        )}
        {isOnFire && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 font-medium">
            Du är på eld! Fortsätt så!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
