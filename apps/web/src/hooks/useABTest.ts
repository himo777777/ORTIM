import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export type ABTestStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type TestType = 'content' | 'ui' | 'quiz' | 'algorithm';
export type MetricType = 'completion_rate' | 'quiz_score' | 'time_on_page' | 'click_rate' | 'conversion_rate';

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  isControl: boolean;
  config: Record<string, unknown>;
  weight: number;
  impressions: number;
  conversions: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: ABTestStatus;
  testType: TestType;
  targetPage?: string;
  trafficPercent: number;
  primaryMetric: MetricType;
  secondaryMetrics?: MetricType[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  variants: ABTestVariant[];
  _count?: {
    assignments: number;
    conversions: number;
  };
}

export interface VariantResults {
  id: string;
  name: string;
  isControl: boolean;
  participants: number;
  conversions: number;
  conversionRate: number;
  averageMetricValue: number;
  standardError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  uplift: number;
  pValue: number;
}

export interface TestResults {
  testId: string;
  testName: string;
  status: ABTestStatus;
  startDate: string | null;
  endDate: string | null;
  totalParticipants: number;
  variants: VariantResults[];
  winner: VariantResults | null;
  isSignificant: boolean;
  confidenceLevel: number;
}

export interface TestSummary {
  total: number;
  byStatus: {
    draft: number;
    running: number;
    paused: number;
    completed: number;
  };
  activeTests: number;
  totalParticipants: number;
  totalConversions: number;
}

export interface CreateTestInput {
  name: string;
  description?: string;
  testType: TestType;
  targetPage?: string;
  trafficPercent?: number;
  primaryMetric: MetricType;
  secondaryMetrics?: MetricType[];
  startDate?: string;
  endDate?: string;
  variants: {
    name: string;
    description?: string;
    isControl?: boolean;
    config: Record<string, unknown>;
    weight?: number;
  }[];
}

