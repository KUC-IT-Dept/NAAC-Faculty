/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Regression sweep over EVERY usage of the shared SearchableSelect.
 *  - Faculty section forms: each searchable field must show "+ Add Other..." on open, offer
 *    + Add "<typed>" and apply the trimmed value.
 *  - Fixed-list admin / VC / HOD pickers must opt out with allowAddOther={false}.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn(), put: vi.fn() },
  getAuthenticatedFileUrl: (u: string) => u,
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
Element.prototype.scrollIntoView = vi.fn();

const sections: Record<string, any> = import.meta.glob('../../src/components/sections/S*.tsx', { eager: true });
const raw: Record<string, string> = import.meta.glob('../../src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as any;

type Case = { file: string; shape: 'array' | 'object'; addButton: RegExp; minTriggers: number };
const CASES: Case[] = [
  { file: 'S02_Qualifications', shape: 'array', addButton: /^Add Qualification/, minTriggers: 2 },
  { file: 'S04_EmploymentDetails', shape: 'object', addButton: /^Add Current Employment/, minTriggers: 2 },
  { file: 'S05_WorkExperience', shape: 'array', addButton: /^Add Work Experience/, minTriggers: 2 },
  { file: 'S06_Publications', shape: 'array', addButton: /^Add Publication/, minTriggers: 1 },
  { file: 'S07_Awards', shape: 'array', addButton: /^Add Award/, minTriggers: 1 },
  { file: 'S10_AcademicResponsibilities', shape: 'object', addButton: /^Add Course/, minTriggers: 3 },
  { file: 'S10_InternshipAndProjects', shape: 'array', addButton: /^Add Student/, minTriggers: 1 },
  { file: 'S12_FdpWorkshops', shape: 'array', addButton: /^Add Program/, minTriggers: 1 },
  { file: 'S14_InternationalExperience', shape: 'array', addButton: /^Add Experience/, minTriggers: 1 },
  { file: 'S16_AdminNonAcademicResponsibilities', shape: 'object', addButton: /^Add Responsibility/, minTriggers: 1 },
  { file: 'S20_ExaminationAndEvaluation', shape: 'object', addButton: /^Add Responsibility/, minTriggers: 1 },
  { file: 'S22_DepartmentalCharges', shape: 'object', addButton: /^Add Responsibility/, minTriggers: 1 },
  { file: 'S23_SpecialAssignments', shape: 'object', addButton: /^Add Responsibility/, minTriggers: 1 },
  { file: 'S24_ExtraInstitutionalActivities', shape: 'object', addButton: /^Add Responsibility/, minTriggers: 1 },
];

const triggers = () => Array.from(document.querySelectorAll('[aria-haspopup="listbox"]')) as HTMLElement[];

/** Opens the add form; for sections whose searchable fields depend on a charge/type select, tries each option until some appear. */
async function openForm(u: ReturnType<typeof userEvent.setup>, c: Case) {
  const Comp = sections[`../../src/components/sections/${c.file}.tsx`].default;
  function H() {
    const [d, setD] = useState<any>(c.shape === 'array' ? [] : {});
    return <Comp data={d} onChange={setD} onPersist={async () => {}} />;
  }
  render(<H />);
  await u.click(screen.getAllByRole('button').find((b) => c.addButton.test((b.textContent || '').trim())) as HTMLElement);
  if (triggers().length === 0) {
    const select = document.querySelector('select') as HTMLSelectElement;
    for (const o of Array.from(select.options).filter((o) => o.value && o.value !== 'CUSTOM_ADD')) {
      await u.selectOptions(select, o.value);
      if (triggers().length > 0) break;
    }
  }
}

beforeEach(() => cleanup());

describe('every Faculty section field that uses SearchableSelect gets the persistent Add Other', () => {
  it.each(CASES)('$file', async (c) => {
    const u = userEvent.setup();
    await openForm(u, c);
    const n = triggers().length;
    expect(n).toBeGreaterThanOrEqual(c.minTriggers);

    for (let i = 0; i < n; i++) {
      const t = triggers()[i];
      await u.click(t);
      // 1) Add Other present immediately, empty query
      const footer = await screen.findByTestId('add-other-action');
      expect(footer.textContent).toBe('+ Add Other...');
      expect((screen.getByPlaceholderText('Search...') as HTMLInputElement).value).toBe('');
      // 2) typed value -> specific action, trimmed on apply
      await u.type(screen.getByPlaceholderText('Search...'), `  Zz Custom ${i}  `);
      expect(screen.getByTestId('add-other-action').textContent).toMatch(new RegExp(`^\\+ Add "Zz Custom ${i}"`));
      await u.click(screen.getByTestId('add-other-action'));
      await waitFor(() => expect(triggers()[i].textContent).toContain(`Zz Custom ${i}`));
      expect(triggers()[i].textContent).not.toContain('  Zz');
      expect(screen.queryByTestId('add-other-action')).toBeNull(); // closed again
    }
  });
});

const labelled = (label: string | RegExp) => {
  const l = screen.getByText(label, { selector: 'label' });
  return within(l.closest('.form-group') as HTMLElement).getByRole('combobox');
};

describe('named fields from the task', () => {
  it('Qualifications — Board / University', async () => {
    const u = userEvent.setup();
    await openForm(u, CASES[0]);
    await u.click(labelled('Board / University'));
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add Other...');
  });
  it('Research & Publications — Type of Article', async () => {
    const u = userEvent.setup();
    await openForm(u, CASES[3]);
    await u.click(labelled('Type of Article *'));
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add Other...');
    await u.type(screen.getByPlaceholderText('Search...'), 'Technical Note');
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add "Technical Note"');
  });
  it('Awards & Honours — Award / Fellowship / Honour Name', async () => {
    const u = userEvent.setup();
    await openForm(u, CASES[4]);
    await u.click(labelled('Award / Fellowship / Honour Name *'));
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add Other...');
  });
  it.each(['Courses / Subjects Taught', 'Programmes', 'Department'])('Academic Responsibilities — %s', async (label) => {
    const u = userEvent.setup();
    await openForm(u, CASES[5]);
    await u.click(labelled(label));
    expect(screen.getByTestId('add-other-action').textContent).toBe('+ Add Other...');
  });
});

describe('static review of all <SearchableSelect> call sites', () => {
  const files = Object.entries(raw).filter(([p]) => /\.tsx$/.test(p) && raw[p].includes('<SearchableSelect') && !p.endsWith('components/SearchableSelect.tsx'));
  const countIn = (src: string, re: RegExp) => (src.match(re) || []).length;

  it('finds the expected call-site files (guards against silently skipping one)', () => {
    const names = files.map(([p]) => p.split('/').pop());
    for (const n of ['S02_Qualifications.tsx', 'S06_Publications.tsx', 'S07_Awards.tsx', 'S10_AcademicResponsibilities.tsx', 'AdminDashboard.tsx', 'VCDashboard.tsx', 'HODDashboard.tsx']) expect(names).toContain(n);
  });

  it('admin / VC / HOD pickers (fixed lists, filters, tutor pickers) all opt out explicitly', () => {
    for (const [p, src] of files.filter(([p]) => /\/pages\/(admin|vc|hod)\//.test(p))) {
      const total = countIn(src, /<SearchableSelect\b/g);
      const optedOut = countIn(src, /<SearchableSelect\s+allowAddOther=\{false\}/g);
      expect({ file: p.split('/').pop(), total }).toEqual({ file: p.split('/').pop(), total: optedOut });
    }
  });

  it('Faculty profile sections never opt out (they must support custom entries)', () => {
    for (const [p, src] of files.filter(([p]) => p.includes('/components/sections/'))) {
      expect({ file: p, optedOut: /allowAddOther=\{false\}/.test(src) }).toEqual({ file: p, optedOut: false });
    }
  });
});
