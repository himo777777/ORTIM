import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface UserEngagementStats {
  totalUsers: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  averageSessionDuration: number;
}

export interface CourseProgressStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  completionRate: number;
}

export interface QuizStats {
  totalAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passRate: number;
  attemptsByBloomLevel: Record<string, { attempts: number; avgScore: number }>;
}

export interface PlatformStats {
  users: UserEngagementStats;
  courses: CourseProgressStats;
  quiz: QuizStats;
}

export interface CohortStats {
  id: string;
  name: string;
  totalParticipants: number;
  activeParticipants: number;
  averageProgress: number;
  oscePassRate: number;
}

export interface DailyActivity {
  date: string;
  logins: number;
  quizAttempts: number;
  chaptersCompleted: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionCode: string;
  attempts: number;
  correctRate: number;
  avgTimeSpent: number;
}

export interface CertificateAnalytics {
  totalIssued: number;
  issuedLast30Days: number;
  byMonth: { month: string; count: number }[];
}

// Query keys
const analyticsKeys = {
  all: ['analytics'] as const,
  overview: ['analytics', 'overview'] as const,
  users: ['analytics', 'users'] as const,
  courses: ['analytics', 'courses'] as const,
  quiz: ['analytics', 'quiz'] as const,
  cohorts: ['analytics', 'cohorts'] as const,
  activity: (days: number) => ['analytics', 'activity', days] as const,
  questions: ['analytics', 'questions'] as const,
  certificates: ['analytics', 'certificates'] as const,
};

// API calls (add to api.ts later)
const analyticsApi = {
  getOverview: () =>
    fetch('/api/analytics/overview', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<PlatformStats>,

  getUserStats: () =>
    fetch('/api/analytics/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<UserEngagementStats>,

  getCourseStats: () =>
    fetch('/api/analytics/courses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<CourseProgressStats>,

  getQuizStats: () =>
    fetch('/api/analytics/quiz', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<QuizStats>,

  getCohortAnalytics: () =>
    fetch('/api/analytics/cohorts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<CohortStats[]>,

  getDailyActivity: (days: number) =>
    fetch(`/api/analytics/activity?days=${days}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<DailyActivity[]>,

  getQuestionAnalytics: () =>
    fetch('/api/analytics/questions', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<QuestionAnalytics[]>,

  getCertificateAnalytics: () =>
    fetch('/api/analytics/certificates', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.json()) as Promise<CertificateAnalytics>,
};

// Hooks
export function usePlatformStats() {
  return useQuery({
    queryKey: analyticsKeys.overview,
    queryFn: analyticsApi.getOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: analyticsKeys.users,
    queryFn: analyticsApi.getUserStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourseStats() {
  return useQuery({
    queryKey: analyticsKeys.courses,
    queryFn: analyticsApi.getCourseStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuizAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.quiz,
    queryFn: analyticsApi.getQuizStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCohortAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.cohorts,
    queryFn: analyticsApi.getCohortAnalytics,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyActivity(days: number = 30) {
  return useQuery({
    queryKey: analyticsKeys.activity(days),
    queryFn: () => analyticsApi.getDailyActivity(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuestionAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.questions,
    queryFn: analyticsApi.getQuestionAnalytics,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCertificateAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.certificates,
    queryFn: analyticsApi.getCertificateAnalytics,
    staleTime: 5 * 60 * 1000,
  });
}
