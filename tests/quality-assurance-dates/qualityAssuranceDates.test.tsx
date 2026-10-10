/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() }, getAuthenticatedFileUrl: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import QualityAssurance from '../../src/components/sections/S18_QualityAssurance';
import { formatQaDate, formatQaDateSpan, hasOtherLegacyDates } from '../../src/components/sections/qualityAssuranceUtils';

import { qualityAssuranceOptions } from '../../src/shared/dropdownOptions';

const CHARGES: string[] = qualityAssuranceOptions;
const D = { fromDate: '2022-06-01', toDate: '2024-05-31', dateOfAppointment: '2022-05-15' };

let latest: any[] = [];
function Harness({ initial }: { initial: any[] }) {
  const [data, setData] = useState<any[]>(initial);
  latest = data;
  return <QualityAssurance data={data} onChange={(d) => { latest = d; setData(d); }} />;
}
const group = (label: string) => screen.getByText(label, { selector: 'label' }).closest('.form-group') as HTMLElement;
const input = (label: string) => group(label).querySelector('input') as HTMLInputElement;
const chargeSelect = () => group('Administrative Charge *').querySelector('select') as HTMLSelectElement;
const chooseCharge = (c: string) => fireEvent.change(chargeSelect(), { target: { value: c } });
const setDate = (label: string, v: string) => fireEvent.change(input(label), { target: { value: v } });
const btn = (name: RegExp, n = 0) => screen.getAllByRole('button', { name })[n];
const hasLabel = (l: string) => screen.queryByText(l, { selector: 'label' }) !== null;
async function openNew(u: ReturnType<typeof userEvent.setup>) { await u.click(btn(/Add Responsibility/)); }

beforeEach(() => { cleanup(); latest = []; });

describe('QA dates — form fields for every administrative charge', () => {
  it('there are 8 charges under test (guards against the option list changing silently)', () => {
    expect(CHARGES.length).toBe(8);
    expect(CHARGES).toContain('Director IQAC');
  });

  it.each(CHARGES)('%s: shows From Date, To Date, Date of Appointment (type=date); no Academic Year / Activity Date', async (charge) => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge(charge);
    for (const l of ['From Date', 'To Date', 'Date of Appointment']) {
      expect(input(l).type).toBe('date');
      expect(input(l).value).toBe('');
    }
    expect(hasLabel('Academic Year')).toBe(false);
    expect(hasLabel('Activity Date')).toBe(false);
  });

  it.each(CHARGES)('%s: all three dates save independently', async (charge) => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge(charge);
    setDate('From Date', D.fromDate);
    expect(input('To Date').value).toBe('');
    expect(input('Date of Appointment').value).toBe('');
    setDate('To Date', D.toDate);
    expect(input('Date of Appointment').value).toBe('');
    setDate('Date of Appointment', D.dateOfAppointment);
    await u.click(btn(/^Save$/));
    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ administrativeCharge: charge, ...D });
    expect('academicYear' in latest[0]).toBe(false);
    expect('activityDate' in latest[0]).toBe(false);
  });

  it('dates are optional: a record with only a charge saves, dates empty', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Director IQAC');
    await u.click(btn(/^Save$/));
    expect(latest[0]).toMatchObject({ administrativeCharge: 'Director IQAC', fromDate: '', toDate: '', dateOfAppointment: '' });
  });

  it('From and To can be set without the appointment date, and vice versa', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Other');
    setDate('Date of Appointment', '2021-01-04');
    await u.click(btn(/^Save$/));
    expect(latest[0]).toMatchObject({ fromDate: '', toDate: '', dateOfAppointment: '2021-01-04' });
  });
});

describe('QA dates — changing the charge never clears them', () => {
  it('new record: dates survive every charge change; remarks too', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Director IQAC');
    setDate('From Date', D.fromDate);
    setDate('To Date', D.toDate);
    setDate('Date of Appointment', D.dateOfAppointment);
    for (const c of CHARGES) {
      chooseCharge(c);
      expect(input('From Date').value).toBe(D.fromDate);
      expect(input('To Date').value).toBe(D.toDate);
      expect(input('Date of Appointment').value).toBe(D.dateOfAppointment);
    }
  });

  it('existing record: charge change keeps dates in the saved data', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[{ administrativeCharge: 'Director IQAC', ...D, activityTitle: 'T', remarks: 'keep' }]} />);
    await u.click(btn(/^Edit$/));
    chooseCharge('NIRF Department coordinator');
    expect(latest[0]).toMatchObject({ administrativeCharge: 'NIRF Department coordinator', ...D, remarks: 'keep' });
  });
});