export interface VariantAssignment {
  variantId: string;
  config: Record<string, unknown>;
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const abTestApi = {
  getSummary: async (): Promise<TestSummary> => {
    const response = await fetch('/api/analytics/ab-tests/summary', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  },

  getTests: async (status?: ABTestStatus, testType?: TestType): Promise<ABTest[]> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (testType) params.set('testType', testType);

    const response = await fetch(`/api/analytics/ab-tests?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tests');
    return response.json();
  },

  getTest: async (testId: string): Promise<ABTest> => {
    const response = await fetch(`/api/analytics/ab-tests/${testId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch test');
    return response.json();
  },

  getTestResults: async (testId: string): Promise<TestResults> => {
    const response = await fetch(`/api/analytics/ab-tests/${testId}/results`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch results');
    return response.json();
  },

  createTest: async (data: CreateTestInput): Promise<ABTest> => {
    const response = await fetch('/api/analytics/ab-tests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create test');
    return response.json();
  },

  updateStatus: async (testId: string, status: ABTestStatus): Promise<ABTest> => {
    const response = await fetch(`/api/analytics/ab-tests/${testId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  deleteTest: async (testId: string): Promise<void> => {
    const response = await fetch(`/api/analytics/ab-tests/${testId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete test');
  },

  getVariant: async (testId: string, sessionId?: string): Promise<VariantAssignment | null> => {
    const response = await fetch('/api/analytics/ab-tests/variant', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testId, sessionId }),
    });
    if (!response.ok) return null;
    return response.json();
  },

  getActiveTestsForPage: async (targetPage: string): Promise<ABTest[]> => {
    const response = await fetch(`/api/analytics/ab-tests/page/${encodeURIComponent(targetPage)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tests for page');
    return response.json();
  },

  recordConversion: async (
    testId: string,
    metricName: string,
    metricValue: number,
    sessionId?: string,
  ): Promise<void> => {
    const response = await fetch('/api/analytics/ab-tests/conversion', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testId, metricName, metricValue, sessionId }),
    });
    if (!response.ok) throw new Error('Failed to record conversion');
  },

  getUserAssignments: async (): Promise<{
    test: { id: string; name: string; testType: string; targetPage?: string };
    variant: { id: string; name: string; config: Record<string, unknown> };
  }[]> => {
    const response = await fetch('/api/analytics/ab-tests/user/assignments', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  },
};

/**
 * Hook for A/B test summary (admin dashboard)
 */
export function useABTestSummary() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ab-tests-summary'],
    queryFn: abTestApi.getSummary,
  });

  return {
    summary: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for listing A/B tests
 */
export function useABTests(status?: ABTestStatus, testType?: TestType) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ab-tests', status, testType],
    queryFn: () => abTestApi.getTests(status, testType),
  });

  return {
    tests: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for a single A/B test
 */
export function useABTest(testId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ab-test', testId],
    queryFn: () => abTestApi.getTest(testId),
    enabled: !!testId,
  });

  return {
    test: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for A/B test results
 */
export function useABTestResults(testId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ab-test-results', testId],
    queryFn: () => abTestApi.getTestResults(testId),
    enabled: !!testId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    results: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for managing A/B tests (create, update, delete)
 */
export function useABTestManager() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: abTestApi.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      queryClient.invalidateQueries({ queryKey: ['ab-tests-summary'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ testId, status }: { testId: string; status: ABTestStatus }) =>
      abTestApi.updateStatus(testId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      queryClient.invalidateQueries({ queryKey: ['ab-test'] });
      queryClient.invalidateQueries({ queryKey: ['ab-tests-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: abTestApi.deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      queryClient.invalidateQueries({ queryKey: ['ab-tests-summary'] });
    },
  });

  return {
    createTest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    deleteTest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for getting variant assignment and recording conversions
 * Use this in components that need A/B test variants
 */
export function useVariant(testId: string, sessionId?: string) {
  const [variant, setVariant] = useState<VariantAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasRecordedConversion = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }

    const fetchVariant = async () => {
      try {
        const assignment = await abTestApi.getVariant(testId, sessionId);
        setVariant(assignment);
      } catch (e) {
        console.error('Failed to get variant:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [testId, sessionId]);

  const recordConversion = useCallback(
    async (metricName: string, metricValue: number) => {
      if (!variant) return;

      // Prevent duplicate conversions for same metric
      const key = `${testId}-${metricName}`;
      if (hasRecordedConversion.current.has(key)) return;

      try {
        await abTestApi.recordConversion(testId, metricName, metricValue, sessionId);
        hasRecordedConversion.current.add(key);
      } catch (e) {
        console.error('Failed to record conversion:', e);
      }
    },
    [testId, variant, sessionId],
  );

  return {
    variant,
    config: variant?.config || {},
    isLoading,
    isInTest: variant !== null,
    recordConversion,
  };
}

/**
 * Hook for getting all variant assignments for current user
 */
export function useUserAssignments() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ab-test-assignments'],
    queryFn: abTestApi.getUserAssignments,
  });

  return {
    assignments: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook for getting active tests on a specific page
 */
export function usePageTests(targetPage: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ab-tests-page', targetPage],
    queryFn: () => abTestApi.getActiveTestsForPage(targetPage),
    enabled: !!targetPage,
  });

  return {
    tests: data || [],
    isLoading,
    error,
  };
}

// Helper functions
export function getStatusColor(status: ABTestStatus): string {
  switch (status) {
    case 'DRAFT':
      return '#6B7280';
    case 'RUNNING':
      return '#10B981';
    case 'PAUSED':
      return '#F59E0B';
    case 'COMPLETED':
      return '#6366F1';
    default:
      return '#6B7280';
  }
}

export function getStatusLabel(status: ABTestStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Utkast';
    case 'RUNNING':
      return 'Aktiv';
    case 'PAUSED':
      return 'Pausad';
    case 'COMPLETED':
      return 'Avslutad';
    default:
      return status;
  }
}

export function getTestTypeLabel(type: TestType): string {
  switch (type) {
    case 'content':
      return 'Innehåll';
    case 'ui':
      return 'Gränssnitt';
    case 'quiz':
      return 'Quiz';
    case 'algorithm':
      return 'Algoritm';
    default:
      return type;
  }
}

export function getMetricLabel(metric: MetricType): string {
  switch (metric) {
    case 'completion_rate':
      return 'Slutförandegrad';
    case 'quiz_score':
      return 'Quiz-poäng';
    case 'time_on_page':
      return 'Tid på sidan';
    case 'click_rate':
      return 'Klickfrekvens';
    case 'conversion_rate':
      return 'Konverteringsgrad';
    default:
      return metric;
  }
}

export function formatUplift(uplift: number): string {
  const sign = uplift >= 0 ? '+' : '';
  return `${sign}${uplift.toFixed(1)}%`;
}

export function formatPValue(pValue: number): string {
  if (pValue < 0.001) return '< 0.001';
  return pValue.toFixed(3);
}

export function isSignificant(pValue: number): boolean {
  return pValue < 0.05;
}

export { abTestApi };
