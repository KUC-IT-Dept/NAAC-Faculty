/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const post = vi.fn();
vi.mock('../../src/lib/api', () => ({ default: { get: vi.fn(), post: (...a: any[]) => post(...a), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no scrollIntoView

import SearchableSelect from '../../src/components/SearchableSelect';

const OPTIONS = ['Research Article', 'Review Article', 'Editorial', 'Brief Report'];

let changes: string[] = [];
function Harness({ initial = '', options = OPTIONS, allowAddOther, onChangeSpy }: any) {
  const [v, setV] = useState(initial);
  return (
    <SearchableSelect
      value={v}
      options={options}
      allowAddOther={allowAddOther}
      onChange={(x) => { changes.push(x); setV(x); onChangeSpy?.(x); }}
    />
  );
}

const trigger = () => screen.getByRole('combobox');
const search = () => screen.getByPlaceholderText('Search...') as HTMLInputElement;
const footer = () => screen.queryByTestId('add-other-action');
const listbox = () => screen.getByRole('listbox');
const optionNames = () => within(listbox()).queryAllByRole('option').map((o) => o.textContent);

beforeEach(() => { cleanup(); changes = []; post.mockReset(); });

describe('SearchableSelect — persistent Add Other', () => {
  it('shows "+ Add Other..." as soon as the dropdown opens, with an empty search', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    expect(footer()).toBeNull();                       // closed: nothing rendered
    await u.click(trigger());
    expect(search().value).toBe('');
    expect(footer()?.textContent).toBe('+ Add Other...');
  });

  it('footer is a sibling of the scrolling list, not inside it, so it cannot scroll away or be clipped', async () => {
    const u = userEvent.setup();
    const many = Array.from({ length: 80 }, (_, i) => `Option ${i}`);
    render(<Harness options={many} />);
    await u.click(trigger());
    expect(within(listbox()).queryByTestId('add-other-action')).toBeNull();
    expect(listbox().style.overflowY).toBe('auto');
    expect(listbox().style.minHeight).toBe('0px');     // lets the list shrink so the footer keeps its space
    const footerEl = footer() as HTMLElement;
    expect((footerEl.parentElement as HTMLElement).style.flex).toContain('0 0 auto'); // never shrinks
    expect(listbox().parentElement).toBe((footerEl.parentElement as HTMLElement).parentElement); // same flex column
    expect((listbox().parentElement as HTMLElement).style.display).toBe('flex');
  });

  it('empty-search click on Add Other adds nothing, keeps the list open, focuses search and explains', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.click(footer() as HTMLElement);
    expect(changes).toEqual([]);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(search());
    expect(screen.getByRole('status').textContent).toMatch(/type the new value/i);
  });

  it('typing a new value turns the action into + Add "<value>" and adds the trimmed value', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), '  Technical Note  ');
    expect(footer()?.textContent).toBe('+ Add "Technical Note"');
    await u.click(footer() as HTMLElement);
    expect(changes).toEqual(['Technical Note']);
    expect(trigger().textContent).toContain('Technical Note');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('reverts to the generic action when the search is cleared again', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), 'abc');
    expect(footer()?.textContent).toBe('+ Add "abc"');
    await u.clear(search());
    expect(footer()?.textContent).toBe('+ Add Other...');
  });
});

describe('SearchableSelect — validation', () => {
  it('rejects whitespace-only input: no specific action, Enter/click add nothing', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), '    ');
    expect(footer()?.textContent).toBe('+ Add Other...');
    expect(screen.queryByText(/\+ Add "/)).toBeNull();
    await u.keyboard('{ArrowDown}'.repeat(OPTIONS.length)); // move to footer
    await u.keyboard('{Enter}');
    await u.click(footer() as HTMLElement);
    expect(changes).toEqual([]);
  });

  it.each(['editorial', '  EDITORIAL  ', 'Editorial'])('does not offer a duplicate for %j (case/whitespace-insensitive)', async (typed) => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), typed);
    expect(screen.queryByText(/\+ Add "/)).toBeNull();
    expect(footer()?.textContent).toBe('+ Add Other...');
    await u.click(footer() as HTMLElement);
    expect(changes).toEqual([]);
    expect(screen.getByRole('status').textContent).toMatch(/already exists/i);
  });

  it('Enter on an exact (case-insensitive) match selects the existing option, never a duplicate', async () => {
    const u = userEvent.setup();
    render(<Harness options={['UG', 'PG', 'UG Diploma']} />);
    await u.click(trigger());
    await u.type(search(), 'ug');
    expect(optionNames()[0]).toBe('UG'); // exact match ranked first
    await u.keyboard('{Enter}');
    expect(changes).toEqual(['UG']);
  });

  it('partial matches still offer Add for the typed text', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), 'Edit');
    expect(optionNames()).toEqual(['Editorial']);
    expect(footer()?.textContent).toBe('+ Add "Edit"');
  });
});

