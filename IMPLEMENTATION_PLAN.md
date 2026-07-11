# Role-Based Analytics Viewing Implementation Plan

**Project:** NAAC-Faculty
**Scope of this document:** Add role-based *viewing* permissions to the existing analytics engine. No new analytics/metrics are being built. No architecture changes. No breaking changes to existing routes, models, or frontend pages.
**Audience:** This document is a development specification for an implementing AI agent (Antigravity). It contains no code — only structure, responsibilities, and sequencing.

---

## 1. Overview

### 1.1 Current Analytics Architecture

The live server entry point is `server/index.js` (confirmed via `package.json` → `"start": "node index.js"`). All active routes are mounted from there.

The analytics engine is metadata-driven:

```
server/index.js
 └─ app.use('/api/faculty/analytics', facultyAnalyticsRoutes)
      └─ server/modules/faculty/routes/analytics.js      (ACTIVE route file)
           ├─ server/modules/analytics/models/Metric.js         (metric metadata schema)
           └─ server/modules/analytics/services/analyticsService.js (calculation engine)
                ├─ reads server/modules/faculty/models/Faculty.js
                └─ reads server/modules/student/models/StudentProfile.js
```

`analyticsService.js` reads `Metric` documents (each with a `formulaType`: `count`, `sum`, `percentage`, `ratio`, `objectSum`, `conditionalCount`, `studentCount`, etc.) and computes values dynamically against the `Faculty` and `StudentProfile` collections. This calculation logic is already cleanly isolated from routing — a strong foundation to build on.

**Live endpoints** (mounted at `/api/faculty/analytics/`):
`/metrics`, `/coverage`, `/metric/:metricId`, `/dashboard`, `/profile-completion`, `/profile-summary`, `/departments`, `/department-performance`, `/student-profile-completion`, `/student-profile-summary`, `/student-departments`, `/program-levels`.

### 1.2 Current Authentication / Authorization Flow

The faculty module uses its own local, actively-used middleware:

```
server/modules/faculty/middleware/auth.js
  ├─ auth          → verifies JWT, loads User, attaches req.user
  ├─ adminOnly      → role === 'admin' | 'superadmin'
  ├─ facultyOnly    → role === 'faculty'
  ├─ hodOnly        → role === 'hod'
  ├─ vcOnly         → role === 'vc'
  └─ adminOrVc      → role in [admin, superadmin, vc]
```

This is what `hod.js`, `vc.js`, and `admin.js` already use (`router.use(auth, hodOnly)` etc.). It is the stable, production authentication layer for this module.

A second, more generic layer exists at `server/auth/middleware/{authenticate,authorize}.js` with a canonical role list at `server/auth/constants/roles.js` (`student, faculty, hod, vc, iqac_director, staff, superadmin`). This layer is **not** currently wired into the faculty module's routers — it appears to be part of an unfinished "unified backend" effort. It must not be assumed active.

Frontend (`AuthContext.tsx`, `App.tsx`) only actively distinguishes four roles: `admin | faculty | vc | hod` (superadmin is remapped to `admin` client-side). `iqac_director` and `staff` exist in the schema but are never seeded or routed to today.

### 1.3 Existing Analytics Flow (Request Lifecycle Today)

```
Client request → /api/faculty/analytics/<endpoint>
      ↓
   (NO middleware — route handler runs directly)
      ↓
   Route handler queries Metric / Faculty / StudentProfile directly
      ↓
   JSON response returned, unfiltered, to any caller
```

### 1.4 Problems With the Current Implementation

