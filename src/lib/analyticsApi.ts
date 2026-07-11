/**
 * analyticsApi.ts
 *
 * Thin wrapper functions for all analytics API endpoints.
 * Reuses the shared `api` axios instance from api.ts (token attachment,
 * base URL, and 401 redirect are all handled automatically).
 *
 * Usage:
 *   import { getMyAccess, getDashboard } from '../lib/analyticsApi';
 */

import api from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AccessibleEndpoint {
  key: string;
  scopeLevel: 'self' | 'department' | 'university' | 'institution' | 'full';
}

export interface MyAccessResponse {
  role: string;
  scopeLevel: string | null;
  department: string | null;
  accessibleEndpoints: AccessibleEndpoint[];
}

export interface MetricResult {
  metricId: string;
  metricName: string;
  value: number;
}

export interface CoverageItem {
  metricId: string;
  metricName: string;
  recordsFound: number;
  totalFaculty: number;
  coveragePercent: number;
  available: boolean;
}

export interface ProfileCompletionItem {
  facultyName: string;
  department: string;
  profileComplete: boolean;
  completionPercentage: number;
}

export interface ProfileSummary {
  totalFaculty: number;
  completedProfiles: number;
  incompleteProfiles: number;
  averageCompletion: number;
}

export interface DepartmentSummary {
  department: string;
  facultyCount: number;
  averageCompletion: number;
}

export interface DepartmentPerformance {
  department: string;
  facultyCount: number;
  averageCompletion: number;
  publications: number;
  projects: number;
  patents: number;
  /** null when funding data/metric is unavailable — distinct from a real ₹0 */
  funding: number | null;
}

export interface StudentProfileCompletion {
  student: string;
  completion: number;
}

export interface StudentProfileSummary {
  totalStudents: number;
  averageCompletion: number;
  completeProfiles: number;
  incompleteProfiles: number;
}

export interface StudentDepartment {
  department: string;
  students: number;
}

export interface ProgramLevel {
  programLevel: string;
  students: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Discover which analytics views the current user may access. */
export const getMyAccess = (): Promise<MyAccessResponse> =>
  api.get('/analytics/my-access').then(r => r.data);

/** All metric metadata. */
export const getMetrics = (): Promise<MetricResult[]> =>
  api.get('/analytics/metrics').then(r => r.data);

/** Coverage report across all metrics. */
export const getCoverage = (): Promise<CoverageItem[]> =>
  api.get('/analytics/coverage').then(r => r.data);

/** Single metric value by ID. */
export const getMetric = (metricId: string): Promise<MetricResult> =>
  api.get(`/analytics/metric/${metricId}`).then(r => r.data);

/** Full dashboard — all metrics with values. */
export const getDashboard = (params?: Record<string, unknown>): Promise<MetricResult[]> =>
  api.get('/analytics/dashboard', { params }).then(r => r.data);

/** Per-faculty profile completion list. */
export const getProfileCompletion = (): Promise<ProfileCompletionItem[]> =>
  api.get('/analytics/profile-completion').then(r => r.data);

/** Institution-level profile completion summary. */
export const getProfileSummary = (params?: Record<string, unknown>): Promise<ProfileSummary> =>
  api.get('/analytics/profile-summary', { params }).then(r => r.data);

/** Department list with faculty count and average completion. */
export const getDepartments = (params?: Record<string, unknown>): Promise<DepartmentSummary[]> =>
  api.get('/analytics/departments', { params }).then(r => r.data);

/** Department performance including research metrics. */
export const getDepartmentPerformance = (params?: Record<string, unknown>): Promise<DepartmentPerformance[]> =>
  api.get('/analytics/department-performance', { params }).then(r => r.data);

/** Per-student profile completion. */
export const getStudentProfileCompletion = (): Promise<StudentProfileCompletion[]> =>
  api.get('/analytics/student-profile-completion').then(r => r.data);

/** Student profile completion summary. */
export const getStudentProfileSummary = (params?: Record<string, unknown>): Promise<StudentProfileSummary> =>
  api.get('/analytics/student-profile-summary', { params }).then(r => r.data);

/** Student distribution by department. */
export const getStudentDepartments = (params?: Record<string, unknown>): Promise<StudentDepartment[]> =>
  api.get('/analytics/student-departments', { params }).then(r => r.data);

/** Student distribution by program level. */
export const getProgramLevels = (params?: Record<string, unknown>): Promise<ProgramLevel[]> =>
  api.get('/analytics/program-levels', { params }).then(r => r.data);
