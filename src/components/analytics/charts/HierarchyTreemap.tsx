/**
 * HierarchyTreemap.tsx
 *
 * Treemap visualizing hierarchical composition (e.g. relative faculty
 * size per department). Previously fixed-height with no in-cell labels
 * at all (recharts' default Treemap draws no text unless you supply a
 * custom `content` renderer) — department names were only reachable via
 * hover, which becomes unusable past a handful of departments.
 *
 * Now: a custom cell renderer shows the name (and value) only when the
 * cell is actually large enough to hold it legibly; smaller cells fall
 * back to color + tooltip only, rather than cramming unreadable text in.
 * A Top-N control (only shown when it's actually needed) keeps cell
 * sizes from degrading into an unreadable mosaic at high department
 * counts, same pattern as the bar charts.
 */

import { useMemo, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { applyTopN, type TopNOption } from './chartLabelUtils';

interface TreemapNode {
  name: string;
  size: number;
}

interface HierarchyTreemapProps {
  data: TreemapNode[];
  height?: number;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

// Minimum cell dimensions for text to be legible at all — below this,
// showing truncated/overlapping text is worse than showing none.
const MIN_CELL_W_FOR_TEXT = 60;
const MIN_CELL_H_FOR_TEXT = 28;

function CellContent(props: any) {
  const { x, y, width, height, name, size, index } = props;
  const fill = COLORS[index % COLORS.length];
  const canShowText = width >= MIN_CELL_W_FOR_TEXT && height >= MIN_CELL_H_FOR_TEXT;
  // Roughly how many characters fit on one line at ~11px font.
  const maxChars = Math.max(3, Math.floor((width - 8) / 6));
  const label = name && name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill, stroke: '#fff', strokeWidth: 1.5 }} />
      {canShowText && (
        <>
          <text x={x + 6} y={y + 16} fontSize={11} fill="#fff" fontWeight={600}>{label}</text>
          {height >= MIN_CELL_H_FOR_TEXT + 14 && (
            <text x={x + 6} y={y + 30} fontSize={10} fill="#e0e7ff">{size}</text>
          )}
        </>
      )}
    </g>
  );
}

export default function HierarchyTreemap({ data, height = 320 }: HierarchyTreemapProps) {
  const safeData = useMemo(
    () => (data || []).map(d => ({
      name: d.name && d.name.trim() ? d.name : 'Unknown Department',
      value: Number.isFinite(d.size) ? d.size : 0,
    })),
    [data]
  );

  const [topN, setTopN] = useState<TopNOption>(() => (safeData.length > 25 ? 15 : 'all'));
  const showTopNControl = safeData.length > 25;
  const displayed = applyTopN(safeData, topN).map(d => ({ name: d.name, size: d.value }));

  if (!safeData.length) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }

  return (
    <div>
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
            Showing {displayed.length} of {safeData.length} departments by faculty count
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={displayed}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CellContent />}
        >
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            formatter={(val: number, _name: string, props: any) => [val, props.payload.name]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
