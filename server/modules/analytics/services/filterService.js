/**
 * filterService.js
 *
 * Pure functions that translate raw HTTP query parameters into
 * Mongo-filter fragments (plain objects) consumed by route handlers.
 *
 * This service:
 *   - Knows nothing about roles, scopes, or permissions.
 *   - Knows nothing about Express (no req/res — takes a plain query object).
 *   - Never queries the database.
 *   - Always produces a plain object that can be spread into a
 *     Faculty.find() / Faculty.countDocuments() call.
 *
 * The resulting filter *composes* with the existing deptFilter pattern
 * that V1 route handlers already use:
 *
 *   const deptFilter = scope.level === 'department' ? { ... } : {};
 *   const userFilter = buildFacultyFilter(req.query);
 *   const combined   = { ...deptFilter, ...userFilter };
 *   await Faculty.find(combined)
 *
 * All filter parameters are strictly optional. When absent (or empty
 * string), the corresponding filter fragment is omitted entirely so
 * existing no-filter call paths produce byte-identical responses.
 *
 * Supported query parameters:
 *
 *   Faculty-level:
 *     department  - e.g. "Computer Science"  → { 'employmentDetails.department': v }
 *     designation - e.g. "Professor"         → { 'employmentDetails.designation': v }
 *     facultyId   - MongoDB _id or username  → { _id: v } or { username: v }  [V3]
 *
 *   Qualification / Experience:  [V3]
 *     qualification   - e.g. "Ph.D"          → $elemMatch on qualifications.degreeLevel
 *     minExperience   - e.g. "10"            → employmentDetails.totalExperienceYears ≥ n
 *     maxExperience   - e.g. "20"            → employmentDetails.totalExperienceYears ≤ n
 *
 *   Publication sub-document:
 *     year        - e.g. "2024"              → $elemMatch on publications.year
 *     category    - e.g. "Scopus"            → $elemMatch on publications.journalCategory
 *     level       - e.g. "International"     → $elemMatch on publications.level
 *     pubType     - e.g. "Journal Articles"  → $elemMatch on publications.type
 *
 *   Project sub-document:
 *     projectCategory - e.g. "Major"         → $elemMatch on projects.projectCategory
 *     projectStatus   - e.g. "Ongoing"       → $elemMatch on projects.status
 *     fundingAgency   - e.g. "SERB"          → $elemMatch on projects.fundingAgency
 *     from / to   - ISO date strings         → $elemMatch on projects.startDate range
 *
 *   Patent sub-document:
 *     patentStatus - e.g. "Granted"          → $elemMatch on patents.status
 *
 *   Student-level (for StudentProfile queries — separate helper):
 *     program     - e.g. "B.Tech"            → { 'academic_details.programLevel': v }
 *     studentDept - e.g. "CS"                → { 'academic_details.faculty': v }
 */

'use strict';

// ── Multi-value helper ────────────────────────────────────────────────────────

/**
 * Normalizes a query param that may arrive as a single string, a
 * comma-separated string (the frontend serializes arrays this way), or an
 * already-parsed array (Express parses repeated `?key=a&key=b` params into
 * an array automatically) into a clean string array.
 *
 * @param {string|string[]|undefined} value
 * @returns {string[]} - empty array if value is absent/empty
 */
function toArray(value) {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw.map(v => String(v).trim()).filter(v => v !== '');
}

/**
 * Builds either an exact-match value or a Mongo `$in` clause depending on
 * how many values are present. Keeps single-value filters byte-identical
 * to the pre-multi-select behavior (no `$in` wrapper for one value).
 *
 * @param {string[]} values
 * @returns {string|{$in: string[]}|undefined}
 */
function toMatchValue(values) {
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  return { $in: values };
}

// ── Faculty filter builder ────────────────────────────────────────────────────

/**
 * Builds a Mongo filter fragment for Faculty.find() from request query params.
 * All parameters are optional; missing/empty values are silently ignored.
 *
 * Multi-select support: department, pubType, fundingAgency, projectCategory,
 * qualification, and awardCategory accept either a single value or multiple
 * values (comma-separated string, repeated query params, or a real array).
 * Existing single-value callers are unaffected since one value never gets
 * wrapped in `$in`.
 *
 * @param {object} query - raw req.query object from Express
 * @returns {object}     - Mongo filter fragment (may be empty object)
 */
