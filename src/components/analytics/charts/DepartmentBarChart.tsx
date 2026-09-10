/**
 * DepartmentBarChart.tsx
 *
 * Horizontal bar chart comparing a numeric metric across departments.
 * Department names sit on the Y-axis, wrapped to at most 2 lines instead
 * of being cut off — the full name is always available via tooltip
 * regardless of what the axis can fit. Chart height adapts to the number
 * of *displayed* departments, and a Top-N control (only shown once the
 * dataset is actually large enough to need it — see chartLabelUtils)
 * keeps that height bounded rather than growing forever.
 *
 * Pure presentational — receives already-fetched data as props. Sorting,
 * Top-N, null-safety, and missing-name fallback all happen inside this
 * component so any future caller gets them for free, rather than relying
 * on every call site to remember to guard its own data.
 *
 * Usage:
 *   <DepartmentBarChart
 *     data={[{ department: 'CS', value: 42 }, ...]}
 *     valueLabel="Publications"
 *   />
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
  Cell,
} from 'recharts';
import { wrapLabel, adaptiveLabelWidth, applyTopN, defaultTopN, type TopNOption } from './chartLabelUtils';

interface DeptDataPoint {
  department: string;
  value: number;
}

interface DepartmentBarChartProps {
  data:        DeptDataPoint[];
  valueLabel?: string;
  color?:      string;
  /** Optional explicit height override. When omitted, height adapts to
   *  the number of *displayed* (post Top-N) departments. */
  height?:     number;
  /** Unit prefix/suffix for tooltip formatting, e.g. "₹" for funding.
   *  Purely cosmetic — does not change the underlying value. */
  formatValue?: (v: number) => string;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const ROW_HEIGHT = 34;
const CHROME_HEIGHT = 40;
const MIN_HEIGHT = 220;

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600); // sensible default before first measure
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

export default function DepartmentBarChart({
  data,
  valueLabel = 'Value',
  color,
  height,
  formatValue,
}: DepartmentBarChartProps) {
  const [containerRef, containerWidth] = useContainerWidth();

  // Defensive normalization — never render null/undefined/NaN, never a
  // blank axis row. This runs regardless of whether the caller already
  // guarded its own data, so this component is safe on its own.
  const safeData = useMemo(
    () => (data || []).map(d => ({
      department: d.department && d.department.trim() ? d.department : 'Unknown Department',
      value: Number.isFinite(d.value) ? d.value : 0,
    })),
    [data]
  );

  const [topN, setTopN] = useState<TopNOption>(() => defaultTopN(safeData.length));
  const showTopNControl = safeData.length > 25;

  // Sorted highest → lowest (per spec default for metric comparison
  // charts), then sliced to the selected Top-N. Sorting/slicing only
  // changes what's *displayed* — safeData (and therefore the underlying
  // values) is untouched.
  const displayed = useMemo(() => applyTopN(safeData, topN), [safeData, topN]);

  if (!safeData.length) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  const chartHeight = height ?? Math.max(MIN_HEIGHT, displayed.length * ROW_HEIGHT + CHROME_HEIGHT);
  const labelWidth = adaptiveLabelWidth(displayed.map(d => d.department), containerWidth);

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
            Showing {displayed.length} of {safeData.length} departments, sorted highest → lowest
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={displayed}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            type="category"
            dataKey="department"
            width={labelWidth}
            tick={renderTick}
            interval={0}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            formatter={(v: number) => [formatValue ? formatValue(v) : v, valueLabel]}
            labelFormatter={(label: string) => label}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {displayed.map((_, i) => (
              <Cell key={i} fill={color || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
