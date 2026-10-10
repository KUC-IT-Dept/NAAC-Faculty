/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
Element.prototype.scrollIntoView = vi.fn();

import AcademicResponsibilities from '../../src/components/sections/S10_AcademicResponsibilities';
import {
  buildAcademicYearOptions, courseAcademicYearLabel, courseSemesterLabel, courseProgramme,
  semesterForEdit, legacyYearNote, legacySemesterNote, courseSortYear, EMPTY_COURSE,
} from '../../src/components/sections/academicCourseUtils';

let persisted: any[] = [];
function Harness({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial);
  return <AcademicResponsibilities data={data} onChange={setData} onPersist={(d: any) => { persisted.push(JSON.parse(JSON.stringify(d))); }} />;
}
const last = () => persisted[persisted.length - 1];
const form = (label: string) => within(screen.getByText(label, { selector: 'label' }).closest('.form-group') as HTMLElement);
const nativeSelect = (label: string) => form(label).getByRole('combobox') as HTMLSelectElement;
const searchable = (label: string) => form(label).getByRole('combobox');
const card = () => document.querySelector('.list-item-card') as HTMLElement;
const labelsInCard = () => Array.from(card().querySelectorAll('label.form-label')).map((l) => (l.textContent || '').trim());

async function pick(u: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await u.click(searchable(label));
  await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}
async function addCourse(u: ReturnType<typeof userEvent.setup>, v: { course: string; programme?: string; year?: string; semester?: string; dept?: string }) {
  await u.click(screen.getByRole('button', { name: /Add Course/ }));
  await pick(u, 'Courses / Subjects Taught', v.course);
  if (v.programme) await pick(u, 'Programmes', v.programme);
  if (v.year) await u.selectOptions(nativeSelect('Academic Year'), v.year);
  if (v.semester) await u.selectOptions(nativeSelect('Semester'), v.semester);
  if (v.dept) await pick(u, 'Department', v.dept);
  await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
}

beforeEach(() => { cleanup(); persisted = []; });

describe('Academic Responsibilities — course form field order and shape', () => {
  it('shows exactly: Courses / Subjects Taught, Programmes, Academic Year, Semester, Department', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    expect(labelsInCard()).toEqual(['Courses / Subjects Taught', 'Programmes', 'Academic Year', 'Semester', 'Department']);
  });

  it('has no From/To Year or From/To Semester controls in the course form', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    for (const t of ['From Year', 'To Year', 'From Semester', 'To Semester']) expect(within(card()).queryByText(t)).toBeNull();
  });

  it('course, programme and department are searchable dropdowns; year and semester are single selects', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    for (const l of ['Courses / Subjects Taught', 'Programmes', 'Department']) expect(searchable(l).getAttribute('aria-haspopup')).toBe('listbox');
    expect(nativeSelect('Academic Year').tagName).toBe('SELECT');
    expect(nativeSelect('Semester').tagName).toBe('SELECT');
  });

  it('Academic Year options use the YYYY-YYYY convention, newest first', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    const vals = Array.from(nativeSelect('Academic Year').options).map((o) => o.value).filter(Boolean);
    const y = new Date().getFullYear();
    expect(vals[0]).toBe(`${y}-${y + 1}`);
    expect(vals).toContain('2023-2024');
    expect(vals.every((v) => /^\d{4}-\d{4}$/.test(v))).toBe(true);
  });

  it('edit form keeps the same order', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [{ courseName: 'Data Structures', academicYear: '2023-2024' }], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(labelsInCard()).toEqual(['Courses / Subjects Taught', 'Programmes', 'Academic Year', 'Semester', 'Department']);
  });
});

