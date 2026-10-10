/**
 * Quality Assurance: three independent dates shared by every Administrative Charge.
 * Stored per record as 'YYYY-MM-DD' strings (what <input type="date"> produces), '' when not set.
 * They are never derived from each other or from the legacy `academicYear` / `activityDate`.
 */
export const QA_DATE_KEYS = ['fromDate', 'toDate', 'dateOfAppointment'] as const;

/** Legacy fields: no longer shown or written by the form, but kept on existing records (never deleted). */
export const QA_LEGACY_KEYS = ['academicYear', 'activityDate'] as const;

/**
 * Legacy date keys that belonged exclusively to the "Other" charge before
 * the unified From/To dates were introduced. Still stored in the database;
 * no longer written by the form. Kept so existing records are not lost.
 */
export const QA_OTHER_LEGACY_KEYS = ['startDate', 'endDate'] as const;

/**
 * Returns true when an "Other" record has legacy startDate/endDate data
 * but the replacement fromDate/toDate have not yet been filled in.
 * Used to show a non-silent migration hint in the edit form.
 */
export function hasOtherLegacyDates(r: Record<string, unknown>): boolean {
  const hasLegacy = !!(r.startDate || r.endDate);
  const hasNew = !!(r.fromDate || r.toDate);
  return hasLegacy && !hasNew;
}

/** '2024-07-01' -> '01/07/2024' (same dd/mm/yyyy as en-GB used elsewhere; string maths, no timezone shift). Other shapes pass through. */
export function formatQaDate(v?: string): string {
  const s = (v || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

/** Short "from – to" text for list subtitles; '' when neither date is set. */
export function formatQaDateSpan(r: { fromDate?: string; toDate?: string }): string {
  const f = formatQaDate(r.fromDate);
  const t = formatQaDate(r.toDate);
  if (f && t) return `${f} – ${t}`;
  if (f) return `From ${f}`;
  if (t) return `Until ${t}`;
  return '';
}