describe('QA dates — edit, restore, preview', () => {
  const rec = { administrativeCharge: 'Convener NAAC criteria', ...D, criteriaNumber: '3', criteriaName: 'Research', remarks: 'r', status: 'Active' };

  it('restores all three dates on edit; changing one leaves the others and other fields intact', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[rec]} />);
    await u.click(btn(/^Edit$/));
    expect(input('From Date').value).toBe(D.fromDate);
    expect(input('To Date').value).toBe(D.toDate);
    expect(input('Date of Appointment').value).toBe(D.dateOfAppointment);
    setDate('To Date', '2025-01-31');
    expect(latest[0]).toEqual({ ...rec, toDate: '2025-01-31' });
  });

  it('preview shows the three dates (dd/mm/yyyy) and never Academic Year / Activity Date', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[rec]} />);
    await u.click(btn(/View/));
    expect(screen.getByText('01/06/2022')).toBeTruthy();
    expect(screen.getByText('31/05/2024')).toBeTruthy();
    expect(screen.getByText('15/05/2022')).toBeTruthy();
    expect(screen.queryByText(/Academic Year/i)).toBeNull();
    expect(screen.queryByText(/Activity Date/i)).toBeNull();
  });

  it('existing Director IQAC fields remain intact', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Director IQAC');
    for (const l of ['Activity Title', 'Activity Category', 'Objective', 'Outcome', 'Supporting Documents URL', 'Remarks']) expect(hasLabel(l)).toBe(true);
    await u.type(input('Activity Title'), 'Audit');
    await u.type(input('Supporting Documents URL'), 'http://x/doc.pdf');
    setDate('From Date', D.fromDate);
    await u.click(btn(/^Save$/));
    expect(latest[0]).toMatchObject({ activityTitle: 'Audit', supportingDocuments: 'http://x/doc.pdf', fromDate: D.fromDate });
  });

  it('charge-specific fields of other charges remain (spot check)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Convener NAAC criteria');
    for (const l of ['Criteria Number', 'Criteria Name', 'Task Description', 'Evidence Available', 'Status']) expect(hasLabel(l)).toBe(true);
    chooseCharge('Coordinating student/teacher feedback and action plans');
    for (const l of ['Semester', 'Feedback Type', 'Feedback Summary', 'Action Plan', 'Responsible Person', 'Implementation Status']) expect(hasLabel(l)).toBe(true);
    chooseCharge('Other');
    // Start Date / End Date inputs removed from Other; only the shared dates + new fields remain
    for (const l of ['Responsibility Title', 'Description', 'Status']) expect(hasLabel(l)).toBe(true);
    expect(hasLabel('Start Date')).toBe(false);
    expect(hasLabel('End Date')).toBe(false);
  });
});

