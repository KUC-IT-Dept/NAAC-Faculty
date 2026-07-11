/**
 * TrendLineChart.tsx
 *
 * Multi-series line chart for period-over-period or entity comparison.
 * Pure presentational — receives already-fetched data as props.
 *
 * Usage:
 *   <TrendLineChart
 *     periods={['2021', '2022', '2023', '2024']}
 *     series={[
 *       { label: 'CS',   data: [10, 14, 18, 22] },
 *       { label: 'EEE',  data: [8, 11, 9, 15]  },
 *     ]}
 *   />
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendSeries {
  label: string;
  data:  number[];
}

interface TrendLineChartProps {
  periods: string[];
  series:  TrendSeries[];
  height?: number;
}

const LINE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

export default function TrendLineChart({ periods, series, height = 300 }: TrendLineChartProps) {
  if (!periods || periods.length === 0 || !series || series.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No trend data available.</p>;
  }

  // Recharts requires a flat array of objects.
  const chartData = periods.map((p, i) => {
    const row: Record<string, string | number> = { period: p };
    series.forEach(s => { row[s.label] = s.data[i] ?? 0; });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
        <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
        {series.map((s, i) => (
          <Line
            key={s.label}
            type="monotone"
            dataKey={s.label}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
