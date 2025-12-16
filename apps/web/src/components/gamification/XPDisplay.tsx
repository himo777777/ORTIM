import { Star, TrendingUp, Zap } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface XPDisplayProps {
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function XPDisplay({ className, showProgress = true, compact = false }: XPDisplayProps) {
  const { totalXP, level, xpToNextLevel, getCurrentLevelXP } = useGamificationStore();

  const currentLevelXP = getCurrentLevelXP();
  const progressPercent = (currentLevelXP / xpToNextLevel) * 100;

  const getLevelTitle = (level: number): string => {
    if (level >= 50) return 'Mästare';
    if (level >= 40) return 'Expert';
    if (level >= 30) return 'Specialist';
    if (level >= 20) return 'Erfaren';
    if (level >= 10) return 'Lärd';
    if (level >= 5) return 'Studenten';
    return 'Nybörjare';
  };

  const getLevelColor = (level: number): string => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 40) return 'from-yellow-500 to-orange-500';
    if (level >= 30) return 'from-blue-500 to-cyan-500';
    if (level >= 20) return 'from-green-500 to-emerald-500';
    if (level >= 10) return 'from-indigo-500 to-purple-500';
    if (level >= 5) return 'from-slate-500 to-slate-600';
    return 'from-gray-400 to-gray-500';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                'bg-gradient-to-r',
                getLevelColor(level),
                'text-white shadow-sm',
                className
              )}
            >
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">Nivå {level}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{getLevelTitle(level)}</p>
            <p className="text-xs text-muted-foreground">
              {totalXP.toLocaleString()} XP totalt
            </p>
            <p className="text-xs text-muted-foreground">
              {xpToNextLevel - currentLevelXP} XP till nästa nivå
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-lg',
              getLevelColor(level)
            )}
          >
            <span className="text-white font-bold text-lg">{level}</span>
          </div>
          <div>
            <p className="font-semibold">{getLevelTitle(level)}</p>
            <p className="text-sm text-muted-foreground">Nivå {level}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-500">
            <Zap className="h-4 w-4 fill-current" />
            <span className="font-bold">{totalXP.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
      </div>

      {/* Progress to next level */}
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Till nivå {level + 1}</span>
            <span className="font-medium">
              {currentLevelXP} / {xpToNextLevel} XP
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}
    </div>
  );
}

// Animated XP gain popup
interface XPGainPopupProps {
  amount: number;
  reason?: string;
  onComplete?: () => void;
}

export function XPGainPopup({ amount, reason, onComplete }: XPGainPopupProps) {
  return (
    <div
      className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300"
      onAnimationEnd={() => {
        if (onComplete) {
          setTimeout(onComplete, 2000);
        }
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
        <TrendingUp className="h-5 w-5" />
        <div>
          <p className="font-bold">+{amount} XP</p>
          {reason && <p className="text-xs opacity-90">{reason}</p>}
        </div>
      </div>
    </div>
  );
}
