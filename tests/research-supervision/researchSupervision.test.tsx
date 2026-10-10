/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import ResearchSupervision from '../../src/components/sections/S09_ResearchSupervision';
import { SUPERVISION_DATE_FIELDS, formatSupervisionDate, emptyStudentDates } from '../../src/components/sections/researchSupervisionUtils';

const LABELS = [
  'Date of Admission / Enrolment',
  'Date of Registration',
  'Date of Submission of Thesis',
  'Date of Viva Voce',
  'Date of Approval by Syndicate',
];
const KEYS = ['dateOfAdmissionEnrolment', 'dateOfRegistration', 'dateOfThesisSubmission', 'dateOfVivaVoce', 'dateOfSyndicateApproval'];

let persisted: { data: any; toast?: boolean }[] = [];
function Harness({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial);
  return <ResearchSupervision data={data} onChange={setData} onPersist={(d: any, t?: boolean) => { persisted.push({ data: JSON.parse(JSON.stringify(d)), toast: t }); }} />;
}
const lastStudents = () => persisted[persisted.length - 1].data.studentDetails;
const dateInput = (label: string) => (screen.getByText(label, { selector: "label" }).closest(".form-group") as HTMLElement).querySelector("input") as HTMLInputElement;
const setDate = (label: string, v: string) => fireEvent.change(dateInput(label) as HTMLInputElement, { target: { value: v } });
const clickSave = async (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
const clickEdit = async (u: ReturnType<typeof userEvent.setup>, n = 0) => u.click(screen.getAllByRole('button', { name: /^Edit$/ })[n]);
const base = (over: any = {}) => ({ studentDetails: [{ id: 's1', studentName: 'Asha Nair', topic: 'Graph Mining', fellowship: 'UGC-JRF', degree: 'Ph.D', status: 'Ongoing', scholarGender: 'Female', guidanceType: 'Supervisor', supervisionCategory: 'Regular', ...over }] });

beforeEach(() => { cleanup(); persisted = []; });

describe('Research Supervision — five date fields', () => {
  it('renders the five date inputs with the exact labels, type="date", and no Year field', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    for (const l of LABELS) {
      expect(screen.getByText(l, { selector: 'label' })).toBeTruthy();
      expect((dateInput(l) as HTMLInputElement).type).toBe('date');
      expect((dateInput(l) as HTMLInputElement).value).toBe('');
    }
    expect(screen.queryByText(/^Year$/, { selector: 'label' })).toBeNull();
    expect(document.querySelectorAll('select option[value="2024"]').length).toBe(0); // no year dropdown left
  });

  it('labels in the helper match the required wording, in order', () => {
    expect(SUPERVISION_DATE_FIELDS.map((f) => f.label)).toEqual(LABELS);
    expect(SUPERVISION_DATE_FIELDS.map((f) => f.key)).toEqual(KEYS);
  });

  it('each date can be set independently without touching the other four', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    for (let i = 0; i < 5; i++) {
      setDate(LABELS[i], `20${20 + i}-0${i + 1}-1${i}`);
      const expected = LABELS.map((_, j) => (j <= i ? `20${20 + j}-0${j + 1}-1${j}` : ''));
      expect(LABELS.map((l) => (dateInput(l) as HTMLInputElement).value)).toEqual(expected);
    }
  });

  it('all five values are sent to the backend on Save, with the other fields intact', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    const vals = ['2019-07-01', '2019-12-15', '2023-03-20', '2023-06-10', '2023-09-05'];
    LABELS.forEach((l, i) => setDate(l, vals[i]));
    await clickSave(u);
    const saved = persisted[persisted.length - 1];
    expect(saved.toast).toBe(true);
    const st = lastStudents()[0];
    KEYS.forEach((k, i) => expect(st[k]).toBe(vals[i]));
    expect(st).toMatchObject({ studentName: 'Asha Nair', topic: 'Graph Mining', fellowship: 'UGC-JRF', degree: 'Ph.D', status: 'Ongoing', scholarGender: 'Female', guidanceType: 'Supervisor', supervisionCategory: 'Regular' });
  });

  it('saving after changing ONE date keeps the other four saved dates', async () => {
    const u = userEvent.setup();
    const all = { dateOfAdmissionEnrolment: '2019-07-01', dateOfRegistration: '2019-12-15', dateOfThesisSubmission: '2023-03-20', dateOfVivaVoce: '2023-06-10', dateOfSyndicateApproval: '2023-09-05' };
    render(<Harness initial={base(all)} />);
    await clickEdit(u);
    setDate('Date of Viva Voce', '2023-07-11');
    await clickSave(u);
    expect(lastStudents()[0]).toMatchObject({ ...all, dateOfVivaVoce: '2023-07-11' });
  });

  it('restores saved dates when the record is reopened (JSON round trip) and edited', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    LABELS.forEach((l, i) => setDate(l, `2021-0${i + 1}-0${i + 1}`));
    await clickSave(u);
    const reloaded = JSON.parse(JSON.stringify(persisted[persisted.length - 1].data));
    cleanup();
    render(<Harness initial={reloaded} />);
    await clickEdit(u);
    LABELS.forEach((l, i) => expect((dateInput(l) as HTMLInputElement).value).toBe(`2021-0${i + 1}-0${i + 1}`));
  });

  it('empty dates stay empty strings: nothing invented, saving a record with no dates works', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    await clickSave(u);
    KEYS.forEach((k) => expect(lastStudents()[0][k] ?? '').toBe(''));
    expect(screen.queryByTestId('supervision-dates-summary')).toBeNull();
  });

  it('clearing a previously saved date saves it as empty (and leaves the others)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base({ dateOfRegistration: '2020-01-02', dateOfVivaVoce: '2023-06-10' })} />);
    await clickEdit(u);
    setDate('Date of Registration', '');
    await clickSave(u);
    expect(lastStudents()[0].dateOfRegistration).toBe('');
    expect(lastStudents()[0].dateOfVivaVoce).toBe('2023-06-10');
  });

  it('Add Student creates a record with five empty dates and no `year` key', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ studentDetails: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Student/ }));
    for (const l of LABELS) expect((dateInput(l) as HTMLInputElement).value).toBe('');
    await u.type(screen.getByPlaceholderText('Enter student name'), 'Ravi');
    await clickSave(u);
    const st = lastStudents()[0];
    expect(st).toMatchObject({ studentName: 'Ravi', degree: 'Ph.D', status: 'Ongoing', ...emptyStudentDates() });
    expect(st).not.toHaveProperty('year');
  });

  it('read-only card shows only the dates that are filled, formatted without timezone shifts', async () => {
    render(<Harness initial={base({ dateOfAdmissionEnrolment: '2019-07-01', dateOfVivaVoce: '2023-12-31' })} />);
    expect(screen.getByTestId('supervision-dates-summary').textContent).toBe('Admission: 01 Jul 2019 • Viva Voce: 31 Dec 2023');
    expect(formatSupervisionDate('2020-02-29')).toBe('29 Feb 2020');
    expect(formatSupervisionDate('')).toBe('');
    expect(formatSupervisionDate('garbage')).toBe('garbage');
  });
});

