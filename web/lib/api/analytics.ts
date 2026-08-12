/**
 * Analytics API client
 */

import { apiClient } from './client';

export interface DrillMetrics {
  totalParticipants: number;
  avgEvacuationTime: number;
  minEvacuationTime: number;
  maxEvacuationTime: number;
  avgScore: number;
  participationOverTime: Array<{
    date: string;
    participants: number;
    avgEvacuationTime: number;
  }>;
}

export interface StudentProgress {
  summary: {
    totalStudents: number;
    avgModulesCompleted: number;
    avgPreparednessScore: number;
    avgLoginStreak: number;
  };
  quiz: {
    avgQuizzesPerStudent: number;
    avgQuizScore: number;
    avgPassRate: number;
  };
  games: Array<{
    gameType: string;
    totalGames: number;
    avgScore: number;
    totalXP: number;
  }>;
  progressOverTime: Array<{
    date: string;
    avgScore: number;
    studentCount: number;
  }>;
}

export interface InstitutionAnalytics {
  institution: {
    id: string;
    name: string;
    totalUsers: number;
    totalClasses: number;
    classes: Array<{
      id: string;
      name: string;
      teacherName: string;
      studentCount: number;
    }>;
  };
  modules: {
    totalStudents: number;
    avgModulesCompleted: number;
    completionRate: number;
  };
  activities: {
    totalQuizzes: number;
    totalGames: number;
    totalDrillLogs: number;
    totalDrills: number;
  };
}

export interface ModuleCompletion {
  moduleId: string;
  moduleTitle: string;
  category: string;
  completedCount: number;
  totalStudents: number;
  completionRate: number;
}

export interface GamePerformance {
  byGameType: Array<{
    gameType: string;
    totalGames: number;
    uniquePlayers: number;
    avgScore: number;
    totalXP: number;
  }>;
  overTime: Array<{
    gameType: string;
    date: string;
    avgScore: number;
    totalGames: number;
  }>;
}

export interface QuizAccuracy {
  overTime: Array<{
    date: string;
    totalQuizzes: number;
    avgScore: number;
    passRate: number;
    accuracyRate: number;
  }>;
  byModule: Array<{
    moduleId: string;
    moduleTitle: string;
    totalQuizzes: number;
    avgScore: number;
    passRate: number;
  }>;
}

export const analyticsApi = {
  /**
   * Get drill performance metrics
   */
  getDrillMetrics: async (institutionId?: string, drillId?: string, startDate?: string, endDate?: string): Promise<DrillMetrics> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (drillId) params.append('drillId', drillId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<DrillMetrics>(`/analytics/drills?${params.toString()}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch drill metrics');
  },

  /**
   * Get student progress metrics
   */
  getStudentProgress: async (institutionId?: string, classId?: string, userId?: string, startDate?: string, endDate?: string): Promise<StudentProgress> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (classId) params.append('classId', classId);
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<StudentProgress>(`/analytics/students/progress?${params.toString()}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch student progress');
  },

  /**
   * Get institution analytics
   */
  getInstitutionAnalytics: async (institutionId?: string, startDate?: string, endDate?: string): Promise<InstitutionAnalytics> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<InstitutionAnalytics>(`/analytics/institution?${params.toString()}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch institution analytics');
  },

  /**
   * Get module completion rates
   */
  getModuleCompletion: async (institutionId?: string, startDate?: string, endDate?: string): Promise<ModuleCompletion[]> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<ModuleCompletion[]>(`/analytics/modules/completion?${params.toString()}`);
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  },

  /**
   * Get game performance analytics
   */
  getGamePerformance: async (institutionId?: string, gameType?: string, startDate?: string, endDate?: string): Promise<GamePerformance> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (gameType) params.append('gameType', gameType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<GamePerformance>(`/analytics/games?${params.toString()}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch game performance');
  },

  /**
   * Get quiz accuracy trends
   */
  getQuizAccuracy: async (institutionId?: string, moduleId?: string, startDate?: string, endDate?: string): Promise<QuizAccuracy> => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (moduleId) params.append('moduleId', moduleId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<QuizAccuracy>(`/analytics/quizzes/accuracy?${params.toString()}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch quiz accuracy');
  },

  /**
   * Generate report
   */
  generateReport: async (format: 'pdf' | 'excel' | 'csv', reportType: string, institutionId?: string, startDate?: string, endDate?: string, filters?: any) => {
    const response = await apiClient.post(`/analytics/reports/${format}`, {
      reportType,
      institutionId,
      startDate,
      endDate,
      filters
    });
    
    // Handle response structure - backend returns { success: true, data: { filename, fileUrl, ... } }
    const data = (response as any)?.data || response;
    return data;
  },

  /**
   * Phase 3.5.6: Content & Game Analytics
   */
  
  /**
   * Get game attempt analytics
   */
  getGameAttempts: async (gameType?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (gameType) params.append('gameType', gameType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/analytics/content/game-attempts?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get module completion rate analytics
   */
  getModuleCompletionRate: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/analytics/content/module-completion?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get quiz accuracy analytics
   */
  getQuizAccuracyDetailed: async (moduleId?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/analytics/content/quiz-accuracy?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get drill participation analytics
   */
  getDrillParticipation: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/analytics/content/drill-participation?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get hazard recognition analytics
   */
  getHazardAccuracy: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/analytics/content/hazard-accuracy?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get streak analytics
   */
  getStreaks: async (streakType?: string) => {
    const params = new URLSearchParams();
    if (streakType) params.append('streakType', streakType);

    const response = await apiClient.get(`/analytics/content/streaks?${params.toString()}`);
    return response.data.data;
  }
};

