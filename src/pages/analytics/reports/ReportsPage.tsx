/**
 * ReportsPage.tsx
 *
 * Analytics V2 — Report generation panel.
 * Lists available report types (role-filtered by the backend),
 * lets the user pick a format (PDF / Excel / CSV), and triggers
 * a browser download via the /reports/:type/generate endpoint.
 *
 * Rendered as a tab inside AnalyticsDashboard — no new route needed.
 *
 * Usage:
 *   <ReportsPage filters={filters} />
 */

import { useEffect, useState } from 'react';
import {
  type ReportType,
  type AnalyticsFilters,
} from '../../../lib/analyticsV2Api';
import { getReportTypesV3 } from '../../../lib/analyticsV3Api';
import api from '../../../lib/api';

interface ReportsPageProps {
  filters?: AnalyticsFilters;
}

type DownloadFormat = 'pdf' | 'excel' | 'csv';

const FORMAT_LABELS: Record<DownloadFormat, string> = {
  pdf:   '📄 PDF',
  excel: '📊 Excel',
  csv:   '📋 CSV',
};

export default function ReportsPage({ filters }: ReportsPageProps) {
  const [reportTypes, setReportTypes]       = useState<ReportType[]>([]);
  const [loading,     setLoading]           = useState(false);
  const [error,       setError]             = useState<string | null>(null);
  const [generating,  setGenerating]        = useState<string | null>(null); // key = `${type}-${format}`
  const [genError,    setGenError]          = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getReportTypesV3()
      .then(setReportTypes)
      .catch(() => setError('Report types not available. This feature requires Phase 7 backend deployment.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (reportType: string, format: DownloadFormat) => {
    const key = `${reportType}-${format}`;
    setGenerating(key);
    setGenError(null);

    // Build query params from active filters
    const params: Record<string, string> = { format };
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
    }

    try {
      const response = await api.post(
        `/analytics/reports-v3/${reportType}/generate`,
        {},
        { params, responseType: 'blob' }
      );

      const ext = format === 'excel' ? 'xlsx' : format;
      const url = URL.createObjectURL(new Blob([response.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${reportType}-report.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setGenError(`Failed to generate ${format.toUpperCase()} for "${reportType}". Please try again.`);
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading available reports…</p>;
  }

  if (error) {
    return (
      <div style={{
        background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10,
        padding: '14px 18px', color: '#854d0e', fontSize: '0.875rem',
      }}>
        {error}
      </div>
    );
  }

  if (reportTypes.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No report types available for your role.</p>;
  }

  return (
    <div>
      {genError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '12px 16px', color: '#b91c1c', fontSize: '0.875rem', marginBottom: 16,
        }}>
          {genError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {reportTypes.map(report => (
          <div
            key={report.key}
            style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '18px 20px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
            }}
          >
            {/* Report info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy, #1e3a5f)', fontSize: '0.95rem' }}>
                {report.label}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4, lineHeight: 1.5 }}>
                {report.description}
              </div>
            </div>

            {/* Format buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {report.formats.map(fmt => {
                const key       = `${report.key}-${fmt}`;
                const isRunning = generating === key;
                return (
                  <button
                    key={fmt}
                    type="button"
                    disabled={!!generating}
                    onClick={() => handleDownload(report.key, fmt)}
                    style={{
                      background: isRunning ? '#e2e8f0' : '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      color: '#334155',
                      fontWeight: 500,
                      opacity: generating && !isRunning ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {isRunning ? '⏳ Generating…' : FORMAT_LABELS[fmt]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 20 }}>
        Reports are generated from live data and reflect any active filters applied above.
      </p>
    </div>
  );
}
