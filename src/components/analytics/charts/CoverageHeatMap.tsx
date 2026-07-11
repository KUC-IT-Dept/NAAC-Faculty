/**
 * CoverageHeatMap.tsx
 *
 * Visual heatmap showing data coverage percentage per metric,
 * using colour bands to convey completeness at a glance.
 *
 * Because recharts has no native heatmap, this is implemented as a
 * styled table with colour-coded cells — consistent with the project's
 * existing inline-style pattern and requiring no new CSS libraries.
 *
 * Pure presentational — receives already-fetched coverage data as props.
 *
 * Usage:
 *   <CoverageHeatMap data={coverage} />
 */

import type { CoverageItem } from '../../../lib/analyticsApi';

interface CoverageHeatMapProps {
  data: CoverageItem[];
}

function coverageColor(pct: number): string {
  if (pct >= 80) return '#dcfce7'; // green
  if (pct >= 50) return '#fef9c3'; // yellow
  if (pct >= 20) return '#ffedd5'; // orange
  return '#fee2e2';                // red
}

function coverageTextColor(pct: number): string {
  if (pct >= 80) return '#166534';
  if (pct >= 50) return '#854d0e';
  if (pct >= 20) return '#9a3412';
  return '#991b1b';
}

export default function CoverageHeatMap({ data }: CoverageHeatMapProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No coverage data available.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {data.map(item => (
          <div
            key={item.metricId}
            style={{
              background: coverageColor(item.coveragePercent),
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 16px',
              minWidth: 160,
              flex: '1 1 160px',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: coverageTextColor(item.coveragePercent),
            }}>
              {item.coveragePercent}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4, lineHeight: 1.3 }}>
              {item.metricName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
              {item.recordsFound} / {item.totalFaculty} faculty
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { color: '#dcfce7', text: '#166534', label: '≥ 80% — Good'     },
          { color: '#fef9c3', text: '#854d0e', label: '50–79% — Fair'     },
          { color: '#ffedd5', text: '#9a3412', label: '20–49% — Low'      },
          { color: '#fee2e2', text: '#991b1b', label: '< 20% — Critical'  },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-block', width: 14, height: 14,
              background: b.color, borderRadius: 3, border: '1px solid #e2e8f0',
            }} />
            <span style={{ fontSize: '0.78rem', color: b.text }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