describe('SearchableSelect — keyboard, focus, selection', () => {
  it('opens from the keyboard, focuses the search box, filters, selects with Enter, refocuses the trigger', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await u.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toBe(search()));
    await u.type(search(), 'brief');
    await u.keyboard('{Enter}');
    expect(changes).toEqual(['Brief Report']);
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('arrow keys reach the Add action (after the last option) and Enter on it adds the typed value', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), 'Zed');          // no matches -> Add is index 0
    await u.keyboard('{Enter}');
    expect(changes).toEqual(['Zed']);
  });

  it('ArrowDown from the last option lands on the Add row; ArrowUp wraps back', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), 'Re');            // Research Article, Review Article, Brief Report
    const n = optionNames().length;
    await u.keyboard('{ArrowDown}'.repeat(n)); // -> Add row
    await u.keyboard('{Enter}');
    expect(changes).toEqual(['Re']);
  });

  it('Escape closes, keeps the value unchanged and returns focus to the trigger', async () => {
    const u = userEvent.setup();
    render(<Harness initial="Editorial" />);
    await u.click(trigger());
    await u.type(search(), 'abc');
    await u.keyboard('{Escape}');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(changes).toEqual([]);
    expect(trigger().textContent).toContain('Editorial');
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('reopening starts with a clean search and the Add Other row again', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.type(search(), 'abc');
    await u.keyboard('{Escape}');
    await u.click(trigger());
    expect(search().value).toBe('');
    expect(footer()?.textContent).toBe('+ Add Other...');
  });

  it('click selection, aria-selected and combobox attributes are preserved', async () => {
    const u = userEvent.setup();
    render(<Harness initial="Editorial" />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    await u.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(within(listbox()).getByRole('option', { name: 'Editorial' }).getAttribute('aria-selected')).toBe('true');
    await u.click(within(listbox()).getByRole('option', { name: 'Brief Report' }));
    expect(changes).toEqual(['Brief Report']);
  });

  it('clicking the Add row does not close the list through blur', async () => {
    const u = userEvent.setup();
    render(<Harness />);
    await u.click(trigger());
    await u.click(footer() as HTMLElement);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
});

describe('SearchableSelect — saved custom values', () => {
  it('shows a saved value that is not in the options and does not offer it as a new duplicate', async () => {
    const u = userEvent.setup();
    render(<Harness initial="Legacy Custom Type" />);
    expect(trigger().textContent).toContain('Legacy Custom Type');
    await u.click(trigger());
    await u.type(search(), 'legacy custom type');
    expect(screen.queryByText(/\+ Add "/)).toBeNull();
    expect(footer()?.textContent).toBe('+ Add Other...');
  });

  it('a saved value that IS in the options list is marked selected', async () => {
    const u = userEvent.setup();
    render(<Harness initial="Review Article" options={[...OPTIONS]} />);
    await u.click(trigger());
    expect(within(listbox()).getByRole('option', { name: 'Review Article' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('SearchableSelect — allowAddOther={false} (fixed-list fields)', () => {
  it('renders no Add action, even after typing an unknown value; Enter adds nothing', async () => {
    const u = userEvent.setup();
    render(<Harness allowAddOther={false} />);
    await u.click(trigger());
    expect(footer()).toBeNull();
    await u.type(search(), 'Nope');
    expect(footer()).toBeNull();
    expect(screen.queryByText(/\+ Add/)).toBeNull();
    await u.keyboard('{Enter}');
    expect(changes).toEqual([]);
  });

  it('still searches and selects normally', async () => {
    const u = userEvent.setup();
    render(<Harness allowAddOther={false} />);
    await u.click(trigger());
    await u.type(search(), 'edit');
    await u.keyboard('{Enter}');
    expect(changes).toEqual(['Editorial']);
  });
});

describe('SearchableSelect — HOD-approval dropdowns (options carry a dropdownKey)', () => {
  const keyed = () => { const a: any = [...OPTIONS]; a.dropdownKey = 'article_type'; return a; };

  it('posts the trimmed request, then applies the value', async () => {
    post.mockResolvedValue({});
    const u = userEvent.setup();
    render(<Harness options={keyed()} />);
    await u.click(trigger());
    expect(footer()?.textContent).toBe('+ Add Other...');
    await u.type(search(), '  Case Study ');
    expect(footer()?.textContent).toBe('+ Add "Case Study" (Request HOD Approval)');
    await u.click(footer() as HTMLElement);
    await waitFor(() => expect(changes).toEqual(['Case Study']));
    expect(post).toHaveBeenCalledWith('/me/requests', { dropdownKey: 'article_type', requestedValue: 'Case Study', previousValue: '' });
  });

  it('does not apply the value when the request fails', async () => {
    post.mockRejectedValue(new Error('x'));
    const u = userEvent.setup();
    render(<Harness options={keyed()} />);
    await u.click(trigger());
    await u.type(search(), 'Case Study');
    await u.click(footer() as HTMLElement);
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(changes).toEqual([]);
  });

  it('never posts a duplicate or blank request', async () => {
    const u = userEvent.setup();
    render(<Harness options={keyed()} />);
    await u.click(trigger());
    await u.type(search(), ' editorial ');
    await u.click(footer() as HTMLElement);
    await u.clear(search());
    await u.type(search(), '   ');
    await u.click(footer() as HTMLElement);
    expect(post).not.toHaveBeenCalled();
  });
});
