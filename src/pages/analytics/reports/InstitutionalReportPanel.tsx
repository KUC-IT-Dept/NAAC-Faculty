/**
 * InstitutionalReportPanel.tsx
 *
 * IQAC Institutional Report Generator — lives inside the existing
 * Admin → Analytics → Reports page (ReportsPage.tsx renders this alongside
 * the pre-existing report-type list; this is NOT a separate page/route).
 *
 * Categories are never hardcoded here — they come from
 * GET /analytics/report-categories, the backend's own catalogue, so an
 * unsupported category can never appear as a selectable option.
 *
 * HOD department restriction is enforced server-side regardless of what
 * this component sends (see filterService's scope-last mergeFilters fix) —
 * this UI simply doesn't *offer* other departments to a scoped HOD.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  getReportCategories,
  getDepartmentsV3,
  previewInstitutionalReport,
  downloadInstitutionalReport,
  type ReportCategoryCatalogue,
  type ReportPeriodType,
  type ReportConvention,
  type InstitutionalReportPayload,
  type InstitutionalReportQuery,
} from '../../../lib/analyticsV3Api';

const NAVY = '#1e3a5f';
const BORDER = '#e2e8f0';
const MUTED = '#64748b';

const PERIOD_OPTIONS: { value: ReportPeriodType; label: string }[] = [
  { value: 'last3', label: 'Last 3 Years' },
  { value: 'last5', label: 'Last 5 Years' },
  { value: 'specific', label: 'Specific Year' },
  { value: 'range', label: 'Custom Year Range' },
];

function card(extra?: React.CSSProperties): React.CSSProperties {
  return { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, ...extra };
}

function sectionLabel(text: string) {
  return (
    <div style={{ fontWeight: 700, color: NAVY, fontSize: '0.82rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {text}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={card({ flex: '1 1 160px', textAlign: 'center' })}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: NAVY }}>{value}</div>
      <div style={{ color: MUTED, fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function CountTable({ title, counts, limit = 15 }: { title: string; counts: Record<string, number>; limit?: number }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const shown = entries.slice(0, limit);
  return (
    <div style={card()}>
      {sectionLabel(title)}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <tbody>
          {shown.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td style={{ padding: '6px 4px', color: '#334155' }}>{k}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, color: NAVY }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length > limit && (
        <div style={{ color: MUTED, fontSize: '0.75rem', marginTop: 6 }}>
          +{entries.length - limit} more — full breakdown is in the downloaded report.
        </div>
      )}
    </div>
  );
}

function RegisterTable({ rows, limit = 25 }: { rows: Array<Record<string, unknown>>; limit?: number }) {
  if (rows.length === 0) {
    return <div style={{ color: MUTED, fontSize: '0.82rem', padding: '10px 0' }}>No records for this selection.</div>;
  }
  const cols = Object.keys(rows[0]);
  const shown = rows.slice(0, limit);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 600 }}>
        <thead>
          <tr style={{ background: NAVY }}>
            {cols.map((c) => (
              <th key={c} style={{ padding: '6px 8px', color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
              {cols.map((c) => (
                <td key={c} style={{ padding: '6px 8px', color: '#334155' }}>{String(r[c] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > limit && (
        <div style={{ color: MUTED, fontSize: '0.75rem', marginTop: 6 }}>
          Showing {limit} of {rows.length} records. Download the full report for the complete register.
        </div>
      )}
    </div>
  );
}

export default function InstitutionalReportPanel() {
  const [catalogue, setCatalogue]   = useState<ReportCategoryCatalogue | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<ReportPeriodType>('last5');
  const [convention, setConvention] = useState<ReportConvention>('calendar');
  const [year, setYear] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [departmentMode, setDepartmentMode] = useState<'all' | 'specific'>('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [report, setReport] = useState<InstitutionalReportPayload | null>(null);

  useEffect(() => {
    getReportCategories()
      .then(setCatalogue)
      .catch(() => setCatalogueError('Could not load the report category list. Try refreshing the page.'));
    getDepartmentsV3()
      .then((rows: Array<{ department: string }>) => setDepartments(rows.map((r) => r.department).filter(Boolean)))
      .catch(() => { /* HOD scope legitimately returns a single department; a load failure just leaves "All Departments" as the only option */ });
  }, []);

  const query = useMemo<InstitutionalReportQuery>(() => ({
    categories: selectedCategories,
    periodType,
    year: year || undefined,
    fromYear: fromYear || undefined,
    toYear: toYear || undefined,
    convention,
    department: departmentMode === 'specific' ? selectedDepartments : undefined,
  }), [selectedCategories, periodType, year, fromYear, toYear, convention, departmentMode, selectedDepartments]);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) => (prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]));
  };

  const validate = (): string | null => {
    if (selectedCategories.length === 0) return 'Select at least one report category.';
    if (periodType === 'specific' && !year.trim()) return 'Enter a year for "Specific Year".';
    if (periodType === 'range') {
      if (!fromYear.trim() || !toYear.trim()) return 'Enter both From Year and To Year for a custom range.';
      if (parseInt(fromYear, 10) > parseInt(toYear, 10)) return 'From Year cannot be later than To Year.';
    }
    if (departmentMode === 'specific' && selectedDepartments.length === 0) return 'Select at least one department, or switch to All Departments.';
    return null;
  };

  const handleGenerate = async () => {
    const err = validate();
    setValidationError(err);
    if (err) return;
    setGenerating(true);
    setGenError(null);
    setReport(null);
    try {
      const payload = await previewInstitutionalReport(query);
      setReport(payload);
    } catch {
      setGenError('Failed to generate the report. Please check your filters and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'excel' | 'csv') => {
    const err = validate();
    setValidationError(err);
    if (err) return;
    setDownloadingFormat(format);
    setGenError(null);
    try {
      await downloadInstitutionalReport(query, format);
    } catch {
      setGenError(`Failed to download the ${format.toUpperCase()} report. Please try again.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setPeriodType('last5');
    setConvention('calendar');
    setYear(''); setFromYear(''); setToYear('');
    setDepartmentMode('all');
    setSelectedDepartments([]);
    setValidationError(null);
    setGenError(null);
    setReport(null);
  };

  if (catalogueError) {
    return (
      <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', color: '#854d0e', fontSize: '0.875rem' }}>
        {catalogueError}
      </div>
    );
  }

  if (!catalogue) {
    return <p style={{ color: MUTED, fontSize: '0.875rem' }}>Loading report categories…</p>;
  }

  const isMultiCategory = report ? report.categories.length > 1 : selectedCategories.length > 1;
  const scopedToOneDept = departments.length <= 1; // HOD: backend already restricted the list to one

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
      <div>
        <div style={{ fontWeight: 800, color: NAVY, fontSize: '1.05rem' }}>IQAC Institutional Report</div>
        <div style={{ color: MUTED, fontSize: '0.8rem', marginTop: 2 }}>
          Build a filtered, department- and year-aware report across the categories the application actually has data for.
        </div>
      </div>

      {/* Category selection */}
      <div style={card()}>
        {sectionLabel('Report Categories')}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button type="button" onClick={() => setSelectedCategories(catalogue.supported.map((c) => c.key))}
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, background: '#f8fafc', cursor: 'pointer' }}>
            Select All
          </button>
          <button type="button" onClick={() => setSelectedCategories([])}
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, background: '#f8fafc', cursor: 'pointer' }}>
            Clear Selection
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {catalogue.supported.map((c) => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedCategories.includes(c.key)} onChange={() => toggleCategory(c.key)} style={{ marginTop: 2 }} />
              <span>
                <span style={{ color: '#334155', fontWeight: 600 }}>{c.label}</span>
                {c.note && <span style={{ display: 'block', color: MUTED, fontSize: '0.72rem', marginTop: 1 }}>{c.note}</span>}
              </span>
            </label>
          ))}
        </div>
        {catalogue.unsupported.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${BORDER}` }}>
            <div style={{ color: MUTED, fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>Not available (no reliable data source):</div>
            {catalogue.unsupported.map((c) => (
              <div key={c.key} style={{ color: '#94a3b8', fontSize: '0.72rem' }}>• {c.label} — {c.reason}</div>
            ))}
          </div>
        )}
      </div>

      {/* Period + department filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={card({ flex: '1 1 320px' })}>
          {sectionLabel('Reporting Period')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {PERIOD_OPTIONS.map((o) => (
              <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="radio" name="periodType" checked={periodType === o.value} onChange={() => setPeriodType(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
          {periodType === 'specific' && (
            <input type="number" placeholder="Year, e.g. 2024" value={year} onChange={(e) => setYear(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: '0.82rem', width: 140 }} />
          )}
          {periodType === 'range' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" placeholder="From Year" value={fromYear} onChange={(e) => setFromYear(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: '0.82rem', width: 120 }} />
              <span style={{ color: MUTED }}>to</span>
              <input type="number" placeholder="To Year" value={toYear} onChange={(e) => setToYear(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: '0.82rem', width: 120 }} />
            </div>
          )}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${BORDER}` }}>
            <div style={{ fontSize: '0.78rem', color: MUTED, marginBottom: 6 }}>Reporting convention:</div>
            <label style={{ fontSize: '0.82rem', marginRight: 14, cursor: 'pointer' }}>
              <input type="radio" name="convention" checked={convention === 'calendar'} onChange={() => setConvention('calendar')} /> Calendar Year (Jan–Dec)
            </label>
            <label style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="radio" name="convention" checked={convention === 'academic'} onChange={() => setConvention('academic')} /> Academic Year (Jun–May)
            </label>
            {convention === 'academic' && (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                Publications, Awards and FDP records only store a calendar year — under Academic Year they're widened to every calendar year the span touches.
              </div>
            )}
          </div>
        </div>

        <div style={card({ flex: '1 1 260px' })}>
          {sectionLabel('Department')}
          {scopedToOneDept ? (
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              Restricted to your department{departments[0] ? `: ${departments[0]}` : ''}.
            </div>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: 6, cursor: 'pointer' }}>
                <input type="radio" checked={departmentMode === 'all'} onChange={() => setDepartmentMode('all')} /> All Departments
              </label>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" checked={departmentMode === 'specific'} onChange={() => setDepartmentMode('specific')} /> Select Specific Department(s)
              </label>
              {departmentMode === 'specific' && (
                <div style={{ maxHeight: 160, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8 }}>
                  {departments.map((d) => (
                    <label key={d} style={{ display: 'block', fontSize: '0.8rem', padding: '2px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedDepartments.includes(d)} onChange={() => toggleDepartment(d)} /> {d}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {validationError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#b91c1c', fontSize: '0.82rem' }}>
          {validationError}
        </div>
      )}
      {genError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#b91c1c', fontSize: '0.82rem' }}>
          {genError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={handleGenerate} disabled={generating}
          style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
          {generating ? 'Generating…' : 'Generate Report / Preview'}
        </button>
        {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
          <button key={fmt} type="button" onClick={() => handleDownload(fmt)} disabled={downloadingFormat !== null}
            style={{ background: '#f8fafc', color: '#334155', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 16px', fontSize: '0.85rem', fontWeight: 500, cursor: downloadingFormat ? 'not-allowed' : 'pointer', opacity: downloadingFormat && downloadingFormat !== fmt ? 0.5 : 1 }}>
            {downloadingFormat === fmt ? 'Downloading…' : `Download ${fmt.toUpperCase()}`}
          </button>
        ))}
        <button type="button" onClick={handleReset}
          style={{ background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
          Reset Filters
        </button>
      </div>

      {/* Preview */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 6 }}>
          <div style={card({ background: '#f8fafc' })}>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem' }}>{report.title}</div>
            <div style={{ color: MUTED, fontSize: '0.8rem', marginTop: 4 }}>
              {report.scope} &nbsp;|&nbsp; {report.period.label}{report.period.convention ? ` (${report.period.convention} year)` : ''} &nbsp;|&nbsp; Generated {new Date(report.generatedAt).toLocaleString()}
            </div>
          </div>

          {report.executiveSummary.totalOutputs === 0 ? (
            <div style={{ color: MUTED, fontSize: '0.85rem', padding: '16px 0' }}>
              No records match this filter selection. Try a wider period or different departments.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <KpiCard label="Total Research Outputs" value={report.executiveSummary.totalOutputs} />
                <KpiCard label="Contributing Faculty" value={report.executiveSummary.contributingFaculty} />
                <KpiCard label="Departments Covered" value={report.executiveSummary.departmentsCovered} />
                <KpiCard label="Categories Included" value={report.categories.length} />
              </div>

              {isMultiCategory && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <CountTable title="Faculty-wise Contribution (combined)" counts={report.totalsByFaculty} />
                  </div>
                  <div style={{ flex: '1 1 300px' }}>
                    <CountTable title="Department-wise Comparison (combined)" counts={report.totalsByDepartment} />
                  </div>
                </div>
              )}

              {report.categories.map((key) => {
                const s = report.sections[key];
                if (!s) return null;
                return (
                  <div key={key} style={card()}>
                    {sectionLabel(s.title)}
                    {s.note && <div style={{ color: MUTED, fontSize: '0.75rem', marginBottom: 10 }}>{s.note}</div>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      {Object.entries(s.summary).map(([k, v]) => (
                        <div key={k} style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: MUTED }}>{k}: </span>
                          <span style={{ fontWeight: 700, color: NAVY }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                      <div style={{ flex: '1 1 220px' }}>
                        <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, marginBottom: 4 }}>Year-wise</div>
                        <CountTable title="" counts={s.yearWise} limit={10} />
                      </div>
                      {!scopedToOneDept && Object.keys(s.departmentWise).length > 1 && (
                        <div style={{ flex: '1 1 220px' }}>
                          <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, marginBottom: 4 }}>Department-wise</div>
                          <CountTable title="" counts={s.departmentWise} limit={10} />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, marginBottom: 6 }}>Detailed Register</div>
                    <RegisterTable rows={s.register} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
