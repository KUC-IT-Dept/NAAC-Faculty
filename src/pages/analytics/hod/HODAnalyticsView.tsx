/**
 * HODAnalyticsView.tsx — Phase 13
 *
 * HOD-specific analytics layout. Rendered instead of the standard 6-tab
 * dashboard when access.role === 'hod'. Reuses all existing components
 * and endpoints — no new backend calls introduced.
 *
 * Sections (all scoped to HOD's own department by existing scope middleware):
 *  1. Pending/Incomplete Profiles  — DepartmentFacultyList sorted by completion asc
 *  2. Department Benchmark         — BenchmarkPage (already dept-scoped)
 *  3. Individual Faculty Drill-in  — DepartmentFacultyList → FacultyProfileAnalytics
 *  4. Dept vs University Average   — ComparisonPanel
 *  5. Department Performance KPIs  — stat cards from deptPerf data passed in as prop
 */

import { useState } from 'react';
import BenchmarkPage from '../benchmark/BenchmarkPage';
import ComparisonPanel from '../comparisons/ComparisonPanel';
import DepartmentFacultyList from '../individual/DepartmentFacultyList';
import FacultyProfileAnalytics from '../individual/FacultyProfileAnalytics';
import type { AnalyticsFilters } from '../../../lib/analyticsV2Api';
import type { DepartmentPerformance } from '../../../lib/analyticsApi';

interface Props {
  deptName:   string;
  filters:    AnalyticsFilters;
  memoizedFilters: AnalyticsFilters;
  deptPerf:   DepartmentPerformance[] | null;
}

type HODTab = 'overview' | 'individual' | 'benchmark' | 'comparisons';

const HOD_TABS: HODTab[] = ['overview', 'individual', 'benchmark', 'comparisons'];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', minWidth: 140, flex: '1 1 140px' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary,#2563eb)' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function HODAnalyticsView({ deptName, filters, memoizedFilters, deptPerf }: Props) {
  const [activeTab,       setActiveTab]       = useState<HODTab>('overview');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  const myDept = deptPerf?.find(d =>
    d.department.toLowerCase().trim() === deptName.toLowerCase().trim()
  );

  return (
    <div>
      {/* HOD tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {HOD_TABS.map(tab => (
          <button key={tab} type="button" onClick={() => { setActiveTab(tab); setSelectedFaculty(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 18px', fontSize: '0.9rem',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? 'var(--primary,#2563eb)' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid var(--primary,#2563eb)' : '2px solid transparent',
              marginBottom: -2, textTransform: 'capitalize',
            }}>
            {tab === 'overview' ? 'Department Overview' : tab === 'individual' ? 'Faculty' : tab === 'benchmark' ? 'Benchmark' : 'Comparisons'}
          </button>
        ))}
      </div>

      {/* Overview — dept KPI cards + incomplete profiles */}
      {activeTab === 'overview' && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy,#1e3a5f)', marginBottom: 14 }}>
            {deptName} — Key Performance Indicators
          </h3>
          {myDept ? (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <StatCard label="Faculty"          value={myDept.facultyCount} />
              <StatCard label="Avg. Completion (%)" value={myDept.averageCompletion} />
              <StatCard label="Publications"     value={myDept.publications} />
              <StatCard label="Projects"         value={myDept.projects} />
              <StatCard label="Patents"          value={myDept.patents} />
              <StatCard
                label="Research Funding"
                value={myDept.funding === null || myDept.funding === undefined
                  ? 'No funding data available'
                  : `₹${myDept.funding.toLocaleString('en-IN')}`}
              />
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 20 }}>
              Department performance data not yet loaded. Switch to Overview tab first.
            </p>
          )}

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy,#1e3a5f)', marginBottom: 10 }}>
            Incomplete Profiles (sorted by completion)
          </h3>
          <DepartmentFacultyList
            deptName={deptName}
            filters={{ ...filters, department: deptName }}
            onSelectFaculty={id => { setSelectedFaculty(id); setActiveTab('individual'); }}
          />
        </div>
      )}

      {/* Individual — faculty list or profile */}
      {activeTab === 'individual' && (
        <div>
          {selectedFaculty ? (
            <FacultyProfileAnalytics
              facultyId={selectedFaculty}
              onBack={() => setSelectedFaculty(null)}
            />
          ) : (
            <DepartmentFacultyList
              deptName={deptName}
              filters={{ ...filters, department: deptName }}
              onSelectFaculty={setSelectedFaculty}
            />
          )}
        </div>
      )}

      {/* Benchmark — already dept-scoped via requireAnalyticsScope */}
      {activeTab === 'benchmark' && (
        <BenchmarkPage filters={memoizedFilters} />
      )}

      {/* Comparisons */}
      {activeTab === 'comparisons' && (
        <ComparisonPanel filters={memoizedFilters} />
      )}
    </div>
  );
}
