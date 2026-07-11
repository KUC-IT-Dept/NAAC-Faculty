/**
 * FundingAreaChart.tsx
 *
 * Stacked area chart showing funding over time per department.
 * Pure presentational — receives already-fetched data as props.
 *
 * Usage:
 *   <FundingAreaChart
 *     periods={['2021', '2022', '2023']}
 *     series={[{ label: 'CS', data: [500000, 750000, 1200000] }]}
 *   />
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FundingSeries {
  label: string;
  data:  number[];
}

interface FundingAreaChartProps {
  periods: string[];
  series:  FundingSeries[];
  height?: number;
}

const AREA_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

const formatLakh = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`;

export default function FundingAreaChart({ periods, series, height = 300 }: FundingAreaChartProps) {
  if (!periods || periods.length === 0 || !series || series.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No funding data available.</p>;
  }

  const chartData = periods.map((p, i) => {
    const row: Record<string, string | number> = { period: p };
    series.forEach(s => { row[s.label] = s.data[i] ?? 0; });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AREA_COLORS[i % AREA_COLORS.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={AREA_COLORS[i % AREA_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tickFormatter={formatLakh} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(v: number) => [formatLakh(v), 'Funding']}
        />
        <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
        {series.map((s, i) => (
          <Area
            key={s.label}
            type="monotone"
            dataKey={s.label}
            stroke={AREA_COLORS[i % AREA_COLORS.length]}
            fill={`url(#grad-${i})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
