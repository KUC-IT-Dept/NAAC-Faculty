/**
 * reportService.js
 *
 * Assembles report payloads by composing calls to existing services.
 * Returns a format-agnostic JSON object { title, rows, metadata }
 * which the exporter files (csvExporter, excelExporter, pdfExporter)
 * then convert to bytes.
 *
 * Report types:
 *   faculty-profile     — faculty name, dept, designation, completion %
 *   department-summary  — per-department faculty count, publications,
 *                         projects, patents, funding, avg completion
 *   research-output     — all publications with faculty context
 *   projects            — all research projects with faculty context
 *   patents             — all patents with faculty context
 *   benchmark           — current vs benchmark comparison table
 *
 * Role-based availability:
 *   hod       — faculty-profile, department-summary (own dept only)
 *   vc/iqac   — all types
 *   admin     — all types
 */

'use strict';

const Faculty          = require('../../faculty/models/Faculty');
const { buildFacultyFilter, mergeFilters } = require('./filterService');
const { getAllBenchmarks }                 = require('./benchmarkService');

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

// ── Report type registry ──────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    key:         'faculty-profile',
    label:       'Faculty Profile Completion',
    description: 'Profile completion status for all faculty members.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['department', 'university', 'institution', 'full'],
  },
  {
    key:         'department-summary',
    label:       'Department Performance Summary',
    description: 'Publications, projects, patents, and funding aggregated by department.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['department', 'university', 'institution', 'full'],
  },
  {
    key:         'research-output',
    label:       'Research Publications Report',
    description: 'All publications with author, journal, year, and indexing details.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['department', 'university', 'institution', 'full'],
  },
  {
    key:         'projects',
    label:       'Research Projects Report',
    description: 'All research projects with funding agency, status, and amount.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['department', 'university', 'institution', 'full'],
  },
  {
    key:         'patents',
    label:       'Patents Report',
    description: 'All patents filed/granted with status and filing date.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['department', 'university', 'institution', 'full'],
  },
  {
    key:         'benchmark',
    label:       'NAAC Benchmark Analysis Report',
    description: 'Current values vs NAAC benchmark thresholds with gap analysis.',
    formats:     ['pdf', 'excel', 'csv'],
    scopes:      ['university', 'institution', 'full'],
  },
];

/**
 * Returns report types available to the caller's scope level.
 * @param {object} scope
 * @returns {Array}
 */
function getAvailableReportTypes(scope) {
  const level = scope?.level || 'full';
  return REPORT_TYPES.filter(r => r.scopes.includes(level));
}

// ── Report generators ─────────────────────────────────────────────────────────

async function facultyProfileReport(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty
    .find(combined)
    .select('username personalInfo.fullName employmentDetails profileComplete completionPercentage')
    .lean();

  const rows = faculty.map(f => ({
    'Faculty Name':    f.personalInfo?.fullName || f.username,
    'Department':      f.employmentDetails?.department || '',
    'Designation':     f.employmentDetails?.designation || '',
    'Profile Complete':f.profileComplete ? 'Yes' : 'No',
    'Completion (%)':  f.completionPercentage || 0,
  }));

  return { title: 'Faculty Profile Completion Report', rows };
}

async function departmentSummaryReport(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty
    .find(combined)
    .select('employmentDetails publications projects patents completionPercentage')
    .lean();

  const deptMap = {};
  for (const f of faculty) {
    const dept = f.employmentDetails?.department || 'Unknown';
    if (!deptMap[dept]) deptMap[dept] = { dept, count: 0, pubs: 0, proj: 0, pat: 0, funding: 0, completion: 0 };
    deptMap[dept].count++;
    deptMap[dept].pubs    += (f.publications || []).length;
    deptMap[dept].proj    += (f.projects     || []).length;
    deptMap[dept].pat     += (f.patents       || []).length;
    deptMap[dept].funding += (f.projects || []).reduce((s, p) => s + Number(String(p.amountSanctioned || 0).replace(/,/g, '')), 0);
    deptMap[dept].completion += f.completionPercentage || 0;
  }

  const rows = Object.values(deptMap).map(d => ({
    'Department':          d.dept,
    'Faculty Count':       d.count,
    'Publications':        d.pubs,
    'Projects':            d.proj,
    'Patents':             d.pat,
    'Total Funding (₹)':   d.funding,
    'Avg. Completion (%)': d.count > 0 ? Number((d.completion / d.count).toFixed(2)) : 0,
  }));

  return { title: 'Department Performance Summary Report', rows };
}

