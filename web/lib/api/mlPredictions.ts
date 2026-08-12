/**
 * Phase 4.8: ML Predictions API client
 */

import { apiClient } from './client';

export interface StudentRiskPrediction {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    responseTime: number;
    moduleCompletion: number;
    quizPerformance: number;
    participation: number;
    age: number;
    location: number;
  };
  historicalData: {
    avgEvacuationTime: number;
    totalDrills: number;
    moduleCompletionRate: number;
    quizAccuracy: number;
    participationRate: number;
  };
}

export interface DrillPerformancePrediction {
  predictedResponseTime: number; // seconds
  predictedParticipationRate: number; // percentage
  confidence: number; // 0-1
  factors: {
    dayOfWeek: number;
    hourOfDay: number;
    dayFactor: number;
    timeFactor: number;
  };
  historicalBaseline: {
    avgResponseTime: number;
    avgParticipationRate: number;
    totalHistoricalDrills: number;
  };
}

export interface OptimalTiming {
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  predictedParticipationRate: number;
  predictedResponseTime: number;
  confidence: number;
}

export interface OptimalDrillTiming {
  optimalTimings: OptimalTiming[];
  recommendation: OptimalTiming | null;
}

export interface DrillAnomaly {
  drillId: string;
  type: string;
  date: Date;
  anomalyType: 'participation' | 'response_time' | 'both';
  details: {
    participationRate: number;
    avgParticipationRate: number;
    participationZScore: number;
    responseTime: number;
    avgResponseTime: number;
    responseTimeZScore: number;
  };
  severity: 'low' | 'medium' | 'high';
}

export interface DrillAnomaliesResult {
  anomalies: DrillAnomaly[];
  summary: {
    totalDrills: number;
    anomaliesDetected: number;
    avgParticipationRate: number;
    avgResponseTime: number;
  };
}

export interface StudentProgressForecast {
  forecast: {
    next30Days: {
      predictedModuleCompletions: number;
      predictedQuizCompletions: number;
      predictedEngagementDays: number;
    };
    trends: {
      moduleCompletion: 'increasing' | 'stable' | 'decreasing';
      quizPerformance: 'improving' | 'stable' | 'declining';
      engagement: 'high' | 'medium' | 'low';
    };
  };
  currentMetrics: {
    recentEngagementRate: number;
    totalRecentEvents: number;
    moduleCompletions: number;
    quizCompletions: number;
  };
  confidence: number;
}

export interface BatchStudentRiskPrediction {
  userId: string;
  name: string;
  grade?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors?: {
    responseTime: number;
    moduleCompletion: number;
    quizPerformance: number;
    participation: number;
    age: number;
    location: number;
  };
  error?: string;
}

export interface BatchPredictionsResult {
  predictions: BatchStudentRiskPrediction[];
  summary: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export const mlPredictionsApi = {
  /**
   * Get student risk prediction
   */
  async getStudentRisk(userId: string): Promise<StudentRiskPrediction> {
    const response = await apiClient.get(`/ml-predictions/student-risk/${userId}`);
    return response.data.data;
  },

  /**
   * Predict drill performance
   */
  async predictDrillPerformance(params?: {
    drillType?: string;
    institutionId?: string;
  }): Promise<DrillPerformancePrediction | null> {
    try {
      const response = await apiClient.get('/ml-predictions/drill-performance', { params });
      if (response?.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('predictDrillPerformance error:', error);
      return null;
    }
  },

  /**
   * Get optimal drill timing
   */
  async getOptimalDrillTiming(institutionId?: string): Promise<OptimalDrillTiming | null> {
    try {
      const response = await apiClient.get('/ml-predictions/optimal-timing', {
        params: institutionId ? { institutionId } : undefined,
      });
      if (response?.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('getOptimalDrillTiming error:', error);
      return null;
    }
  },

  /**
   * Detect drill anomalies
   */
  async detectAnomalies(params?: {
    institutionId?: string;
    drillId?: string;
  }): Promise<DrillAnomaliesResult | null> {
    try {
      const response = await apiClient.get('/ml-predictions/anomalies', { params });
      if (response?.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('detectAnomalies error:', error);
      return null;
    }
  },

  /**
   * Forecast student progress
   */
  async forecastStudentProgress(userId: string): Promise<StudentProgressForecast> {
    const response = await apiClient.get(`/ml-predictions/student-progress/${userId}`);
    return response.data.data;
  },

  /**
   * Batch predict student risks
   */
  async batchPredictStudentRisks(params?: {
    institutionId?: string;
    userIds?: string[];
  }): Promise<BatchPredictionsResult | null> {
    try {
      const response = await apiClient.post('/ml-predictions/batch-predict', params || {});
      if (response?.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('batchPredictStudentRisks error:', error);
      return null;
    }
  },
};