function buildFacultyFilter(query = {}) {
  const filter = {};

  // ── Faculty-level fields ──────────────────────────────────────────────────
  const departments = toArray(query.department);
  if (departments.length > 0) {
    filter['employmentDetails.department'] = toMatchValue(departments);
  }

  if (query.designation && query.designation.trim()) {
    filter['employmentDetails.designation'] = query.designation.trim();
  }

  // ── V3: Single faculty lookup by _id or username ──────────────────────────
  if (query.facultyId && query.facultyId.trim()) {
    const id = query.facultyId.trim();
    if (/^[a-f\d]{24}$/i.test(id)) {
      // eslint-disable-next-line no-undef
      const mongoose = require('mongoose');
      filter['_id'] = mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId.createFromHexString(id) : id;
    } else {
      filter['username'] = id;
    }
  }

  // ── V3: Qualification filter (multi-select) ───────────────────────────────
  const qualifications = toArray(query.qualification);
  if (qualifications.length > 0) {
    filter['qualifications'] = {
      $elemMatch: { degreeLevel: toMatchValue(qualifications) },
    };
  }

  // ── V3: Experience range filter ───────────────────────────────────────────
  // totalExperienceYears is stored as a string; we use regex-based range
  // approximation via $where is not safe, so we apply a post-fetch filter
  // by adding a sentinel field marker. The actual numeric comparison is done
  // in getExperienceFilter() below and applied via aggregation / JS filter
  // in routes that support it. We store the raw values for downstream use.
  if (query.minExperience && query.minExperience.trim()) {
    const min = parseInt(query.minExperience, 10);
    if (!isNaN(min)) filter['__minExperience'] = min; // sentinel, handled by filterByExperience()
  }
  if (query.maxExperience && query.maxExperience.trim()) {
    const max = parseInt(query.maxExperience, 10);
    if (!isNaN(max)) filter['__maxExperience'] = max; // sentinel
  }

  // ── Publications sub-document (pubType is multi-select) ───────────────────
  const pubMatch = {};
  if (query.year        && query.year.trim())    pubMatch.year            = query.year.trim();
  if (query.category    && query.category.trim()) pubMatch.journalCategory = query.category.trim();
  if (query.level       && query.level.trim())   pubMatch.level           = query.level.trim();
  const pubTypes = toArray(query.pubType);
  if (pubTypes.length > 0) pubMatch.type = toMatchValue(pubTypes);

  if (Object.keys(pubMatch).length > 0) {
    filter.publications = { $elemMatch: pubMatch };
  }

  // ── Projects sub-document (projectCategory + fundingAgency are multi-select) ─
  const projectMatch = {};
  const projectCategories = toArray(query.projectCategory);
  if (projectCategories.length > 0) {
    projectMatch.projectCategory = toMatchValue(projectCategories);
  }
  if (query.projectStatus && query.projectStatus.trim()) {
    projectMatch.status = query.projectStatus.trim();
  }
  const fundingAgencies = toArray(query.fundingAgency);
  if (fundingAgencies.length > 0) {
    projectMatch.fundingAgency = toMatchValue(fundingAgencies);
  }
  if (query.from && query.from.trim()) {
    projectMatch.startDate = projectMatch.startDate || {};
    projectMatch.startDate.$gte = query.from.trim();
  }
  if (query.to && query.to.trim()) {
    projectMatch.startDate = projectMatch.startDate || {};
    projectMatch.startDate.$lte = query.to.trim();
  }

  if (Object.keys(projectMatch).length > 0) {
    filter.projects = { $elemMatch: projectMatch };
  }

  // ── Patents sub-document ──────────────────────────────────────────────────
  if (query.patentStatus && query.patentStatus.trim()) {
    filter.patents = { $elemMatch: { status: query.patentStatus.trim() } };
  }

  // ── V3: Awards sub-document (awardCategory is multi-select) ───────────────
  const awardCategories = toArray(query.awardCategory);
  if (awardCategories.length > 0) {
    filter.awards = { $elemMatch: { awardCategory: toMatchValue(awardCategories) } };
  }

  return filter;
}

// ── StudentProfile filter builder ─────────────────────────────────────────────

/**
 * Builds a Mongo filter fragment for StudentProfile.find() from request query params.
 *
 * @param {object} query - raw req.query object from Express
 * @returns {object}     - Mongo filter fragment (may be empty object)
 */
function buildStudentFilter(query = {}) {
  const filter = {};

  if (query.program && query.program.trim()) {
    filter['academic_details.programLevel'] = query.program.trim();
  }

  if (query.studentDept && query.studentDept.trim()) {
    filter['academic_details.faculty'] = query.studentDept.trim();
  }

  return filter;
}

// ── Experience post-filter helper ─────────────────────────────────────────────

