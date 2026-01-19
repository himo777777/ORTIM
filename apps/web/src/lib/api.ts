import { useAuthStore } from '@/stores/authStore';

// ===========================================
// ORTAC API Client
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

// Refresh token lock to prevent race conditions
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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
        // Use shared refresh promise to prevent race conditions
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          // Retry original request with new token
          const newToken = useAuthStore.getState().token;
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...fetchOptions, headers });
          if (retryResponse.ok) {
            const text = await retryResponse.text();
            return text ? JSON.parse(text) : ({} as T);
          }
        }
      } catch {
        // Refresh failed, logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    } else {
      // No refresh token, redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
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
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh(refreshToken);

  try {
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function doRefresh(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      // Handle both accessToken and token names for compatibility
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;
      if (newAccessToken && newRefreshToken) {
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
        return true;
      }
    }

    // Refresh failed - logout
    useAuthStore.getState().logout();
    return false;
  } catch {
    useAuthStore.getState().logout();
    return false;
  }
}

// ===========================================
// API Methods
// ===========================================

export const api = {
  // Generic request method
  request,

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
          instructorOnly?: boolean;
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

    getHistory: () =>
      request<
        Array<{
          id: string;
          type: 'practice' | 'chapter' | 'exam';
          chapterId: string | null;
          score: number;
          passed: boolean;
          correctAnswers: number;
          totalQuestions: number;
          timeSpent: number;
          completedAt: string;
          answers?: Array<{
            questionId: string;
            bloomLevel?: string;
            isCorrect: boolean;
          }>;
        }>
      >('/quiz/history'),
  },

  // Progress
  progress: {
    get: () =>
      request<{
        totalChapters: number;
        completedChapters: number;
        overallProgress: number;
        chapters: Array<{
          chapterId: string;
          readProgress: number;
          quizPassed: boolean;
          bestQuizScore: number | null;
          completedAt: string | null;
          chapter: {
            id: string;
            chapterNumber: number;
            title: string;
            slug: string;
            part: { partNumber: number; title: string };
          };
        }>;
      }>('/progress'),

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

    getByCourse: (courseCode: string) =>
      request<{
        courseCode: string;
        courseName: string;
        totalChapters: number;
        completedChapters: number;
        overallProgress: number;
        chapters: Array<{
          chapterId: string;
          chapterNumber: number;
          title: string;
          slug: string;
          partNumber: number;
          readProgress: number;
          quizPassed: boolean;
          completed: boolean;
          completedAt: string | null;
        }>;
      }>(`/progress/course/${courseCode}`),
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

    checkAndGenerate: (courseCode: string) =>
      request<{
        eligible: boolean;
        alreadyHasCertificate: boolean;
        certificate: {
          id: string;
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
          validUntil: string;
          examScore: number;
          examPassed: boolean;
          verificationUrl: string;
        } | null;
        requirements?: {
          chaptersCompleted: number;
          chaptersRequired: number;
          quizzesPassed: number;
          quizzesRequired: number;
        };
        message: string;
      }>(`/certificates/check/${courseCode}`, { method: 'POST' }),

    downloadPdf: async (certificateId: string): Promise<Blob> => {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to download PDF');
      }
      return response.blob();
    },

    getExpirationStatus: (certificateId: string) =>
      request<{
        certificateId: string;
        validUntil: string;
        daysUntilExpiry: number;
        status: 'valid' | 'expiring_soon' | 'expired';
        canRecertify: boolean;
        isRecertification: boolean;
        recertificationCount: number;
      }>(`/certificates/${certificateId}/status`),

    recertify: (certificateId: string) =>
      request<{
        eligible: boolean;
        certificate?: {
          id: string;
          certificateNumber: string;
          courseName: string;
          validUntil: string;
        };
        message: string;
        requirements?: {
          quizzesPassed: number;
          quizzesRequired: number;
        };
        previousCertificate?: {
          id: string;
          certificateNumber: string;
          validUntil: string;
        };
      }>(`/certificates/${certificateId}/recertify`, { method: 'POST' }),
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

    // EPA (Entrustable Professional Activities)
    listEPAs: () =>
      request<
        Array<{
          id: string;
          code: string;
          title: string;
          description: string;
          objectives: string[];
          criteria: string[];
          sortOrder: number;
        }>
      >('/instructor/epa/list'),

    createEPAAssessment: (data: {
      participantId: string;
      epaId: string;
      entrustmentLevel: number;
      comments?: string;
    }) =>
      request('/instructor/epa/assess', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getEPAAssessments: (participantId: string) =>
      request<
        Array<{
          id: string;
          entrustmentLevel: number;
          comments: string | null;
          assessedAt: string;
          epa: {
            id: string;
            code: string;
            title: string;
            description: string;
          };
        }>
      >(`/instructor/epa/assessments/${participantId}`),

    getCohortEPAAssessments: (cohortId: string) =>
      request<{
        cohort: { id: string; name: string };
        epas: Array<{
          id: string;
          code: string;
          title: string;
          description: string;
          objectives: string[];
          criteria: string[];
        }>;
        participants: Array<{
          userId: string;
          firstName: string;
          lastName: string;
          assessments: Array<{
            id: string;
            epaId: string;
            entrustmentLevel: number;
            comments: string | null;
            assessedAt: string;
            epa: { code: string; title: string };
          }>;
          completedEPAs: number;
          totalEPAs: number;
        }>;
      }>(`/instructor/epa/cohort/${cohortId}`),

    // OSCE Stations
    getOSCEStations: () =>
      request<
        Array<{
          id: string;
          code: string;
          title: string;
          scenario: string;
          checklist: string[];
          criticalErrors: string[];
          timeLimit: number;
          sortOrder: number;
        }>
      >('/instructor/osce-stations'),

    // Pilot Evaluation (Kirkpatrick)
    submitPilotEvaluation: (data: {
      kirkpatrickLevel: 'REACTION' | 'LEARNING' | 'BEHAVIOR' | 'RESULTS';
      assessmentType: string;
      score?: number;
      maxScore?: number;
      responses?: Record<string, unknown>;
      notes?: string;
    }) =>
      request('/instructor/pilot/evaluation', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getPilotResults: (cohortId?: string) =>
      request<{
        summary: {
          totalParticipants: number;
          reactionCount: number;
          learningCount: number;
          behaviorCount: number;
          resultsCount: number;
          averageSatisfaction: number | null;
        };
        assessments: Record<string, Array<{
          id: string;
          participantId: string;
          kirkpatrickLevel: string;
          assessmentType: string;
          score: number | null;
          maxScore: number | null;
          responses: Record<string, unknown> | null;
          notes: string | null;
          assessedAt: string;
        }>>;
      }>(`/instructor/pilot/results${cohortId ? `?cohortId=${cohortId}` : ''}`),

    getParticipantPilotResults: (participantId: string) =>
      request<{
        pilotAssessments: Array<{
          id: string;
          kirkpatrickLevel: string;
          assessmentType: string;
          score: number | null;
          maxScore: number | null;
          responses: Record<string, unknown> | null;
          notes: string | null;
          assessedAt: string;
        }>;
        epaAssessments: Array<{
          id: string;
          entrustmentLevel: number;
          comments: string | null;
          assessedAt: string;
          epa: { code: string; title: string };
        }>;
      }>(`/instructor/pilot/results/${participantId}`),

    // Instructor Training Status
    getMyTraining: () =>
      request<{
        tttProgress: {
          courseCode: string;
          courseName: string;
          totalChapters: number;
          completedChapters: number;
          quizzesPassed: number;
          percentage: number;
          chapters: Array<{
            chapterId: string;
            readProgress: number;
            quizPassed: boolean;
            completed: boolean;
          }>;
        } | null;
        osceStatus: {
          enrolled: boolean;
          cohortId: string | null;
          cohortName: string | null;
          assessmentsCompleted: number;
          assessmentsPassed: number;
          totalStations: number;
          passed: boolean | null;
        } | null;
        certificate: {
          id: string;
          certificateNumber: string;
          issuedAt: string;
          validUntil: string;
          verificationUrl: string;
        } | null;
        eligibleForCertificate: boolean;
        message?: string;
      }>('/instructor/my-training'),
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

    // Statistics
    getDetailedStats: (params?: {
      courseCode?: string;
      cohortId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.courseCode) searchParams.set('courseCode', params.courseCode);
      if (params?.cohortId) searchParams.set('cohortId', params.cohortId);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      return request<{
        completionByWeek: Array<{ week: string; count: number }>;
        scoreDistribution: Array<{ range: string; count: number }>;
        chapterPassRates: Array<{
          chapterNumber: number;
          title: string;
          passRate: number;
          totalAttempts: number;
        }>;
        certificateStats: {
          total: number;
          thisMonth: number;
          expiringIn30Days: number;
          expired: number;
        };
        enrollmentByMonth: Array<{ month: string; count: number }>;
      }>(`/admin/stats/detailed?${searchParams}`);
    },

    // Exports
    exportParticipants: async (cohortId?: string): Promise<Blob> => {
      const token = useAuthStore.getState().token;
      const params = cohortId ? `?cohortId=${cohortId}` : '';
      const response = await fetch(`${API_BASE_URL}/admin/export/participants${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to export participants');
      }
      return response.blob();
    },

    exportProgress: async (courseCode?: string): Promise<Blob> => {
      const token = useAuthStore.getState().token;
      const params = courseCode ? `?courseCode=${courseCode}` : '';
      const response = await fetch(`${API_BASE_URL}/admin/export/progress${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to export progress');
      }
      return response.blob();
    },

    exportCertificates: async (courseCode?: string): Promise<Blob> => {
      const token = useAuthStore.getState().token;
      const params = courseCode ? `?courseCode=${courseCode}` : '';
      const response = await fetch(`${API_BASE_URL}/admin/export/certificates${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to export certificates');
      }
      return response.blob();
    },
  },

  // ===========================================
  // MEDIA
  // ===========================================
  media: {
    upload: async (file: File, metadata?: { alt?: string; caption?: string; tags?: string[] }): Promise<{
      id: string;
      filename: string;
      url: string;
      thumbnailUrl: string | null;
      type: string;
      mimeType: string;
      size: number;
      width: number | null;
      height: number | null;
    }> => {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('file', file);
      if (metadata?.alt) formData.append('alt', metadata.alt);
      if (metadata?.caption) formData.append('caption', metadata.caption);
      if (metadata?.tags) formData.append('tags', metadata.tags.join(','));

      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.message || 'Failed to upload file');
      }

      return response.json();
    },

    embed: (data: { url: string; alt?: string; caption?: string; tags?: string[] }) =>
      request<{
        id: string;
        url: string;
        thumbnailUrl: string | null;
        videoProvider: string;
        videoId: string;
      }>('/media/embed', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (params?: { skip?: number; take?: number; search?: string; type?: 'IMAGE' | 'VIDEO' | 'PDF' }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.take) searchParams.set('take', params.take.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      return request<{
        assets: Array<{
          id: string;
          filename: string;
          originalName: string;
          mimeType: string;
          size: number;
          type: 'IMAGE' | 'VIDEO' | 'PDF';
          url: string;
          thumbnailUrl: string | null;
          alt: string | null;
          caption: string | null;
          videoProvider: string | null;
          videoId: string | null;
          width: number | null;
          height: number | null;
          tags: string[];
          usageCount: number;
          createdAt: string;
          uploadedBy: { id: string; firstName: string; lastName: string };
        }>;
        total: number;
        skip: number;
        take: number;
      }>(`/media?${searchParams}`);
    },

    search: (query: string, type?: 'IMAGE' | 'VIDEO' | 'PDF') => {
      const searchParams = new URLSearchParams({ q: query });
      if (type) searchParams.set('type', type);
      return request<{
        assets: Array<{
          id: string;
          filename: string;
          url: string;
          thumbnailUrl: string | null;
          type: 'IMAGE' | 'VIDEO' | 'PDF';
          alt: string | null;
        }>;
        total: number;
      }>(`/media/search?${searchParams}`);
    },

    get: (id: string) =>
      request<{
        id: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        type: 'IMAGE' | 'VIDEO' | 'PDF';
        url: string;
        thumbnailUrl: string | null;
        alt: string | null;
        caption: string | null;
        videoProvider: string | null;
        videoId: string | null;
        width: number | null;
        height: number | null;
        tags: string[];
        usageCount: number;
        createdAt: string;
        uploadedBy: { id: string; firstName: string; lastName: string };
      }>(`/media/${id}`),

    update: (id: string, data: { alt?: string; caption?: string; tags?: string[] }) =>
      request(`/media/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/media/${id}`, { method: 'DELETE' }),
  },

  // ===========================================
  // ORGANIZATION (Admin)
  // ===========================================
  organization: {
    list: (params?: { skip?: number; take?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.take) searchParams.set('take', params.take.toString());
      if (params?.search) searchParams.set('search', params.search);
      return request<{
        organizations: Array<{
          id: string;
          name: string;
          organizationNumber: string | null;
          contactEmail: string;
          reportFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
          reportEnabled: boolean;
          isActive: boolean;
          createdAt: string;
          _count: { members: number; reportRecipients: number };
        }>;
        total: number;
        skip: number;
        take: number;
      }>(`/admin/organizations?${searchParams}`);
    },

    get: (id: string) =>
      request<{
        id: string;
        name: string;
        organizationNumber: string | null;
        contactEmail: string;
        contactPhone: string | null;
        address: string | null;
        reportFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
        reportEnabled: boolean;
        logoUrl: string | null;
        isActive: boolean;
        createdAt: string;
        members: Array<{
          id: string;
          role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
          department: string | null;
          addedAt: string;
          user: { id: string; firstName: string; lastName: string; email: string | null; workplace: string | null };
        }>;
        reportRecipients: Array<{
          id: string;
          email: string;
          name: string | null;
          isActive: boolean;
        }>;
      }>(`/admin/organizations/${id}`),

    create: (data: {
      name: string;
      organizationNumber?: string;
      contactEmail: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      logoUrl?: string;
    }) =>
      request('/admin/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: {
      name?: string;
      organizationNumber?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      reportEnabled?: boolean;
      logoUrl?: string;
      isActive?: boolean;
    }) =>
      request(`/admin/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/admin/organizations/${id}`, { method: 'DELETE' }),

    addMember: (organizationId: string, data: {
      userId: string;
      role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
      department?: string;
    }) =>
      request(`/admin/organizations/${organizationId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateMember: (organizationId: string, userId: string, data: {
      role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
      department?: string;
    }) =>
      request(`/admin/organizations/${organizationId}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    removeMember: (organizationId: string, userId: string) =>
      request<{ success: boolean }>(`/admin/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE',
      }),

    addRecipient: (organizationId: string, data: { email: string; name?: string }) =>
      request(`/admin/organizations/${organizationId}/recipients`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    removeRecipient: (recipientId: string) =>
      request<{ success: boolean }>(`/admin/organizations/recipients/${recipientId}`, {
        method: 'DELETE',
      }),
  },

  // ===========================================
  // ORGANIZATION PORTAL
  // ===========================================
  organizationPortal: {
    getDashboard: () =>
      request<{
        organization: {
          id: string;
          name: string;
          organizationNumber: string | null;
          contactEmail: string;
          logoUrl: string | null;
        };
        stats: {
          totalEmployees: number;
          employeesWithCertificates: number;
          certificationRate: number;
          expiringCertificates: number;
          averageProgress: number;
        };
        recentCertificates: Array<{
          id: string;
          certificateNumber: string;
          courseName: string;
          issuedAt: string;
          validUntil: string;
          user: { firstName: string; lastName: string };
        }>;
      }>('/organization-portal'),

    getEmployees: (params?: { skip?: number; take?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip) searchParams.set('skip', params.skip.toString());
      if (params?.take) searchParams.set('take', params.take.toString());
      if (params?.search) searchParams.set('search', params.search);
      return request<{
        employees: Array<{
          id: string;
          role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
          department: string | null;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
            workplace: string | null;
            certificates: Array<{
              id: string;
              courseName: string;
              issuedAt: string;
              validUntil: string;
            }>;
            _count: { chapterProgress: number; certificates: number };
          };
        }>;
        total: number;
        skip: number;
        take: number;
      }>(`/organization-portal/employees?${searchParams}`);
    },

    getEmployee: (id: string) =>
      request<{
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        workplace: string | null;
        createdAt: string;
        department: string | null;
        memberRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
        certificates: Array<{
          id: string;
          certificateNumber: string;
          courseName: string;
          courseCode: string;
          issuedAt: string;
          validUntil: string;
          examScore: number;
          examPassed: boolean;
        }>;
        chapterProgress: Array<{
          id: string;
          readProgress: number;
          completedAt: string | null;
          chapter: { title: string; chapterNumber: number };
        }>;
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
      }>(`/organization-portal/employees/${id}`),

    exportData: async (): Promise<Blob> => {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/organization-portal/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to export data');
      }
      return response.blob();
    },
  },

  // ===========================================
  // GAMIFICATION
  // ===========================================
  gamification: {
    getStats: () =>
      request<{
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
      }>('/gamification/stats'),

    getLeaderboard: (period: 'weekly' | 'monthly' | 'allTime' = 'weekly', limit = 10) =>
      request<{
        leaderboard: Array<{
          rank: number;
          userId: string;
          firstName: string;
          lastName: string;
          xp: number;
          level: number;
          streak: number;
        }>;
        currentUserRank: number | null;
        currentUserXP: number;
      }>(`/gamification/leaderboard?period=${period}&limit=${limit}`),

    getAllBadges: () =>
      request<
        Array<{
          id: string;
          code: string;
          name: string;
          description: string;
          icon: string;
          category: 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';
          xpReward: number;
          requirement: Record<string, unknown>;
          isActive: boolean;
        }>
      >('/gamification/badges'),

    getMyBadges: () =>
      request<
        Array<{
          id: string;
          earnedAt: string;
          badge: {
            id: string;
            code: string;
            name: string;
            description: string;
            icon: string;
            category: 'PROGRESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';
            xpReward: number;
          };
        }>
      >('/gamification/badges/mine'),

    recordActivity: () =>
      request<{
        streak: number;
        xpAwarded: number;
        message: string;
      }>('/gamification/activity', { method: 'POST' }),

    checkBadges: () =>
      request<{
        newBadges: Array<{
          id: string;
          code: string;
          name: string;
          description: string;
          icon: string;
          xpReward: number;
        }>;
      }>('/gamification/check-badges', { method: 'POST' }),
  },

  // ===========================================
  // NOTIFICATIONS
  // ===========================================
  notifications: {
    getVapidPublicKey: () =>
      request<{ vapidPublicKey: string | null }>('/notifications/vapid-public-key'),

    subscribe: (subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }) =>
      request<{ success: boolean; message: string }>('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
      }),

    unsubscribe: (endpoint: string) =>
      request<{ success: boolean; message: string }>('/notifications/unsubscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
      }),

    unsubscribeAll: () =>
      request<{ success: boolean; message: string }>('/notifications/unsubscribe-all', {
        method: 'DELETE',
      }),

    getAll: () =>
      request<
        Array<{
          id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown> | null;
          read: boolean;
          sentAt: string;
          readAt: string | null;
        }>
      >('/notifications'),

    getUnread: () =>
      request<
        Array<{
          id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown> | null;
          read: boolean;
          sentAt: string;
          readAt: string | null;
        }>
      >('/notifications/unread'),

    getUnreadCount: () =>
      request<{ count: number }>('/notifications/unread-count'),

    markAsRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

    markAllAsRead: () =>
      request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),

    sendTest: () =>
      request<{ notification: unknown; sent: number; failed: number }>(
        '/notifications/test',
        { method: 'POST' }
      ),

    send: (data: {
      userIds?: string[];
      role?: 'PARTICIPANT' | 'INSTRUCTOR' | 'ADMIN';
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }) =>
      request('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ===========================================
  // AI & PERSONALIZATION
  // ===========================================
  ai: {
    // Chat
    chat: (data: { message: string; conversationId?: string; contextChapterId?: string }) =>
      request<{
        conversationId: string;
        messageId: string;
        content: string;
        sourcesUsed: Array<{
          type: string;
          id: string;
          title: string;
          relevance: number;
        }>;
        tokensUsed: number;
      }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Stream chat - returns EventSource URL
    getStreamUrl: () => `${API_BASE_URL}/ai/chat/stream`,

    // Conversations
    getConversations: (limit = 20) =>
      request<
        Array<{
          id: string;
          title: string | null;
          createdAt: string;
          updatedAt: string;
          messages: Array<{
            id: string;
            role: 'user' | 'assistant';
            content: string;
            createdAt: string;
          }>;
        }>
      >(`/ai/conversations?limit=${limit}`),

    getConversation: (id: string) =>
      request<{
        id: string;
        title: string | null;
        createdAt: string;
        updatedAt: string;
        messages: Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          contextUsed: Array<{
            type: string;
            id: string;
            title: string;
            relevance: number;
          }> | null;
          tokensUsed: number | null;
          createdAt: string;
        }>;
      }>(`/ai/conversations/${id}`),

    deleteConversation: (id: string) =>
      request<{ success: boolean }>(`/ai/conversations/${id}`, { method: 'DELETE' }),

    // Content assistance
    summarizeChapter: (chapterId: string, format: 'brief' | 'detailed' | 'bullet_points' = 'brief') =>
      request<{
        summary: string;
        keyPoints: string[];
      }>(`/ai/summarize/${chapterId}?format=${format}`),

    explainQuestion: (questionId: string, includeRelatedConcepts = true) =>
      request<{
        explanation: string;
        correctAnswer: string;
        whyOthersWrong: Array<{ option: string; reason: string }>;
        relatedConcepts?: string[];
      }>(`/ai/explain/${questionId}?includeRelatedConcepts=${includeRelatedConcepts}`),

    // Recommendations & Learning Profile
    getRecommendations: () =>
      request<{
        recommendations: Array<{
          type: 'chapter_review' | 'quiz_practice' | 'spaced_repetition' | 'new_content' | 'weakness_focus';
          title: string;
          description: string;
          contentId: string;
          contentType: 'chapter' | 'quiz' | 'question';
          priority: number;
          estimatedMinutes?: number;
          metadata?: {
            lastAttemptScore?: number;
            daysAgo?: number;
            reviewCount?: number;
          };
        }>;
        generatedAt: string;
        learningProfile?: {
          strongTopics: string[];
          weakTopics: string[];
          preferredStudyTime?: string;
          averageSessionMinutes?: number;
          learningStyle?: string;
        };
      }>('/ai/recommendations'),

    getLearningProfile: () =>
      request<{
        userId: string;
        weakTopics: string[];
        strongTopics: string[];
        preferredTimes?: string[];
        averageSession?: number;
        learningStyle?: 'visual' | 'reading' | 'practice';
        updatedAt: string;
      } | null>('/ai/learning-profile'),
  },
};

export { ApiError };
export type { RequestOptions };
