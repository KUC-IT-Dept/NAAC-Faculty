/**
 * Helpers for the Courses / Subjects Taught records in Academic Responsibilities.
 *
 * Current format (single values):
 *   academicYear: "2023-2024"      (same "YYYY-YYYY" convention as Quality Assurance / Departmental Charges)
 *   semester:     "Semester III"   (values from semesterTypeOptions)
 *   programmes:   string
 *
 * Legacy format (still stored on old records, never deleted):
 *   fromYear / toYear           -> calendar-year range, e.g. "2021" / "2023"
 *   semesterFrom / semesterTo   -> semester range
 *   programme (singular)        -> what the backend schema persisted before `programmes` was added
 */

export interface CourseRecord {
  courseName?: string;
  programmes?: string;
  programme?: string;
  academicYear?: string;
  semester?: string;
  subject?: string;
  fromYear?: string;
  toYear?: string;
  semesterFrom?: string;
  semesterTo?: string;
  [k: string]: unknown;
}

export const EMPTY_COURSE: CourseRecord = {
  courseName: '',
  programmes: '',
  academicYear: '',
  semester: '',
  subject: '',
};

/** "2026-2027", "2025-2026", ... descending, starting at the current calendar year. */
export function buildAcademicYearOptions(startYear = 1960, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let y = now.getFullYear(); y >= startYear; y--) out.push(`${y}-${y + 1}`);
  return out;
}

const clean = (s?: string) => (s || '').trim();
const range = (a: string, b: string) => (a && b ? (a === b ? a : `${a} – ${b}`) : a || b);

export const legacyYearLabel = (c: CourseRecord) => range(clean(c.fromYear), clean(c.toYear));
export const legacySemesterLabel = (c: CourseRecord) => range(clean(c.semesterFrom), clean(c.semesterTo));

/** What to show for the academic year: the new single value, else the legacy range. */
export const courseAcademicYearLabel = (c: CourseRecord) => clean(c.academicYear) || legacyYearLabel(c);

/** What to show for the semester: the new single value, else the legacy range. */
export const courseSemesterLabel = (c: CourseRecord) => clean(c.semester) || legacySemesterLabel(c);

export const courseProgramme = (c: CourseRecord) => clean(c.programmes) || clean(c.programme);

/**
 * Value the Semester control should show. Pre-fills from legacy data only when that is lossless
 * (a single semester, or from === to). A real range is NOT collapsed; it stays visible as a note.
 */
export function semesterForEdit(c: CourseRecord): string {
  if (clean(c.semester)) return clean(c.semester);
  const from = clean(c.semesterFrom);
  const to = clean(c.semesterTo);
  if (from && (!to || to === from)) return from;
  if (!from && to) return to;
  return '';
}

/** Value the Academic Year control should show (never guesses a "YYYY-YYYY" from a bare year). */
export const academicYearForEdit = (c: CourseRecord): string => clean(c.academicYear);

/** Note shown under a control when an older record has data the single control cannot represent. */
export function legacyYearNote(c: CourseRecord): string {
  if (clean(c.academicYear)) return '';
  const l = legacyYearLabel(c);
  return l ? `Previously recorded: ${l} (kept on this record)` : '';
}
export function legacySemesterNote(c: CourseRecord): string {
  if (clean(c.semester)) return '';
  const from = clean(c.semesterFrom);
  const to = clean(c.semesterTo);
  const lossless = from && (!to || to === from);
  if (lossless || (!from && to)) return '';
  const l = legacySemesterLabel(c);
  return l ? `Previously recorded: ${l} (kept on this record)` : '';
}

/** Sort key (descending): start year of the academic year, else legacy fromYear/toYear. */
export function courseSortYear(c: CourseRecord): number {
  const ay = parseInt(clean(c.academicYear).slice(0, 4), 10);
  if (!Number.isNaN(ay)) return ay;
  return parseInt(clean(c.fromYear) || clean(c.toYear) || '0', 10) || 0;
}