1. **No authentication** on any analytics route — confirmed by direct inspection of `server/modules/faculty/routes/analytics.js`. Anyone with the URL, authenticated or not, can call any analytics endpoint.
2. **No authorization / role distinction** — even if auth were added naively, there is currently no concept of "which role can see which analytics."
3. **No scoping** — every response is institution-wide. There is no per-department or per-user filtering, so a department-level viewer and an institution-level viewer would see identical data today.
4. **Permission logic, if added carelessly, risks being mixed into the calculation engine** (`analyticsService.js`), which would violate separation of concerns and make both harder to test and maintain.
5. **Dead/duplicate files exist** (`server/server.js`, `server/routes/*.js`, `server/middleware/*.js`, `server/modules/analytics` route duplicated under `server/routes/analytics.js`) which are not wired into `index.js`. These must be identified and explicitly avoided so no effort is wasted modifying code that never executes.
6. **No frontend consumption yet** — no page in `src/` currently calls any `/analytics/*` endpoint. This is actually a benefit: there is no existing UI behavior to regress against on the frontend side.

---

## 2. Design Goals

1. **Preserve current functionality** — every analytics endpoint, for a role that is permitted to call it, must return the exact same response shape and values as today.
2. **No regression** — routes/pages that don't touch analytics (`hod.js`, `vc.js`, `admin.js`, `FacultyDashboard.tsx`, etc.) are not touched at all.
3. **Role-based analytics viewing** — every analytics request must be attributable to an authenticated user with a known role, and the response must reflect what that role is entitled to see.
4. **Scalable architecture** — the permission model must be able to extend to other modules (student, course, research, placement) without redesign, and to new roles (e.g. `iqac_director`, `staff`, or a future `principal`) without touching the calculation engine.
5. **Separation of concerns** — three concerns must remain physically separate in three different layers/files:
   - **Authentication** (who is this user?) — existing, unmodified.
   - **Scope resolution & permission** (what is this user allowed to see?) — new, isolated.
   - **Analytics calculation** (compute the metric value) — existing, unmodified.

---

## 3. Proposed Architecture

```
┌──────────────────────┐
│      Frontend         │   Requests analytics data with JWT attached
└──────────┬────────────┘
           ↓
┌──────────────────────┐
│    Authentication      │   Existing `auth` middleware (modules/faculty/middleware/auth.js)
│                        │   Verifies JWT → loads User → attaches req.user (role, department, id)
└──────────┬────────────┘
           ↓
┌──────────────────────┐
│ Analytics Scope        │   NEW — resolves an "analytics scope" from req.user.role
│ Resolver (middleware)  │   Decides: is this role allowed to hit this endpoint at all?
│                        │   If yes, attaches a `scope` object to req (e.g. { level: 'department',
│                        │   department: 'CS' } or { level: 'institution' })
│                        │   If no, responds 403 and stops the chain here.
└──────────┬────────────┘
           ↓
┌──────────────────────┐
│  Analytics Service      │   EXISTING, UNMODIFIED — analyticsService.js
│  (calculation engine)  │   Computes metric values from Faculty / StudentProfile / Metric
│                        │   Optionally accepts a scope filter (e.g. department) as a plain
│                        │   parameter — it has no knowledge of roles, only of data filters.
└──────────┬────────────┘
           ↓
┌──────────────────────┐
│       Database          │   MongoDB collections: faculties, studentprofiles, metrics
└──────────────────────┘
```

**Responsibility of each layer:**

| Layer | Responsibility | Knows about roles? | Knows about metrics/formulas? |
|---|---|---|---|
| Frontend | Sends authenticated request, renders whatever comes back | No (only renders based on what backend allows) | No |
| Authentication | Confirms identity, attaches `req.user` | No | No |
| Analytics Scope Resolver | Confirms **permission** and computes a **data scope** | Yes — this is its only job | No |
| Analytics Service | Computes metric values, optionally applies a scope **filter** if given one | No | Yes — this is its only job |
| Database | Stores/returns raw data | No | No |

This keeps the permission system and the calculation engine in two different files with two different responsibilities, connected only by a simple, role-agnostic `scope` object passed through `req`.

---

## 4. Analytics Scope Model

Rather than hard-coding "which endpoints can role X call" as a flat permission list, model **scope** as the primary concept. A scope describes *how much data* a role may see, not *which URL* they may hit. This is more scalable and mirrors how the codebase already partitions data (e.g. `employmentDetails.department` is already used for HOD-style filtering elsewhere in the app).

