/**
 * drilldownService.js
 *
 * Returns the underlying record list for a given KPI, with server-side
 * search, sort, and pagination. This is the "drill-down" layer: where
 * the existing analytics endpoints return aggregated numbers, this
 * service returns the raw records that make up those numbers.
 *
 * Supported KPIs:
 *   publications  — faculty.publications[] entries
 *   projects      — faculty.projects[] entries
 *   patents       — faculty.patents[] entries
 *   faculty       — faculty-level records (one row per faculty member)
 *
 * This service:
 *   - Reads Faculty (and optionally StudentProfile) directly
 *   - Applies scope-based base filtering (same logic as V1 route handlers)
 *   - Applies V2 user filters via filterService
 *   - Returns paginated, searchable, sortable record lists
 *   - Never touches analyticsService.js (no duplication of formula logic)
 */

'use strict';

const Faculty        = require('../../faculty/models/Faculty');
const { buildFacultyFilter, mergeFilters } = require('./filterService');

// ── Helpers ───────────────────────────────────────────────────────────────────

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

function parsePagination(query) {
  const page     = Math.max(1, parseInt(query.page     || '1',  10));
  const pageSize = Math.min(200, Math.max(1, parseInt(query.pageSize || '25', 10)));
  return { page, pageSize };
}

// ── KPI definitions ───────────────────────────────────────────────────────────
// Each entry describes how to expand and flatten a sub-document array,
// plus which fields to include in search matching.

const KPI_CONFIG = {
  publications: {
    arrayField:    'publications',
    searchFields:  ['title', 'journal', 'authors', 'year', 'journalCategory', 'level'],
    columns: [
      'title', 'type', 'authors', 'authorRole', 'journal',
      'journalCategory', 'level', 'year', 'indexedIn', 'doi',
    ],
    sortDefault: 'year',
  },
  projects: {
    arrayField:    'projects',
    searchFields:  ['title', 'fundingAgency', 'projectCategory', 'status'],
    columns: [
      'title', 'fundingAgency', 'projectCategory', 'fundingType',
      'amountSanctioned', 'startDate', 'endDate', 'status', 'role',
    ],
    sortDefault: 'startDate',
  },
  patents: {
    arrayField:    'patents',
    searchFields:  ['title', 'patentNumber', 'status', 'patentType'],
    columns: [
      'title', 'patentNumber', 'dateOfFiling', 'status', 'patentType',
    ],
    sortDefault: 'dateOfFiling',
  },
  // ── V3 additions (additive — existing entries above are untouched) ─────────
  awards: {
    arrayField:    'awards',
    searchFields:  ['name', 'awardingAgency', 'level', 'awardCategory', 'yearReceived'],
    columns:       ['name', 'awardingAgency', 'yearReceived', 'level', 'awardCategory', 'honourType'],
    sortDefault:   'yearReceived',
  },
  fdp: {
    arrayField:    'fdpWorkshops',
    searchFields:  ['programTitle', 'type', 'organizingInstitution', 'year', 'mode'],
    columns:       ['programTitle', 'type', 'organizingInstitution', 'duration', 'mode', 'year'],
    sortDefault:   'year',
  },
  courses: {
    arrayField:    'onlineCourses',
    searchFields:  ['courseName', 'platform', 'completionYear'],
    columns:       ['courseName', 'platform', 'duration', 'completionYear', 'courseLevel'],
    sortDefault:   'completionYear',
  },
  memberships: {
    arrayField:    'memberships',
    searchFields:  ['professionalBody', 'membershipType', 'yearOfJoining'],
    columns:       ['professionalBody', 'membershipType', 'membershipId', 'yearOfJoining'],
    sortDefault:   'yearOfJoining',
  },
  internationalExperience: {
    arrayField:    'internationalExperience',
    searchFields:  ['country', 'purpose', 'institution', 'fundingSource'],
    columns:       ['country', 'purpose', 'institution', 'duration', 'from', 'to', 'fundingSource'],
    sortDefault:   'from',
  },
  researchGuidance: {
    arrayField:    'researchGuidance.studentDetails',
    searchFields:  ['studentName', 'topic', 'degree', 'status'],
    columns:       ['studentName', 'topic', 'year', 'degree', 'status', 'guidanceType'],
    sortDefault:   'year',
  },
};

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Returns a paginated drill-down list for a given KPI.
 *
 * @param {string} kpi    - One of: publications, projects, patents, faculty
 * @param {object} scope  - req.analyticsScope from the scope resolver
 * @param {object} query  - req.query from the route handler
 * @returns {object}      - { kpi, total, page, pageSize, records }
 */
