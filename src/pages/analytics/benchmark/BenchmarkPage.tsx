/**
 * BenchmarkPage.tsx
 *
 * Renders the NAAC benchmark comparison table:
 * Current Value / Benchmark Value / Gap / Status / Recommendation.
 *
 * Rendered as a tab inside AnalyticsDashboard (no new route needed).
 *
 * Usage:
 *   <BenchmarkPage filters={filters} />
 */

import { useEffect, useState } from 'react';
import {
  getBenchmarks,
  type BenchmarkEntry,
  type AnalyticsFilters,
} from '../../../lib/analyticsV2Api';

interface BenchmarkPageProps {
  filters?: AnalyticsFilters;
}

function StatusBadge({ status }: { status: BenchmarkEntry['status'] }) {
  const map = {
    above:   { bg: '#dcfce7', color: '#166534', label: '▲ Above'   },
    meets:   { bg: '#fef9c3', color: '#854d0e', label: '✓ Meets'   },
    below:   { bg: '#fee2e2', color: '#991b1b', label: '▼ Below'   },
    unknown: { bg: '#f1f5f9', color: '#64748b', label: '? Unknown' },
  };
  const style = map[status] || map.unknown;
  return (
    <span style={{
      background: style.bg, color: style.color,
      borderRadius: 999, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700,
    }}>
      {style.label}
    </span>
  );
}

export default function BenchmarkPage({ filters }: BenchmarkPageProps) {
  const [data,    setData]    = useState<BenchmarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getBenchmarks(filters)
      .then(setData)
      .catch(() => setError('Benchmark data not available. This feature requires Phase 5 backend deployment.'))
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading benchmark data…</p>;
  if (error)   return <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>;
  if (data.length === 0) return <p style={{ color: '#94a3b8' }}>No benchmark data available.</p>;

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              {['Metric', 'Criterion', 'Current Value', 'Benchmark', 'Gap', 'Status', 'Recommendation'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => (
              <tr key={entry.metricId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 600 }}>{entry.metricName}</td>
                <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.8rem' }}>{entry.criterion}</td>
                <td style={{ padding: '8px 12px', color: '#1e3a5f', fontWeight: 700 }}>{entry.currentValue}</td>
                <td style={{ padding: '8px 12px', color: '#475569' }}>{entry.benchmarkValue}</td>
                <td style={{ padding: '8px 12px', color: entry.gap > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {entry.gap > 0 ? `−${entry.gap}` : `+${Math.abs(entry.gap)}`}
                </td>
                <td style={{ padding: '8px 12px' }}><StatusBadge status={entry.status} /></td>
                <td style={{ padding: '8px 12px', color: '#475569', fontSize: '0.8rem', maxWidth: 320 }}>
                  {entry.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
