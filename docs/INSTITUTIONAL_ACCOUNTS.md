# Institutional Accounts — Librarian and MMTTC Director

Two independent, single-module roles were added to the existing role system.

| Role | Module key | Can access | Cannot access |
|---|---|---|---|
| `librarian` | `library` | `/api/library/*`, Library page | `/api/mmttc/*`, all admin, directory, department, analytics, student endpoints |
| `mmttc_director` | `mmttc` | `/api/mmttc/*`, MMTTC page | `/api/library/*`, all admin, directory, department, analytics, student endpoints |

Neither role is in `ROLE_GROUPS.ADMIN_ONLY` (superadmin/iqac_director), and neither inherits superadmin privileges.
`authorizeModule()` ignores `modulePermissions` for these two roles, so a stray grant can never open the other module.
Existing roles (superadmin, iqac_director, staff/faculty with `modulePermissions`) keep exactly their previous access.

## Admin API (admin / superadmin only)

Base: `/api/faculty/admin/institutional-accounts`. The role comes **only** from the `:type` URL segment
(`librarian` | `mmttc_director`); any `role`, `modulePermissions`, `isActive` or `password` in a request body is ignored.
These routes use `adminOnly`, which is stricter than the router-level `adminOrVc` (a VC cannot manage them).

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Both accounts (`null` if not yet created) |
| POST | `/:type` | Create (`name`, `email`, optional 10-digit `phone`); returns a one-time temporary password |
| PATCH | `/:type` | Edit `name`, `email`, `phone` only |
| PATCH | `/:type/deactivate` · `/:type/reactivate` | Toggle `isActive` |
| POST | `/:type/reset-password` | Generate a new one-time temporary password (`isFirstLogin` set again) |

**One account per role.** Enforced in the API (HTTP 409) and by a partial unique index
`uniq_institutional_role` on `User.role` (only for `librarian` / `mmttc_director`). To replace the holder, edit the account
(name/email/phone) and reset its password. Deactivation takes effect immediately: `authenticate()` and the faculty `auth`
middleware re-read the user on every request, and login is refused for inactive accounts.

Passwords are bcrypt-hashed (cost 12) exactly like every other account. The temporary password is random (CSPRNG), shown
once and never stored in plaintext. No endpoint returns password, hash or OTP fields.

## Login and landing pages

Login uses the existing `/api/faculty/auth/login`. The frontend sends `librarian` → `/institutional/library` and
`mmttc_director` → `/institutional/mmttc`; other roles keep their destinations. The Library and MMTTC pages **already
existed** (full CRUD built in earlier phases), so they are reused as the landing pages instead of placeholders.

## Admin page

Sidebar entry **Special Responsibilities** was replaced by **Institutional Accounts**
(`/admin/institutional-accounts`) with a Librarian panel and an MMTTC Director panel. The old backend endpoints and the
old page route remain (unlinked from the sidebar, reachable from a link on the new page) because faculty may already hold
Library/MMTTC grants through `modulePermissions`; removing them would strand those grants without a way to revoke.

## Migration / configuration

- No data migration. On first start Mongoose builds the partial unique index; it cannot conflict with existing data.
- No new environment variables or dependencies.
- Create the two accounts from the Admin page. Share the temporary password through a secure channel.

## Known gaps

- There is no change-password screen for these two roles (the API `POST /api/faculty/auth/change-password` exists). Until a
  UI is added, use **Reset Password** to rotate credentials.
- Frontend landing-page routing is verified by type-check and production build only; the project has no frontend test runner.

---

# Specification reference for the future dashboards

Field lists are preserved from the supplied documents (`library details.pdf`, `MMTTC details.odt`). "DD" = drop-down.

## 0.9 Library Evaluation

