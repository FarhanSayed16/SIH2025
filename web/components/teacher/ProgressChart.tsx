/**
 * Reusable Progress Chart Component
 * Displays various types of progress charts
 */

'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';

export interface ChartDataPoint {
  date?: string;
  name?: string;
  value?: number;
  [key: string]: any;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area';
  title?: string;
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  multipleSeries?: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

export function ProgressChart({
  data,
  type = 'line',
  title,
  dataKey,
  xAxisKey = 'date',
  color = '#3b82f6',
  height = 300,
  showGrid = true,
  showLegend = false,
  multipleSeries = []
}: ProgressChartProps) {
  const chartContent = () => {
    if (type === 'bar') {
      return (
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (xAxisKey === 'date' && value) {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              const label = String(value ?? '');
              return label.length > 14 ? `${label.slice(0, 12)}…` : label;
            }}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}
            labelFormatter={(value) => {
              if (xAxisKey === 'date' && value) {
                return new Date(value).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
              }
              return value;
            }}
          />
          {showLegend && <Legend />}
          {multipleSeries.length > 0 ? (
            multipleSeries.map((series) => (
              <Bar 
                key={series.key} 
                dataKey={series.key} 
                name={series.name}
                fill={series.color}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      );
    }

    if (type === 'area') {
      return (
        <AreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (xAxisKey === 'date' && value) {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              const label = String(value ?? '');
              return label.length > 14 ? `${label.slice(0, 12)}…` : label;
            }}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}
            labelFormatter={(value) => {
              if (xAxisKey === 'date' && value) {
                return new Date(value).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
              }
              return value;
            }}
          />
          {showLegend && <Legend />}
          {multipleSeries.length > 0 ? (
            multipleSeries.map((series, index) => (
              <Area 
                key={series.key} 
                type="monotone"
                dataKey={series.key} 
                name={series.name}
                stroke={series.color}
                fill={series.color}
                fillOpacity={0.6}
                stackId={index}
              />
            ))
          ) : (
            <Area 
              type="monotone"
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.6}
            />
          )}
        </AreaChart>
      );
    }

    // Default to line chart
    return (
      <LineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (xAxisKey === 'date' && value) {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            const label = String(value ?? '');
            return label.length > 14 ? `${label.slice(0, 12)}…` : label;
          }}
        />
        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px'
          }}
          labelFormatter={(value) => {
            if (xAxisKey === 'date' && value) {
              return new Date(value).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              });
            }
            return value;
          }}
        />
        {showLegend && <Legend />}
        {multipleSeries.length > 0 ? (
          multipleSeries.map((series) => (
            <Line 
              key={series.key} 
              type="monotone"
              dataKey={series.key} 
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))
        ) : (
          <Line 
            type="monotone"
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    );
  };

  return (
    <Card className="p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {chartContent()}
      </ResponsiveContainer>
    </Card>
  );
}