describe('Academic Responsibilities — add, save, reopen (single year / semester)', () => {
  it('saves one academicYear + one semester + programmes and no range keys', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    await pick(u, 'Courses / Subjects Taught', 'Data Structures');
    await pick(u, 'Programmes', 'B.Tech');
    await u.selectOptions(nativeSelect('Academic Year'), '2023-2024');
    await u.selectOptions(nativeSelect('Semester'), 'Semester III');
    await u.click(searchable('Department'));
    const dept = within(screen.getByRole('listbox')).getAllByRole('option')[0];
    const deptName = dept.textContent as string;
    await u.click(dept);
    await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);

    const c = last().courses[0];
    expect(c).toEqual({ courseName: 'Data Structures', programmes: 'B.Tech', academicYear: '2023-2024', semester: 'Semester III', subject: deptName });
    for (const k of ['fromYear', 'toYear', 'semesterFrom', 'semesterTo']) expect(c).not.toHaveProperty(k);
  });

  it('Save needs only a course name; year and semester stay optional', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    expect((screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement).disabled).toBe(true);
    await pick(u, 'Courses / Subjects Taught', 'Data Structures');
    expect((screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it('custom course name via Add Other is saved trimmed, and Add Other shows on open', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Course/ }));
    await u.click(searchable('Courses / Subjects Taught'));
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add Other...');
    await u.type(screen.getByPlaceholderText('Search...'), '  Quantum Computing Lab  ');
    await u.click(screen.getByTestId('add-other-action'));
    await waitFor(() => expect(searchable('Courses / Subjects Taught').textContent).toContain('Quantum Computing Lab'));
    await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
    expect(last().courses[0].courseName).toBe('Quantum Computing Lab');
  });

  it('reopen after a JSON round trip: card shows saved values; edit shows them in the controls', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await addCourse(u, { course: 'Data Structures', programme: 'B.Tech', year: '2022-2023', semester: 'Semester II' });
    const saved = JSON.parse(JSON.stringify(last()));   // what the API would hand back
    cleanup();

    render(<Harness initial={saved} />);
    expect(screen.getByText('2022-2023')).toBeTruthy();
    expect(screen.getByText('Semester II')).toBeTruthy();
    expect(screen.getByText('B.Tech')).toBeTruthy();

    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(nativeSelect('Academic Year').value).toBe('2022-2023');
    expect(nativeSelect('Semester').value).toBe('Semester II');
    expect(searchable('Programmes').textContent).toContain('B.Tech');
    expect(searchable('Courses / Subjects Taught').textContent).toContain('Data Structures');
  });

  it('editing the year/semester of a saved record persists and survives another reopen', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [{ courseName: 'Data Structures', programmes: 'B.Tech', academicYear: '2022-2023', semester: 'Semester II', subject: '' }], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    await u.selectOptions(nativeSelect('Academic Year'), '2024-2025');
    await u.selectOptions(nativeSelect('Semester'), 'Semester IV');
    expect(last().courses[0]).toMatchObject({ academicYear: '2024-2025', semester: 'Semester IV' });
    cleanup();
    render(<Harness initial={JSON.parse(JSON.stringify(last()))} />);
    expect(screen.getByText('2024-2025')).toBeTruthy();
    expect(screen.getByText('Semester IV')).toBeTruthy();
  });

  it('newest academic year is listed first', async () => {
    render(<Harness initial={{ courses: [
      { courseName: 'Older', academicYear: '2019-2020' },
      { courseName: 'Newer', academicYear: '2024-2025' },
    ], otherResponsibilities: [] }} />);
    const names = Array.from(document.querySelectorAll('.list-item-card')).map((c) => c.textContent || '');
    expect(names[0]).toContain('Newer');
    expect(names[1]).toContain('Older');
  });

  it('Edit and Delete act on the right record when stored order differs from display order', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [
      { courseName: 'Older', academicYear: '2019-2020', subject: 'X' },
      { courseName: 'Newer', academicYear: '2024-2025', subject: 'Y' },
    ], otherResponsibilities: [] }} />);
    // display order: Newer, Older
    await u.click(screen.getAllByRole('button', { name: /^Edit$/ })[0]);        // edits "Newer"
    await u.selectOptions(nativeSelect('Semester'), 'Semester V');
    expect(last().courses.find((c: any) => c.courseName === 'Newer').semester).toBe('Semester V');
    expect(last().courses.find((c: any) => c.courseName === 'Older').semester ?? '').toBe('');
    await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
    await u.click(screen.getAllByRole('button', { name: /Delete/ })[0]);        // deletes "Newer"
    expect(last().courses.map((c: any) => c.courseName)).toEqual(['Older']);
  });
});

