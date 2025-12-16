import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { db } from '@/lib/db';

export function useCourse(courseCode: string) {
  return useQuery({
    queryKey: ['course', courseCode],
    queryFn: () => api.courses.getByCode(courseCode),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCourseStructure(courseCode: string) {
  return useQuery({
    queryKey: ['course', courseCode, 'structure'],
    queryFn: async () => {
      const course = await api.courses.getByCode(courseCode);
      return {
        ...course,
        parts: course.parts.map((part) => ({
          ...part,
          completedChapters: 0,
          totalChapters: part.chapters.length,
        })),
      };
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useChapter(chapterSlug: string) {
  return useQuery({
    queryKey: ['chapter', chapterSlug],
    queryFn: async () => {
      // Try to get from IndexedDB first for offline support
      const cached = await db.chapters.get(chapterSlug);
      if (cached && cached.content) {
        return {
          ...cached,
          learningObjectives: [],
          previousChapter: undefined,
          nextChapter: undefined,
        };
      }

      // Fetch from API
      const chapter = await api.chapters.getBySlug(chapterSlug);

      // Cache for offline use
      await db.cacheChapter({
        id: chapter.id,
        slug: chapterSlug,
        title: chapter.title,
        content: chapter.content,
        chapterNumber: chapter.chapterNumber,
        estimatedMinutes: chapter.estimatedMinutes,
        version: 1,
      });

      return {
        ...chapter,
        estimatedReadTime: chapter.estimatedMinutes,
        previousChapter: undefined,
        nextChapter: undefined,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useChapterList() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      const courses = await api.courses.list();
      const allChapters = courses.flatMap((course) =>
        course.parts.flatMap((part) => part.chapters)
      );
      return allChapters;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useChapterProgress(chapterId: string) {
  return useQuery({
    queryKey: ['progress', 'chapter', chapterId],
    queryFn: async () => {
      const progress = await api.progress.get();
      return progress.find((p) => p.chapterId === chapterId) || {
        chapterId,
        readProgress: 0,
        quizPassed: false,
        bestQuizScore: null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { chapterId: string; scrollPosition?: number; completed?: boolean }) =>
      api.progress.update(data.chapterId, {
        readProgress: data.scrollPosition,
        quizPassed: data.completed,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', 'chapter', variables.chapterId] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'overall'] });
    },
  });
}

interface OverallProgressResult {
  chaptersCompleted: number;
  totalChapters: number;
  chapterProgress: {
    chapterId: string;
    chapterNumber: number;
    scrollPosition: number | null;
    completed: boolean;
  }[];
  currentChapter?: {
    id: string;
    title: string;
    progress: number | null;
  };
  lastCompletedChapter?: {
    id: string;
    title: string;
  };
}

export function useOverallProgress() {
  return useQuery<OverallProgressResult>({
    queryKey: ['progress', 'overall'],
    queryFn: async () => {
      const progress = await api.progress.get();
      const completed = progress.filter((p) => p.quizPassed).length;
      const current = progress.find((p) => !p.quizPassed);
      const lastCompleted = progress.filter((p) => p.quizPassed).pop();

      return {
        chaptersCompleted: completed,
        totalChapters: 17,
        chapterProgress: progress.map((p) => ({
          chapterId: p.chapterId,
          chapterNumber: 0, // Would need to map this
          scrollPosition: p.readProgress,
          completed: p.quizPassed,
        })),
        currentChapter: current ? {
          id: current.chapterId,
          title: 'Current Chapter',
          progress: current.readProgress,
        } : undefined,
        lastCompletedChapter: lastCompleted ? {
          id: lastCompleted.chapterId,
          title: 'Last Completed Chapter',
        } : undefined,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
