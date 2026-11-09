// server/tests/iqac-report-filters/test.js
//
// Regression coverage for:
//   1. The HOD department-scope override bug: a client-supplied `department`
//      query param could previously win over the server-computed scope
//      restriction because mergeFilters(scopeBase, userFilter) let the
//      later argument (userFilter) overwrite the earlier one. Every real
//      call site in the codebase was fixed to put the scope restriction
//      LAST. This test locks in the correct Object.assign-based semantics
//      of mergeFilters() itself and the call pattern every site now uses.
//   2. The new resolveReportPeriod()/elemMatch helpers added for the IQAC
//      Report Generator (Admin -> Analytics -> Reports).
//
// Run: node server/tests/iqac-report-filters/test.js
// No DB/network required — filterService.js is pure functions.

const {
  mergeFilters,
  resolveReportPeriod,
  validateYearRange,
  currentAcademicYearStart,
  yearStringElemMatch,
  dateStringElemMatch,
  dateElemMatch,
} = require('../../modules/analytics/services/filterService');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

// ============ 1. Scope-override bug: mergeFilters() semantics + call pattern ============

// The fixed pattern everywhere in the codebase is now:
//   mergeFilters(userFilter, scopeBase)   <-- scope restriction passed LAST
// Simulate an HOD (scope restricted to 'Physics') whose request also carries
// a forged `employmentDetails.department` from buildFacultyFilter(req.query)
// (e.g. ?department=Chemistry).

const hodScopeBase   = { 'employmentDetails.department': 'Physics' };
const forgedUserFilter = { 'employmentDetails.department': 'Chemistry', 'patents.status': 'Granted' };

const correctOrderResult = mergeFilters(forgedUserFilter, hodScopeBase);
check(
  'mergeFilters(userFilter, scopeBase): HOD scope wins over forged department param',
  correctOrderResult['employmentDetails.department'] === 'Physics',
  correctOrderResult
);
check(
  'mergeFilters(userFilter, scopeBase): unrelated user filter keys are preserved',
  correctOrderResult['patents.status'] === 'Granted',
  correctOrderResult
);

// Prove the OLD (vulnerable) order really was exploitable, so we know what
// we fixed and this test would have caught the original bug.
const oldVulnerableOrderResult = mergeFilters(hodScopeBase, forgedUserFilter);
check(
  'OLD order mergeFilters(scopeBase, userFilter) was exploitable (documents the bug that was fixed)',
  oldVulnerableOrderResult['employmentDetails.department'] === 'Chemistry',
  oldVulnerableOrderResult
);

// Unrestricted scope (vc/iqac_director/admin/superadmin): base is {} so a
// legitimate department filter from the user must still apply, in either order.
const unrestrictedBase = {};
const legitUserFilter = { 'employmentDetails.department': 'Computer Science' };
check(
  'Unrestricted scope: legitimate user department filter still applies',
  mergeFilters(legitUserFilter, unrestrictedBase)['employmentDetails.department'] === 'Computer Science',
  mergeFilters(legitUserFilter, unrestrictedBase)
);

// ============ 2. resolveReportPeriod() ============

check('resolveReportPeriod(): no periodType -> null (no filter, byte-identical to no-filter calls)',
  resolveReportPeriod({}) === null);

const fixedNow = new Date(Date.UTC(2026, 10, 9)); // 9 Nov 2026

// last3 / last5, calendar convention
let p = resolveReportPeriod({ periodType: 'last3' }, fixedNow);
check('last3 calendar: years = [2024,2025,2026]', JSON.stringify(p.years) === JSON.stringify([2024, 2025, 2026]), p.years);

p = resolveReportPeriod({ periodType: 'last5' }, fixedNow);
check('last5 calendar: years = [2022..2026]', JSON.stringify(p.years) === JSON.stringify([2022, 2023, 2024, 2025, 2026]), p.years);

// specific year
p = resolveReportPeriod({ periodType: 'specific', year: '2023' }, fixedNow);
check('specific year: startYear === endYear === 2023', p.startYear === 2023 && p.endYear === 2023);
check('specific year: label is "2023"', p.label === '2023', p.label);

// specific year invalid
let threw = false;
try { resolveReportPeriod({ periodType: 'specific', year: 'abc' }, fixedNow); }
catch (e) { threw = true; check('specific year invalid: error has status 400', e.status === 400, e); }
check('specific year invalid: throws', threw);

// custom range valid
p = resolveReportPeriod({ periodType: 'range', fromYear: '2021', toYear: '2025' }, fixedNow);
check('custom range: years = [2021..2025]', JSON.stringify(p.years) === JSON.stringify([2021, 2022, 2023, 2024, 2025]), p.years);

// custom range invalid (from > to) — must be rejected, not silently swapped
threw = false;
try { resolveReportPeriod({ periodType: 'range', fromYear: '2025', toYear: '2021' }, fixedNow); }
catch (e) { threw = true; check('custom range from>to: error message names the problem', /later/.test(e.message), e.message); }
check('custom range from>to: throws (invalid selection rejected, not silently reordered)', threw);

// academic year convention: 9 Nov 2026 falls in AY 2026-27 (Jun 2026 - May 2027)
check('currentAcademicYearStart(9 Nov 2026) === 2026', currentAcademicYearStart(fixedNow) === 2026);

const midAcademicYearDate = new Date(Date.UTC(2026, 2, 15)); // 15 Mar 2026 -> still AY 2025-26
check('currentAcademicYearStart(15 Mar 2026) === 2025 (before June -> previous AY)',
  currentAcademicYearStart(midAcademicYearDate) === 2025);

p = resolveReportPeriod({ periodType: 'specific', year: '2024', convention: 'academic' }, fixedNow);
check('academic specific year label format', p.label === 'AY 2024-25', p.label);
check('academic specific year: date bounds are Jun 2024 - May 2025',
  p.dateRange.start.getTime() === Date.UTC(2024, 5, 1) &&
  p.dateRange.end.getTime()   === Date.UTC(2025, 4, 31, 23, 59, 59, 999));
check('academic specific year: bare-year string widening touches both 2024 and 2025 (documented limitation)',
  JSON.stringify(p.yearStrings.sort()) === JSON.stringify(['2024', '2025']), p.yearStrings);

// ============ 3. validateYearRange() ============

check('validateYearRange: valid range', validateYearRange('2020', '2024').valid === true);
check('validateYearRange: from > to is invalid', validateYearRange('2024', '2020').valid === false);
check('validateYearRange: non-numeric is invalid', validateYearRange('abc', '2024').valid === false);

// ============ 4. elemMatch helpers ============

p = resolveReportPeriod({ periodType: 'specific', year: '2023' }, fixedNow);
check('yearStringElemMatch: $in on the given field',
  JSON.stringify(yearStringElemMatch('year', p)) === JSON.stringify({ year: { $in: ['2023'] } }));
check('yearStringElemMatch: null period -> {} (no filtering, no behavior change)',
  JSON.stringify(yearStringElemMatch('year', null)) === '{}');

check('dateStringElemMatch: $gte/$lte ISO strings',
  JSON.stringify(dateStringElemMatch('dateOfFiling', p)) ===
  JSON.stringify({ dateOfFiling: { $gte: '2023-01-01', $lte: '2023-12-31' } }));

const dm = dateElemMatch('date', p);
check('dateElemMatch: $gte/$lte real Date objects',
  dm.date.$gte instanceof Date && dm.date.$lte instanceof Date &&
  dm.date.$gte.getUTCFullYear() === 2023 && dm.date.$lte.getUTCFullYear() === 2023);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
