/**
 * facultyProfileAnalyticsService.js
 *
 * Individual-mode analytics: aggregates all available metrics for a single
 * faculty member, and provides a department faculty list with headline KPIs.
 *
 * DESIGN PRINCIPLE — Metric-driven, not hardcoded:
 *   This service reads the Metric collection and evaluates every supported
 *   metric against a single faculty's data. Adding a new Metric document
 *   automatically extends the individual profile without code changes.
 *   No special-casing for publications vs patents vs awards.
 *
 * HOD SCOPE ENFORCEMENT:
 *   An HOD can only access faculty within their own department.
 *   This is enforced server-side in both functions — the frontend cannot
 *   bypass it by manipulating facultyId or deptName parameters.
 */

'use strict';

const Faculty = require('../../faculty/models/Faculty');
const {
  buildFacultyFilter,
  mergeFilters,
  extractExperienceFilter,
  isInExperienceRange,
} = require('./filterService');

// ── Headline KPI metric IDs shown in the department faculty list ──────────────
// These are the most universally meaningful per-faculty headline metrics.
// All are already seeded by V1 + V3 seeders — no hardcoded counts here.
const HEADLINE_METRIC_IDS = [
  '3.4.4',          // total publications
  '3.2.2',          // total projects
  '3.4.5',          // total patents
  'awards.total',   // total awards
  'fdp.total',      // FDP participations
];

// ── Metric groupings for the individual profile view ─────────────────────────
// Groups are presentation hints for the frontend — they do NOT change
// calculation logic. Any metric not matching a group lands in 'other'.
const METRIC_GROUPS = {
  'Research & Publications':       'research',
  'Research Projects':             'research',
  'Resource Mobilization':         'research',
  'Innovation & Intellectual Property': 'research',
  'Innovation & Awards':           'research',
  'Research Guidance':             'research',
  'Faculty Development':           'development',
  'Professional Engagement':       'development',
  'International Linkage':         'development',
  'Teacher Profile & Quality':     'profile',
  'Administration & Extension':    'extension',
  'Quality Assurance':             'extension',
};

// ── Helper: build a single-faculty Mongo filter ───────────────────────────────

function buildSingleFacultyFilter(facultyDoc) {
  return { _id: facultyDoc._id };
}

// ── Compute per-faculty value for one metric ──────────────────────────────────
// Inline aggregation against one faculty's sub-documents.
// This mirrors calculateMetric() logic but scoped to a single document,
// avoiding a full-collection scan for individual-mode queries.

function computeForFaculty(faculty, metric) {
  try {
    switch (metric.formulaType) {
      case 'count': {
        const arr = getNestedValue(faculty, metric.fieldPath);
        return Array.isArray(arr) ? arr.length : 0;
      }
      case 'conditionalCount': {
        const arr = getNestedValue(faculty, metric.fieldPath);
        if (!Array.isArray(arr)) return 0;
        return arr.filter(item => item[metric.conditionField] === metric.conditionValue).length;
      }
      case 'sum': {
        const arr = getNestedValue(faculty, metric.fieldPath);
        if (!Array.isArray(arr)) return 0;
        return arr.reduce((t, item) => {
          const v = parseFloat(String(item[metric.sumField] || '0').replace(/,/g, ''));
          return t + (isNaN(v) ? 0 : v);
        }, 0);
      }
      case 'objectSum': {
        const obj = getNestedValue(faculty, metric.fieldPath);
        if (!obj || typeof obj !== 'object') return 0;
        const v = parseFloat(String(obj[metric.sumField] || '0').replace(/,/g, ''));
        return isNaN(v) ? 0 : v;
      }
      case 'average': {
        const field = getNestedValue(faculty, metric.fieldPath);
        if (Array.isArray(field)) {
          // Array field — average over all sub-document entries
          let total = 0, count = 0;
          field.forEach(item => {
            const v = parseFloat(String(item[metric.sumField] || '').replace(/,/g, ''));
            if (!isNaN(v)) { total += v; count++; }
          });
          return count > 0 ? Number((total / count).toFixed(4)) : 0;
        }
        // Object field (e.g. employmentDetails) — scalar value per faculty
        if (field && typeof field === 'object') {
          const v = parseFloat(String(field[metric.sumField] || '').replace(/,/g, ''));
          return (!isNaN(v) && v >= 0) ? v : 0;
        }
        return 0;
      }
      default:
        return null; // ratio/percentage/count metrics need full-collection context
    }
  } catch {
    return null;
  }
}

// Safely read dot-notation path from object
function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((cur, key) => (cur && cur[key] !== undefined ? cur[key] : undefined), obj);
}

// ── getDepartmentFacultyList ──────────────────────────────────────────────────

/**
 * Returns faculty list for a department with headline KPI values.
 * HOD scope enforced: if scope.level === 'department', the deptName param
 * must match scope.department, otherwise 403.
 *
 * @param {string} deptName
 * @param {object} scope      - req.analyticsScope
 * @param {object} query      - req.query (supports ?page, ?pageSize, ?search)
 */
