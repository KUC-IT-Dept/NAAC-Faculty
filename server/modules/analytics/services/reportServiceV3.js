'use strict';

const Faculty = require('../../faculty/models/Faculty');
const { buildFacultyFilter, mergeFilters } = require('./filterService');
const { publicationTypeMatches } = require('../utils/publicationType');
const {
  facultyProfileReport,
  departmentSummaryReport,
  researchOutputReport,
  projectsReport,
  patentsReport,
  benchmarkReport,
} = require('./reportService');

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

const REPORT_TYPES = [
  { key: 'faculty-profile', label: 'Faculty Profile Completion', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'department-summary', label: 'Department Performance Summary', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'research-output', label: 'Research Publications Report', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'projects', label: 'Research Projects Report', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'patents', label: 'Patents Report', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'benchmark', label: 'NAAC Benchmark Analysis Report', formats: ['pdf', 'excel', 'csv'], scopes: ['university', 'institution', 'full'] },
  { key: 'awards', label: 'Awards & Recognitions Report', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
  { key: 'books', label: 'Books Authored/Edited Report', formats: ['pdf', 'excel', 'csv'], scopes: ['department', 'university', 'institution', 'full'] },
];

function getAvailableReportTypesV3(scope) {
  const level = scope?.level || 'full';
  return REPORT_TYPES.filter(r => r.scopes.includes(level));
}

async function listReportGenerator(scope, query, listName, filterFn, mapFn, title) {
  const base = scopeFilter(scope);
  const user = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const faculty = await Faculty.find(combined).select(`username personalInfo.fullName employmentDetails.department ${listName}`).lean();

  const rows = [];
  for (const f of faculty) {
    const list = f[listName] || [];
    const filteredList = filterFn ? list.filter(filterFn) : list;
    for (const item of filteredList) {
      rows.push({
        'Faculty': f.personalInfo?.fullName || f.username,
        'Department': f.employmentDetails?.department || '',
        ...mapFn(item),
      });
    }
  }

  return { title, rows };
}

async function booksReport(scope, query) {
  return listReportGenerator(scope, query, 'publications', pub => publicationTypeMatches(pub, 'Books Authored / Edited'), pub => ({
    'Title': pub.title,
    'Publisher': pub.journal,
    'Year': pub.year,
    'ISBN': pub.isbn || '',
  }), 'Books Authored/Edited Report');
}

async function awardsReport(scope, query) {
  return listReportGenerator(scope, query, 'recognitions', null, rec => ({
    'Title/Award': rec.title,
    'Awarding Agency': rec.awardingAgency,
    'Level': rec.level,
    'Year': rec.year,
  }), 'Awards & Recognitions Report');
}

const GENERATORS = {
  'faculty-profile': facultyProfileReport,
  'department-summary': departmentSummaryReport,
  'research-output': researchOutputReport,
  'projects': projectsReport,
  'patents': patentsReport,
  'benchmark': benchmarkReport,
  'awards': awardsReport,
  'books': booksReport,
};

async function generateReportV3(reportType, scope, query = {}) {
  const generator = GENERATORS[reportType];
  if (!generator) {
    throw new Error(`Unknown report type: "${reportType}"`);
  }
  return generator(scope, query);
}

module.exports = { getAvailableReportTypesV3, generateReportV3 };
