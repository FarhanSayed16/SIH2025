/**
 * Drill creation activity chart — last 30 days by current status (WB3).
 */

'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Drill, isDrillInProgress } from '@/lib/api/drills';

interface DrillPerformanceChartProps {
  drills: Drill[];
}

export function DrillPerformanceChart({ drills }: DrillPerformanceChartProps) {
  const processData = () => {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj: date,
        completed: 0,
        in_progress: 0,
        scheduled: 0,
        total: 0,
      };
    });

    drills.forEach((drill) => {
      if (!drill.createdAt) return;
      const drillDate = new Date(drill.createdAt);
      if (Number.isNaN(drillDate.getTime())) return;
      const dayIndex = last30Days.findIndex(
        (day) =>
          day.dateObj.getDate() === drillDate.getDate() &&
          day.dateObj.getMonth() === drillDate.getMonth() &&
          day.dateObj.getFullYear() === drillDate.getFullYear()
      );

      if (dayIndex !== -1) {
        last30Days[dayIndex].total++;
        if (drill.status === 'completed') last30Days[dayIndex].completed++;
        if (isDrillInProgress(drill.status)) last30Days[dayIndex].in_progress++;
        if (drill.status === 'scheduled') last30Days[dayIndex].scheduled++;
      }
    });

    return last30Days;
  };

  const chartData = processData();
  const hasAny = chartData.some((d) => d.total > 0);

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Drills created in the last 30 days
            </h3>
            <p className="text-sm text-gray-600">
              Grouped by current status (counts, not evacuation performance)
            </p>
          </div>
        </div>
      </div>
      {!hasAny ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No drills created in this 30-day window
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip />
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
                dataKey="in_progress"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorActive)"
                name="In progress"
              />
              <Area
                type="monotone"
                dataKey="scheduled"
                stroke="#f59e0b"
                fillOpacity={0.3}
                fill="#f59e0b"
                name="Scheduled"
              />
            </AreaChart>
          </ResponsiveContainer>
          <table className="sr-only">
            <caption>Drills created per day in the last 30 days by current status</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Completed</th>
                <th>In progress</th>
                <th>Scheduled</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {chartData
                .filter((d) => d.total > 0)
                .map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.completed}</td>
                    <td>{d.in_progress}</td>
                    <td>{d.scheduled}</td>
                    <td>{d.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}
