import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { db } from '@/lib/db';
import { Quality } from '@/lib/sm2';

export function useDueReviewCards() {
  return useQuery({
    queryKey: ['review', 'due'],
    queryFn: async () => {
      // Try to get from IndexedDB for offline support
      const localDue = await db.getDueReviewCards();
      if (localDue.length > 0) {
        return localDue.map((card) => ({
          id: card.id,
          questionId: card.questionId,
          question: {
            questionText: '',
            options: [] as { optionLabel: string; optionText: string; isCorrect: boolean }[],
            explanation: '',
          },
          easeFactor: card.easeFactor,
          interval: card.interval,
          repetitions: card.repetitions,
        }));
      }

      // Fetch from API
      const dueCards = await api.review.getDue();
      return dueCards.map((card) => ({
        id: card.id,
        questionId: card.questionId,
        question: card.question,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cardId: string; quality: Quality }) => {
      // Sync to server
      return api.review.grade(data.cardId, data.quality);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['review', 'stats'] });
    },
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: ['review', 'stats'],
    queryFn: async () => {
      // Return mock stats - API doesn't have this endpoint yet
      return {
        totalCards: 0,
        reviewedToday: 0,
        averageQuality: undefined as number | undefined,
        streak: 0,
        nextReviewDate: undefined as string | undefined,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_questionId: string) => {
      // API doesn't have this endpoint yet
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review'] });
    },
  });
}
