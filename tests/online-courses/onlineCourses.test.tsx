/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() }, getAuthenticatedFileUrl: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import OnlineCourses from '../../src/components/sections/S13_OnlineCourses';

let latest: any[] = [];
function Harness({ initial }: { initial: any[] }) {
  const [data, setData] = useState<any[]>(initial);
  latest = data;
  return <OnlineCourses data={data} onChange={(d) => { latest = d; setData(d); }} />;
}
const group = (label: string) => screen.getByText(label, { selector: 'label' }).closest('.form-group') as HTMLElement;
const input = (label: string) => group(label).querySelector('input') as HTMLInputElement;
const select = (label: string) => group(label).querySelector('select') as HTMLSelectElement;
const btn = (name: RegExp, n = 0) => screen.getAllByRole('button', { name })[n];

const legacy = { courseName: 'Intro to ML', platform: 'Coursera', from: '2020-01-10', to: '2020-03-15', certificateId: 'C-1', score: '92', courseLevel: 'Beginner', certificateUrl: '/u/c.pdf' };
const modern = { courseName: 'Cloud Basics', activityType: 'Taught', platform: 'edX', date: '2024-05-02', certificateId: 'C-2', score: 'A', courseLevel: 'Advanced', certificateUrl: '/u/d.pdf' };

beforeEach(() => { cleanup(); latest = []; });

describe('Online Courses — new form', () => {
  it('shows one Date field and no From/To inputs', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await u.click(btn(/Add Course/));
    expect(input('Date *').type).toBe('date');
    expect(screen.queryByText('From Date *', { selector: 'label' })).toBeNull();
    expect(screen.queryByText('To Date *', { selector: 'label' })).toBeNull();
  });

  it('activity type dropdown offers exactly Conducted, Attended, Taught', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await u.click(btn(/Add Course/));
    const opts = Array.from(select('Course Activity Type *').options).map((o) => o.value).filter(Boolean);
    expect(opts).toEqual(['Conducted', 'Attended', 'Taught']);
  });

  it('keeps all other fields', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await u.click(btn(/Add Course/));
    for (const l of ['Course / Certification Name *', 'Platform / Provider *', 'Course Level', 'Certificate ID', 'Score / Grade', 'Upload Certificate'])
      expect(screen.getByText(l, { selector: 'label' })).toBeTruthy();
  });

  it('Save is disabled until name, activity type, platform and date are set, then saves date + type', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await u.click(btn(/Add Course/));
    expect((btn(/^Save$/) as HTMLButtonElement).disabled).toBe(true);
    await u.type(input('Course / Certification Name *'), 'Deep Learning');
    fireEvent.change(select('Course Activity Type *'), { target: { value: 'Attended' } });
    fireEvent.change(select('Platform / Provider *'), { target: { value: select('Platform / Provider *').options[1].value } });
    expect((btn(/^Save$/) as HTMLButtonElement).disabled).toBe(true); // no date yet
    fireEvent.change(input('Date *'), { target: { value: '2025-02-03' } });
    await u.type(input('Score / Grade'), '88');
    expect((btn(/^Save$/) as HTMLButtonElement).disabled).toBe(false);
    await u.click(btn(/^Save$/));
    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ courseName: 'Deep Learning', activityType: 'Attended', date: '2025-02-03', score: '88' });
    expect('from' in latest[0]).toBe(false);
    expect('to' in latest[0]).toBe(false);
  });

  it('Cancel discards a new record', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[]} />);
    await u.click(btn(/Add Course/));
    await u.type(input('Course / Certification Name *'), 'X');
    await u.click(btn(/Cancel/));
    expect(latest).toHaveLength(0);
    expect(screen.queryByText('New Course')).toBeNull();
  });
});

describe('Online Courses — edit, restore, delete', () => {
  it('restores date and activity type on edit and changing date keeps other fields', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[modern]} />);
    await u.click(btn(/^Edit$/));
    expect(input('Date *').value).toBe('2024-05-02');
    expect(select('Course Activity Type *').value).toBe('Taught');
    fireEvent.change(input('Date *'), { target: { value: '2024-06-09' } });
    fireEvent.change(select('Course Activity Type *'), { target: { value: 'Conducted' } });
    expect(latest[0]).toEqual({ ...modern, date: '2024-06-09', activityType: 'Conducted' });
  });

  it('legacy from/to record loads, shows no From/To inputs, new date empty, legacy values preserved', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacy]} />);
    expect(screen.getByText('Intro to ML')).toBeTruthy();
    await u.click(btn(/^Edit$/));
    expect(input('Date *').value).toBe('');
    expect(select('Course Activity Type *').value).toBe('');
    expect(screen.queryByText('From Date *', { selector: 'label' })).toBeNull();
    expect(screen.queryByText('To Date *', { selector: 'label' })).toBeNull();
    expect(input('Certificate ID').value).toBe('C-1');
    expect(input('Score / Grade').value).toBe('92');
    // editing an unrelated field keeps legacy dates untouched and invents nothing
    await u.type(input('Certificate ID'), 'x');
    expect(latest[0]).toMatchObject({ from: '2020-01-10', to: '2020-03-15', certificateUrl: '/u/c.pdf', score: '92', courseLevel: 'Beginner', platform: 'Coursera' });
    expect(latest[0].date).toBeUndefined();
    expect(latest[0].activityType).toBeUndefined();
  });

  it('legacy record can be given a date + type without losing from/to', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[legacy]} />);
    await u.click(btn(/^Edit$/));
    fireEvent.change(input('Date *'), { target: { value: '2020-02-01' } });
    fireEvent.change(select('Course Activity Type *'), { target: { value: 'Attended' } });
    expect(latest[0]).toMatchObject({ date: '2020-02-01', activityType: 'Attended', from: '2020-01-10', to: '2020-03-15' });
  });

  it('empty / minimal legacy record does not crash', () => {
    render(<Harness initial={[{}, { courseName: 'Old', completionYear: '2018' }]} />);
    expect(screen.getByText('Old')).toBeTruthy();
    expect(screen.getByText('Untitled Course')).toBeTruthy();
  });

  it('View shows activity type and date; Delete removes the right record when list is sorted', async () => {
    const u = userEvent.setup();
    const older = { ...legacy, courseName: 'Older' };
    const newer = { ...modern, courseName: 'Newer' };
    render(<Harness initial={[older, newer]} />); // data order differs from display order (newest first)
    await u.click(btn(/View/, 0));
    expect(screen.getByText('Taught')).toBeTruthy();
    expect(screen.getByText('2024-05-02')).toBeTruthy();
    await u.click(btn(/^Delete$/, 0)); // first displayed = Newer
    expect(latest.map((c) => c.courseName)).toEqual(['Older']);
  });

  it('Edit targets the displayed record even when data order differs from display order', async () => {
    const u = userEvent.setup();
    render(<Harness initial={[{ ...legacy, courseName: 'Older' }, { ...modern, courseName: 'Newer' }]} />);
    await u.click(btn(/^Edit$/, 0)); // displayed first = Newer
    await u.type(input('Course / Certification Name *'), '!');
    expect(latest.find((c) => c.courseName === 'Newer!')).toBeTruthy();
    expect(latest.find((c) => c.courseName === 'Older')).toBeTruthy();
    void within;
  });
});
