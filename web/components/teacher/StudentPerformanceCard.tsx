/**
 * Reusable Student Performance Card Component
 * Displays individual student performance metrics
 */

'use client';

import { Card } from '@/components/ui/card';
import { Award, BookOpen, Gamepad2, TrendingUp, Clock } from 'lucide-react';

export interface StudentPerformanceData {
  student: {
    id: string;
    name: string;
    email?: string;
    grade?: string;
    section?: string;
  };
  modules: {
    completed: number;
    inProgress: number;
    total: number;
  };
  quiz: {
    totalQuizzes: number;
    avgScore: number;
    passRate: number;
  };
  games: {
    totalGames: number;
    totalXP: number;
    avgScore: number;
  };
  progress: {
    preparednessScore: number;
    loginStreak: number;
  };
  lastActivity?: string | Date;
}

interface StudentPerformanceCardProps {
  data: StudentPerformanceData;
  onClick?: () => void;
  showDetails?: boolean;
}

export function StudentPerformanceCard({ data, onClick, showDetails = true }: StudentPerformanceCardProps) {
  const completionRate = data.modules.total > 0 
    ? Math.round((data.modules.completed / data.modules.total) * 100) 
    : 0;

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card 
      className={`p-4 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {data.student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{data.student.name}</h3>
            {data.student.email && (
              <p className="text-sm text-gray-500">{data.student.email}</p>
            )}
            {(data.student.grade || data.student.section) && (
              <p className="text-xs text-gray-400">
                {data.student.grade && `Grade ${data.student.grade}`}
                {data.student.grade && data.student.section && ' - '}
                {data.student.section && `Section ${data.student.section}`}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{data.progress.preparednessScore}</div>
          <div className="text-xs text-gray-500">Preparedness</div>
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Modules */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Modules</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {data.modules.completed}/{data.modules.total}
            </div>
            <div className="text-xs text-gray-500">{completionRate}% complete</div>
            {data.modules.inProgress > 0 && (
              <div className="text-xs text-blue-600 mt-1">{data.modules.inProgress} in progress</div>
            )}
          </div>

          {/* Quizzes */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Quizzes</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {data.quiz.avgScore.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">{data.quiz.totalQuizzes} completed</div>
            <div className="text-xs text-purple-600 mt-1">{data.quiz.passRate.toFixed(0)}% pass rate</div>
          </div>

          {/* Games */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Gamepad2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Games</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {data.games.totalGames}
            </div>
            <div className="text-xs text-gray-500">{data.games.totalXP} XP</div>
            {data.games.avgScore > 0 && (
              <div className="text-xs text-green-600 mt-1">Avg: {data.games.avgScore.toFixed(0)}</div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-700">Activity</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {data.progress.loginStreak} day streak
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last: {formatDate(data.lastActivity)}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-semibold text-blue-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