describe('QA dates — legacy records (academicYear + activityDate only)', () => {
  const legacy = { administrativeCharge: 'Director IQAC', academicYear: '2022-2023', activityDate: '2023-01-10', activityTitle: 'NAAC Preparation', activityCategory: 'Meeting', objective: 'SSR', outcome: 'Draft', supportingDocuments: 'http://x/a.pdf', remarks: 'ok' };

  it('loads without errors, shows no legacy labels or values, dates empty', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacy]} />);
    expect(screen.getByText('Director IQAC')).toBeTruthy();
    await u.click(btn(/View/));
    expect(screen.queryByText(/Academic Year/i)).toBeNull();
    expect(screen.queryByText(/Activity Date/i)).toBeNull();
    expect(screen.queryByText('2022-2023')).toBeNull();
    await u.click(btn(/^Edit$/));
    expect(input('From Date').value).toBe('');
    expect(input('To Date').value).toBe('');
    expect(input('Date of Appointment').value).toBe('');
    expect(hasLabel('Academic Year')).toBe(false);
    expect(hasLabel('Activity Date')).toBe(false);
  });

  it('editing keeps legacy values and unrelated data; invents no dates', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacy]} />);
    await u.click(btn(/^Edit$/));
    await u.type(input('Activity Title'), '!');
    expect(latest[0]).toEqual({ ...legacy, activityTitle: 'NAAC Preparation!' });
    expect(latest[0].fromDate).toBeUndefined();
    setDate('Date of Appointment', '2023-01-10');
    expect(latest[0]).toMatchObject({ academicYear: '2022-2023', activityDate: '2023-01-10', dateOfAppointment: '2023-01-10' });
  });

  it('changing the charge on a legacy record does not wipe legacy values', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacy]} />);
    await u.click(btn(/^Edit$/));
    chooseCharge('Other');
    expect(latest[0]).toMatchObject({ administrativeCharge: 'Other', academicYear: '2022-2023', activityDate: '2023-01-10', remarks: 'ok', supportingDocuments: 'http://x/a.pdf' });
  });

  it('minimal / empty legacy records do not crash', () => {
    render(<Harness initial={[{}, { administrativeCharge: 'Other' }, { administrativeCharge: 'Reports for NIRF', academicYear: '2020-21' }]} />);
    expect(screen.getByText('Untitled Responsibility')).toBeTruthy();
  });
});

describe('QA — Other charge: backward compatibility with legacy startDate/endDate', () => {
  // A record saved before the unified From/To dates were introduced.
  const legacyOther = {
    administrativeCharge: 'Other',
    startDate: '2021-03-01',
    endDate: '2022-02-28',
    responsibilityTitle: 'Timetable Co-ordinator',
    description: 'Managed timetables',
    status: 'Completed',
  };
  // A record that already has the new unified dates set (both old and new keys present).
  const migratedOther = {
    administrativeCharge: 'Other',
    startDate: '2021-03-01',
    endDate: '2022-02-28',
    fromDate: '2021-03-01',
    toDate: '2022-02-28',
    responsibilityTitle: 'Library Co-ordinator',
  };

  it('legacy Other record: no Start Date / End Date inputs; migration notice is shown', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacyOther]} />);
    await u.click(btn(/^Edit$/));
    // removed inputs
    expect(hasLabel('Start Date')).toBe(false);
    expect(hasLabel('End Date')).toBe(false);
    // migration notice visible and contains the formatted legacy dates
    const notice = document.querySelector('[data-testid="other-legacy-date-notice"]') as HTMLElement;
    expect(notice).not.toBeNull();
    expect(notice.textContent).toMatch(/01\/03\/2021/);
    expect(notice.textContent).toMatch(/28\/02\/2022/);
  });

  it('legacy Other: migration notice absent when fromDate is already set (no duplication)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[migratedOther]} />);
    await u.click(btn(/^Edit$/));
    expect(document.querySelector('[data-testid="other-legacy-date-notice"]')).toBeNull();
  });

  it('legacy Other: editing keeps startDate/endDate untouched in saved data', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacyOther]} />);
    await u.click(btn(/^Edit$/));
    // Set the description to trigger an update
    setDate('Date of Appointment', '2021-03-01');
    expect(latest[0].startDate).toBe('2021-03-01');
    expect(latest[0].endDate).toBe('2022-02-28');
  });

  it('legacy Other preview: shows Start Date (legacy) / End Date (legacy) when fromDate absent', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacyOther]} />);
    await u.click(btn(/View/));
    expect(screen.getByText(/Start Date \(legacy\)/i)).toBeTruthy();
    expect(screen.getByText(/End Date \(legacy\)/i)).toBeTruthy();
    expect(screen.getByText('01/03/2021')).toBeTruthy();
    expect(screen.getByText('28/02/2022')).toBeTruthy();
  });

  it('migrated Other preview: does NOT show legacy labels when fromDate is set', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[migratedOther]} />);
    await u.click(btn(/View/));
    expect(screen.queryByText(/Start Date \(legacy\)/i)).toBeNull();
    expect(screen.queryByText(/End Date \(legacy\)/i)).toBeNull();
  });

  it('legacy Other subtitle falls back to startDate when from/to absent', () => {
    render(<Harness initial={[legacyOther]} />);
    expect(screen.getByText('Timetable Co-ordinator')).toBeTruthy();
  });

  it('legacy Other: delete removes only that record', async () => {
    const u = userEvent.setup();
    const other2 = { administrativeCharge: 'Other', responsibilityTitle: 'Second Role', fromDate: '2023-01-01', toDate: '2023-12-31' };
    render(<Harness initial={[legacyOther, other2]} />);
    await u.click(btn(/^Delete$/, 0));
    expect(latest).toHaveLength(1);
    expect(latest[0].responsibilityTitle).toBe('Second Role');
  });

  it('new Other record: no migration notice, no Start Date / End Date inputs', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Other');
    expect(hasLabel('Start Date')).toBe(false);
    expect(hasLabel('End Date')).toBe(false);
    expect(document.querySelector('[data-testid="other-legacy-date-notice"]')).toBeNull();
    // shared dates present
    expect(input('From Date').type).toBe('date');
    expect(input('To Date').type).toBe('date');
  });

  it('record with both old and new dates: edit shows new dates, keeps all values, no notice', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[migratedOther]} />);
    await u.click(btn(/^Edit$/));
    // new unified dates visible in shared row
    expect(input('From Date').value).toBe('2021-03-01');
    expect(input('To Date').value).toBe('2022-02-28');
    // legacy startDate/endDate still in model untouched
    expect(latest[0].startDate).toBe('2021-03-01');
    expect(latest[0].endDate).toBe('2022-02-28');
  });
});

