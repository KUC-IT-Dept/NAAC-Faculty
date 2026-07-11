/**
 * DrilldownTable.tsx
 *
 * Generic drill-down table component.
 * Supports: search, column sort, pagination, CSV export trigger.
 *
 * Accepts a KPI key and optional filter state. Fetches its own data
 * via analyticsV2Api.getDrilldown() so it works as a standalone panel.
 *
 * Usage:
 *   <DrilldownTable kpi="publications" filters={filters} />
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getDrilldown,
  type DrilldownResult,
  type AnalyticsFilters,
} from '../../../lib/analyticsV2Api';

interface DrilldownTableProps {
  kpi:      string;
  filters?: AnalyticsFilters;
  onClose?: () => void;
}

const KPI_LABELS: Record<string, string> = {
  publications: 'Publications',
  projects:     'Research Projects',
  patents:      'Patents',
  faculty:      'Faculty Records',
};

export default function DrilldownTable({ kpi, filters, onClose }: DrilldownTableProps) {
  const [result,  setResult]  = useState<DrilldownResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState('');
  const [page,    setPage]    = useState(1);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDrilldown(kpi, filters, search || undefined, sort || undefined, page, pageSize);
      setResult(data);
    } catch {
      setError('Failed to load drill-down data.');
    } finally {
      setLoading(false);
    }
  }, [kpi, filters, search, sort, page]);

  useEffect(() => { load(); }, [load]);

  const columns = result && result.records.length > 0
    ? Object.keys(result.records[0])
    : [];

  const handleSort = (col: string) => {
    setSort(prev => prev === col ? `-${col}` : col);
    setPage(1);
  };

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const totalPages = result ? Math.ceil(result.total / pageSize) : 1;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
      padding: 24, marginTop: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
          {KPI_LABELS[kpi] || kpi} — Drill-down
          {result && <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8, fontSize: '0.875rem' }}>({result.total} records)</span>}
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`/api/faculty/analytics/drilldown/${kpi}/export?format=csv`}
            download
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '5px 12px', fontSize: '0.8rem', color: '#334155',
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            ↓ CSV
          </a>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.2rem', color: '#94a3b8', lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search records…"
        value={search}
        onChange={e => handleSearch(e.target.value)}
        style={{
          border: '1px solid #cbd5e1', borderRadius: 8, padding: '7px 12px',
          fontSize: '0.875rem', width: '100%', marginBottom: 14,
          boxSizing: 'border-box',
        }}
      />

      {/* Table */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>Loading…</div>
      )}
      {!loading && error && (
        <div style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</div>
      )}
      {!loading && !error && result && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      textAlign: 'left', padding: '7px 10px',
                      borderBottom: '2px solid #e2e8f0',
                      color: '#475569', fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {col}
                    {sort === col && ' ▲'}
                    {sort === `-${col}` && ' ▼'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.records.length === 0 && (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '20px 10px', color: '#94a3b8', textAlign: 'center' }}>
                    No records found.
                  </td>
                </tr>
              )}
              {result.records.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '6px 10px', color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {result && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'center' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 12px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 12px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
