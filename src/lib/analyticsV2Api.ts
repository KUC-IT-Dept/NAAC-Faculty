/**
 * analyticsV2Api.ts
 *
 * Typed wrapper functions for all Analytics V2 endpoints.
 * Follows the exact same pattern as analyticsApi.ts — reuses the
 * shared `api` axios instance (not modified) for automatic token
 * attachment, base URL resolution, and 401 redirect.
 */

import api from './api';

// ── Filter types ──────────────────────────────────────────────────────────────

/**
 * All filter parameters are optional; absent params are simply omitted.
 *
 * Multi-select fields (department, pubType, projectCategory, fundingAgency,
 * qualification, awardCategory) accept either a single string (legacy,
 * unchanged shape) or a string[] when multiple values are selected.
 * `toParams()` serializes an array as a comma-joined string, which the
 * backend's `buildFacultyFilter()` splits back into an array — single-value
 * selections still travel as a plain string with no wrapping, so nothing
 * about the existing single-select call paths changes.
 */
export interface AnalyticsFilters {
  /** e.g. "Computer Science" — multi-select */
  department?:      string | string[];
  /** e.g. "Professor" */
  designation?:     string;
  /** Publication year, e.g. "2024" */
  year?:            string;
  /** Journal category, e.g. "Scopus" */
  category?:        string;
  /** Publication level, e.g. "International" */
  level?:           string;
  /** Publication type, e.g. "Journal Articles" — multi-select */
  pubType?:         string | string[];
  /** Project category, e.g. "Major" — multi-select */
  projectCategory?: string | string[];
  /** Project status, e.g. "Ongoing" */
  projectStatus?:   string;
  /** Funding agency, e.g. "SERB" — multi-select */
  fundingAgency?:   string | string[];
  /** Project start date lower bound (ISO date string) */
  from?:            string;
  /** Project start date upper bound (ISO date string) */
  to?:              string;
  /** Patent status, e.g. "Granted" */
  patentStatus?:    string;
  /** Student program level */
  program?:         string;
  /** Student department */
  studentDept?:     string;
  // ── V3 additions (optional, backward-compatible) ──────────────────────────
  /** Single faculty lookup by MongoDB _id or username */
  facultyId?:       string;
  /** Filter by qualification degree level, e.g. "Ph.D" — multi-select */
  qualification?:   string | string[];
  /** Minimum years of experience (inclusive) */
  minExperience?:   string;
  /** Maximum years of experience (inclusive) */
  maxExperience?:   string;
  /** Award category, e.g. "National" — multi-select */
  awardCategory?:   string | string[];
  /** V3 Normalization view mode */
  viewMode?:        string;
}

/**
 * Convert a filters object to URL query string params.
 * Array values (multi-select filters) are joined into a comma-separated
 * string — `String(['CS','ECE'])` already yields `"CS,ECE"`, and the
 * backend's `toArray()` helper splits it back apart.
 */
export function toParams(filters?: AnalyticsFilters): Record<string, string> {
  if (!filters) return {};
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => [k, String(v)])
  );
}

// ── Response types ────────────────────────────────────────────────────────────

export interface FilterOptions {
  departments:       string[];
  designations:      string[];
  publicationYears:  string[];
  journalCategories: string[];
  publicationLevels: string[];
  publicationTypes:  string[];
  projectCategories: string[];
  projectStatuses:   string[];
  fundingAgencies:   string[];
  patentStatuses:    string[];
  programLevels:     string[];
}

export interface DrilldownResult {
  kpi:        string;
  total:      number;
  page:       number;
  pageSize:   number;
  records:    Record<string, unknown>[];
}

export interface BenchmarkEntry {
  metricId:       string;
  metricName:     string;
  criterion:      string;
  currentValue:   number;
  benchmarkValue: number;
  gap:            number;
  status:         'above' | 'meets' | 'below' | 'unknown';
  recommendation: string;
}

export interface TrendResult {
  type:    string;
  periods: string[];
  series:  { label: string; data: number[] }[];
}

export interface Recommendation {
  metricId:   string;
  metricName: string;
  criterion:  string;
  priority:   'high' | 'medium' | 'low';
  message:    string;
}

export interface ReportType {
  key:         string;
  label:       string;
  description: string;
  formats:     ('pdf' | 'excel' | 'csv')[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch available filter option values for populating FilterBar dropdowns. */
export const getFilterOptions = (filters?: AnalyticsFilters): Promise<FilterOptions> =>
  api.get('/analytics/filters/options', { params: toParams(filters) }).then(r => r.data);

/** Fetch drill-down record list for a KPI. */
export const getDrilldown = (
  kpi: string,
  filters?: AnalyticsFilters,
  search?: string,
  sort?: string,
  page = 1,
  pageSize = 25
): Promise<DrilldownResult> =>
  api.get(`/analytics/drilldown/${kpi}`, {
    params: { ...toParams(filters), search, sort, page, pageSize },
  }).then(r => r.data);

/** Get the export URL for a drill-down (triggers download in browser). */
export const getDrilldownExportUrl = (
  kpi: string,
  format: 'csv' | 'excel' | 'pdf',
  filters?: AnalyticsFilters
): string => {
  const token  = localStorage.getItem('iqac_token') || '';
  const params = new URLSearchParams({ ...toParams(filters), format, authorization: token });
  return `/api/faculty/analytics/drilldown/${kpi}/export?${params}`;
};

/** Fetch all metrics vs benchmark thresholds. */
export const getBenchmarks = (filters?: AnalyticsFilters): Promise<BenchmarkEntry[]> =>
  api.get('/analytics/benchmark', { params: toParams(filters) }).then(r => r.data);

/** Fetch single-metric benchmark detail. */
export const getMetricBenchmark = (metricId: string, filters?: AnalyticsFilters): Promise<BenchmarkEntry> =>
  api.get(`/analytics/benchmark/${metricId}`, { params: toParams(filters) }).then(r => r.data);

/** Fetch trend/comparison data. */
export const getTrend = (
  type: 'yearOverYear' | 'deptVsDept' | 'facultyVsFaculty' | 'fiveYear',
  filters?: AnalyticsFilters
): Promise<TrendResult> =>
  api.get('/analytics/trend', { params: { ...toParams(filters), type } }).then(r => r.data);

/** Fetch rule-based recommendations. */
export const getRecommendations = (filters?: AnalyticsFilters): Promise<Recommendation[]> =>
  api.get('/analytics/recommendations', { params: toParams(filters) }).then(r => r.data);

/** List report types available to the caller's role. */
export const getReportTypes = (): Promise<ReportType[]> =>
  api.get('/analytics/reports/types').then(r => r.data);

/**
 * Trigger report download in the browser.
 * Returns a URL — assign to window.location.href or an <a> href to start download.
 */
export const getReportDownloadUrl = (
  reportType: string,
  format: 'pdf' | 'excel' | 'csv',
  filters?: AnalyticsFilters
): string => {
  const token  = localStorage.getItem('iqac_token') || '';
  const params = new URLSearchParams({ ...toParams(filters), format, authorization: token });
  return `/api/faculty/analytics/reports/${reportType}/generate?${params}`;
};