describe('QA — Save, Cancel, Edit, Delete', () => {
  it('Cancel discards a new record', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    chooseCharge('Director IQAC');
    setDate('From Date', D.fromDate);
    await u.click(btn(/Cancel/));
    expect(latest).toHaveLength(0);
  });

  it('Delete from the preview and from the edit form removes only that record', async () => {
    const u = userEvent.setup();
    const a = { administrativeCharge: 'Director IQAC', ...D };
    const b = { administrativeCharge: 'Other', responsibilityTitle: 'B' };
    const c = { administrativeCharge: 'NIRF Department coordinator', departmentName: 'CS' };
    render(<Harness initial={[a, b, c]} />);
    await u.click(btn(/^Delete$/, 1));
    expect(latest.map((x) => x.administrativeCharge)).toEqual(['Director IQAC', 'NIRF Department coordinator']);
    await u.click(btn(/^Edit$/, 0));
    await u.click(btn(/Delete/, 0));
    expect(latest.map((x) => x.administrativeCharge)).toEqual(['NIRF Department coordinator']);
  });

  it('Save is disabled until a charge is chosen', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await openNew(u);
    expect((btn(/^Save$/) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('qualityAssuranceUtils', () => {
  it('formats ISO dates as dd/mm/yyyy and passes odd shapes through', () => {
    expect(formatQaDate('2024-01-05')).toBe('05/01/2024');
    expect(formatQaDate('')).toBe('');
    expect(formatQaDate(undefined)).toBe('');
    expect(formatQaDate('Jan 2024')).toBe('Jan 2024');
  });
  it('span text', () => {
    expect(formatQaDateSpan({ fromDate: '2022-06-01', toDate: '2024-05-31' })).toBe('01/06/2022 – 31/05/2024');
    expect(formatQaDateSpan({ fromDate: '2022-06-01' })).toBe('From 01/06/2022');
    expect(formatQaDateSpan({ toDate: '2024-05-31' })).toBe('Until 31/05/2024');
    expect(formatQaDateSpan({})).toBe('');
  });
  it('hasOtherLegacyDates: true only when startDate/endDate present and fromDate/toDate absent', () => {
    expect(hasOtherLegacyDates({ startDate: '2021-03-01', endDate: '2022-02-28' })).toBe(true);
    expect(hasOtherLegacyDates({ startDate: '2021-03-01' })).toBe(true);
    expect(hasOtherLegacyDates({ endDate: '2022-02-28' })).toBe(true);
    // has new dates — no need to show notice
    expect(hasOtherLegacyDates({ startDate: '2021-03-01', fromDate: '2021-03-01' })).toBe(false);
    expect(hasOtherLegacyDates({ startDate: '2021-03-01', toDate: '2022-02-28' })).toBe(false);
    // no legacy at all
    expect(hasOtherLegacyDates({})).toBe(false);
    expect(hasOtherLegacyDates({ fromDate: '2021-03-01' })).toBe(false);
  });
});