/**
 * Strips the experience sentinel fields from a filter object and returns
 * them separately. Route handlers that support experience filtering must:
 *   1. Build the filter via buildFacultyFilter()
 *   2. Call extractExperienceFilter(filter) to get { min, max, cleanFilter }
 *   3. Pass cleanFilter to MongoDB (sentinels are not valid Mongo operators)
 *   4. Post-filter the results using isInExperienceRange()
 *
 * @param {object} filter - output of buildFacultyFilter()
 * @returns {{ min: number|null, max: number|null, cleanFilter: object }}
 */
function extractExperienceFilter(filter) {
  const { __minExperience, __maxExperience, ...cleanFilter } = filter;
  return {
    min: __minExperience ?? null,
    max: __maxExperience ?? null,
    cleanFilter,
  };
}

/**
 * Returns true if a faculty record's experience is within the given range.
 * @param {object} faculty
 * @param {number|null} min
 * @param {number|null} max
 * @returns {boolean}
 */
function isInExperienceRange(faculty, min, max) {
  if (min === null && max === null) return true;
  const exp = parseFloat(faculty.employmentDetails?.totalExperienceYears || '0');
  if (isNaN(exp)) return false;
  if (min !== null && exp < min) return false;
  if (max !== null && exp > max) return false;
  return true;
}

// ── Utility: merge two filter fragments ──────────────────────────────────────

/**
 * Merges two Mongo filter fragments safely.
 *
 * @param  {...object} filters - one or more filter objects
 * @returns {object}
 */
function mergeFilters(...filters) {
  return Object.assign({}, ...filters);
}

// ── Utility: check if any V2 filter params are present ───────────────────────

/**
 * Returns true if any V2-specific filter query params are present and non-empty.
 *
 * @param {object} query
 * @returns {boolean}
 */
function hasActiveFilters(query = {}) {
  const V2_PARAMS = [
    'year', 'category', 'level', 'pubType',
    'projectCategory', 'projectStatus', 'fundingAgency', 'from', 'to',
    'patentStatus', 'designation', 'awardCategory',
    'program', 'studentDept',
  ];
  return V2_PARAMS.some(p => query[p] && String(query[p]).trim() !== '');
}

// ── IQAC Report period resolution (Admin → Analytics → Reports) ──────────────
//
// Academic-year convention mirrors the one already in
// server/modules/events/routes/register.js: Jun(Y)–May(Y+1), so the whole
// platform agrees on a single definition instead of each module inventing
// its own.
//
// IMPORTANT LIMITATION (documented, not silently papered over): Publications
// (publications.year), Awards (awards.yearReceived) and FDP/Workshops
// (fdpWorkshops.year) store only a bare calendar-year string — no month.
// Under the academic convention these cannot be split at the June boundary,
// so this module widens the match to every calendar year the academic-year
// span touches (e.g. AY 2024-25 touches calendar years 2024 and 2025)
// rather than guess which half a bare "2024" belongs to. Callers must show
// this limitation in the report UI for those three categories. Date-bearing
// categories (Patents' dateOfFiling/grantDate, Projects' startDate/endDate,
// the Events/Booking register's date) get exact boundaries.

function currentAcademicYearStart(now = new Date()) {
  const y = now.getUTCFullYear();
  return now.getUTCMonth() >= 5 ? y : y - 1; // getUTCMonth() 5 === June
}

function academicYearBounds(startYear) {
  return {
    start: new Date(Date.UTC(startYear, 5, 1)),
    end:   new Date(Date.UTC(startYear + 1, 4, 31, 23, 59, 59, 999)),
  };
}

