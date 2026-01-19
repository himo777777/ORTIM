import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Get current user's gamification stats
export function useGamificationStats() {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: () => api.gamification.getStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

// Get leaderboard
export function useLeaderboard(period: 'weekly' | 'monthly' | 'allTime' = 'weekly', limit = 10) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period, limit],
    queryFn: () => api.gamification.getLeaderboard(period, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get all available badges
export function useAllBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges', 'all'],
    queryFn: () => api.gamification.getAllBadges(),
    staleTime: 30 * 60 * 1000, // 30 minutes (badges don't change often)
  });
}

// Get user's earned badges
export function useMyBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges', 'mine'],
    queryFn: () => api.gamification.getMyBadges(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Record activity (updates streak)
export function useRecordActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.gamification.recordActivity(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
    },
  });
}

// Check for new badges
export function useCheckBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.gamification.checkBadges(),
    onSuccess: (data) => {
      if (data.newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['gamification', 'badges', 'mine'] });
        queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
      }
    },
  });
}

// Combined hook for badges with earned status
export function useBadgesWithStatus() {
  const { data: allBadges, isLoading: loadingAll } = useAllBadges();
  const { data: myBadges, isLoading: loadingMine } = useMyBadges();

  const badgesWithStatus = allBadges?.map((badge) => {
    const earned = myBadges?.find((ub) => ub.badge.id === badge.id);
    return {
      ...badge,
      earned: !!earned,
      earnedAt: earned?.earnedAt || null,
    };
  });

  return {
    badges: badgesWithStatus || [],
    isLoading: loadingAll || loadingMine,
    earnedCount: myBadges?.length || 0,
    totalCount: allBadges?.length || 0,
  };
}

// Types for external use
export interface GamificationStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  weeklyXP: number;
  monthlyXP: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
  rank: {
    weekly: number | null;
    monthly: number | null;
    allTime: number | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';
  xpReward: number;
  earned?: boolean;
  earnedAt?: string | null;
}
