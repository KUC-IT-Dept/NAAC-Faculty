/**
 * DepartmentRankingView.tsx — Phase 18
 * Ranks all departments by any selected metric.
 * Supports Absolute / Per-Faculty toggle and direction-aware sorting
 * (higherIsBetter → descending, lowerIsBetter → ascending).
 *
 * Backend: GET /analytics/rankings/:metricId
 * API wrapper: getDepartmentRanking in analyticsV3Api.ts
 */
import { useEffect, useState } from 'react';
import { getDepartmentRanking, getMetricsCatalogue } from '../../../lib/analyticsV3Api';
import type { CatalogueEntry, RankingsResponse } from '../../../lib/analyticsV3Api';
import type { AnalyticsFilters } from '../../../lib/analyticsV2Api';

interface Props {
  filters?: AnalyticsFilters;
  defaultMetricId?: string;
}

export default function DepartmentRankingView({ filters = {}, defaultMetricId }: Props) {
  const [catalogue,    setCatalogue]    = useState<CatalogueEntry[]>([]);
  const [metricId,     setMetricId]     = useState<string>(defaultMetricId || '');
  const [viewMode,     setViewMode]     = useState<'absolute' | 'perFaculty'>('absolute');
  const [rankings,     setRankings]     = useState<RankingsResponse | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [catLoading,   setCatLoading]   = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Load metrics catalogue once on mount
  useEffect(() => {
    setCatLoading(true);
    getMetricsCatalogue({ supportedOnly: true })
      .then(res => {
        setCatalogue(res.metrics);
        if (!metricId && res.metrics.length > 0) {
          setMetricId(res.metrics[0].metricId);
        }
      })
      .catch(() => setCatalogue([]))
      .finally(() => setCatLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch rankings whenever metric, viewMode, or filters change
  useEffect(() => {
    if (!metricId) return;
    setLoading(true);
    setError(null);
    getDepartmentRanking(metricId, { ...filters, viewMode })
      .then(data => setRankings(data))
      .catch(e => setError(e?.response?.data?.message || 'Failed to load rankings.'))
      .finally(() => setLoading(false));
  }, [metricId, viewMode, filters]);

  const selectedMetric = catalogue.find(m => m.metricId === metricId);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  const rankLabel = (rank: number) => {
    if (rank === 1) return '🥇 1st';
    if (rank === 2) return '🥈 2nd';
    if (rank === 3) return '🥉 3rd';
    return `#${rank}`;
  };

  const directionBadgeStyle = (direction: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: direction === 'higherIsBetter' ? '#dcfce7' : '#fef9c3',
    color:      direction === 'higherIsBetter' ? '#166534' : '#854d0e',
    marginLeft: 8,
  });

  return (
    <div>
      {/* ── Controls ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        {/* Metric picker */}
        <div>
          <label
            htmlFor="ranking-metric-select"
            style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: 4 }}
          >
            Metric
          </label>
          <select
            id="ranking-metric-select"
            value={metricId}
            onChange={e => setMetricId(e.target.value)}
            disabled={catLoading}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: '0.875rem', color: '#334155', minWidth: 280, maxWidth: 400,
              background: '#fff', cursor: catLoading ? 'wait' : 'pointer',
            }}
          >
            {catLoading && <option value="">Loading metrics…</option>}
            {catalogue.map(m => (
              <option key={m.metricId} value={m.metricId}>
                {m.metricName} ({m.metricId})
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div>
          <label
            style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: 4 }}
          >
            View Mode
          </label>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            {(['absolute', 'perFaculty'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                  fontWeight: viewMode === mode ? 700 : 400,
                  background: viewMode === mode ? 'var(--primary, #2563eb)' : '#fff',
                  color: viewMode === mode ? '#fff' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {mode === 'absolute' ? 'Absolute' : 'Per Faculty'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Selected metric info ────────────────────────────── */}
      {selectedMetric && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#1e3a5f' }}>{selectedMetric.metricName}</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({selectedMetric.metricId})</span>
            {rankings && (
              <span style={directionBadgeStyle(rankings.direction)}>
                {rankings.direction === 'higherIsBetter' ? '↑ Higher is Better' : '↓ Lower is Better'}
              </span>
            )}
          </div>
          {selectedMetric.description && (
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0 0' }}>
              {selectedMetric.description}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>
            Criterion {selectedMetric.criterionNumber}: {selectedMetric.criterion}
          </p>
        </div>
      )}

      {/* ── Loading / Error / Empty states ──────────────────── */}
      {loading && (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading rankings…</p>
      )}
      {!loading && error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '12px 16px', color: '#b91c1c', fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Rankings table ───────────────────────────────────── */}
      {!loading && !error && rankings && rankings.rankings.length > 0 && (
        <>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 10 }}>
            {rankings.totalDepartments} department{rankings.totalDepartments !== 1 ? 's' : ''} ranked
            {viewMode === 'perFaculty' && ' · values normalized per faculty member'}
            {' · sorted '}
            {rankings.direction === 'higherIsBetter' ? 'highest → lowest' : 'lowest → highest'}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Department</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>
                    {viewMode === 'perFaculty' ? 'Per Faculty Value' : 'Absolute Value'}
                  </th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Faculty Count</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Per Faculty Value</th>
                </tr>
              </thead>
              <tbody>
                {rankings.rankings.map((entry, i) => (
                  <tr
                    key={entry.department}
                    style={{
                      background: entry.rank <= 3 ? (
                        entry.rank === 1 ? '#fefce8' :
                        entry.rank === 2 ? '#f8fafc' :
                        '#fff7ed'
                      ) : (i % 2 === 0 ? '#fff' : '#f8fafc'),
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, minWidth: 60 }}>
                      {rankLabel(entry.rank)}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: '#1e3a5f' }}>
                      {entry.department}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: 'var(--primary, #2563eb)' }}>
                      {viewMode === 'perFaculty' ? fmt(entry.perFacultyValue) : fmt(entry.absoluteValue)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>
                      {entry.facultyCount}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>
                      {entry.facultyCount > 0
                        ? fmt(entry.absoluteValue / entry.facultyCount)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !error && rankings && rankings.rankings.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          No department data available for the selected metric and current filters.
        </p>
      )}

      {!loading && !error && !rankings && !catLoading && (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Select a metric to view department rankings.
        </p>
      )}
    </div>
  );
}

// ── Table cell styles ─────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid #e2e8f0',
  color: '#475569',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: '#334155',
};
