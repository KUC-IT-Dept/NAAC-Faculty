/**
 * HierarchyTreemap.tsx
 *
 * Treemap visualizing hierarchical composition (e.g. relative sizes of departments).
 */

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface TreemapNode {
  name: string;
  size: number;
}

interface HierarchyTreemapProps {
  data: TreemapNode[];
  height?: number;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export default function HierarchyTreemap({ data, height = 300 }: HierarchyTreemapProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  // Assign colors to nodes
  const formattedData = data.map((d, i) => ({
    ...d,
    fill: COLORS[i % COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={formattedData}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
      >
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          formatter={(val: number, _name: string, props: any) => [val, props.payload.name]}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
