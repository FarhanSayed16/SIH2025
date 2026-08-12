/**
 * Drill Performance Chart Component
 * Shows drill performance over time using Recharts
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Drill } from '@/lib/api/drills';

interface DrillPerformanceChartProps {
  drills: Drill[];
}

export function DrillPerformanceChart({ drills }: DrillPerformanceChartProps) {
  // Process drills data for chart
  const processData = () => {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj: date,
        completed: 0,
        active: 0,
        scheduled: 0,
        total: 0
      };
    });

    drills.forEach((drill) => {
      const drillDate = new Date(drill.createdAt);
      const dayIndex = last30Days.findIndex(
        (day) =>
          day.dateObj.getDate() === drillDate.getDate() &&
          day.dateObj.getMonth() === drillDate.getMonth() &&
          day.dateObj.getFullYear() === drillDate.getFullYear()
      );

      if (dayIndex !== -1) {
        last30Days[dayIndex].total++;
        if (drill.status === 'completed') last30Days[dayIndex].completed++;
        if (drill.status === 'active') last30Days[dayIndex].active++;
        if (drill.status === 'scheduled') last30Days[dayIndex].scheduled++;
      }
    });

    return last30Days;
  };

  const chartData = processData();

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Drill Performance</h3>
            <p className="text-sm text-gray-600">Last 30 days activity</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="completed" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorCompleted)"
            name="Completed"
          />
          <Area 
            type="monotone" 
            dataKey="active" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorActive)"
            name="Active"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

