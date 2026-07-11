/**
 * DepartmentBarChart.tsx
 *
 * Bar chart comparing a numeric metric across departments.
 * Pure presentational — receives already-fetched data as props.
 * No API calls, no routing knowledge.
 *
 * Usage:
 *   <DepartmentBarChart
 *     data={[{ department: 'CS', value: 42 }, ...]}
 *     valueLabel="Publications"
 *   />
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DeptDataPoint {
  department: string;
  value: number;
}

interface DepartmentBarChartProps {
  data:        DeptDataPoint[];
  valueLabel?: string;
  color?:      string;
  height?:     number;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function DepartmentBarChart({
  data,
  valueLabel = 'Value',
  color,
  height = 300,
}: DepartmentBarChartProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="department"
          tick={{ fontSize: 12, fill: '#64748b' }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(v: number) => [v, valueLabel]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color || COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
