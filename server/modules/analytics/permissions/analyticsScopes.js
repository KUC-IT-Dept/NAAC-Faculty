/**
 * analyticsScopes.js
 *
 * Single source of truth for analytics access control.
 *
 * Structure:
 *   ANALYTICS_SCOPES[role][endpointKey] = scope level string
 *
 * Scope levels (narrowest → broadest):
 *   'self'        — own records only (faculty viewing their own data)
 *   'department'  — all records in the user's department (HOD)
 *   'university'  — all departments, university-wide aggregates (VC)
 *   'institution' — full institutional / NAAC-oriented view (IQAC Director)
 *   'full'        — unrestricted, including administrative views (admin/superadmin)
 *
 * Endpoint keys correspond 1-to-1 with route definitions in
 *   server/modules/faculty/routes/analytics.js
 *
 * To add a new role or endpoint: add a row/key here only.
 * Nothing else needs to change.
 */

// ── Endpoint keys ────────────────────────────────────────────────────────────
// These must stay in sync with the route paths in analytics.js.
// Named as camelCase keys for ease of use in requireAnalyticsScope().
const ENDPOINT_KEYS = [
  // ── V1 keys (do not rename or remove) ──────────────────────────────────
  'metrics',
  'coverage',
  'metric',               // /metric/:metricId
  'dashboard',
  'profileCompletion',    // /profile-completion
  'profileSummary',       // /profile-summary
  'departments',
  'departmentPerformance',// /department-performance
  'studentProfileCompletion', // /student-profile-completion
  'studentProfileSummary',    // /student-profile-summary
  'studentDepartments',       // /student-departments
  'programLevels',            // /program-levels

  // ── V2 keys (additive) ──────────────────────────────────────────────────
  'filterOptions',        // /filters/options
  'drilldown',            // /drilldown/:kpi
  'benchmark',            // /benchmark  and  /benchmark/:metricId
  'trend',                // /trend
  'recommendations',      // /recommendations
  'reportTypes',          // /reports/types
  'reportGenerate',       // /reports/:reportType/generate

  // ── V3 keys (additive) ──────────────────────────────────────────────────
  'metricsCatalogue',     // /metrics-catalogue
  'normalized',           // /normalized/:metricId
  'facultyProfile',       // /faculty/:facultyId/profile-analytics
  'comparisons',          // /comparisons/*
  'departmentBenchmark',  // /benchmark/department/:deptName
  'export',               // /export (generic ad-hoc export)
  // Phase 18 additions
  'rankings',             // /rankings/:metricId
];

// ── Scope configuration table ─────────────────────────────────────────────────
//
// Format:
//   ANALYTICS_SCOPES[role] = { endpointKey: scopeLevel, ... }
//
// A missing key for a role means that role is NOT permitted for that endpoint.
// A role not present in ANALYTICS_SCOPES at all is denied on all endpoints.

