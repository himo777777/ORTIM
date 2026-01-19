import { motion } from 'framer-motion';
import { Star, TrendingUp, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGamificationStats } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

interface XPProgressCardProps {
  className?: string;
  compact?: boolean;
}

export function XPProgressCard({ className, compact = false }: XPProgressCardProps) {
  const { data, isLoading } = useGamificationStats();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className={compact ? 'p-4' : 'p-6'}>
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const {
    totalXP,
    level,
    xpToNextLevel,
    progressToNextLevel,
    weeklyXP,
  } = data;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        {/* Level Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'relative flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold shadow-lg',
                compact ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'
              )}
            >
              {level}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            </motion.div>
            <div>
              <h3 className={cn('font-bold', compact ? 'text-lg' : 'text-xl')}>
                Nivå {level}
              </h3>
              <p className="text-sm text-muted-foreground">
                {totalXP.toLocaleString()} XP totalt
              </p>
            </div>
          </div>
          {weeklyXP > 0 && (
            <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              +{weeklyXP} denna vecka
            </div>
          )}
        </div>

        {/* Progress to next level */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Till nivå {level + 1}</span>
            <span className="font-medium">{Math.round(progressToNextLevel)}%</span>
          </div>
          <div className="relative">
            <Progress value={progressToNextLevel} className="h-3" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-1 -right-1"
            >
              <ChevronUp className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {xpToNextLevel.toLocaleString()} XP kvar
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
