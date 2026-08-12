/**
 * Alert Status Pie Chart Component
 * Shows active vs resolved alerts distribution
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  _id: string;
  status: 'active' | 'resolved' | 'false_alarm';
  severity?: string;
}

interface AlertStatusChartProps {
  alerts: Alert[];
}

const COLORS = {
  active: '#ef4444',
  resolved: '#10b981',
  false_alarm: '#f59e0b'
};

export function AlertStatusChart({ alerts }: AlertStatusChartProps) {
  const processData = () => {
    const statusCounts = {
      active: 0,
      resolved: 0,
      false_alarm: 0
    };

    alerts.forEach((alert) => {
      if (alert.status === 'active') statusCounts.active++;
      else if (alert.status === 'resolved') statusCounts.resolved++;
      else if (alert.status === 'false_alarm') statusCounts.false_alarm++;
    });

    return [
      { name: 'Active', value: statusCounts.active, color: COLORS.active },
      { name: 'Resolved', value: statusCounts.resolved, color: COLORS.resolved },
      { name: 'False Alarm', value: statusCounts.false_alarm, color: COLORS.false_alarm }
    ].filter(item => item.value > 0);
  };

  const data = processData();

  if (data.length === 0) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Alert Status</h3>
            <p className="text-sm text-gray-600">Distribution overview</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          No alert data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Alert Status</h3>
          <p className="text-sm text-gray-600">Distribution overview</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

