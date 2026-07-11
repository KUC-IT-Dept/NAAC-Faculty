/**
 * CategoryDonutChart.tsx
 *
 * Donut chart breaking down a total by category (e.g. journal categories,
 * publication types, project categories).
 * Pure presentational — receives already-fetched data as props.
 *
 * Usage:
 *   <CategoryDonutChart
 *     data={[{ name: 'Scopus', value: 34 }, { name: 'WoS', value: 18 }]}
 *     title="By Journal Category"
 *   />
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryDataPoint {
  name:  string;
  value: number;
}

interface CategoryDonutChartProps {
  data:    CategoryDataPoint[];
  title?:  string;
  height?: number;
}

const DONUT_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706',
  '#7c3aed', '#0891b2', '#c026d3', '#65a30d',
];

export default function CategoryDonutChart({ data, height = 280 }: CategoryDonutChartProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="70%"
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(v: number) => [v, 'Count']}
        />
        <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
