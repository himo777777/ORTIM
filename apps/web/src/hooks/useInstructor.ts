import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ===========================================
// Cohort Hooks
// ===========================================

export function useCohorts() {
  return useQuery({
    queryKey: ['instructor', 'cohorts'],
    queryFn: () => api.instructor.getCohorts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCohort(cohortId: string) {
  return useQuery({
    queryKey: ['instructor', 'cohort', cohortId],
    queryFn: () => api.instructor.getCohort(cohortId),
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCohortStats(cohortId: string) {
  return useQuery({
    queryKey: ['instructor', 'cohort', cohortId, 'stats'],
    queryFn: () => api.instructor.getCohortStats(cohortId),
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCohortParticipants(cohortId: string) {
  return useQuery({
    queryKey: ['instructor', 'cohort', cohortId, 'participants'],
    queryFn: () => api.instructor.getCohortParticipants(cohortId),
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      courseId: string;
      name: string;
      description?: string;
      startDate: string;
      endDate?: string;
      maxParticipants?: number;
    }) => api.instructor.createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'cohorts'] });
    },
  });
}

// ===========================================
// OSCE Assessment Hooks
// ===========================================

export function useOsceAssessments(enrollmentId: string) {
  return useQuery({
    queryKey: ['instructor', 'osce', enrollmentId],
    queryFn: () => api.instructor.getOsceAssessments(enrollmentId),
    enabled: !!enrollmentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOsceAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      data,
    }: {
      enrollmentId: string;
      data: {
        stationNumber: number;
        stationName: string;
        passed: boolean;
        score?: number;
        comments?: string;
      };
    }) => api.instructor.createOsceAssessment(enrollmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'osce', variables.enrollmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'cohort'],
      });
    },
  });
}

export function useUpdateOsceAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      enrollmentId: string;
      data: {
        passed?: boolean;
        score?: number;
        comments?: string;
      };
    }) => api.instructor.updateOsceAssessment(assessmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'osce', variables.enrollmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'cohort'],
      });
    },
  });
}

// ===========================================
// Dashboard Summary Hook
// ===========================================

export function useInstructorDashboard() {
  const { data: cohorts, isLoading: cohortsLoading } = useCohorts();

  // Calculate summary stats
  const activeCohorts = cohorts?.filter((c) => c.isActive) || [];
  const totalParticipants = cohorts?.reduce(
    (sum, c) => sum + c._count.enrollments,
    0
  ) || 0;

  return {
    cohorts,
    activeCohorts,
    totalParticipants,
    totalCohorts: cohorts?.length || 0,
    isLoading: cohortsLoading,
  };
}

// ===========================================
// EPA (Entrustable Professional Activities) Hooks
// ===========================================

export function useEPAList() {
  return useQuery({
    queryKey: ['instructor', 'epa', 'list'],
    queryFn: () => api.instructor.listEPAs(),
    staleTime: 30 * 60 * 1000, // EPAs don't change often
  });
}

export function useEPAAssessments(participantId: string) {
  return useQuery({
    queryKey: ['instructor', 'epa', 'assessments', participantId],
    queryFn: () => api.instructor.getEPAAssessments(participantId),
    enabled: !!participantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCohortEPAAssessments(cohortId: string) {
  return useQuery({
    queryKey: ['instructor', 'epa', 'cohort', cohortId],
    queryFn: () => api.instructor.getCohortEPAAssessments(cohortId),
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEPAAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      participantId: string;
      epaId: string;
      entrustmentLevel: number;
      comments?: string;
    }) => api.instructor.createEPAAssessment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'epa', 'assessments', variables.participantId],
      });
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'epa', 'cohort'],
      });
    },
  });
}

// ===========================================
// OSCE Stations Hooks
// ===========================================

export function useOSCEStations() {
  return useQuery({
    queryKey: ['instructor', 'osce-stations'],
    queryFn: () => api.instructor.getOSCEStations(),
    staleTime: 30 * 60 * 1000, // Stations don't change often
  });
}

// ===========================================
// Pilot Evaluation (Kirkpatrick) Hooks
// ===========================================

export function useSubmitPilotEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      kirkpatrickLevel: 'REACTION' | 'LEARNING' | 'BEHAVIOR' | 'RESULTS';
      assessmentType: string;
      score?: number;
      maxScore?: number;
      responses?: Record<string, unknown>;
      notes?: string;
    }) => api.instructor.submitPilotEvaluation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'pilot'],
      });
    },
  });
}

export function usePilotResults(cohortId?: string) {
  return useQuery({
    queryKey: ['instructor', 'pilot', 'results', cohortId],
    queryFn: () => api.instructor.getPilotResults(cohortId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useParticipantPilotResults(participantId: string) {
  return useQuery({
    queryKey: ['instructor', 'pilot', 'participant', participantId],
    queryFn: () => api.instructor.getParticipantPilotResults(participantId),
    enabled: !!participantId,
    staleTime: 2 * 60 * 1000,
  });
}

// ===========================================
// Instructor Training Status (TTT Course)
// ===========================================

export function useMyTrainingStatus() {
  return useQuery({
    queryKey: ['instructor', 'my-training'],
    queryFn: () => api.instructor.getMyTraining(),
    staleTime: 5 * 60 * 1000,
  });
}
