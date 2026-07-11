/**
 * CriterionPieChart.tsx
 *
 * Pie chart distributing metric values across NAAC criteria.
 * Pure presentational — receives already-fetched metrics as props.
 *
 * Usage:
 *   <CriterionPieChart metrics={dashboard} />
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MetricResult } from '../../../lib/analyticsApi';

interface CriterionPieChartProps {
  metrics: MetricResult[];
  height?: number;
}

const PIE_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706',
  '#7c3aed', '#0891b2', '#c026d3', '#65a30d',
];

export default function CriterionPieChart({ metrics, height = 280 }: CriterionPieChartProps) {
  if (!metrics || metrics.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No metric data available.</p>;
  }

  const data = metrics
    .filter(m => m.value > 0)
    .map(m => ({ name: m.metricName, value: m.value }));

  if (data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>All metric values are zero.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="65%"
          dataKey="value"
          paddingAngle={1}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(v: number) => [v, 'Value']}
        />
        <Legend wrapperStyle={{ fontSize: '0.78rem' }} layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
