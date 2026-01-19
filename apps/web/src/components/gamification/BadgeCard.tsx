import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  badge: {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';
    xpReward: number;
    earned?: boolean;
    earnedAt?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
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

export function BadgeCard({ badge, size = 'md', showDetails = true, onClick }: BadgeCardProps) {
  const { name, description, icon, category, xpReward, earned, earnedAt } = badge;

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <motion.div
      whileHover={earned ? { scale: 1.05 } : undefined}
      whileTap={earned ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl transition-all',
        earned
          ? 'bg-white dark:bg-gray-800 shadow-md cursor-pointer hover:shadow-lg'
          : 'bg-gray-100 dark:bg-gray-800/50 opacity-60',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Badge Icon */}
      <div className="relative">
        <motion.div
          initial={earned ? { scale: 0, rotate: -180 } : { scale: 1 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className={cn(
            'flex items-center justify-center rounded-full',
            sizeClasses[size],
            earned
              ? `bg-gradient-to-br ${categoryColors[category]} shadow-lg`
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <span className={cn(earned ? 'grayscale-0' : 'grayscale opacity-50')}>
            {icon}
          </span>
        </motion.div>

        {/* Lock overlay for unearned badges */}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        )}

        {/* Sparkle effect for newly earned badges */}
        {earned && earnedAt && isRecentlyEarned(earnedAt) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
        )}
      </div>

      {/* Badge Info */}
      {showDetails && (
        <div className="mt-3 text-center">
          <h4 className={cn('font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>
            {name}
          </h4>
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
          {earned && size !== 'sm' && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              +{xpReward} XP
            </p>
          )}
        </div>
      )}

      {/* Category tag */}
      {showDetails && size !== 'sm' && (
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium',
            earned
              ? `bg-gradient-to-r ${categoryColors[category]} text-white`
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
          )}
        >
          {categoryLabels[category]}
        </div>
      )}
    </motion.div>
  );
}

// Helper to check if badge was earned recently (within last 24 hours)
function isRecentlyEarned(earnedAt: string): boolean {
  const earned = new Date(earnedAt);
  const now = new Date();
  const diff = now.getTime() - earned.getTime();
  return diff < 24 * 60 * 60 * 1000;
}
