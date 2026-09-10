/**
 * CategoryDonutChart.tsx
 *
 * Donut chart breaking down a total by category (e.g. journal categories,
 * publication types, students by department).
 *
 * Previous version had only 8 rotating colors (categories 9, 17, 25...
 * became visually identical to category 1) and a default-wrapping legend
 * with no bound, which becomes unusable past a handful of categories.
 *
 * Fix: Top-N + an explicit "Other Departments (N)" slice for the rest —
 * clearly labeled as an aggregate, never presented as if it were a real
 * department — plus a larger, procedurally-generated color set and a
 * scrollable, height-bounded legend instead of unbounded default wrap.
 *
 * Pure presentational — receives already-fetched data as props.
 *
 * Usage:
 *   <CategoryDonutChart
 *     data={[{ name: 'Scopus', value: 34 }, { name: 'WoS', value: 18 }]}
 *     title="By Journal Category"
 *   />
 */

import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { applyTopN, type TopNOption } from './chartLabelUtils';

interface CategoryDataPoint {
  name:  string;
  value: number;
}

interface CategoryDonutChartProps {
  data:    CategoryDataPoint[];
  title?:  string;
  height?: number;
}

// Procedural palette: evenly spaced hues, so N distinct-looking slices
// don't repeat until N > ~24 (vs. the old fixed 8-color cycle, where
// category 9 was already indistinguishable from category 1).
function paletteColor(i: number, total: number): string {
  const hue = Math.round((360 / Math.max(total, 1)) * i) % 360;
  return `hsl(${hue}, 65%, 52%)`;
}
const OTHER_COLOR = '#94a3b8'; // neutral grey — visually marks "not a real single department"

const TOP_N_THRESHOLD = 15; // donut legends get cramped much sooner than bar charts

export default function CategoryDonutChart({ data, height = 280 }: CategoryDonutChartProps) {
  const safeData = useMemo(
    () => (data || []).map(d => ({
      name: d.name && String(d.name).trim() ? d.name : 'Unknown Department',
      value: Number.isFinite(d.value) ? d.value : 0,
    })),
    [data]
  );

  const [topN, setTopN] = useState<TopNOption>(() => (safeData.length > TOP_N_THRESHOLD ? 10 : 'all'));
  const showTopNControl = safeData.length > TOP_N_THRESHOLD;

  const { displayed, otherTotal, otherCount } = useMemo(() => {
    if (topN === 'all') return { displayed: [...safeData].sort((a, b) => b.value - a.value), otherTotal: 0, otherCount: 0 };
    const top = applyTopN(safeData, topN);
    const shown = new Set(top.map(d => d.name));
    const rest = safeData.filter(d => !shown.has(d.name));
    const restTotal = rest.reduce((sum, d) => sum + d.value, 0);
    return { displayed: top, otherTotal: restTotal, otherCount: rest.length };
  }, [safeData, topN]);

  const pieData = otherCount > 0
    ? [...displayed, { name: `Other Departments (${otherCount})`, value: otherTotal, __isOther: true }]
    : displayed;

  if (!safeData.length) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <div>
      {showTopNControl && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Show:</span>
          {([10, 15, 25, 'all'] as TopNOption[]).map(opt => (
            <button
              key={String(opt)}
              type="button"
              onClick={() => setTopN(opt)}
              style={{
                background: topN === opt ? 'var(--primary, #2563eb)' : '#f1f5f9',
                color: topN === opt ? '#fff' : '#334155',
                border: '1px solid #e2e8f0', borderRadius: 6,
                padding: '3px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500,
              }}
            >
              {opt === 'all' ? 'All' : `Top ${opt}`}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry: any, i) => (
                  <Cell key={i} fill={entry.__isOther ? OTHER_COLOR : paletteColor(i, pieData.length)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                formatter={(v: number, _n: string, p: any) => [v, p?.payload?.__isOther ? 'Combined total' : 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Bounded, scrollable legend instead of recharts' default
            unbounded flex-wrap, which had no ceiling on how tall it
            could grow with many categories. */}
        <div style={{ flex: '1 1 200px', minWidth: 180, maxHeight: height, overflowY: 'auto', fontSize: '0.8rem' }}>
          {pieData.map((entry: any, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: entry.__isOther ? OTHER_COLOR : paletteColor(i, pieData.length),
              }} />
              <span style={{ color: entry.__isOther ? '#64748b' : '#334155', fontStyle: entry.__isOther ? 'italic' : 'normal' }}>
                {entry.name}
              </span>
              <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
