import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBadgesWithStatus, Badge } from '@/hooks/useGamification';
import { BadgeCard } from './BadgeCard';
import { cn } from '@/lib/utils';

interface BadgeGridProps {
  className?: string;
  showHeader?: boolean;
  maxVisible?: number;
  filterCategories?: ('PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL')[];
  showFilters?: boolean;
}

type BadgeCategory = 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL' | 'ALL';

const categoryLabels: Record<BadgeCategory, string> = {
  ALL: 'Alla',
  PROGRESS: 'Framsteg',
  ACHIEVEMENT: 'Prestationer',
  STREAK: 'Streaks',
  SPECIAL: 'Speciella',
};

export function BadgeGrid({
  className,
  showHeader = true,
  maxVisible,
  filterCategories,
  showFilters = false,
}: BadgeGridProps) {
  const { badges, isLoading, earnedCount, totalCount } = useBadgesWithStatus();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
        )}
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter badges
  let filteredBadges = badges;
  if (filterCategories) {
    filteredBadges = badges.filter((b) => filterCategories.includes(b.category));
  }
  if (selectedCategory !== 'ALL') {
    filteredBadges = filteredBadges.filter((b) => b.category === selectedCategory);
  }

  // Sort: earned first, then by category
  filteredBadges = [...filteredBadges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  // Limit visible badges if specified
  const visibleBadges = maxVisible ? filteredBadges.slice(0, maxVisible) : filteredBadges;
  const hasMore = maxVisible && filteredBadges.length > maxVisible;

  return (
    <>
      <Card className={className}>
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges
              <span className="text-sm font-normal text-muted-foreground">
                ({earnedCount}/{totalCount})
              </span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {/* Category Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(categoryLabels) as BadgeCategory[]).map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs"
                >
                  {cat !== 'ALL' && <Filter className="w-3 h-3 mr-1" />}
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>
          )}

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                size="md"
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>

          {/* Show more indicator */}
          {hasMore && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              +{filteredBadges.length - (maxVisible || 0)} fler badges
            </p>
          )}

          {/* Empty state */}
          {filteredBadges.length === 0 && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Inga badges i denna kategori</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Badge Detail Modal Component
function BadgeDetailModal({
  badge,
  onClose,
}: {
  badge: Badge;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <BadgeCard badge={badge} size="lg" showDetails={false} />

          <h3 className="text-xl font-bold mt-4">{badge.name}</h3>
          <p className="text-muted-foreground mt-2">{badge.description}</p>

          {badge.earned ? (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                Intjänad!
              </p>
              {badge.earnedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(badge.earnedAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                +{badge.xpReward} XP
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-muted-foreground">
                Inte intjänad ännu
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Belöning: {badge.xpReward} XP
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
