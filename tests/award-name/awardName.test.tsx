/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  getAuthenticatedFileUrl: (u: string) => u,
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
// jsdom has no scrollIntoView (SearchableSelect uses it to keep the highlighted row visible).
Element.prototype.scrollIntoView = vi.fn();

import Awards from '../../src/components/sections/S07_Awards';

const DEFAULTS = [
  'Elected Academy Fellowships',
  'International Research Fellowships',
  'Senior / Emeritus Research Fellowships',
  'Visiting Professorships & Fellowships',
  'Young Scientist Awards',
  'National & Discipline-Specific Medals',
  'High-Citation Awards',
  'Institutional Research Excellence Awards',
  'Innovation Recognition',
  'Excellence in Teaching / Best Teacher Awards',
  'Outstanding Ph.D. / Postdoctoral Mentor Awards',
  'Pedagogical & Digital Innovation Awards',
  'Keynote & Plenary Speaker Honor',
  'Honorary / Lifetime Memberships in Professional Societies',
  'Professor Emeritus Status',
  'Distinguished / Endowed Chair Professorship',
  'Honorary Doctorate',
  'Institutional Lifetime Achievement Awards',
];

let latest: any[] = [];
let persisted: any[][] = [];
function Harness({ initial }: { initial: any[] }) {
  const [data, setData] = useState<any[]>(initial);
  return (
    <Awards
      data={data}
      onChange={(d) => { latest = d; setData(d); }}
      onPersist={async (d) => { persisted.push(d); }}
    />
  );
}

const rec = (over: any = {}) => ({
  name: 'Young Scientist Awards', awardingAgency: 'Government', awardCategory: 'Research',
  honourType: 'Award', recognitionStatus: 'Received', dateOfAward: '2021-05-10', yearReceived: '2021',
  level: 'National', description: 'Desc text', documentUrl: '/uploads/a.pdf', ...over,
});

const NAME = 'Award / Fellowship / Honour Name *';
const field = () => {
  const label = screen.getByText(NAME, { selector: 'label' });
  return within(label.closest('.form-group') as HTMLElement).getByRole('combobox');
};
const listOptions = () => within(screen.getByRole('listbox')).queryAllByRole('option').map((o) => o.textContent);
const addRow = () => within(screen.getByRole('listbox')).queryByText(/\+ Add/);
const searchBox = () => screen.getByPlaceholderText('Search...') as HTMLInputElement;
const open = async (u: ReturnType<typeof userEvent.setup>) => { await u.click(field()); };
const startAdd = async (u: ReturnType<typeof userEvent.setup>) => { await u.click(screen.getByRole('button', { name: /Add Award/ })); };
const nativeSelect = (label: string) =>
  within(screen.getByText(label, { selector: 'label' }).closest('.form-group') as HTMLElement).getByRole('combobox') as HTMLSelectElement;

async function saveNew(u: ReturnType<typeof userEvent.setup>) {
  await u.selectOptions(nativeSelect('Awarding Body / Agency *'), 'Government');
  await u.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
  await waitFor(() => expect(persisted.length).toBeGreaterThan(0));
}

beforeEach(() => { latest = []; persisted = []; cleanup(); });

