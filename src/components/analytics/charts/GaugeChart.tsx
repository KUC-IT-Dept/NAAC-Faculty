/**
 * GaugeChart.tsx
 *
 * Single KPI gauge showing achievement percentage against a target using a RadialBarChart.
 */

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface GaugeChartProps {
  value: number; // 0-100 percentage
  label?: string;
  height?: number;
}

export default function GaugeChart({ value, label = 'Achievement', height = 200 }: GaugeChartProps) {
  const cappedValue = Math.min(100, Math.max(0, value));
  const data = [{ name: label, value: cappedValue, fill: '#3b82f6' }];

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="100%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={15}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#e2e8f0' }}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '0',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          {cappedValue.toFixed(0)}%
        </span>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</span>
      </div>
    </div>
  );
}
