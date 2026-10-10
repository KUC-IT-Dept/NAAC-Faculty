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

import Publications from '../../src/components/sections/S06_Publications';

const DEFAULTS = [
  'Original Research Article', 'Short Communication / Letter', 'Brief Report', 'Data Paper',
  'Registered Report', 'Narrative Review Article', 'Systematic Review', 'Meta-Analysis',
  'Scoping Review', 'Methodology Article', 'Software / Tool Paper', 'Case Study / Case Report',
  'Replication Study', 'Perspective / Opinion', 'Commentary / Response', 'Editorial',
  'Book Review', 'Appeared in News paper', 'Corrigendum / Erratum',
];

let latest: any[] = [];
function Harness({ initial }: { initial: any[] }) {
  const [data, setData] = useState<any[]>(initial);
  return <Publications data={data} onChange={(d) => { latest = d; setData(d); }} />;
}

const saved = (over: any = {}) => ({
  type: 'Journal Articles', title: 'Original Research Article', authors: 'A, B', authorRole: 'Principal',
  journal: 'Journal of X', journalCategory: 'Q1', year: '2021', volume: '3', issue: '2', issn: '1234-5678',
  pageFrom: '10', pageTo: '20', impactFactor: '2.1', indexedIn: 'Scopus', doi: '10.1/x', ...over,
});

const field = () => {
  const label = screen.getByText('Type of Article *', { selector: 'label' });
  return within(label.closest('.form-group') as HTMLElement).getByRole('combobox');
};
const listOptions = () => within(screen.getByRole('listbox')).queryAllByRole('option').map((o) => o.textContent);
const addRow = () => within(screen.getByRole('listbox')).queryByText(/\+ Add/);
const searchBox = () => screen.getByPlaceholderText('Search...') as HTMLInputElement;
const open = async (u: ReturnType<typeof userEvent.setup>) => { await u.click(field()); };

