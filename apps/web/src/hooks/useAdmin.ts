import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================
// Dashboard
// ============================================

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.getDashboard(),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// Users
// ============================================

export function useAdminUsers(params?: {
  skip?: number;
  take?: number;
  search?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.admin.getUsers(params),
    staleTime: 30 * 1000,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.admin.getUser(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      personnummer: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role?: string;
      workplace?: string;
      speciality?: string;
    }) => api.admin.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        role?: string;
        workplace?: string;
        speciality?: string;
      };
    }) => api.admin.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// ============================================
// Courses
// ============================================

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => api.admin.getCourses(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: ['admin', 'course', id],
    queryFn: () => api.admin.getCourse(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      code: string;
      name: string;
      fullName: string;
      version: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
    }) => api.admin.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        fullName?: string;
        version?: string;
        lipusNumber?: string;
        description?: string;
        estimatedHours?: number;
        passingScore?: number;
        isActive?: boolean;
      };
    }) => api.admin.updateCourse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', variables.id] });
    },
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      partId: string;
      chapterNumber: number;
      title: string;
      slug: string;
      content: string;
      estimatedMinutes?: number;
    }) => api.admin.createChapter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        content?: string;
        estimatedMinutes?: number;
        isActive?: boolean;
      };
    }) => api.admin.updateChapter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });
}

// ============================================
// Questions
// ============================================

export function useAdminQuestions(params?: {
  skip?: number;
  take?: number;
  search?: string;
  chapterId?: string;
  bloomLevel?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'questions', params],
    queryFn: () => api.admin.getQuestions(params),
    staleTime: 30 * 1000,
  });
}

export function useAdminQuestion(id: string) {
  return useQuery({
    queryKey: ['admin', 'question', id],
    queryFn: () => api.admin.getQuestion(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => api.admin.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        chapterId?: string;
        bloomLevel?: string;
        questionText?: string;
        explanation?: string;
        reference?: string;
        isActive?: boolean;
        isExamQuestion?: boolean;
      };
    }) => api.admin.updateQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'question', variables.id] });
    },
  });
}

export function useUpdateQuestionOptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: string;
      options: Array<{
        id?: string;
        optionLabel: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    }) => api.admin.updateQuestionOptions(id, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'question', variables.id] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// ============================================
// Algorithms
// ============================================

export function useAdminAlgorithms() {
  return useQuery({
    queryKey: ['admin', 'algorithms'],
    queryFn: () => api.admin.getAlgorithms(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAlgorithm(id: string) {
  return useQuery({
    queryKey: ['admin', 'algorithm', id],
    queryFn: () => api.admin.getAlgorithm(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAlgorithm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      code: string;
      title: string;
      description?: string;
      svgContent: string;
      chapterId?: string;
    }) => api.admin.createAlgorithm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'algorithms'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateAlgorithm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        svgContent?: string;
        chapterId?: string;
        isActive?: boolean;
      };
    }) => api.admin.updateAlgorithm(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'algorithms'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'algorithm', variables.id] });
    },
  });
}

export function useDeleteAlgorithm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteAlgorithm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'algorithms'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// ============================================
// Statistics
// ============================================

export function useDetailedStats(params?: {
  courseCode?: string;
  cohortId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'stats', 'detailed', params],
    queryFn: () => api.admin.getDetailedStats(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExportParticipants() {
  return useMutation({
    mutationFn: async (cohortId?: string) => {
      const blob = await api.admin.exportParticipants(cohortId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportProgress() {
  return useMutation({
    mutationFn: async (courseCode?: string) => {
      const blob = await api.admin.exportProgress(courseCode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportCertificates() {
  return useMutation({
    mutationFn: async (courseCode?: string) => {
      const blob = await api.admin.exportCertificates(courseCode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}