async function getDepartmentFacultyList(deptName, scope, query = {}) {
  // Scope enforcement
  if (scope.level === 'department' && scope.department) {
    if (scope.department.toLowerCase().trim() !== deptName.toLowerCase().trim()) {
      const err = new Error('Access denied: department out of scope.');
      err.status = 403;
      throw err;
    }
  }

  const page     = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(1000, Math.max(1, parseInt(query.pageSize || '25', 10)));
  const search   = (query.search || '').toLowerCase().trim();

  const userFilter = buildFacultyFilter(query);
  const { min, max, cleanFilter } = extractExperienceFilter(userFilter);
  const filter = mergeFilters(
    { 'employmentDetails.department': deptName },
    cleanFilter
  );

  const facultyRecords = await Faculty
    .find(filter)
    .select('username personalInfo.fullName employmentDetails profileComplete completionPercentage publications projects patents awards fdpWorkshops')
    .lean();

  const filteredFacultyRecords = facultyRecords.filter(f => isInExperienceRange(f, min, max));

  const { getMetrics } = require('./referenceDataCache');
  const metrics = (await getMetrics()).filter(m =>
    m.supported === true && HEADLINE_METRIC_IDS.includes(m.metricId)
  );

  const publicationTypeBreakdown = {
    'Journal Articles': 0,
    'Book Chapters': 0,
    'Books Authored / Edited': 0,
    'Conference Papers': 0,
  };

  for (const faculty of filteredFacultyRecords) {
    for (const publication of faculty.publications || []) {
      if (publication.type && publicationTypeBreakdown[publication.type] !== undefined) {
        publicationTypeBreakdown[publication.type] += 1;
      }
    }
  }

  // Build result rows
  let rows = filteredFacultyRecords.map(f => {
    const kpis = {};
    for (const m of metrics) {
      const val = computeForFaculty(f, m);
      kpis[m.metricId] = { metricName: m.metricName, value: val ?? 0 };
    }
    return {
      facultyId:            String(f._id),
      facultyName:          f.personalInfo?.fullName || f.username,
      username:             f.username,
      department:           f.employmentDetails?.department || '',
      designation:          f.employmentDetails?.designation || '',
      experienceYears:      parseFloat(f.employmentDetails?.totalExperienceYears || '0') || 0,
      profileComplete:      f.profileComplete || false,
      completionPercentage: f.completionPercentage || 0,
      kpis,
    };
  });

  // Search
  if (search) {
    rows = rows.filter(r =>
      r.facultyName.toLowerCase().includes(search) ||
      r.username.toLowerCase().includes(search) ||
      r.designation.toLowerCase().includes(search)
    );
  }

  const total   = rows.length;
  const records = rows.slice((page - 1) * pageSize, page * pageSize);

  return {
    department: deptName,
    total, page, pageSize,
    headlineMetrics: HEADLINE_METRIC_IDS,
    publicationTypeBreakdown,
    faculty: records,
  };
}

// ── getFacultyProfileAnalytics ────────────────────────────────────────────────

/**
 * Returns complete cross-category analytics for one faculty member.
 * HOD scope enforced: HOD can only view faculty in their own department.
 *
 * @param {string} facultyId  - Faculty._id or username
 * @param {object} scope
 * @param {object} query
 */
async function getFacultyProfileAnalytics(facultyId, scope, query = {}) {
  // Find the faculty record (by _id or username)
  const isObjectId = /^[a-f\d]{24}$/i.test(facultyId);
  const findQuery  = isObjectId ? { _id: facultyId } : { username: facultyId };
  const faculty    = await Faculty.findOne(findQuery).lean();
  if (!faculty) return null;

  // HOD scope enforcement — must be in same department
  if (scope.level === 'department' && scope.department) {
    const facultyDept = (faculty.employmentDetails?.department || '').toLowerCase().trim();
    const scopeDept   = scope.department.toLowerCase().trim();
    if (facultyDept !== scopeDept) {
      const err = new Error('Access denied: faculty is outside your department scope.');
      err.status = 403;
      throw err;
    }
  }

  // Load all supported metrics that work at the per-faculty level
  const { getMetrics } = require('./referenceDataCache');
  const allMetrics = (await getMetrics()).filter(m => m.supported === true);

  // Compute value per metric, grouped by criterion category
  const grouped = {};

  for (const m of allMetrics) {
    const value = computeForFaculty(faculty, m);
    if (value === null) continue; // skip ratio/percentage — needs collection context

    const group = METRIC_GROUPS[m.criterion] || 'other';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push({
      metricId:   m.metricId,
      metricName: m.metricName,
      criterion:  m.criterion,
      formulaType:m.formulaType,
      value,
    });
  }

  // Profile section completeness — which of the 24 sections have data
  const PROFILE_SECTIONS = [
    'personalInfo', 'qualifications', 'eligibilityTests', 'employmentDetails',
    'workExperience', 'publications', 'awards', 'projects', 'patents',
    'researchGuidance', 'adminResponsibilities', 'fdpWorkshops', 'onlineCourses',
    'memberships', 'internationalExperience', 'qualityAssurance',
    'departmentalCharges', 'specialAssignments', 'extraInstitutionalActivities',
    'adminNonAcademicResponsibilities', 'academicAdministration',
    'researchAndInnovation', 'examinationAndEvaluation', 'administrativeSupport',
  ];

  const sectionCompletion = PROFILE_SECTIONS.map(section => {
    const val = faculty[section];
    let filled = false;
    if (Array.isArray(val)) filled = val.length > 0;
    else if (val && typeof val === 'object') filled = Object.values(val).some(v => v && String(v).trim() !== '');
    else filled = val !== undefined && val !== null && String(val).trim() !== '';
    return { section, filled };
  });

  return {
    facultyId:            String(faculty._id),
    facultyName:          faculty.personalInfo?.fullName || faculty.username,
    username:             faculty.username,
    department:           faculty.employmentDetails?.department || '',
    designation:          faculty.employmentDetails?.designation || '',
    profileComplete:      faculty.profileComplete || false,
    completionPercentage: faculty.completionPercentage || 0,
    sectionCompletion,
    metrics: grouped,
  };
}

module.exports = { getDepartmentFacultyList, getFacultyProfileAnalytics };