async function confirm(u: ReturnType<typeof userEvent.setup>, trigger: RegExp) {
  await u.click(screen.getAllByRole('button', { name: trigger })[0]);
  const dialog = await screen.findByRole('dialog');
  await u.click(within(dialog).getByRole('button', { name: /^Save$/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}
const startAdd = async (u: ReturnType<typeof userEvent.setup>) => {
  await u.click(screen.getByRole('button', { name: /Add Publication/ }));
};

beforeEach(() => { latest = []; cleanup(); });

describe('Type of Article searchable dropdown', () => {
  it('lists all 19 default options, exact text and order', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    expect(listOptions()).toEqual(DEFAULTS);
    expect(DEFAULTS).toHaveLength(19);
  });

  it('each default option can be selected and saved to the existing `title` field', async () => {
    for (const name of DEFAULTS) {
      cleanup(); latest = [];
      const u = userEvent.setup();
      render(<Harness initial={[]} />);
      await startAdd(u); await open(u);
      await u.click(within(screen.getByRole('listbox')).getByRole('option', { name }));
      expect(field().textContent).toContain(name);
      await confirm(u, /^Save$/);
      expect(latest[0].title).toBe(name);
      expect(latest[0].type).toBe('Journal Articles');
    }
  }, 120000);

  it('search is case-insensitive', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'SYSTEMATIC');
    expect(listOptions()).toEqual(['Systematic Review']);
    await u.clear(searchBox()); await u.type(searchBox(), 'meta-ANALYSIS');
    expect(listOptions()).toEqual(['Meta-Analysis']);
    await u.clear(searchBox()); await u.type(searchBox(), 'review');
    expect(listOptions()).toEqual(['Narrative Review Article', 'Systematic Review', 'Scoping Review', 'Book Review']);
  });

  it('shows helpful empty-results message plus add row', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'zzzz');
    expect(listOptions()).toEqual([]);
    expect(screen.getByText(/No matching article type/)).toBeTruthy();
    expect(screen.queryByText(/No departments found/)).toBeNull();
    expect(screen.getByText(/\+ Add "zzzz"/)).toBeTruthy();
  });

  it('custom type: add "Technical Note", exact value saved, no extra request fired', async () => {
    const u = userEvent.setup();
    const api = (await import('../../src/lib/api')).default as any;
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), 'Technical Note');
    await u.click(screen.getByText(/\+ Add "Technical Note"/));
    expect(field().textContent).toContain('Technical Note');
    await confirm(u, /^Save$/);
    expect(latest[0].title).toBe('Technical Note');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('trims whitespace and rejects empty/whitespace-only entries', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), '   ');
    expect(addRow()).toBeNull();
    expect(listOptions()).toEqual(DEFAULTS); // whitespace-only == empty search, never an add row
    await u.keyboard('{Enter}'); // picks the highlighted default, cannot create a blank custom value
    expect(field().textContent).toBe('Original Research Article');
    await open(u);
    await u.clear(searchBox()); await u.type(searchBox(), '   Technical Note   ');
    await u.click(screen.getByText(/\+ Add "Technical Note"/));
    await confirm(u, /^Save$/);
    expect(latest[0].title).toBe('Technical Note');
  });

  it('prevents duplicates ignoring case/whitespace; picks canonical default', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.type(searchBox(), '  systematic REVIEW ');
    expect(addRow()).toBeNull();
    await u.keyboard('{Enter}');
    expect(field().textContent).toContain('Systematic Review');
    await confirm(u, /^Save$/);
    expect(latest[0].title).toBe('Systematic Review');
  });

  it('prevents duplicate of a saved custom value when reopened', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[saved({ title: 'Technical Note' })]} />);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await open(u);
    expect(listOptions().filter((o) => o === 'Technical Note')).toHaveLength(1);
    expect(listOptions()).toHaveLength(20);
    await u.type(searchBox(), ' technical note');
    expect(addRow()).toBeNull();
  });

  it('keyboard: open, type, arrows, Enter, Escape, refocus, no stale search', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    field().focus();
    await u.keyboard('{Enter}');
    expect(searchBox()).toBeTruthy();
    await u.keyboard('review');
    await u.keyboard('{ArrowDown}{ArrowDown}{Enter}'); // Narrative, Systematic, Scoping -> index 2
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    expect(field().textContent).toContain('Scoping Review');
    await waitFor(() => expect(document.activeElement).toBe(field()));
    await u.keyboard('{ArrowDown}');
    expect(searchBox().value).toBe('');
    expect(listOptions()).toHaveLength(19);
    await u.keyboard('{ArrowUp}{Escape}'); // wraps to last row, harmless
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(field()));
    expect(field().textContent).toContain('Scoping Review'); // Escape does not change value
  });

  it('keyboard: custom value via typing then Enter', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    field().focus();
    await u.keyboard('{Enter}Technical Note{Enter}');
    expect(field().textContent).toContain('Technical Note');
  });

  it('existing saved values display: default, custom, odd casing, long legacy text', async () => {
    const u = userEvent.setup();
    const cases = ['Editorial', 'Technical Note', 'original research article', 'A very specific legacy article type value (2019) / misc'];
    for (const title of cases) {
      cleanup();
      render(<Harness initial={[saved({ title })]} />);
      await u.click(screen.getByRole('button', { name: /Edit/ }));
      expect(field().textContent).toContain(title);
    }
  });

  it('opening and finishing edit without touching the field keeps legacy value byte-for-byte', async () => {
    const u = userEvent.setup();
    const rec = saved({ title: 'legacy Free-Text  Type' });
    render(<Harness initial={[rec]} />);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await confirm(u, /Done/);
    expect(latest.length === 0 || latest[0].title === 'legacy Free-Text  Type').toBe(true);
  });

  it('edit round-trip: change type, other fields untouched, custom survives re-edit', async () => {
    const u = userEvent.setup();
    const rec = saved();
    render(<Harness initial={[rec]} />);
    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await open(u);
    await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Editorial' }));
    await confirm(u, /Done/);
    expect(latest[0]).toMatchObject({ ...rec, title: 'Editorial' });

    await u.click(screen.getByRole('button', { name: /Edit/ }));
    await open(u);
    await u.type(searchBox(), 'Foo Report');
    await u.click(screen.getByText(/\+ Add "Foo Report"/));
    await confirm(u, /Done/);
    expect(latest[0]).toMatchObject({ ...rec, title: 'Foo Report' });

    await u.click(screen.getByRole('button', { name: /Edit/ }));
    expect(field().textContent).toContain('Foo Report');
    await open(u);
    expect(listOptions()).toContain('Foo Report');
  });

  it('cancelling a new publication discards it', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u); await open(u);
    await u.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Brief Report' }));
    await u.click(screen.getAllByRole('button', { name: /Cancel/ })[0]);
    expect(latest).toEqual([]);
    expect(screen.queryByText('Type of Article *')).toBeNull();
  });

  it('Save stays disabled until a type is chosen', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    expect((screen.getAllByRole('button', { name: /^Save$/ })[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('other publication categories keep plain title inputs', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await startAdd(u);
    const typeLabel = screen.getByText('Publication Type *', { selector: 'label' });
    await u.selectOptions(within(typeLabel.closest('.form-group') as HTMLElement).getByRole('combobox'), 'Book Chapter');
    const chapter = screen.getByText('Chapter Title *', { selector: 'label' });
    expect(within(chapter.closest('.form-group') as HTMLElement).getByRole('textbox')).toBeTruthy();
    expect(screen.queryByText('Type of Article *')).toBeNull();
  });
});
