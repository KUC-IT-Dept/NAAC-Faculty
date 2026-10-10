/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

vi.mock('../../src/lib/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn(), put: vi.fn().mockResolvedValue({}), patch: vi.fn() },
  getAuthenticatedFileUrl: (u: string) => u,
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'faculty', username: 'f', modulePermissions: [] }, logout: vi.fn() }),
}));
Element.prototype.scrollIntoView = vi.fn();

import ProfileEdit from '../../src/pages/faculty/ProfileEdit';

const Path = () => <div data-testid="path">{useLocation().pathname}</div>;
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Path />
      <Routes>
        <Route path="/faculty/profile/edit" element={<ProfileEdit />} />
        <Route path="/faculty/profile/edit/:sectionId" element={<ProfileEdit />} />
      </Routes>
    </MemoryRouter>,
  );

/** Sub-items of the Edit Profile sidebar group: [id-derived path suffix, label]. */
async function sidebarLabels() {
  await waitFor(() => expect(document.querySelectorAll('.nav-subitem').length).toBeGreaterThan(0));
  return Array.from(document.querySelectorAll('.nav-subitem')).map((b) => (b.textContent || '').trim());
}
const heading = () => document.querySelector('.card-header h3')?.textContent;

beforeEach(() => cleanup());

// Order and numbering required by the task. Every section after "Patents" moves up by one.
const EXPECTED = [
  '01 - Personal Information', '02 - Qualifications', '03 - Eligibility Tests', '04 - Current Employment Details',
  '05 - Work Experience', '06 - Research & Publications', '07 - Awards & Honours', '08 - Research Projects',
  '09 - Patents', '10 - Research Supervision', '11 - Academic Responsibilities', '12 - Internship and Projects',
  '13 - Memberships', '14 - Attended FDP & Workshops', '15 - Online Courses', '16 - Academic International Experience',
  '17 - Admin & Non-Academic Resp.', '18 - Academic Administration', '19 - Quality Assurance', '20 - Research & Innovation',
  '21 - Exam & Evaluation', '22 - Administrative Support', '23 - Departmental Charges', '24 - Special Assignments',
  '25 - Activities – Extra Institutional', '26 - Documents',
];

describe('Faculty Profile Edit sidebar numbering', () => {
  it('shows the exact sequential labels, in the original order', async () => {
    renderAt('/faculty/profile/edit/patents');
    expect(await sidebarLabels()).toEqual(EXPECTED);
  });

  it('numbers are 01..26 with no gaps, no duplicates and no letter suffix (no "08B")', async () => {
    renderAt('/faculty/profile/edit/patents');
    const nums = (await sidebarLabels()).map((l) => l.split(' - ')[0]);
    expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => String(i + 1).padStart(2, '0')));
    expect(document.body.textContent).not.toContain('08B');
  });

  it.each([
    ['09 - Patents', '/faculty/profile/edit/patents', 'Patents'],
    ['10 - Research Supervision', '/faculty/profile/edit/research-supervision', 'Research Supervision'],
    ['11 - Academic Responsibilities', '/faculty/profile/edit/academic-responsibilities', 'Academic Responsibilities'],
    ['14 - Attended FDP & Workshops', '/faculty/profile/edit/fdp-workshops', 'Attended FDP & Workshops'],
    ['26 - Documents', '/faculty/profile/edit/documents', 'Documents'],
  ])('clicking "%s" navigates to %s and opens that section', async (label, path, title) => {
    const u = userEvent.setup();
    renderAt('/faculty/profile/edit/personal-information');
    await waitFor(() => expect(heading()).toBe('Personal Information'));
    await u.click(await screen.findByRole('button', { name: label }));
    expect(screen.getByTestId('path').textContent).toBe(path);       // route/ID unchanged
    await waitFor(() => expect(heading()).toBe(title));
  });

  it('opens the correct section COMPONENT for the three sections the task names', async () => {
    const u = userEvent.setup();
    renderAt('/faculty/profile/edit/personal-information');
    await waitFor(() => expect(heading()).toBe('Personal Information'));

    await u.click(await screen.findByRole('button', { name: '09 - Patents' }));
    expect(await screen.findByRole('button', { name: /Add Patent/ })).toBeTruthy();

    await u.click(screen.getByRole('button', { name: '10 - Research Supervision' }));
    expect(await screen.findByText('Ph.D. Awarded')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Add Patent/ })).toBeNull();

    await u.click(screen.getByRole('button', { name: '11 - Academic Responsibilities' }));
    expect(await screen.findByRole('button', { name: /Add Course/ })).toBeTruthy();
    expect(screen.queryByText('Ph.D. Awarded')).toBeNull();
  });

  it('the active item follows the URL (deep link /patents highlights "09 - Patents")', async () => {
    renderAt('/faculty/profile/edit/patents');
    await sidebarLabels();
    const active = Array.from(document.querySelectorAll('.nav-subitem.active')).map((b) => b.textContent?.trim());
    expect(active).toEqual(['09 - Patents']);
    await waitFor(() => expect(heading()).toBe('Patents'));
    expect(within(document.querySelector('.card-body') as HTMLElement).getByRole('button', { name: /Add Patent/ })).toBeTruthy();
  });

  it('section IDs/routes are unchanged (every sidebar item still points at its original slug)', async () => {
    const u = userEvent.setup();
    renderAt('/faculty/profile/edit/patents');
    const slugs: Record<string, string> = {
      '09 - Patents': 'patents', '10 - Research Supervision': 'research-supervision',
      '11 - Academic Responsibilities': 'academic-responsibilities', '12 - Internship and Projects': 'internship-projects',
      '13 - Memberships': 'memberships', '14 - Attended FDP & Workshops': 'fdp-workshops', '15 - Online Courses': 'online-courses',
    };
    for (const [label, slug] of Object.entries(slugs)) {
      await u.click(await screen.findByRole('button', { name: label }));
      expect(screen.getByTestId('path').textContent).toBe(`/faculty/profile/edit/${slug}`);
    }
  });
});
