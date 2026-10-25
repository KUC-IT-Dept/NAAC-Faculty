/**
 * BenchmarkPage.tsx
 *
 * NAAC benchmark comparison table, driven by the administrator-approved
 * benchmark catalogue. For every metric it shows the ID, description,
 * criterion, current institutional value, the 4..0 score bands, the benchmark
 * target, the gap, the score/status and the source/version of the definition.
 *
 * A value that cannot be calculated reliably is shown as "Insufficient data"
 * (never as 0). Rendered as a tab inside AnalyticsDashboard (no new route).
 */

import { useEffect, useState } from 'react';
import {
  getBenchmarks, getBenchmarkCatalogueStatus,
  type BenchmarkEntry, type BenchmarkCatalogueStatus, type AnalyticsFilters,
} from '../../../lib/analyticsV2Api';

interface BenchmarkPageProps {
  filters?: AnalyticsFilters;
}

const REASONS: Record<string, string> = {
  no_analytics_mapping: 'No institutional data source is mapped to this metric yet.',
  analytics_metric_not_defined: 'The mapped analytics metric is not defined in this environment.',
  analytics_metric_unsupported: 'The mapped analytics metric is not supported by the current data model.',
  source_fields_missing: 'Required source fields are missing from the institutional records.',
  no_institutional_records: 'There are no institutional records to calculate this from.',
  calculation_failed: 'The value could not be calculated.',
  qualitative_requires_assessment: 'This is an A–E assessment; no assessment has been recorded.',
  unit_mismatch: 'The mapped metric is in a different unit from this benchmark, so it was not compared.',
  zero_denominator: 'A ratio or percentage has no denominator (for example no faculty in scope).',
  component_insufficient: 'A component metric of this ratio could not be calculated.',
  component_metric_missing: 'A component metric of this ratio is not defined.',
  no_source_values: 'No faculty has entered the source value for this metric yet.',
  unknown_formula_type: 'The mapped metric uses an unknown formula type.',
  value_outside_all_bands: 'The value does not fall inside any score band.',
};

const UNIT_LABEL: Record<string, string> = {
  percentage: '%', amount_lakhs: ' lakhs', days: ' days', years: ' yrs', ratio: ':1', count: '', option: '',
};

function fmt(v: number | null | undefined, unit?: string): string {
  if (v === null || v === undefined) return '—';
  const n = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  return `${n}${unit ? UNIT_LABEL[unit] ?? '' : ''}`;
}

