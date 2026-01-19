import { useState, useCallback, useEffect } from 'react';

// Types
export interface CohortComparisonData {
  id: string;
  name: string;
  course: string;
  instructor: string;
  startDate: string;
  endDate: string | null;
  participants: number;
  activeCount: number;
  completedCount: number;
  completionRate: number;
  avgProgress: number;
  avgQuizScore: number;
  examPassRate: number;
  oscePassRate: number;
  avgOsceScore: number;
  avgXP: number;
  avgLevel: number;
}

export interface ComparisonMetric {
  name: string;
  unit: string;
  values: { cohortId: string; cohortName: string; value: number }[];
}

export interface RadarChartData {
  cohortId: string;
  cohortName: string;
  axes: { axis: string; value: number }[];
}

export interface CohortComparisonResult {
  cohorts: CohortComparisonData[];
  metrics: ComparisonMetric[];
  radarData: RadarChartData[];
}

export interface BenchmarkComparison {
  metric: string;
  cohortValue: number;
  platformValue: number;
  difference: number;
  unit: string;
}

export interface BenchmarkResult {
  cohort: CohortComparisonData;
  platformAverage: CohortComparisonData;
  comparison: BenchmarkComparison[];
}

export interface CohortBasicInfo {
  id: string;
  name: string;
  course: { name: string };
  startDate: string;
  endDate: string | null;
  _count: { enrollments: number };
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const cohortComparisonApi = {
  getCohorts: async (): Promise<CohortBasicInfo[]> => {
    const response = await fetch('/api/cohorts', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get cohorts');
    return response.json();
  },

  compareCohorts: async (cohortIds: string[]): Promise<CohortComparisonResult> => {
    const ids = cohortIds.join(',');
    const response = await fetch(`/api/analytics/cohorts/compare?ids=${encodeURIComponent(ids)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to compare cohorts');
    return response.json();
  },

  benchmarkCohort: async (cohortId: string): Promise<BenchmarkResult> => {
    const response = await fetch(`/api/analytics/cohorts/${cohortId}/benchmark`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to benchmark cohort');
    return response.json();
  },
};

/**
 * Hook för kohortjämförelse
 */
export function useCohortComparison() {
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([]);
  const [result, setResult] = useState<CohortComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compareCohorts = useCallback(async (cohortIds: string[]) => {
    if (cohortIds.length < 2) {
      setError(new Error('Välj minst två kohorter för jämförelse'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await cohortComparisonApi.compareCohorts(cohortIds);
      setResult(data);
      setSelectedCohortIds(cohortIds);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Kunde inte jämföra kohorter');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearComparison = useCallback(() => {
    setResult(null);
    setSelectedCohortIds([]);
    setError(null);
  }, []);

  const addCohort = useCallback((cohortId: string) => {
    setSelectedCohortIds((prev) =>
      prev.includes(cohortId) ? prev : [...prev, cohortId]
    );
  }, []);

  const removeCohort = useCallback((cohortId: string) => {
    setSelectedCohortIds((prev) => prev.filter((id) => id !== cohortId));
  }, []);

  return {
    selectedCohortIds,
    result,
    isLoading,
    error,
    compareCohorts,
    clearComparison,
    addCohort,
    removeCohort,
    setSelectedCohortIds,
  };
}

/**
 * Hook för kohort-benchmark mot plattformssnitt
 */
export function useCohortBenchmark(cohortId?: string) {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const benchmark = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cohortComparisonApi.benchmarkCohort(id);
      setResult(data);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Kunde inte genomföra benchmark');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Automatisk hämtning om cohortId ges
  useEffect(() => {
    if (cohortId) {
      benchmark(cohortId);
    }
  }, [cohortId, benchmark]);

  return {
    result,
    isLoading,
    error,
    benchmark,
    clear: () => setResult(null),
  };
}

/**
 * Hook för att hämta kohorter för jämförelse
 */
export function useCohortList() {
  const [cohorts, setCohorts] = useState<CohortBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const data = await cohortComparisonApi.getCohorts();
        setCohorts(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Kunde inte hämta kohorter'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCohorts();
  }, []);

  return { cohorts, isLoading, error };
}

/**
 * Hjälpfunktion för att avgöra om en skillnad är positiv/negativ/neutral
 */
export function getBenchmarkStatus(difference: number, metric: string): 'positive' | 'negative' | 'neutral' {
  // För de flesta metrik är högre bättre
  const threshold = 5; // 5% skillnad för att räknas som signifikant

  if (Math.abs(difference) < threshold) {
    return 'neutral';
  }

  return difference > 0 ? 'positive' : 'negative';
}

/**
 * Formatera värde baserat på enhet
 */
export function formatMetricValue(value: number, unit: string): string {
  switch (unit) {
    case '%':
      return `${value}%`;
    case 'poäng':
      return `${value} poäng`;
    case 'XP':
      return `${value.toLocaleString('sv-SE')} XP`;
    default:
      return `${value} ${unit}`;
  }
}

/**
 * Färgkod för benchmark-status
 */
export function getBenchmarkColor(status: 'positive' | 'negative' | 'neutral'): string {
  switch (status) {
    case 'positive':
      return '#00B894'; // Success green
    case 'negative':
      return '#E85A4F'; // Warning coral
    case 'neutral':
      return '#636E72'; // Gray
  }
}

export { cohortComparisonApi };
