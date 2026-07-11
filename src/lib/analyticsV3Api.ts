/**
 * analyticsV3Api.ts — Typed wrappers for Analytics V3 endpoints.
 * Reuses the shared `api` axios instance from api.ts (unmodified).
 */
import api from './api';
import type { AnalyticsFilters } from './analyticsV2Api';

function toParams(f?: AnalyticsFilters): Record<string, string> {
  if (!f) return {};
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
  );
}

export interface ViewModes {
  absolute: boolean; normalized: boolean; individual: boolean;
  trend: boolean; benchmark: boolean; comparison: boolean;
  drilldown: boolean; export: boolean;
}

export interface CatalogueEntry {
  metricId: string; metricName: string; criterion: string;
  criterionNumber: number | null; description: string;
  formulaType: string; sourceField: string | null;
  unit: string; viewModes: ViewModes;
  recommendedChart: string; supported: boolean; isNormalized: boolean;
}

export interface CatalogueResponse { total: number; metrics: CatalogueEntry[]; }

export interface NormalizedResult {
  metricId: string; metricName: string;
  absoluteValue: number; facultyCount: number;
  perFaculty: number; percentageOfFaculty: number;
  scope: { level: string; department: string | null };
  filters: Record<string, unknown> | null;
}

/** Full metrics catalogue with view-mode metadata. */
export const getMetricsCatalogue = (
  params?: { criterion?: string; formulaType?: string; supportedOnly?: boolean }
): Promise<CatalogueResponse> =>
  api.get('/analytics/metrics-catalogue', { params }).then(r => r.data);

/** Extended filter options (V3) — includes qualifications + experienceRange. */
export interface FilterOptionsV3 {
  departments:        string[];
  designations:       string[];
  publicationYears:   string[];
  journalCategories:  string[];
  publicationLevels:  string[];
  publicationTypes:   string[];
  projectCategories:  string[];
  projectStatuses:    string[];
  fundingAgencies:    string[];
  patentStatuses:     string[];
  programLevels:      string[];
  qualificationLevels:string[];
  awardCategories:    string[];
  experienceRange:    { min: number; max: number };
}

export const getFilterOptionsV3 = (filters?: AnalyticsFilters): Promise<FilterOptionsV3> =>
  api.get('/analytics/filters/options', { params: { v3: 'true', ...toParams(filters) } }).then(r => r.data);

/** Normalized (per-faculty) value for one metric. Pass "default" for the standard set. */
export const getNormalized = (
  metricId: string, filters?: AnalyticsFilters
): Promise<NormalizedResult | NormalizedResult[]> =>
  api.get(`/analytics/normalized/${metricId}`, { params: toParams(filters) }).then(r => r.data);

/** Department faculty list with headline KPIs (Phase 3). */
export const getDepartmentFacultyList = (
  deptName: string,
  filters?: AnalyticsFilters,
  extraParams?: Record<string, string | number>
) =>
  api.get(`/analytics/drilldown/department/${encodeURIComponent(deptName)}/faculty`,
    { params: { ...toParams(filters), ...extraParams } }).then(r => r.data);

/** Full cross-category analytics for one faculty (Phase 3). */
export const getFacultyProfileAnalytics = (facultyId: string) =>
  api.get(`/analytics/faculty/${facultyId}/profile-analytics`).then(r => r.data);

/** Department vs university average for a metric (Phase 5). */
export const getDepartmentVsAverage = (deptName: string, metricId: string, filters?: AnalyticsFilters) =>
  api.get('/analytics/comparisons/department-vs-average',
    { params: { deptName, metricId, ...toParams(filters) } }).then(r => r.data);

/** All metrics benchmark for one department (Phase 5). */
export const getDepartmentBenchmarks = (deptName: string, filters?: AnalyticsFilters) =>
  api.get(`/analytics/benchmark/department/${encodeURIComponent(deptName)}`,
    { params: toParams(filters) }).then(r => r.data);