describe('Research Supervision — legacy records with only `year`', () => {
  const legacy = () => base({ year: '2018' });

  it('loads without errors, shows no Year anywhere, and dates are empty', async () => {
    const u = userEvent.setup();
    render(<Harness initial={legacy()} />);
    expect(screen.getByText('Asha Nair')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Year: 2018/);
    await clickEdit(u);
    for (const l of LABELS) expect((dateInput(l) as HTMLInputElement).value).toBe('');
    expect(screen.queryByText(/^Year$/, { selector: 'label' })).toBeNull();
  });

  it('does NOT infer any date from the old year', async () => {
    const u = userEvent.setup();
    render(<Harness initial={legacy()} />);
    await clickEdit(u);
    await clickSave(u);
    KEYS.forEach((k) => expect(lastStudents()[0][k] ?? '').toBe(''));
    expect(JSON.stringify(lastStudents()[0])).not.toMatch(/2018-\d\d-\d\d/);
  });

  it('keeps the historical `year` value on the record when saving other changes (nothing silently deleted)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={legacy()} />);
    await clickEdit(u);
    setDate('Date of Registration', '2018-08-08');
    await clickSave(u);
    expect(lastStudents()[0]).toMatchObject({ year: '2018', dateOfRegistration: '2018-08-08', studentName: 'Asha Nair' });
  });

  it('mixed list: a legacy record and a new-format record render together', () => {
    render(<Harness initial={{ studentDetails: [{ id: 'a', studentName: 'Old Student', year: '2015', degree: 'Ph.D', status: 'Completed' }, { id: 'b', studentName: 'New Student', degree: 'M.Phil', status: 'Ongoing', dateOfRegistration: '2022-01-05' }] }} />);
    expect(screen.getAllByText('Old Student').length).toBeGreaterThan(0); // also listed under Completed Ph.D. Students
    expect(screen.getByText('New Student')).toBeTruthy();
    expect(screen.getAllByTestId('supervision-dates-summary')).toHaveLength(1);
  });
});

describe('Research Supervision — existing behaviour intact', () => {
  it('Save is disabled until a student name is entered', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ studentDetails: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Student/ }));
    expect((screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement).disabled).toBe(true);
    await u.type(screen.getByPlaceholderText('Enter student name'), 'X');
    expect((screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it('Delete (from a saved card, through the confirm dialog) removes the student and persists', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await u.click(screen.getByRole('button', { name: /Delete/ }));
    const confirm = await screen.findAllByRole('button', { name: /Delete/ });
    await u.click(confirm[confirm.length - 1]);
    expect(persisted.length).toBeGreaterThan(0);
    expect(lastStudents()).toEqual([]);
  });

  it('Delete from the edit form removes the record', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    await u.click(screen.getAllByRole('button', { name: /Delete/ })[0]);
    expect(lastStudents()).toEqual([]);
  });

  it('summary counters still follow degree/status; Ph.D. awarded counts a completed Ph.D.', () => {
    render(<Harness initial={{ studentDetails: [{ id: 'a', studentName: 'Done', degree: 'Ph.D', status: 'Completed' }] }} />);
    expect(screen.getAllByText('Ph.D. Awarded')[0].previousSibling?.textContent).toBe('1');
  });

  it('other fields (name, gender, degree, status, guidance, category, topic, fellowship) remain editable', async () => {
    const u = userEvent.setup();
    render(<Harness initial={base()} />);
    await clickEdit(u);
    for (const l of ['Student Name *', 'Scholar Gender', 'Degree *', 'Status *', 'Guidance Type', 'Supervision Category', 'Topic', 'Fellowship Details']) {
      expect(screen.getByText(l, { selector: 'label' })).toBeTruthy();
    }
    fireEvent.change(screen.getByPlaceholderText('Enter research topic'), { target: { value: 'New topic' } });
    await clickSave(u);
    expect(lastStudents()[0].topic).toBe('New topic');
  });
});