function StatusBadge({ entry }: { entry: BenchmarkEntry }) {
  const map = {
    above:   { bg: '#dcfce7', color: '#166534', label: '▲ Above'   },
    meets:   { bg: '#fef9c3', color: '#854d0e', label: '✓ Meets'   },
    below:   { bg: '#fee2e2', color: '#991b1b', label: '▼ Below'   },
    unknown: { bg: '#f1f5f9', color: '#475569', label: 'Insufficient data' },
  };
  const style = map[entry.status] || map.unknown;
  const reason = entry.insufficientReason ? REASONS[entry.insufficientReason] || entry.insufficientReason : undefined;
  return (
    <span title={reason} style={{
      background: style.bg, color: style.color, borderRadius: 999, padding: '2px 10px',
      fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {style.label}{entry.score !== null && entry.score !== undefined ? ` · ${entry.score}/4` : ''}
    </span>
  );
}

function Bands({ entry }: { entry: BenchmarkEntry }) {
  const bands = (entry.bands || []).slice().sort((a, b) => b.score - a.score);
  if (bands.length === 0) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0 8px', fontSize: '0.75rem', color: '#475569' }}>
      {bands.map((b) => (
        <span key={b.score} style={{ display: 'contents' }}>
          <span style={{ fontWeight: b.label === entry.bandLabel ? 800 : 500, color: b.label === entry.bandLabel ? '#1e3a5f' : undefined }}>{b.score}</span>
          <span style={{ fontWeight: b.label === entry.bandLabel ? 800 : 400, color: b.label === entry.bandLabel ? '#1e3a5f' : undefined }}>{b.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function BenchmarkPage({ filters }: BenchmarkPageProps) {
  const [data,    setData]    = useState<BenchmarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<BenchmarkCatalogueStatus | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getBenchmarks(filters)
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setData(list);
        if (list.length === 0) getBenchmarkCatalogueStatus().then(setCatalogue).catch(() => setCatalogue(null));
      })
      .catch(() => setError('Benchmark data could not be loaded from the server.'))
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading benchmark data…</p>;
  if (error)   return <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>;
  if (data.length === 0) {
    if (catalogue && !catalogue.hasCatalogue) {
      return (
        <p style={{ color: '#64748b' }}>
          No benchmark catalogue has been imported in this environment yet. An administrator can import and approve the NAAC
          benchmark document under Admin → Benchmark Management.
        </p>
      );
    }
    return <p style={{ color: '#94a3b8' }}>No benchmark metrics match the current filters.</p>;
  }

  const versions = Array.from(new Set(data.map((d) => d.catalog?.origin === 'import' ? `v${d.catalog.versionNo}${d.catalog.documentVersion ? ` · ${d.catalog.documentVersion}` : ''}` : d.catalog?.origin === 'manual' ? 'manually added metrics' : 'Seeded catalogue')));

  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#64748b' }}>
        Definitions: {versions.join(', ')}. Current values come from institutional records; “Insufficient data” means a reliable value could not be calculated.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {['ID', 'Metric', 'Criterion', 'Current', 'Score bands (4→0)', 'Target', 'Gap', 'Score / Status', 'Source'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => {
              const insufficient = entry.currentValue === null || entry.currentValue === undefined;
              const gapBad = entry.gap !== null && entry.gap !== undefined && entry.gap > 0;
              return (
                <tr key={entry.metricId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa', verticalAlign: 'top' }}>
                  <td style={{ padding: '8px 10px', color: '#1e3a5f', fontWeight: 700, whiteSpace: 'nowrap' }}>{entry.metricId}</td>
                  <td style={{ padding: '8px 10px', color: '#334155', maxWidth: 360 }}>
                    <div style={{ fontWeight: 600 }}>{entry.metricName}</div>
                    {entry.description && entry.description !== entry.metricName && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{entry.description}</div>
                    )}
                    {entry.period && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Period: {entry.period}</div>}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '0.78rem' }}>{entry.criterion}{entry.keyIndicator ? <div style={{ color: '#94a3b8' }}>{entry.keyIndicator}</div> : null}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: insufficient ? '#94a3b8' : '#1e3a5f', whiteSpace: 'nowrap' }}>
                    {insufficient ? <span title={entry.insufficientReason ? REASONS[entry.insufficientReason] : undefined}>Insufficient data{entry.analyticsMapped === false ? <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#b45309' }}>Unmapped metric</div> : null}</span> : fmt(entry.currentValue, entry.unit)}
                  </td>
                  <td style={{ padding: '8px 10px' }}><Bands entry={entry} /></td>
                  <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {entry.scoringType === 'categorical' ? 'Grade A' : fmt(entry.benchmarkValue, entry.unit)}
                    {entry.direction === 'lowerIsBetter' && entry.scoringType !== 'categorical' ? <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>lower is better</div> : null}
                  </td>
                  <td style={{ padding: '8px 10px', color: insufficient || entry.gap === null || entry.gap === undefined ? '#94a3b8' : gapBad ? '#dc2626' : '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {entry.gap === null || entry.gap === undefined ? '—' : gapBad ? `−${fmt(entry.gap)}` : `+${fmt(Math.abs(entry.gap))}`}
                  </td>
                  <td style={{ padding: '8px 10px' }}><StatusBadge entry={entry} /></td>
                  <td style={{ padding: '8px 10px', fontSize: '0.72rem', color: '#64748b', maxWidth: 180 }}>
                    {entry.catalog?.origin === 'import'
                      ? <>v{entry.catalog.versionNo}{entry.catalog.sourceFilename ? ` · ${entry.catalog.sourceFilename}` : ''}{entry.catalog.approvedBy ? <div>Approved by {entry.catalog.approvedBy}</div> : null}</>
                      : entry.catalog?.origin === 'manual' ? `Added manually${entry.catalog.revision ? ` · r${entry.catalog.revision}` : ''}${entry.catalog.editedBy ? ` by ${entry.catalog.editedBy}` : ''}`
                      : 'Seeded catalogue'}
                    {entry.recommendation ? <div style={{ marginTop: 4, color: '#475569' }}>{entry.recommendation}</div> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