describe('Award / Fellowship / Honour Name searchable dropdown', () => {
  it('lists all 18 default options, exact wording/capitalization/order', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    expect(listOptions()).toEqual(DEFAULTS);
    expect(DEFAULTS).toHaveLength(18);
  });

  it('each default can be selected and is saved to the existing `name` field', async () => {
    for (const name of DEFAULTS) {
      cleanup(); latest = []; persisted = [];
      const u = userEvent.setup();
      render(<Harness initial={[]} />);
      await startAdd(u); await open(u);
      await u.click(within(screen.getByRole('listbox')).getByRole('option', { name }));
      expect(field().textContent).toContain(name);
      await saveNew(u);
      expect(latest[0].name).toBe(name);
      expect(persisted[0][0].name).toBe(name);
    }
  }, 120000);

  it('search is case-insensitive', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'YOUNG scientist');
    expect(listOptions()).toEqual(['Young Scientist Awards']);
    await u.clear(searchBox()); await u.type(searchBox(), 'honorary');
    expect(listOptions()).toEqual([
      'Honorary / Lifetime Memberships in Professional Societies', 'Honorary Doctorate',
    ]);
    await u.clear(searchBox()); await u.type(searchBox(), 'PH.D.');
    expect(listOptions()).toEqual(['Outstanding Ph.D. / Postdoctoral Mentor Awards']);
  });

  it('shows clear empty-results message plus add row', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'zzzz');
    expect(listOptions()).toEqual([]);
    expect(screen.getByText(/No matching award/)).toBeTruthy();
    expect(screen.queryByText(/No departments found/)).toBeNull();
    expect(screen.getByText(/\+ Add "zzzz"/)).toBeTruthy();
  });

  it('custom award: "National Innovation Fellowship" saved exactly, no extra request', async () => {
    const u = userEvent.setup();
    const api = (await import('../../src/lib/api')).default as any;
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'National Innovation Fellowship');
    await u.click(screen.getByText(/\+ Add "National Innovation Fellowship"/));
    expect(field().textContent).toContain('National Innovation Fellowship');
    await saveNew(u);
    expect(latest[0].name).toBe('National Innovation Fellowship');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('trims whitespace; whitespace-only creates no add row or blank value', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), '   ');
    expect(addRow()).toBeNull();
    expect(listOptions()).toEqual(DEFAULTS);
    await u.clear(searchBox());
    await u.type(searchBox(), '   Rotary Gold Medal   ');
    await u.click(screen.getByText(/\+ Add "Rotary Gold Medal"/));
    await saveNew(u);
    expect(latest[0].name).toBe('Rotary Gold Medal');
  });

  it('prevents duplicates ignoring case/whitespace and picks canonical default', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), '  honorary DOCTORATE ');
    expect(addRow()).toBeNull();
    await u.keyboard('{Enter}');
    expect(field().textContent).toContain('Honorary Doctorate');
    await saveNew(u);
    expect(latest[0].name).toBe('Honorary Doctorate');
  });

  it('saved custom value is listed once and not re-addable', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[rec({ name: 'National Innovation Fellowship' })]} />);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await open(u);
    expect(listOptions().filter((o) => o === 'National Innovation Fellowship')).toHaveLength(1);
    expect(listOptions()).toHaveLength(19);
    await u.type(searchBox(), ' national innovation FELLOWSHIP ');
    expect(addRow()).toBeNull();
  });

  it('keyboard: open, type, arrows, Enter, Escape, refocus, no stale search', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    field().focus();
    await u.keyboard('{Enter}');
    expect(searchBox()).toBeTruthy();
    await u.keyboard('award');
    // matches in order: Young Scientist Awards, High-Citation Awards, ... ; one ArrowDown -> High-Citation
    await u.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    expect(field().textContent).toContain('High-Citation Awards');
    await waitFor(() => expect(document.activeElement).toBe(field()));
    await u.keyboard('{ArrowDown}');
    expect(searchBox().value).toBe('');
    expect(listOptions()).toHaveLength(18);
    await u.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(field()));
    expect(field().textContent).toContain('High-Citation Awards'); // Escape keeps value
  });

  it('keyboard: custom value by typing then Enter', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    field().focus();
    await u.keyboard('{Enter}National Innovation Fellowship{Enter}');
    expect(field().textContent).toContain('National Innovation Fellowship');
  });

  it('existing values outside the list remain visible and editable', async () => {
    const u = userEvent.setup();
    for (const name of ['Best Paper Award 2019 (IEEE)', 'young scientist awards', 'Untitled / old record']) {
      cleanup();
      render(<Harness initial={[rec({ name })]} />);
      expect(screen.getByText(name)).toBeTruthy(); // preview card still shows it
      await u.click(screen.getByRole('button', { name: /Edit/ }));
      expect(field().textContent).toContain(name);
    }
  });

  it('Done without touching name keeps legacy value byte-for-byte', async () => {
    const u = userEvent.setup();
    const r = rec({ name: 'legacy  Free-Text  Award' });
    render(<Harness initial={[r]} />);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await u.click(screen.getByRole('button', { name: /Done/ }));
    await waitFor(() => expect(persisted.length).toBe(1));
    expect(persisted[0][0]).toEqual(r);
  });

  it('save then reopen: custom value persists in record, shown and listed on re-edit', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'National Innovation Fellowship');
    await u.click(screen.getByText(/\+ Add "National Innovation Fellowship"/));
    await saveNew(u);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    expect(field().textContent).toContain('National Innovation Fellowship');
    await open(u);
    expect(listOptions()).toContain('National Innovation Fellowship');
  });

  it('editing the name leaves every other award field and other awards untouched', async () => {
    const u = userEvent.setup();
    const a = rec({ dateOfAward: '2022-01-01' });
    const b = rec({ name: 'Honorary Doctorate', dateOfAward: '2020-01-01', description: 'other' });
    render(<Harness initial={[a, b]} />);
    await u.click(screen.getAllByRole('button', { name: /Edit/ })[0]);
    await open(u);
    await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Innovation Recognition' }));
    await u.click(screen.getAllByRole('button', { name: /Done/ })[0]);
    await waitFor(() => expect(persisted.length).toBe(1));
    expect(persisted[0][0]).toEqual({ ...a, name: 'Innovation Recognition' });
    expect(persisted[0][1]).toEqual(b);
  });

  it('cancelling a new award discards it', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Innovation Recognition' }));
    await u.click(screen.getAllByRole('button', { name: /Cancel/ })[0]);
    expect(latest).toEqual([]);
    expect(persisted).toEqual([]);
    expect(screen.queryByText(NAME)).toBeNull();
  });

  it('Save stays disabled until name and awarding body are set', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    const save = () => screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement;
    expect(save().disabled).toBe(true);
    await open(u);
    await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Honorary Doctorate' }));
    expect(save().disabled).toBe(true);
    await u.selectOptions(nativeSelect('Awarding Body / Agency *'), 'Government');
    expect(save().disabled).toBe(false);
  });
});