async function researchOutputReport(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty
    .find(combined)
    .select('username personalInfo.fullName employmentDetails.department publications')
    .lean();

  const rows = [];
  for (const f of faculty) {
    for (const pub of f.publications || []) {
      rows.push({
        'Faculty':          f.personalInfo?.fullName || f.username,
        'Department':       f.employmentDetails?.department || '',
        'Title':            pub.title,
        'Type':             pub.type,
        'Journal/Book':     pub.journal,
        'Category':         pub.journalCategory,
        'Level':            pub.level,
        'Year':             pub.year,
        'Indexed In':       pub.indexedIn,
        'Impact Factor':    pub.impactFactor,
        'DOI':              pub.doi,
      });
    }
  }

  return { title: 'Research Publications Report', rows };
}

async function projectsReport(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty
    .find(combined)
    .select('username personalInfo.fullName employmentDetails.department projects')
    .lean();

  const rows = [];
  for (const f of faculty) {
    for (const proj of f.projects || []) {
      rows.push({
        'Faculty':          f.personalInfo?.fullName || f.username,
        'Department':       f.employmentDetails?.department || '',
        'Title':            proj.title,
        'Funding Agency':   proj.fundingAgency,
        'Category':         proj.projectCategory,
        'Amount (₹)':       proj.amountSanctioned,
        'Start Date':       proj.startDate,
        'End Date':         proj.endDate,
        'Status':           proj.status,
        'Role':             proj.role,
      });
    }
  }

  return { title: 'Research Projects Report', rows };
}

async function patentsReport(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty
    .find(combined)
    .select('username personalInfo.fullName employmentDetails.department patents')
    .lean();

  const rows = [];
  for (const f of faculty) {
    for (const pat of f.patents || []) {
      rows.push({
        'Faculty':        f.personalInfo?.fullName || f.username,
        'Department':     f.employmentDetails?.department || '',
        'Title':          pat.title,
        'Patent Number':  pat.patentNumber,
        'Filing Date':    pat.dateOfFiling,
        'Status':         pat.status,
        'Type':           pat.patentType,
      });
    }
  }

  return { title: 'Patents Report', rows };
}

async function benchmarkReport(scope, query) {
  const benchmarks = await getAllBenchmarks(scope, query);

  const rows = benchmarks.map(b => ({
    'Metric ID':       b.metricId,
    'Metric Name':     b.metricName,
    'Criterion':       b.criterion,
    'Current Value':   b.currentValue,
    'Benchmark Value': b.benchmarkValue,
    'Gap':             b.gap,
    'Status':          b.status,
    'Score':           b.score,
    'Recommendation':  b.recommendation,
  }));

  return { title: 'NAAC Benchmark Analysis Report', rows };
}

// ── Main entry point ──────────────────────────────────────────────────────────

const GENERATORS = {
  'faculty-profile':    facultyProfileReport,
  'department-summary': departmentSummaryReport,
  'research-output':    researchOutputReport,
  'projects':           projectsReport,
  'patents':            patentsReport,
  'benchmark':          benchmarkReport,
};

/**
 * @param {string} reportType  - One of the keys in REPORT_TYPES
 * @param {object} scope       - req.analyticsScope
 * @param {object} query       - req.query
 * @returns {{ title: string, rows: object[] }}
 */
async function generateReport(reportType, scope, query = {}) {
  const generator = GENERATORS[reportType];
  if (!generator) {
    throw new Error(`Unknown report type: "${reportType}". Available: ${Object.keys(GENERATORS).join(', ')}`);
  }
  return generator(scope, query);
}

module.exports = {
  getAvailableReportTypes,
  generateReport,
  facultyProfileReport,
  departmentSummaryReport,
  researchOutputReport,
  projectsReport,
  patentsReport,
  benchmarkReport,
};
