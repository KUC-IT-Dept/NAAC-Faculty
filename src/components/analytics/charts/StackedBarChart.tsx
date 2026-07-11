/**
 * StackedBarChart.tsx
 *
 * Stacked bar chart for visualizing composition views (e.g., publication types per department).
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StackedDataPoint {
  name: string;
  [key: string]: string | number; // Dynamic keys for stacks
}

interface StackedBarChartProps {
  data: StackedDataPoint[];
  stacks: string[]; // Keys to stack
  height?: number;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function StackedBarChart({ data, stacks, height = 300 }: StackedBarChartProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#64748b' }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
        />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: '0.85rem', color: '#64748b' }} />
        {stacks.map((stack, i) => (
          <Bar key={stack} dataKey={stack} stackId="a" fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