// ── Phase 5 additions ─────────────────────────────────────────────────────────

export interface DeptBenchmarkEntry {
  department:        string;
  metricId:          string;
  metricName:        string;
  criterion:         string;
  currentValue:      number | null;
  benchmarkValue:    number;
  gap:               number | null;
  achievementPercent:number | null;
  status:            'above' | 'meets' | 'below' | 'unknown';
  recommendation:    string;
}

/** All benchmarks for one department. */
export const getAllDeptBenchmarks = (deptName: string, filters?: AnalyticsFilters) =>
  api.get(`/analytics/benchmark/department/${encodeURIComponent(deptName)}`,
    { params: toParams(filters) }).then(r => r.data as DeptBenchmarkEntry[]);

/** Single metric benchmark for one department. */
export const getDeptMetricBenchmark = (deptName: string, metricId: string, filters?: AnalyticsFilters) =>
  api.get(`/analytics/benchmark/department/${encodeURIComponent(deptName)}/${metricId}`,
    { params: toParams(filters) }).then(r => r.data as DeptBenchmarkEntry);

/** All departments compared for one metric (side-by-side). */
export const getAllDeptsBenchmarkForMetric = (metricId: string, filters?: AnalyticsFilters) =>
  api.get(`/analytics/benchmark/all-departments/${metricId}`,
    { params: toParams(filters) }).then(r => r.data as DeptBenchmarkEntry[]);

// ── Phase 6 additions ─────────────────────────────────────────────────────────

export const getFacultyVsDepartmentAverage = (facultyId: string, metricId: string, filters?: AnalyticsFilters) =>
  api.get('/analytics/comparisons/faculty-vs-department-average',
    { params: { facultyId, metricId, ...toParams(filters) } }).then(r => r.data);

export const getTrendV3 = (type: string, metricId?: string, filters?: AnalyticsFilters) => {
  const params: any = { type, ...toParams(filters) };
  if (metricId) params.metricId = metricId;
  return api.get('/analytics/trend', { params }).then(r => r.data);
};

// ── Phase 7 Prep (Normalization View) ─────────────────────────────────────────

export const getDashboardV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/dashboard-v3', { params: toParams(filters) }).then(r => r.data);

export const getDepartmentPerformanceV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/department-performance-v3', { params: toParams(filters) }).then(r => r.data);

export const getMyAccessV3 = () =>
  api.get('/analytics/my-access').then(r => r.data);

export const getCoverageV3 = () =>
  api.get('/analytics/coverage').then(r => r.data);

export const getProfileSummaryV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/profile-summary', { params: toParams(filters) }).then(r => r.data);

export const getDepartmentsV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/departments', { params: toParams(filters) }).then(r => r.data);

export const getStudentProfileSummaryV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/student-profile-summary', { params: toParams(filters) }).then(r => r.data);

export const getStudentDepartmentsV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/student-departments', { params: toParams(filters) }).then(r => r.data);

export const getProgramLevelsV3 = (filters?: AnalyticsFilters) =>
  api.get('/analytics/program-levels', { params: toParams(filters) }).then(r => r.data);

export const getReportTypesV3 = () =>
  api.get('/analytics/reports-v3/types').then(r => r.data);

// ── Phase 18: Department Rankings ────────────────────────────────────────────

export interface RankingEntry {
  rank: number;
  department: string;
  absoluteValue: number;
  perFacultyValue: number;
  facultyCount: number;
}

export interface RankingsResponse {
  metricId: string;
  metricName: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  viewMode: 'absolute' | 'perFaculty';
  rankings: RankingEntry[];
  totalDepartments: number;
}

/** Get department rankings for a specific metric */
export const getDepartmentRanking = (metricId: string, filters?: AnalyticsFilters): Promise<RankingsResponse> =>
  api.get(`/analytics/rankings/${metricId}`, { params: toParams(filters) }).then(r => r.data);

