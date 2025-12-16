import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { db } from '@/lib/db';

export function useQuizQuestions(chapterId?: string, _mode?: 'practice' | 'exam') {
  return useQuery({
    queryKey: ['quiz', 'questions', chapterId],
    queryFn: async () => {
      const questions = await api.quiz.getQuestions({ chapterId });

      // Cache questions for offline use
      for (const question of questions) {
        await db.questions.put({
          id: question.id,
          questionCode: question.questionCode,
          chapterId: null,
          bloomLevel: question.bloomLevel,
          questionText: question.questionText,
          options: question.options.map((o) => ({
            id: o.id,
            label: o.optionLabel,
            text: o.optionText,
            isCorrect: false,
          })),
          explanation: '',
          reference: null,
          version: 1,
          cachedAt: Date.now(),
        });
      }

      // Transform to expected format
      return questions.map((q) => ({
        id: q.id,
        code: q.questionCode,
        bloomLevel: q.bloomLevel,
        questionText: q.questionText,
        options: q.options.map((o) => ({
          id: o.id,
          label: o.optionLabel,
          text: o.optionText,
          isCorrect: false, // API doesn't return this for security
        })),
      }));
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      chapterId?: string;
      answers: { questionId: string; selectedOption: string }[];
      mode: 'practice' | 'exam';
      timeSpent: number;
    }) => api.quiz.submit({
      type: data.mode,
      chapterId: data.chapterId,
      answers: data.answers,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'attempts'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useQuizAttempts(_chapterId?: string) {
  return useQuery({
    queryKey: ['quiz', 'attempts'],
    queryFn: async () => {
      // Return empty array - API doesn't have this endpoint yet
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuizStats() {
  return useQuery({
    queryKey: ['quiz', 'stats'],
    queryFn: async () => {
      // Return mock stats - API doesn't have this endpoint yet
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
