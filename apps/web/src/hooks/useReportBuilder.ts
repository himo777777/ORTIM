import { useState, useCallback } from 'react';

// Types
export type ReportType = 'cohort' | 'question' | 'progress' | 'learner' | 'custom';

export interface ReportFilter {
  cohortId?: string;
  courseId?: string;
  dateRange?: { start: string; end: string };
  userIds?: string[];
  minProgress?: number;
  maxProgress?: number;
  bloomLevels?: string[];
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'percentage';
  visible: boolean;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  title: string;
  data: { label: string; value: number }[];
}

export interface ReportResult {
  title: string;
  generatedAt: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: Record<string, unknown>;
  charts?: ChartData[];
}

export interface SavedReport {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  configuration: Record<string, unknown>;
  schedule: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { firstName: string; lastName: string };
}

export interface GenerateReportParams {
  reportType: ReportType;
  title?: string;
  filters?: ReportFilter;
  includeCharts?: boolean;
}

export interface SaveReportParams {
  name: string;
  description?: string;
  reportType: ReportType;
  configuration: Record<string, unknown>;
  schedule?: string;
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const reportApi = {
  generateReport: async (params: GenerateReportParams): Promise<ReportResult> => {
    const response = await fetch('/api/analytics/reports/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  },

  getSavedReports: async (): Promise<SavedReport[]> => {
    const response = await fetch('/api/analytics/reports/saved', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get saved reports');
    return response.json();
  },

  saveReport: async (params: SaveReportParams): Promise<SavedReport> => {
    const response = await fetch('/api/analytics/reports/saved', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to save report');
    return response.json();
  },

  getSavedReport: async (id: string): Promise<SavedReport> => {
    const response = await fetch(`/api/analytics/reports/saved/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get report');
    return response.json();
  },

  runSavedReport: async (id: string): Promise<ReportResult> => {
    const response = await fetch(`/api/analytics/reports/saved/${id}/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to run report');
    return response.json();
  },

  updateReport: async (id: string, params: Partial<SaveReportParams>): Promise<SavedReport> => {
    const response = await fetch(`/api/analytics/reports/saved/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to update report');
    return response.json();
  },

  deleteReport: async (id: string): Promise<void> => {
    const response = await fetch(`/api/analytics/reports/saved/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete report');
  },

  exportToCSV: async (params: GenerateReportParams): Promise<Blob> => {
    const response = await fetch('/api/analytics/reports/export/csv', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to export report');
    return response.blob();
  },

  exportToJSON: async (params: GenerateReportParams): Promise<Blob> => {
    const response = await fetch('/api/analytics/reports/export/json', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to export report');
    return response.blob();
  },
};

/**
 * Hook för rapportgenerering
 */
export function useReportBuilder() {
  const [result, setResult] = useState<ReportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = useCallback(async (params: GenerateReportParams) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await reportApi.generateReport(params);
      setResult(data);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to generate report');
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const exportCSV = useCallback(async (params: GenerateReportParams) => {
    try {
      const blob = await reportApi.exportToCSV(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${params.reportType}-rapport-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to export CSV');
    }
  }, []);

  const exportJSON = useCallback(async (params: GenerateReportParams) => {
    try {
      const blob = await reportApi.exportToJSON(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${params.reportType}-rapport-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to export JSON');
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isGenerating,
    error,
    generateReport,
    exportCSV,
    exportJSON,
    clearResult,
  };
}

/**
 * Hook för sparade rapporter
 */
export function useSavedReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportApi.getSavedReports();
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch reports'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveReport = useCallback(async (params: SaveReportParams) => {
    try {
      const saved = await reportApi.saveReport(params);
      setReports((prev) => [saved, ...prev]);
      return saved;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to save report');
    }
  }, []);

  const runReport = useCallback(async (id: string) => {
    return reportApi.runSavedReport(id);
  }, []);

  const updateReport = useCallback(async (id: string, params: Partial<SaveReportParams>) => {
    const updated = await reportApi.updateReport(id, params);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? updated : r))
    );
    return updated;
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    await reportApi.deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    saveReport,
    runReport,
    updateReport,
    deleteReport,
  };
}

/**
 * Preset-rapporter för snabbval
 */
export const REPORT_PRESETS: {
  id: string;
  name: string;
  description: string;
  params: GenerateReportParams;
}[] = [
  {
    id: 'cohort-overview',
    name: 'Kohortöversikt',
    description: 'Jämför alla aktiva kohorter med slutförandegrad och OSCE-resultat',
    params: {
      reportType: 'cohort',
      title: 'Kohortöversikt',
      includeCharts: true,
    },
  },
  {
    id: 'question-difficulty',
    name: 'Frågesvårighet',
    description: 'Analysera svårighetsgrad för alla quiz-frågor',
    params: {
      reportType: 'question',
      title: 'Frågesvårighetsanalys',
      includeCharts: true,
    },
  },
  {
    id: 'learner-progress',
    name: 'Deltagarframsteg',
    description: 'Översikt över alla deltagares framsteg och risknivå',
    params: {
      reportType: 'progress',
      title: 'Deltagarframsteg',
      includeCharts: true,
    },
  },
  {
    id: 'at-risk-learners',
    name: 'Riskdeltagare',
    description: 'Deltagare med låg aktivitet eller framsteg',
    params: {
      reportType: 'progress',
      title: 'Riskdeltagare',
      filters: {
        maxProgress: 50,
      },
      includeCharts: true,
    },
  },
];

export { reportApi };
