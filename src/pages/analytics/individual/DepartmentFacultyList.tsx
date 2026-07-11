/**
 * DepartmentFacultyList.tsx — Phase 12
 * Calls GET /analytics/drilldown/department/:deptName/faculty
 * Renders sortable table of faculty with headline KPIs.
 * Row click navigates to FacultyProfileAnalytics.
 */
import { useEffect, useState } from 'react';
import { getDepartmentFacultyList } from '../../../lib/analyticsV3Api';
import type { AnalyticsFilters } from '../../../lib/analyticsV2Api';

interface Props {
  deptName: string;
  filters?: AnalyticsFilters;
  onSelectFaculty: (facultyId: string) => void;
}

interface FacultyRow {
  facultyId: string;
  facultyName: string;
  username: string;
  designation: string;
  profileComplete: boolean;
  completionPercentage: number;
  kpis: Record<string, { metricName: string; value: number }>;
}

interface DeptFacultyResult {
  department: string;
  total: number;
  page: number;
  pageSize: number;
  headlineMetrics: string[];
  faculty: FacultyRow[];
}

export default function DepartmentFacultyList({ deptName, filters, onSelectFaculty }: Props) {
  const [result,  setResult]  = useState<DeptFacultyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('completionPercentage');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!deptName) return;
    setLoading(true);
    setError(null);
    getDepartmentFacultyList(deptName, filters)
      .then(setResult)
      .catch(e => setError(e?.response?.data?.message || 'Failed to load faculty list.'))
      .finally(() => setLoading(false));
  }, [deptName, filters]);

  const rows = (result?.faculty || [])
    .filter(f => !search || f.facultyName.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = sortKey === 'completionPercentage' ? a.completionPercentage
               : sortKey === 'facultyName'          ? a.facultyName
               : a.kpis[sortKey]?.value ?? 0;
      const bv = sortKey === 'completionPercentage' ? b.completionPercentage
               : sortKey === 'facultyName'          ? b.facultyName
               : b.kpis[sortKey]?.value ?? 0;
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const headlineMetrics = result?.headlineMetrics || [];

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading faculty…</p>;
  if (error)   return <p style={{ color: '#b91c1c' }}>{error}</p>;
  if (!result) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ color: 'var(--navy,#1e3a5f)' }}>{deptName}</strong>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>— {result.total} faculty</span>
        <input
          type="text" placeholder="Search by name…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '5px 10px', fontSize: '0.85rem', marginLeft: 'auto' }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              {[
                { key: 'facultyName', label: 'Faculty' },
                { key: 'designation', label: 'Designation' },
                { key: 'completionPercentage', label: 'Completion (%)' },
                ...headlineMetrics.map(mid => ({ key: mid, label: result.faculty[0]?.kpis[mid]?.metricName || mid })),
              ].map(col => (
                <th key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {col.label} {sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => (
              <tr key={f.facultyId}
                onClick={() => onSelectFaculty(f.facultyId)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '7px 10px', color: 'var(--primary,#2563eb)', fontWeight: 500 }}>{f.facultyName}</td>
                <td style={{ padding: '7px 10px', color: '#64748b' }}>{f.designation}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{ fontWeight: 600, color: f.completionPercentage >= 70 ? '#16a34a' : f.completionPercentage >= 40 ? '#d97706' : '#dc2626' }}>
                    {f.completionPercentage}%
                  </span>
                </td>
                {headlineMetrics.map(mid => (
                  <td key={mid} style={{ padding: '7px 10px', color: '#334155' }}>{f.kpis[mid]?.value ?? 0}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4 + headlineMetrics.length} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No faculty found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