### 4.1 Scope Levels

| Role (as it exists in this codebase today) | Scope Level | Data Boundary |
|---|---|---|
| `faculty` | `self` | Own profile/records only |
| `hod` | `department` | All records where `employmentDetails.department === req.user.department` |
| `vc` | `university` | All departments, all faculty, university-wide aggregates |
| `iqac_director` *(defined in schema, not yet seeded/live)* | `institution` | Full institutional analytics, NAAC/IQAC-focused views (this is the natural owner of the analytics engine's original purpose) |
| `admin` / `superadmin` | `full` | Unrestricted — includes system/administrative views |

> **Note on "Principal" / "College" scopes:** The current codebase has no multi-college or "Principal" concept — it is a single-institution system. The scope model is deliberately designed so a `college` level (between `department` and `institution`) can be added later purely as a new entry in the scope configuration, with zero changes to the resolver's mechanism or to the analytics service. This is covered in §11 (Future Scalability).

### 4.2 How Scope-Based Filtering Works

1. The **Analytics Scope Resolver** middleware inspects `req.user.role` (and, when relevant, `req.user.department`, already available on the authenticated user/faculty record).
2. It looks up the role in a scope configuration table (new, isolated file — see §5) which answers two questions:
   - **Is this role permitted to access this analytics endpoint at all?** (some scopes, like `self`, are not permitted to view institution-wide aggregate analytics endpoints)
   - **If permitted, what is the data boundary?** (`self` / `department` / `university` / `institution` / `full`)
3. The resolver attaches a plain object, e.g. `req.analyticsScope = { level: 'department', department: 'Computer Science' }`, to the request — or returns `403 Forbidden` if the role has no access to that endpoint.
4. The route handler (unchanged in structure) passes `req.analyticsScope` down to `analyticsService.js` as an **optional, plain filter parameter**. The service does not need to know *why* the filter exists — it just optionally narrows its existing MongoDB queries (e.g. adding `{ 'employmentDetails.department': scope.department }` to an existing `Faculty.find()` call) when a department-level scope is present, and skips the filter entirely for `university`/`institution`/`full` scopes.
5. This means: **the same calculation function serves every role** — only the amount of data it's asked to calculate over changes, via a parameter, not via role-aware branching inside the engine.

---

## 5. File Analysis

### 5.1 Files to Modify

#### `server/modules/faculty/routes/analytics.js`
- **Current responsibility:** Defines and handles all 12 analytics HTTP routes; currently has zero middleware.
- **Required modification:** Add two middleware references to each route definition — the existing `auth` middleware, and the new Analytics Scope Resolver middleware (parameterized per route, e.g. `requireAnalyticsScope('dashboard')`). Route handler bodies are **not** rewritten; at most, the already-existing `Faculty.find(...)` / `StudentProfile.find(...)` calls gain an optional spread of a scope-derived filter object where department-level scoping applies.
- **Reason:** This is the only file in the live request path with no protection today. It's also the only appropriate place to attach permission middleware, since it owns the route definitions.
- **Risk level:** **Low.** Additive middleware calls only; no change to response logic for permitted roles; each route can be migrated and verified independently.

#### `server/index.js`
- **Current responsibility:** Mounts all routers, including `facultyAnalyticsRoutes`.
- **Required modification:** Optional — only if a new small "my-access" endpoint (see §5.2) is added as its own router, one new `app.use(...)` line is required. If the new endpoint is instead added directly inside the existing analytics router file, **no change to `index.js` is needed at all.**
- **Reason:** Router mounting is centralized here; any brand-new router must be registered here to be reachable.
- **Risk level:** **Low.** Single additive line, no change to existing mounted routes.

No other files require modification.

### 5.2 New Files

#### `server/modules/analytics/permissions/analyticsScopes.js`
- **Responsibility:** Single source of truth mapping each role → allowed analytics endpoints → scope level. Pure configuration data, no request/response handling, no database access.
- **Dependencies:** None (may reference the existing `server/auth/constants/roles.js` role name constants for consistency, read-only).
- **Why needed:** Centralizes the permission/scope model in one place so it can be audited, extended, and reused (e.g. later by other modules) without touching route or service files.

#### `server/modules/analytics/middleware/requireAnalyticsScope.js`
- **Responsibility:** Express middleware factory. Given an endpoint key (e.g. `'dashboard'`), reads `req.user`, consults `analyticsScopes.js`, either attaches `req.analyticsScope` and calls `next()`, or responds `403`.
- **Dependencies:** `analyticsScopes.js` only (plus `req.user`, which is populated by the existing `auth` middleware).
- **Why needed:** This is the entire "Analytics Scope Resolver" layer from §3. Keeping it as its own file (not inline in the route file) means it is independently testable and has no knowledge of Mongo queries, formulas, or metric definitions — full separation from `analyticsService.js`.

#### `server/modules/analytics/routes/analyticsAccess.js` *(optional but recommended)*
- **Responsibility:** A single new `GET /api/faculty/analytics/my-access` endpoint that returns which analytics views the authenticated user's role is permitted to see (derived from `analyticsScopes.js`), so the frontend can build its navigation/menu without guessing or hardcoding role logic.
- **Dependencies:** `auth` middleware (existing), `analyticsScopes.js` (new).
- **Why needed:** Avoids duplicating the permission table in the frontend; frontend asks the backend "what can I see" rather than re-implementing the role→scope mapping in JavaScript on the client.

#### `src/lib/analyticsApi.ts` *(frontend, only needed once UI work begins)*
- **Responsibility:** Thin wrapper functions calling `/analytics/*` endpoints, following the existing `api` client pattern (`src/lib/api.ts`) — token attachment, base URL, 401 handling already work automatically since the shared `api` instance is reused.
- **Dependencies:** `src/lib/api.ts` (existing, read-only usage — not modified).
- **Why needed:** Keeps analytics-specific fetch logic out of individual page components, consistent with how other pages already isolate concerns.

#### `src/pages/analytics/AnalyticsDashboard.tsx` (and optional per-role variants) *(frontend)*
- **Responsibility:** Renders whichever analytics views the backend's `my-access` endpoint indicates are available for the current user; requests the underlying metric endpoints only for permitted views.
- **Dependencies:** `analyticsApi.ts`, `useAuth()` from existing `AuthContext.tsx` (read-only usage).
- **Why needed:** Net-new page(s) so nothing about existing dashboards (`VCDashboard.tsx`, `HODDashboard.tsx`, `FacultyDashboard.tsx`, `AdminDashboard.tsx`) needs to change to support this feature.

### 5.3 Files That Must Not Be Modified

| File / Group | Reason |
|---|---|
| `server/modules/analytics/services/analyticsService.js` | The calculation engine. Must remain unaware of roles/permissions by design (§2, §4.2). Any modification here should be limited, if ever needed, to accepting an *optional generic filter parameter* — never role logic. |
| `server/modules/analytics/models/Metric.js` | Pure metric metadata schema; unrelated to access control. |
| `server/routes/analytics.js`, `server/routes/*.js`, `server/server.js`, `server/middleware/auth.js`, `server/middleware/roleGuard.js`, `server/middleware/faculty_server_auth_middleware.js` | **Dead code.** Confirmed not required by `server/index.js` (the actual entry point per `package.json`). Modifying them has zero runtime effect and risks misleading future maintainers. |
| `server/auth/middleware/authenticate.js`, `server/auth/middleware/authorize.js`, `server/auth/constants/roles.js` | Belongs to an unfinished "unified backend" auth layer, not wired into the faculty module's routers today. Touching it risks unintended effects on the student module, which may depend on it. Out of scope. |
| `server/modules/faculty/middleware/auth.js` | Stable, production, actively depended on by `hod.js`, `vc.js`, `admin.js`. It must be *reused as-is*, not edited — extend behavior via new files (§5.2), not by adding new exports here. |
| `server/models/Faculty.js`, `Department.js`, `server/auth/models/User.model.js` | No schema changes are required; the `role` and `department` fields already needed for scoping already exist. |
| `src/pages/vc/VCDashboard.tsx`, `src/pages/hod/HODDashboard.tsx`, `src/pages/faculty/FacultyDashboard.tsx`, `src/pages/admin/AdminDashboard.tsx` | None of these currently call the analytics engine. They require no changes to "preserve existing functionality" and should only gain new links/navigation entries (additive) if you choose to surface analytics inside them, in a separate later phase. |
| `src/context/AuthContext.tsx`, `src/lib/api.ts` | Already provide everything needed (JWT attachment, role on `user` object) — read from, not modified. |

---

## 6. Implementation Phases

### Phase 1 — Create the Analytics Scope Configuration
- **Objectives:** Define the role → endpoint → scope-level mapping as static configuration.
- **Files affected:** New: `server/modules/analytics/permissions/analyticsScopes.js`.
- **Expected outcome:** A single, reviewable file fully describing the permission model, importable but not yet used anywhere.
- **Regression risk:** None — file is not yet imported by any live code path.

### Phase 2 — Create the Analytics Scope Resolver Middleware
- **Objectives:** Build the middleware that reads `req.user`, consults Phase 1's config, and either attaches `req.analyticsScope` or returns 403.
- **Files affected:** New: `server/modules/analytics/middleware/requireAnalyticsScope.js`.
- **Expected outcome:** A middleware function that can be unit-tested in isolation (mock `req.user`, assert `next()`/403 behavior) without touching Express routing or the database.
- **Regression risk:** None — not yet attached to any route.

### Phase 3 — Protect Analytics Routes
- **Objectives:** Attach `auth` (existing) + `requireAnalyticsScope(<key>)` (new) to each of the 12 routes in `server/modules/faculty/routes/analytics.js`, one route at a time, verifying after each.
- **Files affected:** Modified: `server/modules/faculty/routes/analytics.js`.
- **Expected outcome:** Every analytics endpoint requires authentication and enforces the role-based scope; permitted roles see byte-identical responses to before; denied roles receive a clean `403`.
- **Regression risk:** **Low, but non-zero** — this is the only phase touching a live file. Mitigate by rolling out one route at a time (start with `/coverage`, the lowest-traffic route) and testing before moving to the next.

### Phase 4 — Add Department-Level Filtering (Scope Application)
- **Objectives:** For endpoints where `hod`/`department`-scope applies, pass `req.analyticsScope` into the existing service calls as an optional filter (e.g. narrowing `Faculty.find()` by `employmentDetails.department`) — without adding any role-awareness inside `analyticsService.js` itself.
- **Files affected:** Modified: `server/modules/faculty/routes/analytics.js` (handler bodies gain an optional filter object passed to already-existing queries). No changes to `analyticsService.js` itself unless a shared filter-merging helper is needed — if so, it should be a **new** small utility file, not an edit to the service.
- **Expected outcome:** HOD-scoped requests return department-narrowed data; VC/IQAC/Admin-scoped requests return the same institution-wide data as before.
- **Regression risk:** **Medium** — this is the phase most likely to change actual response *content* (not just access). Requires careful before/after value comparison for `university`/`full` scope roles (must be unchanged) and explicit new tests for `department` scope (must be narrowed correctly).

### Phase 5 — Add the "My Access" Endpoint (Optional)
- **Objectives:** Expose `GET /api/faculty/analytics/my-access` so the frontend can discover permitted views dynamically.
- **Files affected:** New: `server/modules/analytics/routes/analyticsAccess.js`. Possibly one new line in `server/index.js` if mounted as its own router.
- **Expected outcome:** Authenticated request returns a small JSON structure describing accessible analytics views for the caller's role.
- **Regression risk:** None — entirely new, additive endpoint.

### Phase 6 — Frontend: Analytics Pages
- **Objectives:** Build new page(s) that call `my-access`, then render only the permitted analytics views.
- **Files affected:** New: `src/lib/analyticsApi.ts`, `src/pages/analytics/AnalyticsDashboard.tsx` (or role-specific variants), a small addition of new `<Route>` entries in `src/App.tsx` (additive route declarations only — existing routes untouched), optional new nav links in `src/components/AppLayout.tsx` (additive list entries only).
- **Expected outcome:** Each role sees an analytics view appropriate to their scope; no existing page's behavior changes.
- **Regression risk:** Low — purely additive routes/components; existing pages/routes are not edited, only appended to.

### Phase 7 — Testing
- **Objectives:** Full verification per the checklist in §10.
- **Files affected:** None (or new test files only, if a test framework is present/added).
- **Expected outcome:** Confidence that all permitted-role behavior is unchanged and all denied-role behavior is correctly blocked.
- **Regression risk:** N/A (this phase reduces risk, it doesn't introduce it).

---

## 7. API Flow

Request lifecycle for a protected analytics endpoint, e.g. `GET /api/faculty/analytics/department-performance`:

```
1. Client sends request with `Authorization: Bearer <JWT>`
        ↓
2. AUTHENTICATION (existing, unmodified `auth` middleware)
   - Verifies JWT
   - Loads User from DB
   - Rejects with 401 if invalid/expired/inactive
   - Attaches req.user { id, role, department, ... }
        ↓
3. ANALYTICS SCOPE RESOLVER (new `requireAnalyticsScope('departmentPerformance')`)
   - Looks up req.user.role in analyticsScopes.js
   - If role not permitted for this endpoint key → 403 Forbidden, chain stops
   - If permitted → resolves scope level (e.g. 'department') and attaches
     req.analyticsScope = { level: 'department', department: req.user.department }
        ↓
4. ROUTE HANDLER (existing handler, minimally extended)
   - Passes req.analyticsScope (or a derived filter object) into the existing
     analyticsService.js function call
        ↓
5. ANALYTICS SERVICE (existing, unmodified calculation logic)
   - Runs the same Mongo queries as before, optionally narrowed by the
     filter object it received (no role-awareness inside this layer)
        ↓
6. FILTERED RESPONSE
   - JSON response returned to client — identical shape to today, with data
     narrowed only if the caller's scope required it
```

---

## 8. Frontend Plan

- **New pages:**
  - `src/pages/analytics/AnalyticsDashboard.tsx` — a single adaptive dashboard that renders sections conditionally based on the `my-access` response (preferred over multiple hardcoded per-role pages, to avoid duplicating role logic on the frontend).
- **New components (optional, for readability):**
  - Small presentational components for each analytics card type already implied by existing endpoints (e.g. a coverage table, a department performance table, a profile-completion summary) — purely additive, rendered inside `AnalyticsDashboard.tsx`.
- **Navigation changes:**
  - Add a new "Analytics" entry to the relevant role-based nav arrays in `src/components/AppLayout.tsx` (this file already defines role-specific nav lists) — additive array entries only, no existing entries changed.
  - Add new `<Route>` entries in `src/App.tsx` for `/faculty/analytics`, `/hod/analytics`, `/vc/analytics`, etc., each wrapped in the existing `<ProtectedRoute role="...">` component exactly as other routes already are — no change to `ProtectedRoute` itself.
- **API integration:**
  - `analyticsApi.ts` calls `my-access` once on page load, then conditionally calls only the endpoints the response indicates are permitted. This avoids firing requests the backend would reject anyway and keeps the frontend permission-agnostic (it trusts the backend's answer rather than re-implementing the role table).
- **State management:**
  - Local component state (`useState`) is sufficient, consistent with how `VCDashboard.tsx` and `HODDashboard.tsx` currently manage their own data — no new global state library or context needed. No changes to `AuthContext.tsx`.

---

## 9. Backend Plan

- **Middleware:**
  - `auth` (existing, reused) — identity.
  - `requireAnalyticsScope(endpointKey)` (new) — permission + scope resolution. Applied per-route, mirroring the existing `router.use(auth, hodOnly)` pattern already used in `hod.js`, but applied at the individual-route level (via `router.get(path, auth, requireAnalyticsScope('key'), handler)`) since different analytics endpoints require different scope rules, unlike `hod.js`/`vc.js` where the whole router shares one rule.
- **Routes:**
  - `server/modules/faculty/routes/analytics.js` — all 12 existing endpoints, each gaining the two middleware calls described above.
  - `server/modules/analytics/routes/analyticsAccess.js` (new, optional) — the `my-access` endpoint.
- **Controllers:**
  - This codebase does not use a separate controller layer for analytics — route handlers act as controllers directly (consistent with the existing style in `analytics.js`, `hod.js`, `vc.js`). This plan preserves that convention rather than introducing a new architectural layer.
- **Services:**
  - `analyticsService.js` — unchanged calculation logic, optionally receiving a plain filter object from the route handler (not from the middleware directly, keeping the service decoupled from `req`/Express entirely).
- **Interaction summary:** `auth` populates identity → `requireAnalyticsScope` turns identity into a permission decision + scope object → route handler passes that scope as data (not as roles) into the untouched `analyticsService.js` → service returns values → route handler returns JSON exactly as it does today.

---

## 10. Testing Checklist

### Authentication Tests
- [ ] Request to any analytics endpoint with no `Authorization` header returns `401`.
- [ ] Request with an expired/invalid JWT returns `401`.
- [ ] Request with a valid JWT for a deactivated user (`isActive: false`) returns `403` (existing `auth` middleware behavior, unchanged).

### Permission Tests
- [ ] `faculty` role receives `403` on all institution/department-aggregate analytics endpoints (per the scope table in §4.1), unless a `self`-scoped endpoint is explicitly defined for them.
- [ ] `hod` role receives `200` with department-scoped data on endpoints permitted at `department` level.
- [ ] `hod` role receives `403` on endpoints reserved for `university`/`institution`/`full` scope.
- [ ] `vc` role receives `200` with full (unfiltered) data on university-scope endpoints.
- [ ] `admin`/`superadmin` receives `200` on all endpoints.
- [ ] `iqac_director` (manually testable even though not currently seeded) receives `200` on all endpoints once assigned that role.

### Regression Tests
- [ ] For every role that *was* previously able to call these routes unauthenticated (i.e., every response body), the returned JSON for `vc`/`admin`/`iqac_director` roles is byte-for-byte identical to the pre-change response for the same underlying data.
- [ ] All other, unrelated live routes (`/api/faculty/hod/*`, `/api/faculty/vc/*`, `/api/faculty/admin/*`, `/api/faculty/auth/*`, `/api/student/*`) continue to behave identically — verified by hitting each once before and after the change.
- [ ] `server/index.js` still boots without error and logs the same startup routes.
- [ ] No changes detected in `server/server.js`, `server/routes/*`, `server/middleware/*` (dead code untouched, confirmed via diff).

### Frontend Tests
- [ ] New `/*/analytics` routes render only for the intended role (`ProtectedRoute` behavior confirmed unchanged for existing routes).
- [ ] Analytics page correctly renders only the sections the `my-access` response permits for a logged-in `hod` vs `vc` vs `admin` test account.
- [ ] Existing pages (`FacultyDashboard`, `HODDashboard`, `VCDashboard`, `AdminDashboard`) render and behave identically to before this change (manual smoke test, since none of them currently touch analytics).
- [ ] 401 interceptor in `src/lib/api.ts` still correctly redirects to `/login` when a token expires mid-session on the new analytics page.

### Backend Tests
- [ ] Unit test `analyticsScopes.js` lookups directly (no HTTP layer) for every role/endpoint combination.
- [ ] Unit test `requireAnalyticsScope` middleware with mocked `req.user` objects for each role, asserting `next()` vs `403`.
- [ ] Confirm `analyticsService.js` is never imported by, or aware of, any permission/role file (static import check).

### API Tests
- [ ] Manual/automated pass with Postman/curl for each of the 12 endpoints × each of the 4–5 live roles (faculty, hod, vc, admin, and iqac_director once assignable) = full matrix coverage.
- [ ] `GET /api/faculty/analytics/my-access` returns the correct permitted-endpoint list for each role.

---

## 11. Future Scalability

Because permission logic lives entirely in `analyticsScopes.js` + `requireAnalyticsScope.js`, and never inside any calculation engine, this pattern extends to other modules without redesign:

- **Student Module:** A `server/modules/student/permissions/studentAnalyticsScopes.js` + reuse of the same `requireAnalyticsScope`-style middleware pattern (parameterized by module) can gate any future student analytics endpoints, using the same `self / department / university / institution / full` scope vocabulary already defined here.
- **Faculty Module (beyond analytics):** The same scope vocabulary can gate faculty directory visibility, profile export, or reporting features by reusing `analyticsScopes.js`'s structure as a template for a `facultyDataScopes.js`.
- **Course Module:** If a course-management module is added later, a `courseAnalyticsScopes.js` following the identical shape (role → endpoint key → scope level) can be dropped in; the resolver middleware is generic enough to be reused verbatim, only pointed at a different config file.
- **Research Module:** Research-output analytics (already partially present via `publications`/`projects`/`patents` metrics in the existing engine) can gain its own scope config without touching `analyticsService.js`'s formula logic — the same "pass an optional filter object" pattern applies.
- **Placement Module:** A future placement-analytics feature would follow the same three-layer separation: authentication (unchanged), a new placement-specific scope config + resolver middleware (new, isolated), and a placement calculation service (new, isolated) — never merging permission checks into calculation code.

**Why no redesign is needed:** The permission system was deliberately built as (a) a *data-driven configuration file* and (b) a *generic middleware factory* that takes an endpoint key and returns an allow/deny + scope decision. Neither piece has any hardcoded knowledge of "analytics" specifically — the same two-file pattern is a template that can be copy-adapted per module, keeping every module's permission logic independently auditable while sharing one conceptual scope model (`self → department → university/college → institution → full`) across the whole application.

---

## 12. Final Development Checklist

- [ ] **Phase 1:** Create `server/modules/analytics/permissions/analyticsScopes.js` defining role → endpoint → scope-level mapping.
- [ ] **Phase 2:** Create `server/modules/analytics/middleware/requireAnalyticsScope.js` implementing the resolver/guard logic.
- [ ] **Phase 3:** Attach `auth` + `requireAnalyticsScope(<key>)` to each of the 12 routes in `server/modules/faculty/routes/analytics.js`, one route at a time, verifying after each addition.
- [ ] **Phase 4:** Pass `req.analyticsScope` into existing `analyticsService.js` calls as an optional filter parameter for department-scoped endpoints; verify university/full-scope roles remain unfiltered and unchanged.
- [ ] **Phase 5 (optional):** Create `server/modules/analytics/routes/analyticsAccess.js` exposing `GET /my-access`; register in `server/index.js` if mounted separately.
- [ ] **Phase 6:** Create `src/lib/analyticsApi.ts`; create `src/pages/analytics/AnalyticsDashboard.tsx`; add new additive `<Route>` entries in `src/App.tsx`; add new additive nav entries in `src/components/AppLayout.tsx`.
- [ ] **Phase 7:** Execute full Testing Checklist (§10) — authentication, permission, regression, frontend, backend, and API test rows.
- [ ] **Final verification:** Confirm zero modifications to any file listed in §5.3 ("Files That Must Not Be Modified") via diff review before merge.
- [ ] **Final verification:** Confirm `analyticsService.js` contains no references to `req`, `role`, or any permission-related identifier.
- [ ] **Documentation:** Update `server/modules/analytics/README.md` with a short "Access Control" section describing the new scope model (additive documentation only, does not affect behavior).
