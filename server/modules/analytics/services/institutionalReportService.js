/**
 * institutionalReportService.js
 *
 * Backend for the IQAC Institutional Report Generator
 * (Admin -> Analytics -> Reports -> "IQAC Institutional Report").
 *
 * Builds on the existing data sources only — no new models, no new
 * data-entry workflow, no synthetic data. See CATEGORY_CATALOGUE below for
 * the exact source/date-field/limitation of every category, which the
 * frontend reads instead of hardcoding a category list.
 *
 * Faculty-embedded categories (publications, books, patents, projects,
 * awards, fdp, guidance) all share one fetch-and-filter shape:
 *   1. Resolve which departments are in scope (resolveDepartmentSelection).
 *   2. Fetch Faculty docs restricted to those departments (+ HOD scope,
 *      which always wins — see filterService's scope-last mergeFilters
 *      convention fixed alongside this feature).
 *   3. Re-filter each embedded array client-side against the resolved
 *      period (Mongo $elemMatch only proves >=1 element matches; it does
 *      not sub-select which elements came back).
 *
 * Conferences & Seminars is the one category NOT on Faculty — it's the
 * existing institutional event register (Booking + EventReport), reusing
 * the exact `isCurrent:true, reviewStatus:'approved'` query already used
 * by server/modules/events/routes/register.js so this never shows
 * unapproved/draft events as institutional output.
 */

'use strict';

const Faculty     = require('../../faculty/models/Faculty');
const Department  = require('../../faculty/models/Department');
const { Booking } = require('../../events/models/Booking');
const EventReport = require('../../events/models/EventReport');

const {
  mergeFilters,
  toArray,
  resolveReportPeriod,
} = require('./filterService');
const { publicationTypeMatches } = require('../utils/publicationType');

// ── Category catalogue ────────────────────────────────────────────────────
// Single source of truth for which categories are selectable. The frontend
// calls GET its endpoint for this instead of hardcoding checkboxes, so an
// unsupported category can never be shown as if it were real.

const CATEGORY_CATALOGUE = {
  supported: [
    { key: 'publications', label: 'Publications',
      source: 'Faculty.publications[]', dateField: 'year',
      note: 'Bare calendar-year string — no month, so Academic Year filtering widens to every calendar year the AY span touches.' },
    { key: 'books', label: 'Books & Book Chapters',
      source: 'Faculty.publications[] (type = Books Authored/Edited or Book Chapters)', dateField: 'year',
      note: 'Subset of Publications, reported separately but not double-counted in the Publications total.' },
    { key: 'patents', label: 'Patents',
      source: 'Faculty.patents[]', dateField: 'dateOfFiling (+ grantDate shown where present)',
      note: 'No separate "publication date" field exists on this record — not invented. Status (Filed/Published/Granted) kept distinct, never collapsed into one count.' },
    { key: 'projects', label: 'Research Projects (incl. funding/grants)',
      source: 'Faculty.projects[]', dateField: 'startDate',
      note: 'Research Grants are not a separate selectable category: funding fields already live on these same records; listing them separately would double-count.' },
    { key: 'awards', label: 'Awards & Recognitions',
      source: 'Faculty.awards[]', dateField: 'yearReceived', note: null },
    { key: 'fdp', label: 'Faculty Development Programmes',
      source: 'Faculty.fdpWorkshops[]', dateField: 'year', note: null },
    { key: 'conferences', label: 'Conferences & Seminars (institutional events)',
      source: 'events module: Booking + EventReport (approved register)', dateField: 'Booking.date',
      note: 'Only approved, current event reports — same filter the existing Current Activities Register uses. Papers presented at conferences are counted under Publications, not here, to avoid double-counting.' },
    { key: 'guidance', label: 'Research Scholars Guided',
      source: 'Faculty.researchGuidance.studentDetails[]', dateField: 'dateOfRegistration', note: null },
  ],
  unsupported: [
    { key: 'grants', label: 'Research Grants',
      reason: 'No separate model exists — funding fields already live inside Research Projects records. Offering this separately would double-count the same data.' },
    { key: 'student-achievements', label: 'Student Achievements',
      reason: 'The StudentProfile schema has no achievements/awards field. Not fabricated.' },
  ],
};

function getCategoryCatalogue() {
  return CATEGORY_CATALOGUE;
}

const SUPPORTED_KEYS = new Set(CATEGORY_CATALOGUE.supported.map(c => c.key));

// ── Department resolution ─────────────────────────────────────────────────

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

/**
 * Resolves "All Departments" / "Specific Department(s)" against the real
 * Department collection — never a hardcoded list — and always honors an
 * HOD's scope restriction regardless of what the client asked for.
 */