async function getDrilldown(kpi, scope, query = {}) {
  const { page, pageSize } = parsePagination(query);
  const search = (query.search || '').toLowerCase().trim();
  const sort   = query.sort || null;

  // Build combined scope + user filter for Faculty.find().
  const base       = scopeFilter(scope);
  const userFilter = buildFacultyFilter(query);
  const combined   = mergeFilters(base, userFilter);

  if (kpi === 'faculty') {
    return getFacultyDrilldown(combined, search, sort, page, pageSize);
  }

  const config = KPI_CONFIG[kpi];
  if (!config) {
    throw new Error(`Unknown KPI: "${kpi}". Supported: ${Object.keys(KPI_CONFIG).join(', ')}, faculty`);
  }

  return getSubDocDrilldown(kpi, config, combined, search, sort, page, pageSize);
}

// ── Sub-document drilldown (publications / projects / patents) ───────────────

async function getSubDocDrilldown(kpi, config, facultyFilter, search, sort, page, pageSize) {
  // Fetch faculty records matching the scope/user filter.
  const facultyRecords = await Faculty
    .find(facultyFilter)
    .select(`username personalInfo.fullName employmentDetails.department ${config.arrayField}`)
    .lean();

  // Flatten: one row per sub-document entry, with faculty context attached.
  let rows = [];
  for (const faculty of facultyRecords) {
    const items = faculty[config.arrayField] || [];
    for (const item of items) {
      rows.push({
        facultyName: faculty.personalInfo?.fullName || faculty.username,
        department:  faculty.employmentDetails?.department || '',
        ...item,
      });
    }
  }

  // Search filter (client-side after flatten, since sub-doc text search
  // isn't natively efficient in Mongo without text indexes on sub-arrays).
  if (search) {
    rows = rows.filter(row =>
      config.searchFields.some(f =>
        String(row[f] || '').toLowerCase().includes(search)
      )
    );
  }

  // Sort.
  if (sort) {
    const desc = sort.startsWith('-');
    const key  = desc ? sort.slice(1) : sort;
    rows.sort((a, b) => {
      const av = String(a[key] || '');
      const bv = String(b[key] || '');
      return desc ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  } else if (config.sortDefault) {
    // Default: newest first (string descending for year/date fields).
    rows.sort((a, b) =>
      String(b[config.sortDefault] || '').localeCompare(String(a[config.sortDefault] || ''))
    );
  }

  const total    = rows.length;
  const start    = (page - 1) * pageSize;
  const records  = rows.slice(start, start + pageSize);

  return { kpi, total, page, pageSize, records };
}

// ── Faculty-level drilldown ───────────────────────────────────────────────────

async function getFacultyDrilldown(facultyFilter, search, sort, page, pageSize) {
  const facultyRecords = await Faculty
    .find(facultyFilter)
    .select('username personalInfo.fullName employmentDetails profileComplete completionPercentage')
    .lean();

  let rows = facultyRecords.map(f => ({
    facultyName:          f.personalInfo?.fullName || f.username,
    username:             f.username,
    department:           f.employmentDetails?.department || '',
    designation:          f.employmentDetails?.designation || '',
    natureOfAppointment:  f.employmentDetails?.natureOfAppointment || '',
    profileComplete:      f.profileComplete ? 'Yes' : 'No',
    completionPercentage: f.completionPercentage || 0,
  }));

  if (search) {
    rows = rows.filter(r =>
      [r.facultyName, r.username, r.department, r.designation]
        .some(v => String(v).toLowerCase().includes(search))
    );
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const key  = desc ? sort.slice(1) : sort;
    rows.sort((a, b) => {
      const av = typeof a[key] === 'number' ? a[key] : String(a[key] || '');
      const bv = typeof b[key] === 'number' ? b[key] : String(b[key] || '');
      if (typeof av === 'number') return desc ? bv - av : av - bv;
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }

  const total   = rows.length;
  const start   = (page - 1) * pageSize;
  const records = rows.slice(start, start + pageSize);

  return { kpi: 'faculty', total, page, pageSize, records };
}

module.exports = { getDrilldown };