const ANALYTICS_SCOPES = {

  // ── faculty ───────────────────────────────────────────────────────────────
  // Faculty can only view their own profile completion — not aggregates.
  faculty: {
    profileCompletion: 'self',
    // V2: faculty can see filter options (to populate their own filter bar)
    filterOptions:     'self',
    // V3: faculty can view their own individual profile analytics
    facultyProfile:    'self',
  },

  // ── hod ───────────────────────────────────────────────────────────────────
  // HOD sees department-scoped analytics only.
  hod: {
    metrics:                    'department',
    coverage:                   'department',
    metric:                     'department',
    dashboard:                  'department',
    profileCompletion:          'department',
    profileSummary:             'department',
    departments:                'department',
    departmentPerformance:      'department',
    // V2 additions
    filterOptions:              'department',
    drilldown:                  'department',
    benchmark:                  'department',
    trend:                      'department',
    recommendations:            'department',
    reportTypes:                'department',
    reportGenerate:             'department',
    // V3 additions
    metricsCatalogue:           'department',
    normalized:                 'department',
    facultyProfile:             'department',
    comparisons:                'department',
    departmentBenchmark:        'department',
    export:                     'department',
    // Phase 18 additions
    rankings:                   'department',
  },

  // ── vc ────────────────────────────────────────────────────────────────────
  // VC sees university-wide (unfiltered) analytics.
  vc: {
    metrics:                    'university',
    coverage:                   'university',
    metric:                     'university',
    dashboard:                  'university',
    profileCompletion:          'university',
    profileSummary:             'university',
    departments:                'university',
    departmentPerformance:      'university',
    studentProfileCompletion:   'university',
    studentProfileSummary:      'university',
    studentDepartments:         'university',
    programLevels:              'university',
    // V2 additions
    filterOptions:              'university',
    drilldown:                  'university',
    benchmark:                  'university',
    trend:                      'university',
    recommendations:            'university',
    reportTypes:                'university',
    reportGenerate:             'university',
    // V3 additions
    metricsCatalogue:           'university',
    normalized:                 'university',
    facultyProfile:             'university',
    comparisons:                'university',
    departmentBenchmark:        'university',
    export:                     'university',
    // Phase 18 additions
    rankings:                   'university',
  },

  // ── iqac_director ─────────────────────────────────────────────────────────
  // IQAC Director: full institutional view (same data boundary as vc for now,
  // distinct scope level so future IQAC-specific views can diverge).
  iqac_director: {
    metrics:                    'institution',
    coverage:                   'institution',
    metric:                     'institution',
    dashboard:                  'institution',
    profileCompletion:          'institution',
    profileSummary:             'institution',
    departments:                'institution',
    departmentPerformance:      'institution',
    studentProfileCompletion:   'institution',
    studentProfileSummary:      'institution',
    studentDepartments:         'institution',
    programLevels:              'institution',
    // V2 additions
    filterOptions:              'institution',
    drilldown:                  'institution',
    benchmark:                  'institution',
    trend:                      'institution',
    recommendations:            'institution',
    reportTypes:                'institution',
    reportGenerate:             'institution',
    // V3 additions
    metricsCatalogue:           'institution',
    normalized:                 'institution',
    facultyProfile:             'institution',
    comparisons:                'institution',
    departmentBenchmark:        'institution',
    export:                     'institution',
    // Phase 18 additions
    rankings:                   'institution',
  },

  // ── admin ─────────────────────────────────────────────────────────────────
  // Admin: full unrestricted access.
  admin: {
    metrics:                    'full',
    coverage:                   'full',
    metric:                     'full',
    dashboard:                  'full',
    profileCompletion:          'full',
    profileSummary:             'full',
    departments:                'full',
    departmentPerformance:      'full',
    studentProfileCompletion:   'full',
    studentProfileSummary:      'full',
    studentDepartments:         'full',
    programLevels:              'full',
    // V2 additions
    filterOptions:              'full',
    drilldown:                  'full',
    benchmark:                  'full',
    trend:                      'full',
    recommendations:            'full',
    reportTypes:                'full',
    reportGenerate:             'full',
    // V3 additions
    metricsCatalogue:           'full',
    normalized:                 'full',
    facultyProfile:             'full',
    comparisons:                'full',
    departmentBenchmark:        'full',
    export:                     'full',
    // Phase 18 additions
    rankings:                   'full',
  },

  // ── superadmin ────────────────────────────────────────────────────────────
  // Superadmin: same as admin.
  superadmin: {
    metrics:                    'full',
    coverage:                   'full',
    metric:                     'full',
    dashboard:                  'full',
    profileCompletion:          'full',
    profileSummary:             'full',
    departments:                'full',
    departmentPerformance:      'full',
    studentProfileCompletion:   'full',
    studentProfileSummary:      'full',
    studentDepartments:         'full',
    programLevels:              'full',
    // V2 additions
    filterOptions:              'full',
    drilldown:                  'full',
    benchmark:                  'full',
    trend:                      'full',
    recommendations:            'full',
    reportTypes:                'full',
    reportGenerate:             'full',
    // V3 additions
    metricsCatalogue:           'full',
    normalized:                 'full',
    facultyProfile:             'full',
    comparisons:                'full',
    departmentBenchmark:        'full',
    export:                     'full',
    // Phase 18 additions
    rankings:                   'full',
  },
};

// ── Scope utility helpers ─────────────────────────────────────────────────────

/**
 * Returns the scope level for a given role + endpoint key, or null if denied.
 *
 * @param {string} role         - Value of req.user.role
 * @param {string} endpointKey  - One of the ENDPOINT_KEYS constants above
 * @returns {string|null}       - Scope level string, or null if not permitted
 */
function getScopeLevel(role, endpointKey) {
  const roleScopes = ANALYTICS_SCOPES[role];
  if (!roleScopes) return null;
  return roleScopes[endpointKey] || null;
}

/**
 * Returns true if the scope level requires unfiltered (institution-wide) data.
 * Used by route handlers to decide whether to apply a department filter.
 *
 * @param {string} scopeLevel
 * @returns {boolean}
 */
function isUnfilteredScope(scopeLevel) {
  return ['university', 'institution', 'full'].includes(scopeLevel);
}

module.exports = {
  ANALYTICS_SCOPES,
  ENDPOINT_KEYS,
  getScopeLevel,
  isUnfilteredScope,
};
