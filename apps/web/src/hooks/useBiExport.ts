import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export type ExportDataType =
  | 'users'
  | 'progress'
  | 'quiz_results'
  | 'sessions'
  | 'events'
  | 'cohorts'
  | 'certificates'
  | 'predictions';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportFilter {
  startDate?: string;
  endDate?: string;
  cohortId?: string;
  userId?: string;
  courseId?: string;
}

export interface ExportConfig {
  dataType: ExportDataType;
  format: ExportFormat;
  filters?: ExportFilter;
  columns?: string[];
  includeHeaders?: boolean;
}

export interface DataTypeInfo {
  id: ExportDataType;
  label: string;
  description: string;
}

export interface FormatInfo {
  id: ExportFormat;
  label: string;
  description: string;
}

export interface ScheduledExport {
  id: string;
  name: string;
  config: ExportConfig;
  schedule: string;
  recipients: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  isActive: boolean;
}

export interface ExportStats {
  totalExports: number;
  scheduledExports: number;
  lastExportAt: string | null;
  popularDataTypes: { dataType: string; count: number }[];
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const exportApi = {
  getDataTypes: async (): Promise<{
    dataTypes: DataTypeInfo[];
    formats: FormatInfo[];
  }> => {
    const response = await fetch('/api/analytics/export/data-types', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch data types');
    return response.json();
  },

  getColumns: async (dataType: ExportDataType): Promise<string[]> => {
    const response = await fetch(`/api/analytics/export/columns/${dataType}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch columns');
    const data = await response.json();
    return data.columns;
  },

  generateExport: async (config: ExportConfig): Promise<Blob> => {
    const response = await fetch('/api/analytics/export/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to generate export');
    return response.blob();
  },

  getScheduledExports: async (): Promise<ScheduledExport[]> => {
    const response = await fetch('/api/analytics/export/scheduled', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch scheduled exports');
    return response.json();
  },

  createScheduledExport: async (data: {
    name: string;
    config: ExportConfig;
    schedule: string;
    recipients: string[];
  }): Promise<{ id: string }> => {
    const response = await fetch('/api/analytics/export/scheduled', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create scheduled export');
    return response.json();
  },

  deleteScheduledExport: async (id: string): Promise<void> => {
    const response = await fetch(`/api/analytics/export/scheduled/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete scheduled export');
  },

  getExportStats: async (): Promise<ExportStats> => {
    const response = await fetch('/api/analytics/export/stats', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch export stats');
    return response.json();
  },
};

/**
 * Hook for data types and formats
 */
export function useExportOptions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['export-options'],
    queryFn: exportApi.getDataTypes,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    dataTypes: data?.dataTypes || [],
    formats: data?.formats || [],
    isLoading,
    error,
  };
}

/**
 * Hook for getting available columns for a data type
 */
export function useExportColumns(dataType: ExportDataType | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['export-columns', dataType],
    queryFn: () => (dataType ? exportApi.getColumns(dataType) : Promise.resolve([])),
    enabled: !!dataType,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    columns: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook for generating and downloading exports
 */
export function useGenerateExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateAndDownload = useCallback(async (config: ExportConfig) => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await exportApi.generateExport(config);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename
      const extension = config.format === 'xlsx' ? 'tsv' : config.format;
      a.download = `${config.dataType}_export_${new Date().toISOString().split('T')[0]}.${extension}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Export failed');
      setError(error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateAndDownload,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for scheduled exports
 */
export function useScheduledExports() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-exports'],
    queryFn: exportApi.getScheduledExports,
  });

  const createMutation = useMutation({
    mutationFn: exportApi.createScheduledExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: exportApi.deleteScheduledExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });

  return {
    scheduledExports: data || [],
    isLoading,
    error,
    refetch,
    createScheduledExport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteScheduledExport: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for export statistics
 */
export function useExportStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['export-stats'],
    queryFn: exportApi.getExportStats,
  });

  return {
    stats: data,
    isLoading,
    error,
  };
}

/**
 * Combined hook for full BI export functionality
 */
export function useBiExport() {
  const options = useExportOptions();
  const generator = useGenerateExport();
  const scheduled = useScheduledExports();
  const stats = useExportStats();

  return {
    // Data types and formats
    dataTypes: options.dataTypes,
    formats: options.formats,
    isLoadingOptions: options.isLoading,

    // Generate exports
    generateAndDownload: generator.generateAndDownload,
    isGenerating: generator.isGenerating,
    generateError: generator.error,
    clearGenerateError: generator.clearError,

    // Scheduled exports
    scheduledExports: scheduled.scheduledExports,
    createScheduledExport: scheduled.createScheduledExport,
    deleteScheduledExport: scheduled.deleteScheduledExport,
    isLoadingScheduled: scheduled.isLoading,
    isCreating: scheduled.isCreating,
    isDeleting: scheduled.isDeleting,

    // Stats
    stats: stats.stats,
    isLoadingStats: stats.isLoading,
  };
}

// Schedule presets for UI
export const SCHEDULE_PRESETS = [
  { value: '0 6 * * *', label: 'Dagligen kl 06:00' },
  { value: '0 6 * * 1', label: 'Varje måndag kl 06:00' },
  { value: '0 6 1 * *', label: 'Första dagen i månaden' },
  { value: '0 6 1 1,4,7,10 *', label: 'Varje kvartal' },
];

// Helper to format schedule for display
export function formatSchedule(cron: string): string {
  const preset = SCHEDULE_PRESETS.find(p => p.value === cron);
  if (preset) return preset.label;

  // Basic parsing for common patterns
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Dagligen kl ${hour}:${minute.padStart(2, '0')}`;
  }

  return cron;
}

export { exportApi };
