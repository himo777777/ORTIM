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

  // Admin
  admin: {
    getDashboard: () =>
      request<{
        stats: {
          users: number;
          instructors: number;
          courses: number;
          activeCohorts: number;
          questions: number;
          algorithms: number;
          certificates: number;
          activeEnrollments: number;
        };
        recentUsers: Array<{
          id: string;
          firstName: string;
          lastName: string;
          role: string;
          createdAt: string;
        }>;
        recentCertificates: Array<{
          id: string;
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
          user: { firstName: string; lastName: string };
        }>;
      }>('/admin/dashboard'),

    // Users
    getUsers: (params?: { skip?: number; take?: number; search?: string; role?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.take) searchParams.set('take', params.take.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.role) searchParams.set('role', params.role);
      return request<{
        users: Array<{
          id: string;
          personnummer: string;
          firstName: string;
          lastName: string;
          email: string | null;
          phone: string | null;
          role: string;
          workplace: string | null;
          speciality: string | null;
          createdAt: string;
          lastLoginAt: string | null;
          _count: { enrollments: number; certificates: number };
        }>;
        total: number;
        skip: number;
        take: number;
      }>(`/admin/users?${searchParams}`);
    },

    getUser: (id: string) =>
      request<{
        id: string;
        personnummer: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        role: string;
        workplace: string | null;
        speciality: string | null;
        createdAt: string;
        lastLoginAt: string | null;
        enrollments: Array<{
          id: string;
          status: string;
          enrolledAt: string;
          cohort: {
            id: string;
            name: string;
            course: { name: string; code: string };
          };
        }>;
        certificates: Array<{
          id: string;
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
        }>;
        _count: { quizAttempts: number; chapterProgress: number };
      }>(`/admin/users/${id}`),

    createUser: (data: {
      personnummer: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role?: string;
      workplace?: string;
      speciality?: string;
    }) =>
      request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateUser: (id: string, data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: string;
      workplace?: string;
      speciality?: string;
    }) =>
      request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteUser: (id: string) =>
      request(`/admin/users/${id}`, { method: 'DELETE' }),

    // Courses
    getCourses: () =>
      request<
        Array<{
          id: string;
          code: string;
          name: string;
          fullName: string;
          version: string;
          lipusNumber: string | null;
          description: string | null;
          estimatedHours: number;
          passingScore: number;
          isActive: boolean;
          createdAt: string;
          _count: { parts: number; cohorts: number };
          parts: Array<{
            id: string;
            partNumber: number;
            title: string;
            _count: { chapters: number };
          }>;
        }>
      >('/admin/courses'),

    getCourse: (id: string) =>
      request<{
        id: string;
        code: string;
        name: string;
        fullName: string;
        version: string;
        lipusNumber: string | null;
        description: string | null;
        estimatedHours: number;
        passingScore: number;
        isActive: boolean;
        parts: Array<{
          id: string;
          partNumber: number;
          title: string;
          description: string | null;
          chapters: Array<{
            id: string;
            chapterNumber: number;
            title: string;
            slug: string;
            estimatedMinutes: number;
            isActive: boolean;
            _count: { quizQuestions: number; algorithms: number };
          }>;
        }>;
        cohorts: Array<{
          id: string;
          name: string;
          startDate: string;
          isActive: boolean;
          instructor: { firstName: string; lastName: string };
          _count: { enrollments: number };
        }>;
      }>(`/admin/courses/${id}`),

    createCourse: (data: {
      code: string;
      name: string;
      fullName: string;
      version: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
    }) =>
      request('/admin/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateCourse: (id: string, data: {
      name?: string;
      fullName?: string;
      version?: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
      isActive?: boolean;
    }) =>
      request(`/admin/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    createChapter: (data: {
      partId: string;
      chapterNumber: number;
      title: string;
      slug: string;
      content: string;
      estimatedMinutes?: number;
    }) =>
      request('/admin/chapters', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateChapter: (id: string, data: {
      title?: string;
      content?: string;
      estimatedMinutes?: number;
      isActive?: boolean;
    }) =>
      request(`/admin/chapters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // Questions
    getQuestions: (params?: {
      skip?: number;
      take?: number;
      search?: string;
      chapterId?: string;
      bloomLevel?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.take) searchParams.set('take', params.take.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.chapterId) searchParams.set('chapterId', params.chapterId);
      if (params?.bloomLevel) searchParams.set('bloomLevel', params.bloomLevel);
      return request<{
        questions: Array<{
          id: string;
          questionCode: string;
          bloomLevel: string;
          questionText: string;
          explanation: string;
          reference: string | null;
          isActive: boolean;
          isExamQuestion: boolean;
          createdAt: string;
          chapter: { title: string; slug: string } | null;
          options: Array<{
            id: string;
            optionLabel: string;
            optionText: string;
            isCorrect: boolean;
            sortOrder: number;
          }>;
          _count: { attempts: number };
        }>;
        total: number;
        skip: number;
        take: number;
      }>(`/admin/questions?${searchParams}`);
    },

    getQuestion: (id: string) =>
      request<{
        id: string;
        questionCode: string;
        bloomLevel: string;
        questionText: string;
        explanation: string;
        reference: string | null;
        isActive: boolean;
        isExamQuestion: boolean;
        chapter: {
          id: string;
          title: string;
          slug: string;
        } | null;
        options: Array<{
          id: string;
          optionLabel: string;
          optionText: string;
          isCorrect: boolean;
          sortOrder: number;
        }>;
      }>(`/admin/questions/${id}`),

    createQuestion: (data: {
      questionCode: string;
      chapterId?: string;
      bloomLevel: string;
      questionText: string;
      explanation: string;
      reference?: string;
      isExamQuestion?: boolean;
      options: Array<{
        optionLabel: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    }) =>
      request('/admin/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateQuestion: (id: string, data: {
      chapterId?: string;
      bloomLevel?: string;
      questionText?: string;
      explanation?: string;
      reference?: string;
      isActive?: boolean;
      isExamQuestion?: boolean;
    }) =>
      request(`/admin/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateQuestionOptions: (id: string, options: Array<{
      id?: string;
      optionLabel: string;
      optionText: string;
      isCorrect: boolean;
    }>) =>
      request(`/admin/questions/${id}/options`, {
        method: 'PUT',
        body: JSON.stringify({ options }),
      }),

    deleteQuestion: (id: string) =>
      request(`/admin/questions/${id}`, { method: 'DELETE' }),

    // Algorithms
    getAlgorithms: () =>
      request<
        Array<{
          id: string;
          code: string;
          title: string;
          description: string | null;
          version: number;
          isActive: boolean;
          chapter: { title: string; slug: string } | null;
        }>
      >('/admin/algorithms'),

    getAlgorithm: (id: string) =>
      request<{
        id: string;
        code: string;
        title: string;
        description: string | null;
        svgContent: string;
        version: number;
        isActive: boolean;
        chapter: {
          id: string;
          title: string;
          slug: string;
        } | null;
      }>(`/admin/algorithms/${id}`),

    createAlgorithm: (data: {
      code: string;
      title: string;
      description?: string;
      svgContent: string;
      chapterId?: string;
    }) =>
      request('/admin/algorithms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateAlgorithm: (id: string, data: {
      title?: string;
      description?: string;
      svgContent?: string;
      chapterId?: string;
      isActive?: boolean;
    }) =>
      request(`/admin/algorithms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAlgorithm: (id: string) =>
      request(`/admin/algorithms/${id}`, { method: 'DELETE' }),
  },
};

export { ApiError };
export type { RequestOptions };
