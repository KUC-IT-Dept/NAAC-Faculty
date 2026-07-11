/**
 * RadarProfileChart.tsx
 *
 * Radar chart visualizing a multi-dimensional profile (e.g., faculty profile)
 * across several axes.
 */

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface RadarDataPoint {
  axis: string;
  value: number;
  fullMark: number;
}

interface RadarProfileChartProps {
  data: RadarDataPoint[];
  height?: number;
}

export default function RadarProfileChart({ data, height = 300 }: RadarProfileChartProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
        />
        <Radar
          name="Profile"
          dataKey="value"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
