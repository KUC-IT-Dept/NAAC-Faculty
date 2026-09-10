/**
 * StackedBarChart.tsx
 *
 * Horizontal stacked bar chart for composition views (e.g., publication
 * types per department). Shares label-wrapping, responsive width, and
 * Top-N logic with DepartmentBarChart via chartLabelUtils — see that
 * file's header comment for why this isn't duplicated ad hoc.
 */

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { wrapLabel, adaptiveLabelWidth, type TopNOption } from './chartLabelUtils';

interface StackedDataPoint {
  name: string;
  [key: string]: string | number; // Dynamic keys for stacks
}

interface StackedBarChartProps {
  data: StackedDataPoint[];
  stacks: string[]; // Keys to stack
  height?: number;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const ROW_HEIGHT = 34;
const CHROME_HEIGHT = 70; // legend + axis chrome
const MIN_HEIGHT = 240;

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width || 600);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function StackedBarChart({ data, stacks, height }: StackedBarChartProps) {
  const [containerRef, containerWidth] = useContainerWidth();

  const safeData = useMemo(
    () => (data || []).map(d => {
      const row: StackedDataPoint = { name: d.name && String(d.name).trim() ? d.name : 'Unknown Department' };
      for (const key of stacks) {
        const v = d[key];
        row[key] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
      }
      return row;
    }),
    [data, stacks]
  );

  const [topN, setTopN] = useState<TopNOption>(() => (safeData.length > 25 ? 15 : 'all'));
  const showTopNControl = safeData.length > 25;

  // Sort by total across all stacks, highest → lowest — consistent with
  // the metric-chart default; "total publications for this department"
  // is the natural ranking for a composition chart like this one.
  const sorted = useMemo(() => {
    const withTotal = safeData.map(d => ({
      ...d,
      __total: stacks.reduce((sum, k) => sum + (Number(d[k]) || 0), 0),
    }));
    withTotal.sort((a, b) => b.__total - a.__total);
    return withTotal;
  }, [safeData, stacks]);

  const displayed = topN === 'all' ? sorted : sorted.slice(0, topN);

  if (!safeData.length) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  const chartHeight = height ?? Math.max(MIN_HEIGHT, displayed.length * ROW_HEIGHT + CHROME_HEIGHT);
  const labelWidth = adaptiveLabelWidth(displayed.map(d => d.name), containerWidth);

  const renderTick = (props: any) => {
    const { x, y, payload } = props;
    const lines = wrapLabel(String(payload.value), labelWidth - 8);
    const lineHeight = 13;
    const startY = -((lines.length - 1) * lineHeight) / 2;
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text key={i} x={-6} y={startY + i * lineHeight} dy={4} textAnchor="end" fontSize={12} fill="#334155">
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div ref={containerRef}>
      {showTopNControl && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
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
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 4 }}>
            Showing {displayed.length} of {safeData.length}, sorted by total publications
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={displayed} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={labelWidth}
            tick={renderTick}
            interval={0}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            labelFormatter={(label: string) => label}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: '0.85rem', color: '#64748b' }} />
          {stacks.map((stack, i) => (
            <Bar key={stack} dataKey={stack} stackId="a" fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
