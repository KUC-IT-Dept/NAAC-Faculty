/**
 * AnalyticsDashboard.tsx
 *
 * Adaptive analytics dashboard — renders only the sections that the
 * backend's /my-access endpoint indicates the current user may see.
 *
 * The component never hard-codes "if role === hod show X" — it always
 * asks the backend what is permitted and renders accordingly.
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import AppLayout from '../../components/AppLayout';
import FilterBarV3 from '../../components/analytics/FilterBarV3';
import DepartmentBarChart from '../../components/analytics/charts/DepartmentBarChart';
import CategoryDonutChart from '../../components/analytics/charts/CategoryDonutChart';
import CriterionPieChart from '../../components/analytics/charts/CriterionPieChart';
import CoverageHeatMap from '../../components/analytics/charts/CoverageHeatMap';
import HierarchyTreemap from '../../components/analytics/charts/HierarchyTreemap';
import CorrelationScatterChart from '../../components/analytics/charts/CorrelationScatterChart';
import StackedBarChart from '../../components/analytics/charts/StackedBarChart';
import BenchmarkPage from './benchmark/BenchmarkPage';
import ReportsPage from './reports/ReportsPage';
import DrilldownTable from './drilldown/DrilldownTable';
import ComparisonPanel from './comparisons/ComparisonPanel';
import DepartmentFacultyList from './individual/DepartmentFacultyList';
import FacultyProfileAnalytics from './individual/FacultyProfileAnalytics';
import HODAnalyticsView from './hod/HODAnalyticsView';
import DepartmentRankingView from './rankings/DepartmentRankingView';
import ViewModeSelector, { type ViewMode } from '../../components/analytics/ViewModeSelector';
import { type AnalyticsFilters, toParams } from '../../lib/analyticsV2Api';
import {
  type CatalogueEntry,
  getMetricsCatalogue,
  getMyAccessV3,
  getDashboardV3,
  getCoverageV3,
  getProfileSummaryV3,
  getDepartmentsV3,
  getDepartmentPerformanceV3,
  getStudentProfileSummaryV3,
  getStudentDepartmentsV3,
  getProgramLevelsV3,
  getDepartmentFacultyList,
} from '../../lib/analyticsV3Api';
import {
  type MyAccessResponse,
  type MetricResult,
  type CoverageItem,
  type ProfileSummary,
  type DepartmentSummary,
  type DepartmentPerformance,
  type StudentProfileSummary,
  type StudentDepartment,
  type ProgramLevel,
} from '../../lib/analyticsApi';

const CRITERION_TITLES: Record<number, string> = {
  1: 'Curricular Aspects',
  2: 'Teaching-Learning and Evaluation',
  3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources',
  5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management',
  7: 'Institutional Values and Best Practices',
};

interface DepartmentFacultyChartRow {
  facultyId: string;
  facultyName: string;
  experienceYears?: number;
  kpis: Record<string, { metricName: string; value: number }>;
}

interface DepartmentFacultyChartResult {
  department: string;
  total: number;
  publicationTypeBreakdown?: Record<string, number>;
  faculty: DepartmentFacultyChartRow[];
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--navy, #1e3a5f)', margin: '28px 0 12px' }}>
      {title}
    </h2>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 160,
      flex: '1 1 160px',
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary, #2563eb)' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SimpleTable<T extends Record<string, unknown>>({
  rows,
  columns,
}: {
  rows: T[];
  columns: { key: keyof T; label: string }[];
}) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={String(c.key)} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map(c => (
                <td key={String(c.key)} style={{ padding: '8px 12px', color: '#334155' }}>
                  {String(row[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'var(--navy, #1e3a5f)', borderTopColor: 'transparent' }} />
    </div>
  );
}

// Performance: skeleton placeholders so the dashboard chrome (filter bar,
// tabs) paints immediately while data is still loading, instead of blocking
// the whole page behind a spinner.
function SkeletonBlock({ height = 90, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div
      style={{
        height, width, borderRadius: 12, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)',
        backgroundSize: '400% 100%', animation: 'analytics-skeleton 1.4s ease infinite',
      }}
    />
  );
}

function SkeletonDashboard() {
  return (
    <div>
      <style>{'@keyframes analytics-skeleton{0%{background-position:100% 50%}100%{background-position:0 50%}}'}</style>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} height={78} width={160} />)}
      </div>
      <SkeletonBlock height={220} />
    </div>
  );
}

/** ₹ formatter that distinguishes "no data" (null) from a real ₹0. */
function formatFunding(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'No funding data available';
  return `₹${value.toLocaleString('en-IN')}`;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#b91c1c', fontSize: '0.9rem' }}>
      {message}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [access, setAccess]                   = useState<MyAccessResponse | null>(null);
  const [dashboard, setDashboard]             = useState<MetricResult[] | null>(null);
  const [coverage, setCoverage]               = useState<CoverageItem[] | null>(null);
  const [profileSummary, setProfileSummary]   = useState<ProfileSummary | null>(null);
  const [departments, setDepartments]         = useState<DepartmentSummary[] | null>(null);
  const [deptPerf, setDeptPerf]               = useState<DepartmentPerformance[] | null>(null);
  const [studentSummary, setStudentSummary]   = useState<StudentProfileSummary | null>(null);
  const [studentDepts, setStudentDepts]       = useState<StudentDepartment[] | null>(null);
  const [programLevels, setProgramLevels]     = useState<ProgramLevel[] | null>(null);
  const [metricsCatalogue, setMetricsCatalogue] = useState<CatalogueEntry[] | null>(null);
  const [chartDepartmentData, setChartDepartmentData] = useState<DepartmentFacultyChartResult[] | null>(null);
  const [chartDataLoading, setChartDataLoading] = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  // V2: filter state — empty object means "no filters applied" (V1 behavior)
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  // V2: active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'comparisons' | 'benchmark' | 'reports' | 'individual' | 'rankings'>('overview');
  // V2: drilldown KPI currently open (null = none)
  const [drilldownKpi, setDrilldownKpi] = useState<string | null>(null);

  // Phase 12: Individual mode state
  const [selectedDept,    setSelectedDept]    = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  // Phase 10: Track which tabs have been visited to support lazy mounting
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ overview: true });

  useEffect(() => {
    setVisitedTabs(prev => prev[activeTab] ? prev : { ...prev, [activeTab]: true });
  }, [activeTab]);

  // Phase 4: memoize the combined filter object so BenchmarkPage and
  // ComparisonPanel only re-render when filters or viewMode actually change,
  // not on unrelated parent state updates (e.g. drilldownKpi toggling).
  // Smart charts (Task 2): department filter can now hold 0, 1, or many
  // values. Multiple → comparison charts (existing behavior). Exactly one →
  // department-specific analytics instead of a single-bar comparison.
  const selectedDepartments = useMemo(() => {
    const v = filters.department;
    if (!v) return [] as string[];
    return Array.isArray(v) ? v : [v];
  }, [filters.department]);
  const singleSelectedDept = selectedDepartments.length === 1 ? selectedDepartments[0] : null;

  // Performance (Task 4): cache Overview/Charts tab responses keyed by
  // filters + viewMode so returning to a previously-used combination reuses
  // the cached data instead of refetching. Cleared only by a full reload
  // (a ref, not state, so updating it never triggers a re-render itself).
  const responseCacheRef = useRef<Map<string, {
    dashboard: MetricResult[] | null;
    coverage: CoverageItem[] | null;
    profileSummary: ProfileSummary | null;
    departments: DepartmentSummary[] | null;
    deptPerf: DepartmentPerformance[] | null;
    studentSummary: StudentProfileSummary | null;
    studentDepts: StudentDepartment[] | null;
    programLevels: ProgramLevel[] | null;
  }>>(new Map());

  const memoizedFilters = useMemo(
    () => ({ ...filters, viewMode }),
    [filters, viewMode]
  );

  // Phase 19: Benchmark tab is View-Mode-immune per NAAC manual semantics.
  // Strip viewMode from the filters object passed to BenchmarkPage so that
  // switching View Mode does not trigger a benchmark refetch or change values.
  const benchmarkFilters = useMemo(() => ({ ...filters }), [filters]);

  // Phase 19: Per-tab View Mode applicability map.
  // 'full'     — selector enabled, all modes available
  // 'inactive' — selector greyed out, buttons disabled
  const viewModeApplicable = (tab: typeof activeTab): boolean => {
    switch (tab) {
      case 'overview':
      case 'charts':
      case 'individual':
        return true;
      case 'comparisons':
      case 'benchmark':
      case 'reports':
      case 'rankings':
        return false;
      default:
        return false;
    }
  };

  const criterionPieMetrics = useMemo<MetricResult[]>(() => {
    if (!dashboard || !metricsCatalogue) {
      return [];
    }

    const criterionByMetricId = new Map(
      metricsCatalogue
        .filter(entry => typeof entry.criterionNumber === 'number')
        .map(entry => [entry.metricId, entry.criterionNumber as number])
    );

    const totals = new Map<number, number>();

    for (const metric of dashboard) {
      const criterionNumber = criterionByMetricId.get(metric.metricId);
      if (!criterionNumber || criterionNumber < 1 || criterionNumber > 7) {
        continue;
      }

      totals.set(criterionNumber, (totals.get(criterionNumber) || 0) + metric.value);
    }

    return Array.from({ length: 7 }, (_, index) => {
      const criterionNumber = index + 1;
      return {
        metricId: `criterion-${criterionNumber}`,
        metricName: `Criterion ${criterionNumber} — ${CRITERION_TITLES[criterionNumber]}`,
        value: Number((totals.get(criterionNumber) || 0).toFixed(2)),
      };
    });
  }, [dashboard, metricsCatalogue]);

  const hierarchyTreemapData = useMemo(
    () => (deptPerf || []).map(dept => ({ name: dept.department, size: dept.facultyCount })),
    [deptPerf]
  );

  const publicationStackKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const department of chartDepartmentData || []) {
      Object.keys(department.publicationTypeBreakdown || {}).forEach(key => keys.add(key));
    }
    return Array.from(keys);
  }, [chartDepartmentData]);

  const publicationStackData = useMemo(
    () => (chartDepartmentData || []).map(department => ({
      name: department.department,
      ...Object.fromEntries(
        publicationStackKeys.map(key => [key, department.publicationTypeBreakdown?.[key] || 0])
      ),
    })),
    [chartDepartmentData, publicationStackKeys]
  );

  const experienceScatterData = useMemo(
    () => (chartDepartmentData || []).flatMap(department =>
      department.faculty
        .filter(faculty => typeof faculty.experienceYears === 'number' && !Number.isNaN(faculty.experienceYears))
        .map(faculty => ({
          x: faculty.experienceYears || 0,
          y: faculty.kpis['3.4.4']?.value || 0,
          name: `${faculty.facultyName} (${department.department})`,
        }))
    ),
    [chartDepartmentData]
  );

  useEffect(() => {
    let cancelled = false;

    getMetricsCatalogue()
      .then(response => {
        if (!cancelled) {
          setMetricsCatalogue(response.metrics);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'charts' || !deptPerf || deptPerf.length === 0) {
      return;
    }

    let cancelled = false;
    setChartDataLoading(true);

    Promise.all(
      deptPerf.map(department =>
        getDepartmentFacultyList(department.department, filters, { pageSize: 1000 })
      )
    )
      .then(results => {
        if (!cancelled) {
          setChartDepartmentData(results as DepartmentFacultyChartResult[]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartDepartmentData([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChartDataLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, deptPerf, filters]);

  // Phase 7: Track loaded params to prevent double-fetching on tab switches
  const [loadedParams, setLoadedParams] = useState<string>('');

  // Performance: fetch access once, independently of filters/tab — this lets
  // the filter bar and tab chrome render as soon as role/permissions are
  // known, instead of waiting on the (slower) parallel data fetch below too.
  useEffect(() => {
    getMyAccessV3()
      .then(setAccess)
      .catch(() => setError('Failed to load analytics data. Please try again.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Phase 7: Only fetch when on overview or charts tab
    if (activeTab !== 'overview' && activeTab !== 'charts') {
      return;
    }
    // Access hasn't resolved yet — the effect will re-run once it has
    // (it's a dependency below), nothing to fetch until we know the role.
    if (!access) {
      return;
    }

    const currentParams = JSON.stringify({ filters, viewMode });

    // Performance: serve straight from cache when this exact filters+viewMode
    // combination was already loaded — no network round-trip, no loading flash.
    const cached = responseCacheRef.current.get(currentParams);
    if (cached) {
      if (loadedParams !== currentParams) {
        setDashboard(cached.dashboard);
        setCoverage(cached.coverage);
        setProfileSummary(cached.profileSummary);
        setDepartments(cached.departments);
        setDeptPerf(cached.deptPerf);
        setStudentSummary(cached.studentSummary);
        setStudentDepts(cached.studentDepts);
        setProgramLevels(cached.programLevels);
        setLoadedParams(currentParams);
        setLoading(false);
      }
      return;
    }

    if (loadedParams === currentParams && dashboard !== null) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const allowed = new Set(access.accessibleEndpoints.map(e => e.key));

        // Load only permitted endpoints in parallel, passing active filters
        // as query params.
        const apiParams = toParams({ ...filters, viewMode });

        const [
          dashboardRes, coverageRes, profileRes, deptsRes, deptPerfRes,
          studentSummaryRes, studentDeptsRes, programLevelsRes,
        ] = await Promise.all([
          allowed.has('dashboard')             ? getDashboardV3(apiParams).catch(() => null)             : Promise.resolve(null),
          allowed.has('coverage')               ? getCoverageV3().catch(() => null)                        : Promise.resolve(null),
          allowed.has('profileSummary')         ? getProfileSummaryV3(apiParams).catch(() => null)         : Promise.resolve(null),
          allowed.has('departments')            ? getDepartmentsV3(apiParams).catch(() => null)            : Promise.resolve(null),
          allowed.has('departmentPerformance')  ? getDepartmentPerformanceV3(apiParams).catch(() => null)  : Promise.resolve(null),
          allowed.has('studentProfileSummary')  ? getStudentProfileSummaryV3(apiParams).catch(() => null)  : Promise.resolve(null),
          allowed.has('studentDepartments')     ? getStudentDepartmentsV3(apiParams).catch(() => null)     : Promise.resolve(null),
          allowed.has('programLevels')          ? getProgramLevelsV3(apiParams).catch(() => null)          : Promise.resolve(null),
        ]);

        setDashboard(dashboardRes);
        setCoverage(coverageRes);
        setProfileSummary(profileRes);
        setDepartments(deptsRes);
        setDeptPerf(deptPerfRes);
        setStudentSummary(studentSummaryRes);
        setStudentDepts(studentDeptsRes);
        setProgramLevels(programLevelsRes);

        responseCacheRef.current.set(currentParams, {
          dashboard: dashboardRes,
          coverage: coverageRes,
          profileSummary: profileRes,
          departments: deptsRes,
          deptPerf: deptPerfRes,
          studentSummary: studentSummaryRes,
          studentDepts: studentDeptsRes,
          programLevels: programLevelsRes,
        });

        setLoadedParams(currentParams);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr.response?.status === 403) {
            setError('You do not have permission to access analytics.');
          } else {
            setError('Failed to load analytics data. Please try again.');
          }
        } else {
          setError('Failed to load analytics data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters, viewMode, activeTab, access, dashboard, loadedParams]);

  const scopeLabel = () => {
    if (!access) return '';
    if (access.department) return ` — ${access.department} Department`;
    if (access.scopeLevel === 'university') return ' — University-wide';
    if (access.scopeLevel === 'institution') return ' — Institution-wide';
    if (access.scopeLevel === 'full') return ' — All Data';
    return '';
  };

  return (
    <AppLayout title={`Analytics${scopeLabel()}`}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {error && <ErrorMessage message={error} />}

        {/* Performance: access resolves fast and independently of data —
            show a skeleton rather than a blank page during that brief window. */}
        {!error && !access && <SkeletonDashboard />}

        {!error && access && access.accessibleEndpoints.length === 0 && (
          <ErrorMessage message="Analytics views are not available for your role." />
        )}

        {/* Performance: filter bar + tabs render as soon as access resolves —
            they no longer wait on the (slower) parallel data fetch below. */}
        {!error && access && access.accessibleEndpoints.length > 0 && (
          <>
            {/* ── V2: Filter Bar ── */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <FilterBarV3 value={filters} onChange={setFilters} />
              </div>
              <ViewModeSelector
                value={viewMode}
                onChange={setViewMode}
                inactive={!viewModeApplicable(activeTab)}
                inactiveLabel="Not applicable on this tab"
              />
            </div>

            {/* Phase 13: HOD gets a distinct layout; all other roles get the standard tab set */}
            {access.role === 'hod' && access.department ? (
              <HODAnalyticsView
                deptName={access.department}
                filters={filters}
                memoizedFilters={memoizedFilters}
                deptPerf={deptPerf}
              />
            ) : (
              <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
              {(['overview', 'charts', 'comparisons', 'benchmark', 'reports', 'individual', 'rankings'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 18px', fontSize: '0.9rem', fontWeight: activeTab === tab ? 700 : 400,
                    color: activeTab === tab ? 'var(--primary, #2563eb)' : '#64748b',
                    borderBottom: activeTab === tab ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
                    marginBottom: -2, textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Skeleton: shown only while the active tab has no data yet
                (first visit to that filters+viewMode combination). */}
            {loading && (activeTab === 'overview' || activeTab === 'charts') && dashboard === null && deptPerf === null && (
              <SkeletonDashboard />
            )}

            {/* ── Overview tab (all existing V1 sections — untouched) ── */}
            {visitedTabs.overview && (
              <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                <>
                  {/* ── Profile Summary ── */}
                  {profileSummary && (
                    <>
                      <SectionHeading title="Faculty Profile Completion" />
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <StatCard label="Total Faculty"         value={profileSummary.totalFaculty} />
                        <StatCard label="Completed Profiles"    value={profileSummary.completedProfiles} />
                        <StatCard label="Incomplete Profiles"   value={profileSummary.incompleteProfiles} />
                        <StatCard label="Avg. Completion (%)"   value={profileSummary.averageCompletion} />
                      </div>
                    </>
                  )}

                  {/* ── Dashboard (metrics) ── */}
                  {dashboard && dashboard.length > 0 && (
                    <>
                      <SectionHeading title="Metrics Overview" />
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {dashboard.map(m => (
                          <StatCard key={m.metricId} label={m.metricName} value={m.value} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Coverage ── */}
                  {coverage && coverage.length > 0 && (
                    <>
                      <SectionHeading title="Data Coverage" />
                      <SimpleTable
                        rows={coverage as unknown as Record<string, unknown>[]}
                        columns={[
                          { key: 'metricName'      as never, label: 'Metric'           },
                          { key: 'recordsFound'    as never, label: 'Records Found'    },
                          { key: 'totalFaculty'    as never, label: 'Total Faculty'    },
                          { key: 'coveragePercent' as never, label: 'Coverage (%)'     },
                        ]}
                      />
                    </>
                  )}

                  {/* ── Department Performance ── */}
                  {deptPerf && deptPerf.length > 0 && (
                    <>
                      <SectionHeading title="Department Performance" />
                      <SimpleTable
                        rows={deptPerf.map(d => ({ ...d, funding: formatFunding(d.funding) })) as unknown as Record<string, unknown>[]}
                        columns={[
                          { key: 'department'        as never, label: 'Department'           },
                          { key: 'facultyCount'      as never, label: 'Faculty'              },
                          { key: 'averageCompletion' as never, label: 'Avg. Completion (%)'  },
                          { key: 'publications'      as never, label: 'Publications'          },
                          { key: 'projects'          as never, label: 'Projects'              },
                          { key: 'patents'           as never, label: 'Patents'               },
                          { key: 'funding'           as never, label: 'Research Funding'      },
                        ]}
                      />
                    </>
                  )}

                  {/* ── Departments summary (if dept perf not available) ── */}
                  {departments && !deptPerf && departments.length > 0 && (
                    <>
                      <SectionHeading title="Departments" />
                      <SimpleTable
                        rows={departments as unknown as Record<string, unknown>[]}
                        columns={[
                          { key: 'department'        as never, label: 'Department'           },
                          { key: 'facultyCount'      as never, label: 'Faculty Count'        },
                          { key: 'averageCompletion' as never, label: 'Avg. Completion (%)'  },
                        ]}
                      />
                    </>
                  )}

                  {/* ── Student Profile Summary ── */}
                  {studentSummary && (
                    <>
                      <SectionHeading title="Student Profile Completion" />
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <StatCard label="Total Students"      value={studentSummary.totalStudents} />
                        <StatCard label="Complete Profiles"   value={studentSummary.completeProfiles} />
                        <StatCard label="Incomplete Profiles" value={studentSummary.incompleteProfiles} />
                        <StatCard label="Avg. Completion (%)" value={studentSummary.averageCompletion} />
                      </div>
                    </>
                  )}

                  {/* ── Student Departments ── */}
                  {studentDepts && studentDepts.length > 0 && (
                    <>
                      <SectionHeading title="Students by Department" />
                      <SimpleTable
                        rows={studentDepts as unknown as Record<string, unknown>[]}
                        columns={[
                          { key: 'department' as never, label: 'Department'    },
                          { key: 'students'   as never, label: 'Student Count' },
                        ]}
                      />
                    </>
                  )}

                  {/* ── Program Levels ── */}
                  {programLevels && programLevels.length > 0 && (
                    <>
                      <SectionHeading title="Students by Program Level" />
                      <SimpleTable
                        rows={programLevels as unknown as Record<string, unknown>[]}
                        columns={[
                          { key: 'programLevel' as never, label: 'Program Level'  },
                          { key: 'students'     as never, label: 'Student Count'  },
                        ]}
                      />
                    </>
                  )}
                </>
              </div>
            )}

            {/* ── Charts tab (V2 — additive) ── */}
            {visitedTabs.charts && (
              <div style={{ display: activeTab === 'charts' ? 'block' : 'none' }}>
                <>
                  {/* Department performance: comparison charts when multiple
                      (or zero) departments are selected, department-specific
                      analytics when exactly one is selected (Task 2). */}
                  {deptPerf && deptPerf.length > 0 && (
                    singleSelectedDept ? (
                      <>
                        <SectionHeading title={`${singleSelectedDept} — Department Analytics`} />
                        {(() => {
                          const dept = deptPerf.find(d => d.department === singleSelectedDept);
                          if (!dept) {
                            return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No data available for this department.</p>;
                          }
                          return (
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                              <StatCard label="Faculty"                 value={dept.facultyCount} />
                              <StatCard label="Avg. Completion (%)"     value={dept.averageCompletion} />
                              <StatCard label="Publications"            value={dept.publications} />
                              <StatCard label="Projects"                value={dept.projects} />
                              <StatCard label="Patents"                 value={dept.patents} />
                              <StatCard label="Research Funding"        value={formatFunding(dept.funding)} />
                            </div>
                          );
                        })()}
                        {selectedFaculty ? (
                          <FacultyProfileAnalytics
                            facultyId={selectedFaculty}
                            onBack={() => setSelectedFaculty(null)}
                          />
                        ) : (
                          <DepartmentFacultyList
                            deptName={singleSelectedDept}
                            filters={filters}
                            onSelectFaculty={setSelectedFaculty}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <SectionHeading title="Publications by Department" />
                        <DepartmentBarChart
                          data={deptPerf.map(d => ({ department: d.department, value: d.publications }))}
                          valueLabel="Publications"
                          color="#2563eb"
                        />
                        <SectionHeading title="Research Funding by Department (₹)" />
                        {deptPerf.every(d => d.funding === null || d.funding === undefined) ? (
                          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No funding data available.</p>
                        ) : (
                          <DepartmentBarChart
                            data={deptPerf.map(d => ({ department: d.department, value: d.funding ?? 0 }))}
                            valueLabel="Funding (₹)"
                            color="#16a34a"
                          />
                        )}
                      </>
                    )
                  )}

                  {/* Coverage heatmap */}
                  {coverage && coverage.length > 0 && (
                    <>
                      <SectionHeading title="Data Coverage Heatmap" />
                      <CoverageHeatMap data={coverage} />
                    </>
                  )}

                  {/* Metrics pie */}
                  {dashboard && dashboard.length > 0 && (
                    <>
                      <SectionHeading title="Criterion Value Distribution" />
                      <div style={{ maxWidth: 480 }}>
                        <CriterionPieChart metrics={criterionPieMetrics} />
                      </div>
                    </>
                  )}

                  {/* Student departments donut */}
                  {studentDepts && studentDepts.length > 0 && (
                    <>
                      <SectionHeading title="Students by Department" />
                      <div style={{ maxWidth: 480 }}>
                        <CategoryDonutChart
                          data={studentDepts.map(d => ({ name: d.department, value: d.students }))}
                        />
                      </div>
                    </>
                  )}

                  {deptPerf && deptPerf.length > 0 && (
                    <>
                      <SectionHeading title="Faculty Size Treemap" />
                      <HierarchyTreemap data={hierarchyTreemapData} height={320} />
                    </>
                  )}

                  {chartDataLoading && (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading chart insights…</p>
                  )}

                  {!chartDataLoading && publicationStackData.length > 0 && publicationStackKeys.length > 0 && (
                    <>
                      <SectionHeading title="Publication Type Mix by Department" />
                      <StackedBarChart data={publicationStackData} stacks={publicationStackKeys} height={340} />
                    </>
                  )}

                  {!chartDataLoading && experienceScatterData.length > 0 && (
                    <>
                      <SectionHeading title="Experience vs Publications" />
                      <CorrelationScatterChart
                        data={experienceScatterData}
                        xAxisLabel="Experience (Years)"
                        yAxisLabel="Publications"
                        height={340}
                      />
                    </>
                  )}

                  {/* V2: drill-down quick-launch buttons */}
                  <SectionHeading title="Drill-Down" />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    {['publications', 'projects', 'patents', 'faculty'].map(kpi => (
                      <button
                        key={kpi}
                        type="button"
                        onClick={() => setDrilldownKpi(drilldownKpi === kpi ? null : kpi)}
                        style={{
                          background: drilldownKpi === kpi ? 'var(--primary, #2563eb)' : '#f1f5f9',
                          color: drilldownKpi === kpi ? '#fff' : '#334155',
                          border: '1px solid #e2e8f0', borderRadius: 8,
                          padding: '7px 16px', fontSize: '0.85rem',
                          cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize',
                        }}
                      >
                        {kpi}
                      </button>
                    ))}
                  </div>
                  {drilldownKpi && (
                    <DrilldownTable
                      kpi={drilldownKpi}
                      filters={filters}
                      onClose={() => setDrilldownKpi(null)}
                    />
                  )}
                </>
              </div>
            )}

            {/* ── Comparisons tab ── */}
            {visitedTabs.comparisons && (
              <div style={{ display: activeTab === 'comparisons' ? 'block' : 'none' }}>
                <>
                  <SectionHeading title="Data Comparisons" />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
                    Compare metrics across time periods, faculties, and departments.
                  </p>
                  <ComparisonPanel filters={memoizedFilters} />
                </>
              </div>
            )}

            {/* ── Benchmark tab ── */}
            {visitedTabs.benchmark && (
              <div style={{ display: activeTab === 'benchmark' ? 'block' : 'none' }}>
                <>
                  <SectionHeading title="NAAC Benchmark Analysis" />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
                    Compares current institution metrics against NAAC benchmark thresholds.
                  </p>
                  <BenchmarkPage filters={benchmarkFilters} />
                </>
              </div>
            )}

            {/* ── Reports tab (V2 — Phase 7) ── */}
            {visitedTabs.reports && (
              <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
                <>
                  <SectionHeading title="Generate Reports" />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
                    Download institution analytics reports in PDF, Excel, or CSV format.
                  </p>
                  <ReportsPage filters={filters} />
                </>
              </div>
            )}

            {/* ── Individual tab (Phase 12) ── */}
            {visitedTabs.individual && (
              <div style={{ display: activeTab === 'individual' ? 'block' : 'none' }}>
                <>
                  <SectionHeading title="Individual Faculty Analytics" />
                  {selectedFaculty ? (
                    <FacultyProfileAnalytics
                      facultyId={selectedFaculty}
                      onBack={() => setSelectedFaculty(null)}
                    />
                  ) : selectedDept ? (
                    <DepartmentFacultyList
                      deptName={selectedDept}
                      filters={filters}
                      onSelectFaculty={setSelectedFaculty}
                    />
                  ) : (
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
                        {access?.department
                          ? 'Select a department to view faculty analytics.'
                          : 'Select a department to view its faculty list and individual analytics.'}
                      </p>
                      {access?.department && (
                        <button
                          type="button"
                          onClick={() => setSelectedDept(access.department!)}
                          style={{
                            background: 'var(--primary,#2563eb)', color: '#fff',
                            border: 'none', borderRadius: 8, padding: '8px 20px',
                            fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, marginBottom: 16,
                          }}
                        >
                          View {access.department} Department
                        </button>
                      )}
                      {deptPerf && deptPerf.length > 0 && !access?.department && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {deptPerf.map(d => (
                            <button
                              key={d.department}
                              type="button"
                              onClick={() => setSelectedDept(d.department)}
                              style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                                padding: '12px 20px', cursor: 'pointer', fontSize: '0.9rem',
                                color: 'var(--navy,#1e3a5f)', fontWeight: 500,
                              }}
                            >
                              {d.department}
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                {d.facultyCount} faculty
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!deptPerf && (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          Load the Overview tab first to see available departments.
                        </p>
                      )}
                    </div>
                  )}
                </>
              </div>
            )}

            {/* ── Rankings tab (Phase 18) ── */}
            {visitedTabs.rankings && (
              <div style={{ display: activeTab === 'rankings' ? 'block' : 'none' }}>
                <>
                  <SectionHeading title="Department Rankings" />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
                    Rank all departments by any metric. Toggle between absolute and per-faculty values.
                  </p>
                  <DepartmentRankingView filters={filters} />
                </>
              </div>
            )}

            </> /* close non-HOD else branch */
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
