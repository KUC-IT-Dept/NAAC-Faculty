# NAAC-Faculty-merged — Integration Notes (Phases 0-5)

This document summarizes the work completed to turn this repository into
the shared backend for both the Faculty and Student frontends, plus the
new Library and MMTTC institutional modules.

## Phase 0 — Security fix
Public student registration (`POST /api/student/auth/register`, and the
equivalent in the old standalone `kuc-backend-main`) accepted a
client-supplied `role` field, allowing self-assignment of any role
including `superadmin`. Fixed to always hardcode `role: 'student'` on
public registration. Elevated accounts are only created via the
authenticated+authorized admin routes.

## Phase 1 — Backend consolidation
Closed 5 confirmed gaps between the old standalone student backend and
this merged backend's student module: general dropdown values, student
notifications, student-facing profile-update-request (create/list-mine),
student-facing forgot-password-request (create/list-mine), and
`deleteProfileRecord`. Added 3 compatibility path aliases (`/api/auth`,
`/api/unlock-request`, `/api/user`) so the existing Student frontend needs
no code changes, only an environment variable update.

## Phase 2 — modulePermissions
Added an additive `modulePermissions: string[]` field to the canonical
`User` model, and an `authorizeModule(moduleKey, ...bypassRoles)`
middleware alongside the existing `authorize()`. Follow-up: upgraded
`auth/middleware/authenticate.js` to do a fresh database lookup on every
request (mirroring the pattern already used by
`modules/faculty/middleware/auth.js`), so permission changes and account
deactivation take effect immediately, without waiting for a JWT to expire.

## Phase 3 — Library module
`modules/library/` — one document per academic year
(`LibraryRecord.js`), fields per the uploaded "0.9 Library Evaluation"
requirements document. Routes gated by
`authenticate` + `authorizeModule('library', ...ROLE_GROUPS.ADMIN_ONLY)`.

## Phase 4 — MMTTC module
`modules/mmttc/` — one document per academic year with a repeatable
`courses[]` array (`MMTTCRecord.js`), fields per the uploaded "0.11 MMTTC
Details" document. Same authorization shape as Library, plus dedicated
course add/update/remove sub-routes.

## Phase 5 — Frontend integration
- Faculty frontend: new `/institutional/library` and `/institutional/mmttc`
  pages, reachable by `admin` (which represents both `superadmin` and
  `iqac_director` via role coercion) and by `staff` accounts whose
  `modulePermissions` grant the relevant module. New `src/lib/institutionalApi.ts`
  client, reusing the existing `apiRoot` axios instance.
- Student frontend: no code changes — only `VITE_SERVER` needs to point at
  this merged backend.
- Faculty frontend env: `VITE_STUDENT_API_URL` needs to point at this same
  merged backend (used for both the existing student-admin request pages
  and the new Library/MMTTC pages).

## Authorization model
`authenticate` (JWT verify → live DB lookup) → `authorize(...roles)` or
`authorizeModule(moduleKey, ...bypassRoles)` → route handler. No new
roles were introduced; `ROLE_GROUPS.ADMIN_ONLY = [superadmin, iqac_director]`
(pre-existing) is the bypass group used by both Library and MMTTC.

## Full endpoint map (backend)

```
/api/faculty/*              existing, untouched
/api/analytics/*            existing, untouched (mounted under /api/faculty/analytics)
/api/student/*              existing student module
/api/auth                   alias -> student auth routes
/api/unlock-request         alias -> student unlock-request routes
/api/user                   alias -> student user routes
/api/dropdowns              Phase 1
/api/notifications          Phase 1
/api/profile-update-request Phase 1
/api/forgot-password-request Phase 1
/api/library[/:year]                              Phase 3
/api/mmttc[/:year][/courses[/:id]]                Phase 4
```

## Known limitations / deferred work
- Library/MMTTC file uploads are schema-ready (URL string fields) but no
  upload endpoint was wired up — deferred, not required by this phase.
- `staff` accounts have a minimal UI (Library/MMTTC nav only, no personal
  dashboard) since no such concept existed in the frontend before.
- Dropdown routes (`/api/dropdowns`) remain unauthenticated on writes,
  matching the old backend's original behavior exactly (a pre-existing
  gap, not introduced here) — worth revisiting under future permission work.
- No real MongoDB integration test was possible in the development
  sandbox (network-restricted); see `server/tests/README.md`.