function calendarYearBounds(year) {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end:   new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

function toISODateString(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Validates a From Year / To Year pair.
 * @returns {{valid:true, from:number, to:number}|{valid:false, message:string}}
 */
function validateYearRange(fromYear, toYear) {
  const from = parseInt(fromYear, 10);
  const to   = parseInt(toYear, 10);
  if (isNaN(from) || isNaN(to)) {
    return { valid: false, message: 'From Year and To Year must both be valid years.' };
  }
  if (from > to) {
    return { valid: false, message: 'From Year cannot be later than To Year.' };
  }
  return { valid: true, from, to };
}

function reportPeriodError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Resolves a reporting-period request (periodType/year/fromYear/toYear/
 * convention) into a concrete year list, exact Date bounds (for Date-typed
 * fields) and ISO date-string bounds (for the string-typed date fields this
 * codebase already uses, e.g. patents.dateOfFiling, projects.startDate).
 *
 * @param {object} query - { periodType, year, fromYear, toYear, convention }
 * @param {Date}   now    - injectable for tests
 * @returns {object|null} - null when periodType is absent (caller should
 *                           skip period filtering entirely — no behavior
 *                           change for existing no-filter call paths)
 * @throws {Error} with .status = 400 on an invalid specific/custom period
 */
function resolveReportPeriod(query = {}, now = new Date()) {
  const periodType  = String(query.periodType || '').trim();
  if (!periodType) return null;

  const convention = query.convention === 'academic' ? 'academic' : 'calendar';
  const boundsFor   = convention === 'academic' ? academicYearBounds : calendarYearBounds;
  const currentStartYear = convention === 'academic'
    ? currentAcademicYearStart(now)
    : now.getUTCFullYear();

  let startYear, endYear;

  if (periodType === 'last3') {
    endYear = currentStartYear; startYear = currentStartYear - 2;
  } else if (periodType === 'last5') {
    endYear = currentStartYear; startYear = currentStartYear - 4;
  } else if (periodType === 'specific') {
    const y = parseInt(query.year, 10);
    if (isNaN(y)) throw reportPeriodError('A valid year is required for "Specific Year".');
    startYear = endYear = y;
  } else if (periodType === 'range') {
    const r = validateYearRange(query.fromYear, query.toYear);
    if (!r.valid) throw reportPeriodError(r.message);
    startYear = r.from; endYear = r.to;
  } else {
    throw reportPeriodError(`Unknown reporting period type: "${periodType}".`);
  }

  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const first = boundsFor(startYear);
  const last  = boundsFor(endYear);

  // See file-level note: academic convention widens bare-year-string
  // matching to every calendar year the span touches.
  const yearStringsSet = new Set();
  if (convention === 'academic') {
    for (let y = startYear; y <= endYear + 1; y++) yearStringsSet.add(String(y));
  } else {
    for (const y of years) yearStringsSet.add(String(y));
  }

  return {
    convention,
    periodType,
    startYear,
    endYear,
    years,
    yearStrings: Array.from(yearStringsSet),
    dateRange: { start: first.start, end: last.end },
    dateStringRange: { start: toISODateString(first.start), end: toISODateString(last.end) },
    label: convention === 'academic'
      ? (startYear === endYear
          ? `AY ${startYear}-${String(startYear + 1).slice(-2)}`
          : `AY ${startYear}-${String(startYear + 1).slice(-2)} to AY ${endYear}-${String(endYear + 1).slice(-2)}`)
      : (startYear === endYear ? String(startYear) : `${startYear}\u2013${endYear}`),
  };
}

/**
 * Builds a Mongo $elemMatch fragment restricting a Faculty array sub-document
 * field to a resolved report period, for fields that store only a bare
 * year string (publications.year, awards.yearReceived, fdpWorkshops.year).
 *
 * @param {string} yearField - e.g. 'year' or 'yearReceived'
 * @param {object|null} period - result of resolveReportPeriod(), or null
 * @returns {object} - {} when period is null (no filtering)
 */
function yearStringElemMatch(yearField, period) {
  if (!period) return {};
  return { [yearField]: { $in: period.yearStrings } };
}

/**
 * Builds a Mongo $elemMatch fragment restricting a Faculty array sub-document
 * field to a resolved report period, for fields that store an ISO
 * 'YYYY-MM-DD' date string (patents.dateOfFiling/grantDate,
 * projects.startDate/endDate). Lexicographic string comparison is valid for
 * same-length ISO dates, matching the convention already used elsewhere in
 * this file (projectMatch.startDate.$gte/$lte above).
 *
 * @param {string} dateField
 * @param {object|null} period
 * @returns {object}
 */
function dateStringElemMatch(dateField, period) {
  if (!period) return {};
  return { [dateField]: { $gte: period.dateStringRange.start, $lte: period.dateStringRange.end } };
}

/**
 * Builds a Mongo filter fragment for a real Date-typed field (e.g.
 * Booking.date in the events module) restricted to a resolved report period.
 *
 * @param {string} dateField
 * @param {object|null} period
 * @returns {object}
 */
function dateElemMatch(dateField, period) {
  if (!period) return {};
  return { [dateField]: { $gte: period.dateRange.start, $lte: period.dateRange.end } };
}

module.exports = {
  buildFacultyFilter,
  buildStudentFilter,
  mergeFilters,
  hasActiveFilters,
  extractExperienceFilter,
  isInExperienceRange,
  toArray,
  // Report-period resolution (new)
  resolveReportPeriod,
  validateYearRange,
  currentAcademicYearStart,
  academicYearBounds,
  calendarYearBounds,
  yearStringElemMatch,
  dateStringElemMatch,
  dateElemMatch,
};
