import { useAuthStore } from '@/stores/authStore';

// ===========================================
// B-ORTIM API Client
// ===========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 - token expired
  if (response.status === 401 && !skipAuth) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          // Retry original request with new token
          (headers as Record<string, string>)['Authorization'] =
            `Bearer ${useAuthStore.getState().token}`;
          const retryResponse = await fetch(url, { ...fetchOptions, headers });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch {
        // Refresh failed, logout
        useAuthStore.getState().logout();
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP error ${response.status}`,
      errorData
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

// ===========================================
// API Methods
// ===========================================

export const api = {
  // Auth
  auth: {
    initiateBankId: () =>
      request<{ sessionId: string; qrData: string }>('/auth/bankid/initiate', {
        method: 'POST',
        skipAuth: true,
      }),

    pollBankId: (sessionId: string) =>
      request<{
        state: 'pending' | 'complete' | 'failed';
        token?: string;
        refreshToken?: string;
        user?: { id: string; personnummer: string; firstName: string; lastName: string; role: string };
      }>(`/auth/bankid/poll/${sessionId}`, { skipAuth: true }),

    refresh: (refreshToken: string) =>
      request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      }),

    logout: () => request('/auth/logout', { method: 'POST' }),

    me: () =>
      request<{
        id: string;
        personnummer: string;
        firstName: string;
        lastName: string;
        email: string | null;
        role: string;
        workplace: string | null;
        speciality: string | null;
      }>('/auth/me'),
  },

  // Courses
  courses: {
    list: () =>
      request<
        Array<{
          id: string;
          code: string;
          name: string;
          fullName: string;
          description: string | null;
          estimatedHours: number;
          parts: Array<{
            id: string;
            partNumber: number;
            title: string;
            chapters: Array<{
              id: string;
              chapterNumber: number;
              title: string;
              slug: string;
              estimatedMinutes: number;
            }>;
          }>;
        }>
      >('/courses'),

    getByCode: (code: string) =>
      request<{
        id: string;
        code: string;
        name: string;
        fullName: string;
        description: string | null;
        parts: Array<{
          id: string;
          partNumber: number;
          title: string;
          chapters: Array<{
            id: string;
            chapterNumber: number;
            title: string;
            slug: string;
            content: string;
            estimatedMinutes: number;
          }>;
        }>;
      }>(`/courses/${code}`),
  },

  // Chapters
  chapters: {
    getBySlug: (slug: string) =>
      request<{
        id: string;
        chapterNumber: number;
        title: string;
        slug: string;
        content: string;
        contentVersion: number;
        estimatedMinutes: number;
        learningObjectives: Array<{
          id: string;
          code: string;
          type: string;
          description: string;
        }>;
      }>(`/chapters/${slug}`),
  },

  // Algorithms
  algorithms: {
    list: () =>
      request<
        Array<{
          id: string;
          code: string;
          title: string;
          description: string | null;
        }>
      >('/algorithms'),

    getByCode: (code: string) =>
      request<{
        id: string;
        code: string;
        title: string;
        description: string | null;
        svgContent: string;
      }>(`/algorithms/${code}`),
  },

  // Quiz
  quiz: {
    getQuestions: (params?: { chapterId?: string; count?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.chapterId) searchParams.set('chapterId', params.chapterId);
      if (params?.count) searchParams.set('count', params.count.toString());
      return request<
        Array<{
          id: string;
          questionCode: string;
          bloomLevel: string;
          questionText: string;
          options: Array<{
            id: string;
            optionLabel: string;
            optionText: string;
          }>;
        }>
      >(`/quiz/questions?${searchParams}`);
    },

    submit: (data: {
      type: string;
      chapterId?: string;
      answers: Array<{ questionId: string; selectedOption: string }>;
    }) =>
      request<{
        attemptId: string;
        score: number;
        passed: boolean;
        correctAnswers: number;
        totalQuestions: number;
      }>('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Progress
  progress: {
    get: () =>
      request<
        Array<{
          chapterId: string;
          readProgress: number;
          quizPassed: boolean;
          bestQuizScore: number | null;
        }>
      >('/progress'),

    update: (chapterId: string, data: { readProgress?: number; quizPassed?: boolean }) =>
      request(`/progress/chapter/${chapterId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    sync: (data: Array<{ chapterId: string; readProgress: number; quizPassed: boolean }>) =>
      request('/progress/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Review (Spaced Repetition)
  review: {
    getDue: () =>
      request<
        Array<{
          id: string;
          questionId: string;
          question: {
            id: string;
            questionCode: string;
            questionText: string;
            options: Array<{ optionLabel: string; optionText: string; isCorrect: boolean }>;
            explanation: string;
          };
          nextReviewAt: string;
        }>
      >('/review/due'),

    grade: (cardId: string, quality: number) =>
      request<{
        easeFactor: number;
        interval: number;
        nextReviewAt: string;
      }>(`/review/${cardId}/grade`, {
        method: 'POST',
        body: JSON.stringify({ quality }),
      }),
  },

  // Certificates
  certificates: {
    list: () =>
      request<
        Array<{
          id: string;
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
          validUntil: string;
          examScore: number;
          examPassed: boolean;
        }>
      >('/certificates'),

    getById: (id: string) =>
      request<{
        id: string;
        certificateNumber: string;
        courseName: string;
        courseCode: string;
        issuedAt: string;
        validUntil: string;
        examScore: number;
        examPassed: boolean;
        oscePassed: boolean | null;
        verificationUrl: string;
        pdfUrl: string | null;
      }>(`/certificates/${id}`),

    verify: (code: string) =>
      request<{
        isValid: boolean;
        certificate?: {
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
          validUntil: string;
          examPassed: boolean;
          holderName: string;
        };
      }>(`/verify/${code}`, { skipAuth: true }),
  },

  // Instructor
  instructor: {
    getCohorts: () =>
      request<
        Array<{
          id: string;
          name: string;
          startDate: string;
          endDate: string | null;
          isActive: boolean;
          course: { name: string; code: string };
          _count: { enrollments: number };
        }>
      >('/instructor/cohorts'),

    getCohort: (id: string) =>
      request<{
        id: string;
        name: string;
        description: string | null;
        startDate: string;
        endDate: string | null;
        maxParticipants: number | null;
        isActive: boolean;
        course: { id: string; name: string; code: string };
        enrollments: Array<{
          id: string;
          status: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
            workplace: string | null;
          };
        }>;
      }>(`/instructor/cohorts/${id}`),

    createCohort: (data: {
      courseId: string;
      name: string;
      description?: string;
      startDate: string;
      endDate?: string;
      maxParticipants?: number;
    }) =>
      request('/instructor/cohorts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getCohortStats: (id: string) =>
      request<{
        totalParticipants: number;
        activeParticipants: number;
        completedParticipants: number;
        averageProgress: number;
      }>(`/instructor/cohorts/${id}/stats`),

    getCohortParticipants: (id: string) =>
      request<
        Array<{
          enrollmentId: string;
          status: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
            workplace: string | null;
            speciality: string | null;
          };
          progress: {
            chaptersCompleted: number;
            totalChapters: number;
            percentage: number;
          };
          osce: {
            completed: number;
            passed: number;
            total: number;
            assessments: Array<{
              id: string;
              stationNumber: number;
              stationName: string;
              passed: boolean;
              score: number | null;
              comments: string | null;
              assessedAt: string;
            }>;
          };
        }>
      >(`/instructor/cohorts/${id}/participants`),

    createOsceAssessment: (enrollmentId: string, data: {
      stationNumber: number;
      stationName: string;
      passed: boolean;
      score?: number;
      comments?: string;
    }) =>
      request(`/instructor/osce/${enrollmentId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateOsceAssessment: (assessmentId: string, data: {
      passed?: boolean;
      score?: number;
      comments?: string;
    }) =>
      request(`/instructor/osce/${assessmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getOsceAssessments: (enrollmentId: string) =>
      request<
        Array<{
          id: string;
          stationNumber: number;
          stationName: string;
          passed: boolean;
          score: number | null;
          comments: string | null;
          assessedAt: string;
          assessor: {
            id: string;
            firstName: string;
            lastName: string;
          };
        }>
      >(`/instructor/enrollments/${enrollmentId}/osce`),
  },

  // Content (for offline sync)
  content: {
    getManifest: () =>
      request<{
        version: string;
        lastUpdated: string;
        chapters: Array<{ id: string; slug: string; version: number }>;
        algorithms: Array<{ id: string; code: string; version: number }>;
        questionsVersion: number;
      }>('/content/manifest'),

    getUpdates: (since: string) =>
      request<{
        chapters: Array<{
          id: string;
          slug: string;
          chapterNumber: number;
          title: string;
          content: string;
          contentVersion: number;
          estimatedMinutes: number;
        }>;
        algorithms: Array<{
          id: string;
          code: string;
          title: string;
          description: string | null;
          svgContent: string;
          version: number;
        }>;
        questions: Array<{
          id: string;
          questionCode: string;
          chapterId: string | null;
          bloomLevel: string;
          questionText: string;
          explanation: string;
          reference: string | null;
          options: Array<{
            id: string;
            optionLabel: string;
            optionText: string;
            isCorrect: boolean;
          }>;
        }>;
      }>(`/content/updates?since=${since}`),
  },
};

export { ApiError };
export type { RequestOptions };