1. **General (0.9.1)** — Name of the Librarian; Qualifications; Joining date (DD calendar); Years of service (DD).
2. **Infrastructure (0.9.2)** — Total floor area, sq. ft. (digits only: no comma, space or point); Seating capacity (reading rooms, study carrels, digital labs — DD); Accessibility (ramps, lifts, wheelchairs — DD); Safety (fire alarms, CCTV, emergency exits — DD); Discussion rooms (DD); Computers (DD); Timing (days per week 0–7, from/to time — DD; holidays: Saturday, Sunday).
3. **Collections (0.9.3)** — Total books (subject DD + number DD); Journals and periodicals (print, electronic, national, international; numbers from 0); Digital resources (databases, e-books, institutional repository); Special collections (rare books, theses, manuscripts); Annual additions (titles purchased, subscribed); Contributions by students (project/research); Books donated by alumni / staff / others.
4. **Technology & Digital Access (0.9.4)** — Library management software (e.g. Koha, Libsys); OPAC availability (Y/N); Institutional repository access (Y/N); Remote access (VPN, proxy, federated login); Digital literacy programs (from/to date, calendar).
5. **Staffing & Services (0.9.5)** — Number of support staff; Qualifications and training of staff; User services (reference desk, research assistance, interlibrary loan — DD); Orientation programs for new students (calendar date, photo upload as proof); Workshops/seminars (citation, plagiarism, research tools — keep records); Plagiarism checks (Turnitin, Urkund: date, number of articles/PhD theses, internal/external).
6. **Usage & Engagement (0.9.6)** — Footfall (daily/annual); Circulation (books issued/returned); Digital resource usage (downloads, logins: date, total); Feedback mechanisms (feedback form + suggestion).
7. **Compliance & Precautions (0.9.7)** — Copyright compliance (Y/N); Data privacy (Y/N); Disaster preparedness (fire safety DD, digital backups Y/N); Preservation (binding / digitization / climate control).
8. **Financial Status (0.9.8)** — Budget allocation (annual expenditure); Subscriptions / memberships (e.g. INFLIBNET, DELNET).
9. **Best Practices (0.9.9)** — Best practices (green library, open access, others); Innovations (mobile apps, AI-based search tools, others); Details (free text).

**Future integration requirements (not implemented):**
- *Circulation (0.9.6.2)* must update **automatically from the library system's data**, with a manual-update facility. No library-system integration exists today; the current form is manual entry with a `source` flag (`manual`/`auto`) reserved for this.
- *Number of support staff (0.9.5.1)* and *staff qualifications/training (0.9.5.2)* must be **read from the existing non-teaching staff details**. This data link does not exist yet.

## 0.11 MMTTC Details

1. **General (0.11.1)** — Name of the centre; Affiliation details; Parent institution; Year of establishment (calendar); Recognition status (Yes/No + date); Accreditation status (Yes/No + date); Accreditation number.
2. **Details of the Director (0.11.2)** — Name; Academic qualification (DD: PhD / Professor / Associate Professor / Assistant Professor / M.Tech, repeated three times); Date of joining.
3. **Infrastructure (0.11.3)** — Classrooms; Total seating capacity; Labs; Library (books, space sq. ft.); Digital resources (free text); Seating capacity; Equipment (list, e.g. projector, with numbers); Supporting staff; Rooms available to stay; Stay capacity; Annual budget allocation (Rs.).
4. **Course details (0.11.4)** — **repeatable, multiple course records**: starting year (2000 onward); Course type (refresher / orientation / short term); Course code; Period from–to; Duration (auto from period, or manual 1–30 days); Subjects (DD, three); Course title; Coordinator (name, department, qualification); Eligibility; Participants (total, outside university, outside state, outside India — each 1–100); Faculty participants; Mode (online/offline); Funding source (Govt/Private/Trust); Expenditure; Publications; Feedback form (attachment).
5. **Impact and Outreach (0.11.5)** — Collaborations with universities/institutions; Community outreach / extension activities.

The MMTTC approval workflow is out of scope for this phase.