async function resolveDepartmentSelection(scope, query) {
  const allDeptDocs = await Department.find().select('name').lean();
  const allDeptNames = allDeptDocs.map(d => d.name).filter(Boolean);

  if (scope && scope.level === 'department' && scope.department) {
    return { mode: 'specific', departments: [scope.department], allDepartments: allDeptNames };
  }

  const requested = toArray(query.department);
  if (requested.length === 0) {
    return { mode: 'all', departments: allDeptNames, allDepartments: allDeptNames };
  }

  const valid = requested.filter(d => allDeptNames.includes(d));
  if (valid.length === 0) {
    const err = new Error('None of the requested departments exist in Department Management.');
    err.status = 400;
    throw err;
  }
  return { mode: 'specific', departments: valid, allDepartments: allDeptNames };
}

// ── Category selection validation ─────────────────────────────────────────

function resolveCategorySelection(query) {
  const requested = toArray(query.categories);
  if (requested.length === 0) {
    const err = new Error('Select at least one report category.');
    err.status = 400;
    throw err;
  }
  const unknown = requested.filter(c => !SUPPORTED_KEYS.has(c));
  if (unknown.length > 0) {
    const err = new Error(`Unsupported category selection: ${unknown.join(', ')}. ` +
      `Supported categories: ${Array.from(SUPPORTED_KEYS).join(', ')}.`);
    err.status = 400;
    throw err;
  }
  return requested;
}

// ── Faculty-embedded array category: shared fetch + filter ───────────────

/**
 * @param {object}   opts.scope
 * @param {string[]} opts.departments  - resolved department names to include
 * @param {string}   opts.listField    - e.g. 'publications'
 * @param {string}   opts.yearField    - e.g. 'year' (bare year string) — mutually
 *                                        exclusive with dateField
 * @param {string}   [opts.dateField]  - e.g. 'dateOfFiling' (ISO date string)
 * @param {object|null} opts.period    - resolveReportPeriod() result, or null
 * @param {(item:object)=>boolean} [opts.itemFilter] - extra per-item predicate
 *                                        (e.g. publication type for Books)
 * @returns {Promise<Array<{faculty:string, department:string, item:object}>>}
 */
async function fetchArrayCategoryRows({ scope, departments, listField, yearField, dateField, period, itemFilter }) {
  const base = scopeFilter(scope);
  const deptFilter = { 'employmentDetails.department': { $in: departments } };
  // Scope restriction is merged LAST so it always wins over any client input —
  // see filterService.js's documented mergeFilters(userFilter, scopeBase) fix.
  const combined = mergeFilters(deptFilter, base);

  const faculty = await Faculty.find(combined)
    .select(`username personalInfo.fullName employmentDetails.department ${listField}`)
    .lean();

  const inPeriod = (item) => {
    if (!period) return true;
    if (yearField) return period.yearStrings.includes(String(item[yearField] || ''));
    if (dateField) {
      const v = String(item[dateField] || '');
      return v !== '' && v >= period.dateStringRange.start && v <= period.dateStringRange.end;
    }
    return true;
  };

  const out = [];
  for (const f of faculty) {
    const facultyName = f.personalInfo?.fullName || f.username;
    const dept = f.employmentDetails?.department || 'Unknown';
    const list = f[listField] || [];
    for (const item of list) {
      if (!inPeriod(item)) continue;
      if (itemFilter && !itemFilter(item)) continue;
      out.push({ faculty: facultyName, department: dept, item });
    }
  }
  return out;
}

function tally(rows, keyFn) {
  const counts = {};
  for (const r of rows) {
    const k = keyFn(r);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

// ── Individual category reports ───────────────────────────────────────────

async function publicationsReport(scope, departments, period) {
  const rows = await fetchArrayCategoryRows({ scope, departments, listField: 'publications', yearField: 'year', period });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department,
    Title: item.title, Type: item.type, 'Journal/Book': item.journal,
    Category: item.journalCategory, Level: item.level, Year: item.year,
    'Indexed In': item.indexedIn, 'Impact Factor': item.impactFactor, DOI: item.doi,
  }));
  return {
    key: 'publications', title: 'Publications Report',
    summary: { total: rows.length, contributingFaculty: new Set(rows.map(r => r.faculty)).size },
    yearWise: tally(rows, r => r.item.year || 'Unknown'),
    facultyWise: tally(rows, r => r.faculty),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function booksReport(scope, departments, period) {
  const isBook = (item) =>
    publicationTypeMatches(item, 'Books Authored / Edited') || publicationTypeMatches(item, 'Book Chapters');
  const rows = await fetchArrayCategoryRows({
    scope, departments, listField: 'publications', yearField: 'year', period, itemFilter: isBook,
  });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department, Title: item.title,
    Type: item.type, Publisher: item.journal, Year: item.year, ISBN: item.isbn || '',
  }));
  return {
    key: 'books', title: 'Books & Book Chapters Report',
    summary: { total: rows.length },
    yearWise: tally(rows, r => r.item.year || 'Unknown'),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function patentsReport(scope, departments, period) {
  const rows = await fetchArrayCategoryRows({ scope, departments, listField: 'patents', dateField: 'dateOfFiling', period });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department, Title: item.title,
    'Patent Number': item.patentNumber, 'Filing Date': item.dateOfFiling,
    'Grant Date': item.grantDate || '', Status: item.status, Type: item.patentType,
    'Patent Office': item.patentOffice || '',
  }));
  const statusCounts = { Filed: 0, Published: 0, Granted: 0, Other: 0 };
  for (const r of rows) {
    const s = (r.item.status || '').trim();
    if (s === 'Filed' || s === 'Published' || s === 'Granted') statusCounts[s]++;
    else statusCounts.Other++;
  }
  return {
    key: 'patents', title: 'Patents Report',
    summary: { total: rows.length, ...statusCounts },
    yearWise: tally(rows, r => (r.item.dateOfFiling || '').slice(0, 4) || 'Unknown'),
    facultyWise: tally(rows, r => r.faculty),
    departmentWise: tally(rows, r => r.department),
    register,
    note: 'Counted by filing year. No separate publication-date field exists on this record.',
  };
}

