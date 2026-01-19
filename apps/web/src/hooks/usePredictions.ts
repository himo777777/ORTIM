import { useState, useCallback, useEffect } from 'react';

// Types
export type PredictionType = 'dropout_risk' | 'exam_score' | 'completion_date';

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

export interface PredictionResult {
  userId: string;
  userName: string;
  predictionType: PredictionType;
  value: number;
  confidence: number;
  factors: RiskFactor[];
  generatedAt: string;
}

export interface AtRiskLearner {
  userId: string;
  userName: string;
  email: string | null;
  cohort: string | null;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  lastActivity: string | null;
  progress: number;
  recommendedActions: string[];
}

export interface PredictionHistory {
  id: string;
  userId: string;
  predictionType: PredictionType;
  value: number;
  confidence: number;
  factors: RiskFactor[];
  generatedAt: string;
}

// API helpers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const predictionApi = {
  getAtRiskLearners: async (minRiskScore = 40): Promise<AtRiskLearner[]> => {
    const response = await fetch(`/api/analytics/predictions/at-risk?minRiskScore=${minRiskScore}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get at-risk learners');
    return response.json();
  },

  calculateDropoutRisk: async (userId: string): Promise<PredictionResult> => {
    const response = await fetch(`/api/analytics/predictions/dropout-risk/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to calculate dropout risk');
    return response.json();
  },

  predictExamScore: async (userId: string): Promise<PredictionResult> => {
    const response = await fetch(`/api/analytics/predictions/exam-score/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to predict exam score');
    return response.json();
  },

  getPredictionHistory: async (userId: string, type?: PredictionType): Promise<PredictionHistory[]> => {
    const url = type
      ? `/api/analytics/predictions/history/${userId}?type=${type}`
      : `/api/analytics/predictions/history/${userId}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to get prediction history');
    return response.json();
  },
};

/**
 * Hook för att hämta riskdeltagare
 */
export function useAtRiskLearners(minRiskScore = 40) {
  const [learners, setLearners] = useState<AtRiskLearner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLearners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await predictionApi.getAtRiskLearners(minRiskScore);
      setLearners(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch at-risk learners'));
    } finally {
      setIsLoading(false);
    }
  }, [minRiskScore]);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  // Statistik
  const stats = {
    total: learners.length,
    critical: learners.filter((l) => l.riskLevel === 'critical').length,
    high: learners.filter((l) => l.riskLevel === 'high').length,
    medium: learners.filter((l) => l.riskLevel === 'medium').length,
    averageRiskScore: learners.length > 0
      ? Math.round(learners.reduce((sum, l) => sum + l.riskScore, 0) / learners.length)
      : 0,
  };

  return {
    learners,
    stats,
    isLoading,
    error,
    refresh: fetchLearners,
  };
}

/**
 * Hook för individuell prediktion
 */
export function useUserPrediction(userId?: string) {
  const [dropoutRisk, setDropoutRisk] = useState<PredictionResult | null>(null);
  const [examScore, setExamScore] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateDropoutRisk = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await predictionApi.calculateDropoutRisk(id);
      setDropoutRisk(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to calculate risk'));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predictExamScore = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await predictionApi.predictExamScore(id);
      setExamScore(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to predict score'));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Automatisk beräkning om userId ges
  useEffect(() => {
    if (userId) {
      calculateDropoutRisk(userId);
      predictExamScore(userId);
    }
  }, [userId, calculateDropoutRisk, predictExamScore]);

  return {
    dropoutRisk,
    examScore,
    isLoading,
    error,
    calculateDropoutRisk,
    predictExamScore,
  };
}

/**
 * Hook för prediktionshistorik
 */
export function usePredictionHistory(userId: string, type?: PredictionType) {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await predictionApi.getPredictionHistory(userId, type);
        setHistory(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch history'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId, type]);

  return { history, isLoading, error };
}

// Hjälpfunktioner

/**
 * Färg baserat på risknivå
 */
export function getRiskLevelColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'critical': return '#DC2626'; // Röd
    case 'high': return '#F97316'; // Orange
    case 'medium': return '#FBBF24'; // Gul
    case 'low': return '#22C55E'; // Grön
  }
}

/**
 * Ikon baserat på risknivå
 */
export function getRiskLevelIcon(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return '✅';
  }
}

/**
 * Svensk text för risknivå
 */
export function getRiskLevelLabel(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'critical': return 'Kritisk';
    case 'high': return 'Hög';
    case 'medium': return 'Medel';
    case 'low': return 'Låg';
  }
}

/**
 * Formatera konfidens som procent
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export { predictionApi };
