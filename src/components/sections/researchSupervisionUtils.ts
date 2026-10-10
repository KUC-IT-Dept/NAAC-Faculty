/**
 * Research Supervision: the five independent academic-milestone dates.
 * Stored per student record as 'YYYY-MM-DD' strings (what <input type="date"> produces),
 * '' when not applicable. They are never derived from each other or from the legacy `year`.
 */
export const SUPERVISION_DATE_FIELDS = [
  { key: 'dateOfAdmissionEnrolment', label: 'Date of Admission / Enrolment', short: 'Admission' },
  { key: 'dateOfRegistration', label: 'Date of Registration', short: 'Registration' },
  { key: 'dateOfThesisSubmission', label: 'Date of Submission of Thesis', short: 'Thesis Submission' },
  { key: 'dateOfVivaVoce', label: 'Date of Viva Voce', short: 'Viva Voce' },
  { key: 'dateOfSyndicateApproval', label: 'Date of Approval by Syndicate', short: 'Syndicate Approval' },
] as const;

export type SupervisionDateKey = typeof SUPERVISION_DATE_FIELDS[number]['key'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2020-07-01' -> '01 Jul 2020' (string maths only: no Date object, so no timezone shifts). Unknown shapes pass through. */
export function formatSupervisionDate(v?: string): string {
  const s = (v || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${m[3]} ${month} ${m[1]}` : s;
}

/** Empty record template for a new student. Dates start empty; `year` is not written for new records. */
export const emptyStudentDates = (): Record<SupervisionDateKey, string> => ({
  dateOfAdmissionEnrolment: '',
  dateOfRegistration: '',
  dateOfThesisSubmission: '',
  dateOfVivaVoce: '',
  dateOfSyndicateApproval: '',
});
