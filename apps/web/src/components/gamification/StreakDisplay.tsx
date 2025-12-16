import { Flame, Calendar, Trophy } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export function StreakDisplay({ className, showDetails = false }: StreakDisplayProps) {
  const { currentStreak, longestStreak, lastActivityDate } = useGamificationStore();

  const isActiveToday = () => {
    if (!lastActivityDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastActivityDate === today;
  };

  const getStreakColor = () => {
    if (currentStreak >= 30) return 'text-purple-500';
    if (currentStreak >= 14) return 'text-orange-500';
    if (currentStreak >= 7) return 'text-yellow-500';
    if (currentStreak >= 3) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getStreakMessage = () => {
    if (currentStreak >= 30) return 'Fantastiskt! En hel månads streak!';
    if (currentStreak >= 14) return 'Två veckors streak! Fortsätt så!';
    if (currentStreak >= 7) return 'En veckas streak! Bra jobbat!';
    if (currentStreak >= 3) return 'Du är på gång!';
    if (currentStreak >= 1) return 'Bra start!';
    return 'Starta din streak idag!';
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50',
                className
              )}
            >
              <Flame className={cn('h-4 w-4', getStreakColor(), isActiveToday() && 'animate-pulse')} />
              <span className="text-sm font-medium">{currentStreak}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStreakMessage()}</p>
            <p className="text-xs text-muted-foreground">
              Längsta streak: {longestStreak} dagar
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Streak */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            isActiveToday() ? 'bg-orange-500/20' : 'bg-muted'
          )}>
            <Flame className={cn(
              'h-6 w-6',
              getStreakColor(),
              isActiveToday() && 'animate-pulse'
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nuvarande streak</p>
            <p className="text-2xl font-bold">{currentStreak} dagar</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
          {!isActiveToday() && currentStreak > 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              Slutför en aktivitet för att behålla din streak!
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Longest Streak */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">Längsta streak</p>
            <p className="text-lg font-semibold">{longestStreak} dagar</p>
          </div>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Senaste aktivitet</p>
            <p className="text-lg font-semibold">
              {lastActivityDate
                ? new Date(lastActivityDate).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short'
                  })
                : 'Aldrig'}
            </p>
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Streak-milstolpar</p>
        <div className="flex gap-2">
          {[3, 7, 14, 30, 100].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                'flex-1 p-2 rounded text-center text-xs',
                currentStreak >= milestone
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <p className="font-medium">{milestone}</p>
              <p className="text-[10px]">dagar</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