async function projectsReport(scope, departments, period) {
  const rows = await fetchArrayCategoryRows({ scope, departments, listField: 'projects', dateField: 'startDate', period });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department, Title: item.title,
    'Funding Agency': item.fundingAgency, Category: item.projectCategory,
    'Amount (\u20b9)': item.amountSanctioned, 'Start Date': item.startDate,
    'End Date': item.endDate, Status: item.status, Role: item.role,
  }));
  const totalFunding = rows.reduce((s, r) =>
    s + Number(String(r.item.amountSanctioned || 0).replace(/,/g, '')) || 0, 0);
  return {
    key: 'projects', title: 'Research Projects Report (includes funding/grant data)',
    summary: { total: rows.length, totalFunding },
    yearWise: tally(rows, r => (r.item.startDate || '').slice(0, 4) || 'Unknown'),
    facultyWise: tally(rows, r => r.faculty),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function awardsReport(scope, departments, period) {
  const rows = await fetchArrayCategoryRows({ scope, departments, listField: 'awards', yearField: 'yearReceived', period });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department, 'Title/Award': item.name,
    'Awarding Agency': item.awardingAgency, Level: item.level, Year: item.yearReceived,
  }));
  return {
    key: 'awards', title: 'Awards & Recognitions Report',
    summary: { total: rows.length },
    yearWise: tally(rows, r => r.item.yearReceived || 'Unknown'),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function fdpReport(scope, departments, period) {
  const rows = await fetchArrayCategoryRows({ scope, departments, listField: 'fdpWorkshops', yearField: 'year', period });
  const register = rows.map(({ faculty, department, item }) => ({
    Faculty: faculty, Department: department, 'Programme Title': item.programTitle,
    Type: item.type, 'Organizing Institution': item.organizingInstitution,
    From: item.from, To: item.to, Year: item.year, Mode: item.mode,
  }));
  return {
    key: 'fdp', title: 'Faculty Development Programmes Report',
    summary: { total: rows.length },
    yearWise: tally(rows, r => r.item.year || 'Unknown'),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function guidanceReport(scope, departments, period) {
  const base = scopeFilter(scope);
  const deptFilter = { 'employmentDetails.department': { $in: departments } };
  const combined = mergeFilters(deptFilter, base);

  const faculty = await Faculty.find(combined)
    .select('username personalInfo.fullName employmentDetails.department researchGuidance.studentDetails')
    .lean();

  const inPeriod = (item) => {
    if (!period) return true;
    const v = String(item.dateOfRegistration || '');
    return v !== '' && v >= period.dateStringRange.start && v <= period.dateStringRange.end;
  };

  const rows = [];
  for (const f of faculty) {
    const facultyName = f.personalInfo?.fullName || f.username;
    const dept = f.employmentDetails?.department || 'Unknown';
    for (const s of f.researchGuidance?.studentDetails || []) {
      if (!inPeriod(s)) continue;
      rows.push({ faculty: facultyName, department: dept, item: s });
    }
  }
  const register = rows.map(({ faculty, department, item }) => ({
    'Supervisor (Faculty)': faculty, Department: department, 'Scholar/Topic': item.topic,
    Degree: item.degree, Status: item.status, 'Date of Registration': item.dateOfRegistration,
    'Date of Thesis Submission': item.dateOfThesisSubmission || '', 'Date of Viva Voce': item.dateOfVivaVoce || '',
  }));
  return {
    key: 'guidance', title: 'Research Scholars Guided Report',
    summary: { total: rows.length, completed: rows.filter(r => r.item.status === 'Completed').length },
    yearWise: tally(rows, r => (r.item.dateOfRegistration || '').slice(0, 4) || 'Unknown'),
    facultyWise: tally(rows, r => r.faculty),
    departmentWise: tally(rows, r => r.department),
    register,
  };
}

async function conferencesReport(scope, departments, period) {
  const reportFilter = { isCurrent: true, reviewStatus: 'approved' };
  // Institution-wide vs department-restricted: conductingDepartment is a
  // plain string field on Booking, same convention as employmentDetails.department.
  const reports = await EventReport.find(reportFilter).populate({
    path: 'booking', populate: { path: 'leadFaculty supportingFaculty' },
  }).lean();

  const rows = reports.filter(r => {
    if (!r.booking) return false;
    if (!departments.includes(r.booking.conductingDepartment)) return false;
    if (period) {
      const d = r.booking.date ? new Date(r.booking.date) : null;
      if (!d || d < period.dateRange.start || d > period.dateRange.end) return false;
    }
    return true;
  });

  const register = rows.map(r => ({
    Programme: r.nameOfProgram, Department: r.booking.conductingDepartment,
    'Lead Faculty': r.booking.leadFaculty?.personalInfo?.fullName || r.booking.leadFaculty?.username || '',
    Date: r.booking.date ? new Date(r.booking.date).toISOString().slice(0, 10) : '',
    'Resource Person': r.resourcePerson || '', Participants: r.numberOfParticipants ?? '',
  }));
  return {
    key: 'conferences', title: 'Conferences & Seminars Report',
    summary: { total: rows.length },
    yearWise: tally(rows, r => (r.booking.date ? new Date(r.booking.date).getUTCFullYear() : 'Unknown')),
    departmentWise: tally(rows, r => r.booking.conductingDepartment),
    register,
    note: 'Approved institutional event register only. Conference papers presented (vs. attended) are counted under Publications, not here.',
  };
}

const GENERATORS = {
  publications: publicationsReport,
  books:        booksReport,
  patents:      patentsReport,
  projects:     projectsReport,
  awards:       awardsReport,
  fdp:          fdpReport,
  guidance:     guidanceReport,
  conferences:  conferencesReport,
};

// ── Combined / institutional report ───────────────────────────────────────

/**
 * Generates the full IQAC Institutional Report for one or more selected
 * categories, restricted to the resolved department(s) and period.
 *
 * @param {object} scope - req.analyticsScope
 * @param {object} query - req.query: { categories, periodType, year,
 *                          fromYear, toYear, convention, department }
 */
async function generateInstitutionalReport(scope, query = {}) {
  const categories  = resolveCategorySelection(query);
  const deptSel      = await resolveDepartmentSelection(scope, query);
  const period        = resolveReportPeriod(query);

  const sections = {};
  for (const key of categories) {
    sections[key] = await GENERATORS[key](scope, deptSel.departments, period);
  }

  // Combined executive summary + cross-category faculty/department totals,
  // built only from the categories actually selected — never invents a
  // number for a category that wasn't requested.
  const totalsByFaculty = {};
  const totalsByDept = {};
  let totalOutputs = 0;
  for (const key of categories) {
    const s = sections[key];
    totalOutputs += s.summary.total;
    for (const [dept, n] of Object.entries(s.departmentWise || {})) {
      totalsByDept[dept] = (totalsByDept[dept] || 0) + n;
    }
    for (const [fac, n] of Object.entries(s.facultyWise || {})) {
      totalsByFaculty[fac] = (totalsByFaculty[fac] || 0) + n;
    }
  }

  return {
    title: 'IQAC Institutional Report',
    generatedAt: new Date().toISOString(),
    scope: deptSel.mode === 'all' ? 'All Departments' : deptSel.departments.join(', '),
    period: period ? { label: period.label, convention: period.convention } : { label: 'All time', convention: null },
    categories,
    executiveSummary: {
      totalOutputs,
      contributingFaculty: Object.keys(totalsByFaculty).length,
      departmentsCovered: deptSel.departments.length,
    },
    totalsByFaculty,
    totalsByDepartment: totalsByDept,
    sections,
    // Flat `rows`/`title` kept for exporter backward-compatibility when a
    // single category is selected (existing csv/pdf/excel exporters expect
    // a flat array). Multi-category combined exports use `sections` via the
    // new institutionalReport export branch (see exporters).
    rows: categories.length === 1 ? sections[categories[0]].register : [],
  };
}

module.exports = {
  getCategoryCatalogue,
  resolveDepartmentSelection,
  resolveCategorySelection,
  generateInstitutionalReport,
  GENERATORS,
};