describe('Academic Responsibilities — compatibility with older records', () => {
  const legacyRange = { courseName: 'Operating Systems', fromYear: '2021', toYear: '2023', semesterFrom: 'Semester I', semesterTo: 'Semester III', programme: 'UG', subject: 'Computer Science' };

  it('year and semester ranges still display; singular `programme` still displays', () => {
    render(<Harness initial={{ courses: [legacyRange], otherResponsibilities: [] }} />);
    expect(screen.getByText('2021 – 2023')).toBeTruthy();
    expect(screen.getByText('Semester I – Semester III')).toBeTruthy();
    expect(screen.getByText('UG')).toBeTruthy();
    expect(screen.getByText(/Department: Computer Science/)).toBeTruthy();
  });

  it('opening a range record for editing shows what was recorded and does NOT write anything by itself', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [legacyRange], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(screen.getAllByText(/Previously recorded: 2021 – 2023/).length).toBe(1);
    expect(screen.getAllByText(/Previously recorded: Semester I – Semester III/).length).toBe(1);
    expect(nativeSelect('Academic Year').value).toBe('');
    expect(nativeSelect('Semester').value).toBe('');
    expect(persisted).toHaveLength(0);                 // no silent migration
    expect(searchable('Programmes').textContent).toContain('UG');
  });

  it('choosing a single year/semester keeps every legacy key on the record (nothing discarded)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [legacyRange], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    await u.selectOptions(nativeSelect('Academic Year'), '2022-2023');
    await u.selectOptions(nativeSelect('Semester'), 'Semester II');
    expect(last().courses[0]).toMatchObject({ ...legacyRange, academicYear: '2022-2023', semester: 'Semester II' });
    await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
    expect(screen.getByText('2022-2023')).toBeTruthy();                 // new value wins in the card
    await u.click(screen.getByRole('button', { name: /View/ }));
    expect(screen.getByText('2021 – 2023')).toBeTruthy();               // old range still visible, labelled legacy
  });

  it('a legacy record with equal from/to semester pre-fills the single Semester losslessly', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [{ courseName: 'DBMS', fromYear: '2020', toYear: '2020', semesterFrom: 'Semester IV', semesterTo: 'Semester IV' }], otherResponsibilities: [] }} />);
    expect(screen.getByText('2020')).toBeTruthy();                       // equal range shown once, not "2020 – 2020"
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(nativeSelect('Semester').value).toBe('Semester IV');
    expect(screen.queryByText(/Previously recorded: Semester/)).toBeNull();
  });

  it('records with no year/semester at all still render and edit', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [{ courseName: 'Bare' }], otherResponsibilities: [] }} />);
    expect(screen.getByText('Bare')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(nativeSelect('Academic Year').value).toBe('');
  });

  it('a stored academicYear outside the generated list is still selectable/visible', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [{ courseName: 'Old', academicYear: '1950-1951' }], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(nativeSelect('Academic Year').value).toBe('1950-1951');
  });

  it('"Other Academic Responsibilities" form is untouched (still has its own From/To Year and Semester)', async () => {
    const u = userEvent.setup();
    render(<Harness initial={{ courses: [], otherResponsibilities: [] }} />);
    await u.click(screen.getByRole('button', { name: /Add Responsibility/ }));
    for (const t of ['From Year', 'To Year', 'From Semester', 'To Semester']) expect(screen.getByText(t)).toBeTruthy();
  });
});

describe('academicCourseUtils', () => {
  it('buildAcademicYearOptions', () => {
    expect(buildAcademicYearOptions(2023, new Date('2025-06-01'))).toEqual(['2025-2026', '2024-2025', '2023-2024']);
  });
  it('labels prefer the new single values, fall back to legacy', () => {
    expect(courseAcademicYearLabel({ academicYear: '2023-2024', fromYear: '2019', toYear: '2020' })).toBe('2023-2024');
    expect(courseAcademicYearLabel({ fromYear: '2019', toYear: '2020' })).toBe('2019 – 2020');
    expect(courseAcademicYearLabel({ fromYear: '2019', toYear: '2019' })).toBe('2019');
    expect(courseAcademicYearLabel({ toYear: '2020' })).toBe('2020');
    expect(courseAcademicYearLabel({})).toBe('');
    expect(courseSemesterLabel({ semester: 'Semester I', semesterFrom: 'Semester V' })).toBe('Semester I');
    expect(courseSemesterLabel({ semesterFrom: 'Semester I', semesterTo: 'Semester II' })).toBe('Semester I – Semester II');
    expect(courseProgramme({ programme: 'UG' })).toBe('UG');
    expect(courseProgramme({ programmes: 'PG', programme: 'UG' })).toBe('PG');
  });
  it('semesterForEdit / notes only collapse lossless cases', () => {
    expect(semesterForEdit({ semesterFrom: 'Semester I' })).toBe('Semester I');
    expect(semesterForEdit({ semesterFrom: 'Semester I', semesterTo: 'Semester I' })).toBe('Semester I');
    expect(semesterForEdit({ semesterFrom: 'Semester I', semesterTo: 'Semester II' })).toBe('');
    expect(legacySemesterNote({ semesterFrom: 'Semester I', semesterTo: 'Semester II' })).toMatch(/Semester I – Semester II/);
    expect(legacySemesterNote({ semesterFrom: 'Semester I' })).toBe('');
    expect(legacyYearNote({ fromYear: '2021', toYear: '2023' })).toMatch(/2021 – 2023/);
    expect(legacyYearNote({ academicYear: '2022-2023', fromYear: '2021' })).toBe('');
  });
  it('sort key', () => {
    expect(courseSortYear({ academicYear: '2024-2025' })).toBe(2024);
    expect(courseSortYear({ fromYear: '2019' })).toBe(2019);
    expect(courseSortYear({ toYear: '2018' })).toBe(2018);
    expect(courseSortYear({})).toBe(0);
  });
  it('new-record template has no legacy range keys', () => {
    expect(Object.keys(EMPTY_COURSE).sort()).toEqual(['academicYear', 'courseName', 'programmes', 'semester', 'subject']);
  });
});
