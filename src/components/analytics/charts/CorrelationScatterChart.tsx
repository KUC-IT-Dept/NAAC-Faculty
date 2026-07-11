/**
 * CorrelationScatterChart.tsx
 *
 * Scatter plot visualizing relationships between two numeric variables.
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ScatterPoint {
  x: number;
  y: number;
  name: string;
}

interface CorrelationScatterChartProps {
  data: ScatterPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  height?: number;
}

export default function CorrelationScatterChart({
  data,
  xAxisLabel,
  yAxisLabel,
  height = 300
}: CorrelationScatterChartProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          dataKey="x"
          name={xAxisLabel}
          tick={{ fontSize: 12, fill: '#64748b' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yAxisLabel}
          tick={{ fontSize: 12, fill: '#64748b' }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(val: number, name: string) => [val, name]}
          labelFormatter={() => ''}
        />
        <Scatter name="Entities" data={data} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
