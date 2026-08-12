/**
 * Reusable Performance Metrics Card Component
 * Displays key performance indicators
 */

'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'red';
}

interface PerformanceMetricsCardProps {
  metrics: MetricData[];
  title?: string;
  columns?: 2 | 3 | 4;
}

export function PerformanceMetricsCard({ 
  metrics, 
  title,
  columns = 4 
}: PerformanceMetricsCardProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined || change === 0) return <Minus className="w-4 h-4" />;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = (change?: number) => {
    if (change === undefined || change === 0) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              metric.color ? colorClasses[metric.color] : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-80">{metric.label}</span>
              {metric.icon && (
                <div className="opacity-70">{metric.icon}</div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            {metric.change !== undefined && (
              <div className={`flex items-center space-x-1 text-xs ${getTrendColor(metric.change)}`}>
                {getTrendIcon(metric.change)}
                <span>
                  {Math.abs(metric.change)}% {metric.changeLabel || 'change'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

