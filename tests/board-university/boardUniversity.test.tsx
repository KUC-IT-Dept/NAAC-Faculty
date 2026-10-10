/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Network layer is never exercised by these tests; stub it so no request can leave the sandbox.
vi.mock('../../src/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  getAuthenticatedFileUrl: (u: string) => u,
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import Qualifications from '../../src/components/sections/S02_Qualifications';

// jsdom does not implement scrollIntoView (SearchableSelect calls it to keep the highlighted row visible).
Element.prototype.scrollIntoView = vi.fn();

const REQUIRED = [
  'Kannur University',
  'University of Calicut',
  'University of Kerala',
  'CBSE',
  'Kerala Board of Public Examinations',
];

/** Controlled wrapper that mirrors how ProfileEdit feeds data/onChange, and exposes the latest array. */
let latest: any[] = [];
function Harness({ initial }: { initial: any[] }) {
  const [data, setData] = useState<any[]>(initial);
  return (
    <Qualifications
      data={data}
      onChange={(d) => {
        latest = d;
        setData(d);
      }}
    />
  );
}

const legacyUG = {
  degreeLevel: 'UG', degreeName: 'B.Sc', specialization: 'Physics',
  institution: 'Govt College', university: 'kannur university',
  yearOfPassing: '2015', gradeType: 'Percentage', percentageCGPA: '78',
  division: 'First', mode: 'Regular', country: 'India', state: 'Kerala',
  countryAndState: 'India, Kerala', documentUrl: '/uploads/x.pdf',
};

const boardField = () => {
  const label = screen.getByText('Board / University', { selector: 'label' });
  return within(label.closest('.form-group') as HTMLElement).getByRole('combobox');
};

/** Options inside the open searchable list only (the page also has native <select> options). */
const listOptions = () => within(screen.getByRole('listbox')).queryAllByRole('option');

async function chooseLevel(user: ReturnType<typeof userEvent.setup>, level: string) {
  const label = screen.getByText('Qualification Level *', { selector: 'label' });
  const select = within(label.closest('.form-group') as HTMLElement).getByRole('combobox') as HTMLSelectElement;
  await user.selectOptions(select, level);
}

async function confirmSave(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: /^Save$/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

beforeEach(() => { latest = []; cleanup(); });

describe('Board / University searchable dropdown', () => {
  it('1+2: lists all required options and filters by search', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'UG');
    await user.click(boardField());
    for (const name of REQUIRED) expect(within(screen.getByRole('listbox')).getByRole('option', { name })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('Search...'), 'calicut');
    expect(listOptions().map((o) => o.textContent)).toEqual(['University of Calicut']);
  });

  it('3: accepts a custom value that is not listed', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'PG');
    await user.click(boardField());
    await user.type(screen.getByPlaceholderText('Search...'), 'Anna University');
    await user.click(screen.getByText(/\+ Add "Anna University"/));
    expect(boardField().textContent).toContain('Anna University');
    await confirmSave(user);
    expect(latest[0].university).toBe('Anna University');
    expect(latest[0].degreeLevel).toBe('PG');
  });

  it('7b: shows a useful empty-results state', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'UG');
    await user.click(boardField());
    await user.type(screen.getByPlaceholderText('Search...'), 'zzzz');
    expect(listOptions()).toHaveLength(0);
    expect(screen.getByText(/No matching board \/ university/)).toBeTruthy();
    expect(screen.queryByText(/No departments found/)).toBeNull();
    expect(screen.getByText(/\+ Add "zzzz"/)).toBeTruthy();
  });

  it('4: legacy saved values still display when editing', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[legacyUG]} />);
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    expect(boardField().textContent).toContain('kannur university');
  });

  it('5+8: editing persists the new value and leaves other fields untouched', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[legacyUG]} />);
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    await user.click(boardField());
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Kannur University' }));
    await confirmSave(user);
    expect(latest).toHaveLength(1);
    expect(latest[0].university).toBe('Kannur University');
    const { university: _a, ...restNew } = latest[0];
    const { university: _b, ...restOld } = legacyUG as any;
    expect(restNew).toMatchObject(restOld);
  });

  it('5b: saving an edit without touching the field keeps the stored value byte-for-byte', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[legacyUG]} />);
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    await user.click(screen.getAllByRole('button', { name: /^Save$/ })[0]);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(latest.length).toBe(1));
    expect(latest[0].university).toBe('kannur university');
  });

  it('6: payload stays a plain string on the existing `university` key', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'UG');
    await user.click(boardField());
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'CBSE' }));
    await confirmSave(user);
    expect(typeof latest[0].university).toBe('string');
    expect(latest[0].university).toBe('CBSE');
    expect('boardUniversity' in latest[0]).toBe(false);
  });

  it('7a: full keyboard flow (open, type, arrow, Enter, Escape, refocus, no stale search)', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'UG');

    boardField().focus();
    await user.keyboard('{Enter}');
    expect(screen.getByPlaceholderText('Search...')).toBeTruthy();

    await user.keyboard('kerala');
    // "University of Kerala" and "Kerala Board of Public Examinations" both match
    expect(listOptions()).toHaveLength(2);
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    expect(boardField().textContent).toContain('Kerala Board of Public Examinations');
    await waitFor(() => expect(document.activeElement).toBe(boardField()));

    // reopen via keyboard: search must be cleared, Escape closes and keeps focus
    await user.keyboard('{ArrowDown}');
    expect((screen.getByPlaceholderText('Search...') as HTMLInputElement).value).toBe('');
    expect(listOptions().length).toBe(6);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Search...')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(boardField()));
  });

  it('7c: typing a custom name then Enter adds it from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'UG');
    boardField().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('Pondicherry University{Enter}');
    expect(boardField().textContent).toContain('Pondicherry University');
  });

  it('8: Ph.D form (no Board/University field) still saves without a university', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add Qualification/ }));
    await chooseLevel(user, 'Ph.D');
    expect(screen.queryByText('Board / University', { selector: 'label' })).toBeNull();
  });
});
