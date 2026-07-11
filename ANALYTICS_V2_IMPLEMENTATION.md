# Analytics V2 Implementation Plan

**Project:** NAAC-Faculty
**Scope of this document:** Design a safe, additive upgrade of the Analytics module into a complete reporting system for VC, IQAC, Principal, HOD, and Admin — filtering, visualization, drill-down, report generation (PDF/Excel/CSV), benchmark analysis (against the attached University Benchmark manual), trend analysis, and a rule-based recommendation engine.
**Baseline:** This plan builds directly on top of the already-implemented Role-Based Analytics Viewing layer (Phase 1 of the analytics module's own roadmap — see `server/modules/analytics/README.md`, section "Future Phase 2 Enhancements", which already anticipates most of what is requested here).
**Hard constraint:** No redesign. No refactor. No file moves or renames. No changes outside the Analytics module unless explicitly justified as the only safe path. No code in this document.

---

## Current Analytics Architecture

The live analytics stack (verified against the codebase, not assumed):

```
server/index.js
 └─ app.use('/api/faculty/analytics', facultyAnalyticsRoutes)
      └─ server/modules/faculty/routes/analytics.js         (12 routes, all protected)
           ├─ auth                                            (existing identity middleware)
           ├─ requireAnalyticsScope(endpointKey)               (existing permission middleware — V1)
           ├─ server/modules/analytics/permissions/analyticsScopes.js  (existing role→scope config — V1)
           ├─ server/modules/analytics/models/Metric.js        (metric metadata schema)
           └─ server/modules/analytics/services/analyticsService.js (calculation engine)
                ├─ reads server/modules/faculty/models/Faculty.js
                └─ reads server/modules/student/models/StudentProfile.js

server/modules/analytics/routes/analyticsAccess.js  → GET /api/faculty/analytics/my-access

src/lib/analyticsApi.ts        → typed wrapper for all analytics endpoints
src/pages/analytics/AnalyticsDashboard.tsx → single adaptive dashboard page
src/App.tsx                    → routes: /hod/analytics, /vc/analytics, /admin/analytics
src/components/AppLayout.tsx   → nav entries for hod/vc/admin
```

**What already exists and works (do not rebuild):**

- **Metadata-driven calculation engine** (`analyticsService.js`) supporting formula types: `count`, `sum`, `conditionalCount`, `objectSum`, `percentage`, `ratio`, `facultyCount`, `studentCount`, `studentConditionalCount`, `studentExists`, `metricPercentage`.
- **`Metric` schema already has a `criterion` field** (e.g. `"Research & Publications"`) and metric IDs already follow NAAC numbering (`3.4.4`, `3.2.2`, `3.4.5`, `3.2.1` are the four currently-seeded metrics, per the module's own README). This is a critical finding: **the schema is already NAAC-criterion-aware**, so benchmark mapping in V2 can key off fields that already exist.
- **Role-based scope system** (V1): `faculty→self`, `hod→department`, `vc→university`, `iqac_director→institution`, `admin/superadmin→full`, enforced by `requireAnalyticsScope` and configured entirely in `analyticsScopes.js`.
- **Rich source data already captured** on `Faculty` (via `publicationSchema`, `projectSchema`, `patentSchema`) including per-record `year`, `journalCategory`, `level` (National/International), `projectCategory`, `fundingAgency`, `status`, `startDate`/`endDate`, `dateOfFiling` — i.e. the raw fields needed for Academic Year, Category, and Research Area filtering **already exist in the database**, just not yet aggregated/exposed.
- **No frontend regression risk on existing pages** — confirmed again: `VCDashboard.tsx`, `HODDashboard.tsx`, `AdminDashboard.tsx`, `FacultyDashboard.tsx` still do not call any analytics endpoint. Only `AnalyticsDashboard.tsx` (net-new from V1) does.

**What does not exist yet (this is the V2 gap):**

- No filtering (year/department/faculty/program/date range/category/research area).
- No charts — `AnalyticsDashboard.tsx` currently renders data only as tables/cards.
- No drill-down from a KPI to its underlying record list.
- No report generation (PDF/Excel/CSV) anywhere in the analytics module.
- No benchmark comparison — nothing in the codebase references NAAC benchmark thresholds today.
- No trend/comparison analysis (year-over-year, department-vs-department).
- No recommendation engine.

---

## Proposed Analytics V2 Architecture

V2 is designed as **additive layers bolted onto the existing engine**, not a replacement:

```
                         ┌───────────────────────────────┐
                         │           Frontend              │
                         │  AnalyticsDashboard.tsx (V1,     │
                         │  untouched) + new V2 pages/tabs   │
                         └───────────────┬───────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │      Authentication (auth)       │   EXISTING — unmodified
                         └───────────────┬───────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │  Analytics Scope Resolver        │   EXISTING (V1) — unmodified
                         │  (requireAnalyticsScope)          │
                         └───────────────┬───────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │   NEW: Analytics Filter Layer     │   NEW — parses query params
                         │   (query-param parsing only)      │   (year, dept, faculty, program,
                         │                                    │    dateRange, category, area)
                         └───────────────┬───────────────┘
                                         ↓
              ┌──────────────────────────┼──────────────────────────┐
              ↓                          ↓                          ↓
   ┌───────────────────┐   ┌────────────────────────┐   ┌─────────────────────┐
   │ Analytics Service    │   │ NEW: Benchmark Service    │   │ NEW: Trend Service     │
   │ (EXISTING, unmodified)│   │ compares computed values   │   │ computes period-over-  │
   │ calculateMetric() etc.│   │ against benchmark table    │   │ period / entity-vs-    │
   │                       │   │                            │   │ entity comparisons     │
   └──────────┬────────────┘   └──────────┬─────────────┘   └──────────┬───────────┘
              └──────────────────────────┼──────────────────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │  NEW: Recommendation Engine       │   Rule-based, reads outputs of
                         │  (rule evaluation only)           │   the above; writes nothing
                         └───────────────┬───────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │  NEW: Report Generation Service   │   Assembles PDF/Excel/CSV from
                         │  (PDF / Excel / CSV)              │   the same JSON payloads the
                         │                                    │   dashboard already renders
                         └───────────────┬───────────────┘
                                         ↓
                         ┌───────────────────────────────┐
                         │            Database              │   EXISTING — no schema changes
                         └───────────────────────────────┘
```

**Design principle carried over from V1 and strictly preserved:** every new box above is a **new file**. None of them know about each other's internals — the Filter Layer only produces a plain filter object; the Benchmark/Trend/Recommendation services only consume plain JSON (the same shape `analyticsService.js` already returns); the Report Generator only consumes the same JSON the frontend already renders. `analyticsService.js` itself gains zero new responsibilities.

---

## File Analysis

### Files to Modify

| File | Current Responsibility | Required Modification | Reason | Risk Level |
|---|---|---|---|---|
| `server/modules/faculty/routes/analytics.js` | Defines the 12 existing analytics routes, each already wrapped in `auth` + `requireAnalyticsScope` | **Additive only:** accept optional query-string filter parameters on existing routes (e.g. `?year=2024&department=CS`) and pass them through to `analyticsService.js` calls as an optional filter object; existing calls with no query params must behave byte-identically to today. New V2 routes (drill-down, benchmark, trend, report, recommendations — see API Design) should be added as new files where possible; only if Express routing conventions in this codebase require them to live in this file (to keep the `/api/faculty/analytics/*` prefix) should new `router.get(...)` lines be appended here. | This file already owns the analytics route surface and the scope-check pattern; extending query handling here (rather than duplicating scope checks elsewhere) keeps V1's permission model as the single gate for all V2 reads too. | **Low** — every change is additive (new optional params, new route registrations); no existing route signature, response shape, or behavior changes when called without new params. |
| `src/App.tsx` | Registers `/hod/analytics`, `/vc/analytics`, `/admin/analytics` routes pointing at `AnalyticsDashboard.tsx` | **Additive only:** register new routes for drill-down pages and report pages (e.g. `/vc/analytics/publications`, `/admin/analytics/reports`), each wrapped in the existing `<ProtectedRoute role="...">` component exactly as the current three lines already are. | New pages need routes; `App.tsx` is the single source of routing truth already, so this is unavoidable, but the change is a pure append. | **Low** — no existing `<Route>` line is edited or removed. |
| `src/components/AppLayout.tsx` | Defines per-role nav arrays, already including an "Analytics" entry for hod/vc/admin | **Additive only:** optionally add sub-nav entries or a "Reports" link per role. Can be deferred entirely if V2 is delivered as tabs inside the existing `AnalyticsDashboard.tsx` page instead of separate nav-level pages (recommended — see Frontend Plan). | Only needed if new top-level pages (not tabs) are introduced. | **Low** — additive array entries only. |
| `server/modules/analytics/README.md` | Documents the metric catalog and V1 access-control design; already contains a "Future Phase 2 Enhancements" section listing exactly this work | Append a "V2" section documenting the new services, endpoints, and benchmark source. | Keeps the module's own documentation (which already correctly anticipated this work) accurate and complete. | **None** — documentation only, no runtime effect. |

**Nothing else needs to change.** In particular, `analyticsService.js`, `Metric.js`, `Faculty.js`, `StudentProfile.js`, `requireAnalyticsScope.js`, `analyticsScopes.js`, and `analyticsAccess.js` all remain untouched — V2 is designed specifically so that none of them require edits.

### Files to Create

**Backend — calculation-adjacent, still separate from `analyticsService.js`:**

| File | Responsibility | Depends On |
|---|---|---|
| `server/modules/analytics/services/filterService.js` | Pure functions that turn a raw HTTP query object into a normalized Mongo-filter fragment (e.g. `{ 'employmentDetails.department': 'CS' }`, `{ year: '2024' }` applied to array sub-documents via `$elemMatch`). Knows nothing about roles or scopes — it only translates filters. Composes with (does not replace) the existing `deptFilter` pattern already used in `analytics.js`. | None (pure logic) |
| `server/modules/analytics/services/drilldownService.js` | For a given metric/KPI key + filters, returns the underlying record list (e.g. the actual publication entries, not just the count) with search/sort/pagination applied server-side. Reads the same `Faculty`/`StudentProfile` collections `analyticsService.js` already reads, but returns raw record lists instead of aggregated numbers. | `filterService.js` |
| `server/modules/analytics/data/benchmarkThresholds.js` | Static configuration transcribing the attached University Benchmark manual into a lookup table: `{ metricId: { thresholds: [{min, max, score}], criterion, keyIndicator } }`. Pure data, versionable, no logic. This is the **only** artifact derived from the uploaded benchmark PDF. | None (pure data) |
| `server/modules/analytics/services/benchmarkService.js` | For a computed metric value (from the existing `calculateMetric()`), looks up the matching threshold band in `benchmarkThresholds.js` and returns `{ currentValue, benchmarkValue, gap, status, recommendation }`. Never queries the database directly — always receives an already-computed value as input. | `benchmarkThresholds.js`, output of `analyticsService.js` (passed in, not imported logic) |
| `server/modules/analytics/services/trendService.js` | Computes period-over-period and entity-vs-entity comparisons by calling the existing `calculateMetric()`/filtered queries twice (once per period/entity) and diffing the results. Contains no new data-access patterns beyond what `filterService.js` already enables. | `filterService.js`, `analyticsService.js` (calls, does not modify) |
| `server/modules/analytics/services/recommendationEngine.js` | Pure rule evaluator: takes the outputs of `benchmarkService.js` (and optionally `trendService.js`) and maps them to recommendation text via a declarative rule table (e.g. "status === 'below' → suggest improvement text for that criterion"). No database access at all. | `benchmarkService.js` output (as data, not as an import chain) |
| `server/modules/analytics/services/reportService.js` | Assembles a report payload (department/faculty/publication/funding/research/student/criterion/IQAC/NAAC report "shapes") by composing calls to the existing `analyticsService.js`, plus `benchmarkService.js`/`trendService.js` where relevant. Returns a single structured JSON object per report type — format-agnostic. | `analyticsService.js`, `benchmarkService.js`, `trendService.js` |
| `server/modules/analytics/exporters/pdfExporter.js` | Converts a `reportService.js` JSON payload into a PDF buffer/stream. | `reportService.js` output only |
| `server/modules/analytics/exporters/excelExporter.js` | Converts a `reportService.js` JSON payload into an .xlsx buffer/stream. | `reportService.js` output only |
| `server/modules/analytics/exporters/csvExporter.js` | Converts a `reportService.js` JSON payload (or a drill-down record list) into CSV text. | `reportService.js` / `drilldownService.js` output only |
| `server/modules/analytics/routes/analyticsV2.js` | New router mounted at the same `/api/faculty/analytics` prefix (or a clearly-namespaced `/api/faculty/analytics/v2` prefix — see API Design) exposing drill-down, benchmark, trend, recommendation, and report endpoints. Reuses `auth` + `requireAnalyticsScope` exactly as V1 routes do — **no new permission mechanism is introduced.** | `auth`, `requireAnalyticsScope`, all services above |

**Frontend — additive, no existing component edited:**

| File | Responsibility | Depends On |
|---|---|---|
| `src/lib/analyticsV2Api.ts` | Typed wrapper functions for all new V2 endpoints, following the exact pattern of the existing `analyticsApi.ts` (reuses the shared `api` axios instance — not modified). | `src/lib/api.ts` (read-only usage) |
| `src/components/analytics/FilterBar.tsx` | Renders the filter controls (Academic Year, Department, Faculty, Program, Date Range, Category, Research Area) and emits a filter-state object consumed by whichever chart/table is on screen. | `analyticsV2Api.ts` (for populating filter option lists, e.g. department list) |
| `src/components/analytics/charts/*` (e.g. `TrendLineChart.tsx`, `DepartmentBarChart.tsx`, `CategoryDonutChart.tsx`, `CriterionPieChart.tsx`, `FundingAreaChart.tsx`, `CoverageHeatMap.tsx`) | One small presentational component per chart type (see Visualization section), each taking already-fetched data as props — no direct API calls inside chart components. | Charting library already available in this environment (recharts) |
| `src/pages/analytics/drilldown/DrilldownTable.tsx` | Generic drill-down table component: search box, column sort, pagination, export button — reused across Publications/Faculty/Projects/Funding/Patents drill-downs via configuration props, not five separate components. | `analyticsV2Api.ts` |
| `src/pages/analytics/reports/ReportsPage.tsx` | New page listing available report types per role, with format selection (PDF/Excel/CSV) and a generate/download action. | `analyticsV2Api.ts` |
| `src/pages/analytics/benchmark/BenchmarkPage.tsx` | New page/tab rendering the current-vs-benchmark comparison table (Current Value / Benchmark Value / Gap / Status / Recommendation) per metric. | `analyticsV2Api.ts` |

### Files That Must Not Be Modified

| File / Group | Reason |
|---|---|
| `server/modules/analytics/services/analyticsService.js` | The core calculation engine. V2 must call it, never edit it — every new capability (filters, benchmarks, trends) is layered on top via parameters and post-processing, not by adding role/filter/report logic inside it. |
| `server/modules/analytics/models/Metric.js` | Already has the `criterion` field V2 needs for benchmark mapping. No schema change required (see Database Impact). |
| `server/modules/analytics/permissions/analyticsScopes.js`, `server/modules/analytics/middleware/requireAnalyticsScope.js`, `server/modules/analytics/routes/analyticsAccess.js` | The V1 permission system is complete and correct for V2's needs — every new V2 route reuses this exact mechanism unmodified. Editing it would risk regressing the already-shipped role-based viewing feature. |
| `server/modules/faculty/middleware/auth.js` | Stable, production, depended on by `hod.js`, `vc.js`, `admin.js`, and all V1/V2 analytics routes alike. Reused as-is. |
| `server/models/Faculty.js`, `server/modules/student/models/StudentProfile.js`, `server/auth/models/User.model.js` | Already contain every field V2 needs (`year`, `journalCategory`, `level`, `projectCategory`, `department`, `programLevel`, etc.). No schema changes required. |
| `src/pages/vc/VCDashboard.tsx`, `src/pages/hod/HODDashboard.tsx`, `src/pages/faculty/FacultyDashboard.tsx`, `src/pages/admin/AdminDashboard.tsx` | None of these call the analytics engine today (confirmed again in this review); they require zero changes to remain fully functional. |
| `src/pages/analytics/AnalyticsDashboard.tsx` | The existing V1 dashboard page. V2 should extend it by adding new tabs/sections that call new V2 endpoints, but the existing rendering logic for the 12 V1 endpoints must remain untouched — do not rewrite this file, only append to it (or, preferably, compose it with new sibling components so the diff stays additive). |
| `src/context/AuthContext.tsx`, `src/lib/api.ts` | Already provide identity/token plumbing; V2 reuses both unmodified. |
| Any route/controller/service outside `server/modules/analytics/` and its direct callers (`hod.js`, `vc.js`, `admin.js`, `faculty.js`, student module routes) | Out of scope per explicit instruction; V2 is an Analytics-module-only enhancement. |
| `server/index.js` mounting order for existing routers | Must not be reordered or altered beyond adding one new `app.use()` line for `analyticsV2.js` if it is mounted as its own router (see API Design for the recommended alternative that avoids even this). |

---

## Backend Plan

**Routes.** All V2 endpoints are added as new route registrations, never replacing existing ones. Two viable approaches, in order of preference:

1. **Preferred:** add new `router.get(...)`/`router.post(...)` lines directly to the existing, already-modified `server/modules/faculty/routes/analytics.js` (it already imports `auth` and `requireAnalyticsScope` — reusing the same file avoids a second `app.use()` registration in `server/index.js` and keeps one canonical analytics route file, consistent with "prefer new files" applied to *logic*, while routing stays consolidated since that's the existing pattern).
2. **Alternative:** create `server/modules/analytics/routes/analyticsV2.js` and mount it in `server/index.js` under the same `/api/faculty/analytics` prefix (Express supports multiple routers on one prefix) — this keeps the diff on `analytics.js` at zero, at the cost of one new mount line in `index.js`.

Either way, **every new route uses the identical `auth, requireAnalyticsScope(<key>)` pattern as V1**, with new endpoint keys added to `analyticsScopes.js`'s data (an additive edit to that config object, not a structural change — see note below)*.

*Note: `analyticsScopes.js` is listed under "Files That Must Not Be Modified" for its *mechanism*; adding new endpoint-key rows to its existing config object is the same kind of additive, data-only change already anticipated by its own header comment ("To add a new role or endpoint: add a row/key here only. Nothing else needs to change."). This is the one exception worth flagging explicitly to the implementing agent: **new endpoint keys may be added to the existing tables in `analyticsScopes.js`; the resolver logic itself (`requireAnalyticsScope.js`) must not change.**

**Controllers.** This codebase does not use a separate controller layer anywhere (route handlers act as controllers directly, including in `hod.js`/`vc.js`/`analytics.js`). V2 preserves this convention — new route handlers stay thin, delegating immediately to the new service files.

**Services.** As detailed in "Files to Create": `filterService.js` (query→filter translation), `drilldownService.js` (record lists), `benchmarkService.js` (threshold comparison), `trendService.js` (period/entity comparison), `recommendationEngine.js` (rule evaluation), `reportService.js` (report payload assembly). Each has exactly one responsibility and calls the layer below it, never the layer above.

**Middleware.** No new middleware type is introduced. `auth` and `requireAnalyticsScope` are reused for every new route. The only new "middleware-adjacent" logic is the query-param parsing in `filterService.js`, which is deliberately implemented as a plain function called from within route handlers (not as Express middleware) so it stays trivially unit-testable without a request/response cycle.

**Report Generation.** `reportService.js` produces one canonical JSON shape per report type regardless of output format. `pdfExporter.js`/`excelExporter.js`/`csvExporter.js` are pure transformers of that JSON into bytes — this means adding a new report type later only requires a new "shape" in `reportService.js`, not new exporter code, and adding a new export format later only requires one new exporter file, not changes to every report type.

**Filtering.** Filters are always optional query parameters. Every existing V1 endpoint continues to return its full, unfiltered result when called with no query parameters (preserving current behavior exactly); filters only narrow results when explicitly supplied. `filterService.js` centralizes the translation from query params to Mongo filter fragments so that the same "Department = CS" logic isn't reimplemented differently in five different route handlers (today's `deptFilter` pattern, already duplicated four times in `analytics.js`, is an ideal candidate to be refactored into `filterService.js` as an additive helper the existing routes can optionally adopt — without removing the inline versions if the implementing agent judges that riskier than leaving them alone).

**Exports.** All export endpoints stream a file with an appropriate `Content-Type`/`Content-Disposition` header, reusing the same `auth` + `requireAnalyticsScope` gate as the underlying data endpoint — a role that cannot view a report cannot export it either.

---

## Frontend Plan

**Filters.** A single `FilterBar.tsx` component, rendered once at the top of `AnalyticsDashboard.tsx` (or a new V2 tab within it), exposing controls for Academic Year, Department, Faculty, Program, Date Range, Category, and Research Area. Filter state lives in the page component and is passed down to whichever chart/table/report view is active — no global state store is introduced (consistent with how `VCDashboard.tsx`/`HODDashboard.tsx` already manage local state only). Filter options (department list, faculty list, program list) are populated from existing endpoints (`/analytics/departments`) plus one or two small new list endpoints if needed, not hardcoded.

**Charts.** Rendered via small presentational components, each wrapping the existing charting library already available in this environment (recharts). See "Visualization" below for the chart-to-use-case mapping. Charts receive already-fetched, already-filtered data as props; they perform no data fetching themselves, keeping them trivially reusable and testable.

**Drill-down pages.** A single generic `DrilldownTable.tsx` component configured per KPI (columns, sort keys, export shape) rather than five bespoke pages — reduces duplication and keeps future KPI drill-downs (e.g. a future "Awards" drill-down) a configuration change, not a new component. Each drill-down view supports search, column sort, pagination, and an export button (CSV immediately, PDF/Excel via the shared exporters).

**Navigation.** Two options:
- **Recommended:** keep the existing three routes (`/hod/analytics`, `/vc/analytics`, `/admin/analytics`) exactly as they are, and turn `AnalyticsDashboard.tsx` into a tabbed page (Overview / Benchmark / Trends / Reports) — this requires **zero new routes or nav entries**, only new tab content inside the existing page.
- **Alternative:** add new nav entries/routes for `.../analytics/reports` and `.../analytics/benchmark` if separate pages are preferred for deep-linking. This is a valid additive option but touches `App.tsx`/`AppLayout.tsx` (low risk, but more surface area than the tabbed approach).

**Report pages.** `ReportsPage.tsx` (or a "Reports" tab) lists available report types (filtered by role — e.g. HOD only sees Department/Faculty reports, VC/IQAC/Admin see all), lets the user pick filters + format, and triggers a download via the new export endpoints.

**Export UI.** A consistent small "Export" control (format dropdown + button) reused across drill-down tables and report pages, calling the relevant exporter endpoint and triggering a browser download — no new UI pattern invented, just one reusable component.

**State management.** Local component state (`useState`/`useEffect`) throughout, exactly matching the existing convention in this codebase. No Redux/Zustand/React Query introduced, to avoid adding a new architectural pattern the rest of the app doesn't use.

---

## Database Impact

**No schema changes are required.** This is confirmed by direct inspection, not assumed:

- `Metric.js` already has a `criterion` field and metric IDs already follow NAAC numbering — sufficient to key benchmark lookups off `metricId`/`criterion` without adding a new field.
- `Faculty.js`'s `publicationSchema`, `projectSchema`, and `patentSchema` already carry `year`, `journalCategory`, `level`, `projectCategory`, `status`, `startDate`/`endDate`, `dateOfFiling` — sufficient for Academic Year, Category, Research Area, and Date Range filtering via query-time aggregation, with no new stored fields.
- `employmentDetails.department` (Faculty) and `academic_details.faculty`/`department`/`programLevel` (StudentProfile) already exist — sufficient for Department/Program filtering.
- Benchmark threshold values themselves belong in code/config (`benchmarkThresholds.js`), not the database, because they are a static reference table transcribed from an external manual, not user-generated data — this avoids a migration entirely and makes the thresholds version-controllable and diffable in code review.

**If, later, true persistence is needed** (e.g. saving a generated report for later retrieval, or caching a slow trend calculation), that would warrant a **new, additive collection** (e.g. `analytics_reports` or `analytics_cache`) via a **new model file** — never a modification to `Faculty`, `StudentProfile`, `User`, or `Metric`. This is explicitly out of scope for the initial V2 delivery and should only be considered if a phase's testing reveals a real performance need (see Migration Plan, Phase 7).

---

## API Design

All new endpoints are additive; **no existing endpoint is removed, renamed, or given a breaking response-shape change.**

| Method | Endpoint | Purpose | Scope-gated via |
|---|---|---|---|
| `GET` | `/api/faculty/analytics/dashboard?year=&department=&program=&category=&area=&from=&to=` | Existing endpoint, extended with optional filters | `requireAnalyticsScope('dashboard')` (existing) |
| `GET` | `/api/faculty/analytics/department-performance?...filters` | Existing endpoint, extended with optional filters | existing |
| `GET` | `/api/faculty/analytics/filters/options` | Returns available filter values (departments, programs, categories, research areas, year range) for populating `FilterBar.tsx` | new key, same permission model |
| `GET` | `/api/faculty/analytics/drilldown/:kpi?...filters&search=&sort=&page=&pageSize=` | Record-level list for a given KPI (`publications`, `faculty`, `projects`, `funding`, `patents`) | new key |
| `GET` | `/api/faculty/analytics/drilldown/:kpi/export?format=csv|pdf|excel&...filters` | Export a drill-down list | same key as above |
| `GET` | `/api/faculty/analytics/benchmark?...filters` | Current-vs-benchmark comparison for all (or filtered) metrics | new key |
| `GET` | `/api/faculty/analytics/benchmark/:metricId` | Single-metric benchmark detail | new key |
| `GET` | `/api/faculty/analytics/trend?type=yearOverYear|deptVsDept|facultyVsFaculty|fiveYear&...params` | Trend/comparison computation | new key |
| `GET` | `/api/faculty/analytics/recommendations?...filters` | Rule-evaluated recommendation list | new key |
| `GET` | `/api/faculty/analytics/reports/types` | Lists report types available to the caller's role | new key |
| `POST` | `/api/faculty/analytics/reports/:reportType/generate?format=pdf|excel|csv` | Generates and returns/downloads a report | new key |
| `GET` | `/api/faculty/analytics/my-access` | **Unchanged** — existing V1 endpoint; optionally extended to also list V2 endpoint availability (additive field on the response, not a breaking change) | existing |

Every new endpoint key above must be added to `analyticsScopes.js` (additive rows, per the note in "Backend Plan") before its route is usable — this keeps the exact same enforcement point as every existing endpoint, with no parallel permission system introduced.

---

## Regression Analysis

| Risk | Where it could occur | Mitigation |
|---|---|---|
| Existing analytics responses change shape/values when filters are added | `analytics.js` route handlers | Filters must be strictly optional; every route's no-filter code path must remain byte-identical to today. Add automated/manual before/after comparison for each of the 12 routes called with zero query params. |
| New endpoint keys break `analyticsScopes.js`'s existing lookups | `analyticsScopes.js` | Only add new keys/rows; never rename or remove existing keys (`metrics`, `coverage`, `dashboard`, etc.). Unit test `getScopeLevel()` for all pre-existing role/key pairs after the edit to confirm unchanged output. |
| A V2 route accidentally omits `requireAnalyticsScope` | new route registrations | Code-review checklist item: every new `router.get/post` in the analytics module must include both `auth` and `requireAnalyticsScope(<key>)`, mirroring every existing line in the file. |
| Report/export generation is slow or blocks the event loop | `reportService.js`, exporters | Keep report generation synchronous-but-bounded initially (small dataset, matches current data volumes); revisit only if Phase 7 testing shows latency issues — do not preemptively add a job queue, which would be an architecture change. |
| Benchmark thresholds misattributed to the wrong metric | `benchmarkThresholds.js` | Key strictly by `metricId` (already unique per `Metric.js`'s schema) rather than by fuzzy name matching; cross-check every entry against the attached benchmark manual by criterion number before merging. |
| Frontend V2 tabs/components break the existing V1 dashboard rendering | `AnalyticsDashboard.tsx` | Treat V1's existing render output as a fixed contract: add new tabs/sections as siblings, never restructure the component tree that already renders the 12 V1 views. |
| New routes mounted in `server/index.js` (if the alternative routing approach is used) disturb existing router order | `server/index.js` | Add the new `app.use()` line strictly after all existing ones; do not reorder any existing line. |
| Dead/legacy files (`server/routes/analytics.js`, `server/server.js`, etc., confirmed unused by the live `index.js` entry point) get mistakenly "kept in sync" with V2 changes | anywhere | Explicitly exclude them — they still have zero runtime effect; touching them adds risk for no benefit. |
| Benchmark/trend/recommendation calculations silently diverge from `analyticsService.js`'s numbers due to duplicated logic | new services | New services must always call `calculateMetric()`/existing query helpers rather than re-implementing aggregation logic against `Faculty`/`StudentProfile` directly, so there is exactly one source of truth for every raw number. |

---

## Migration Plan

Each phase is independently deployable and independently testable; the project must remain fully functional after every phase.

### Phase 1 — Filtering Foundation
- **Scope:** Create `filterService.js`. Extend existing V1 route handlers in `analytics.js` to accept optional query parameters, translating them via the new service, with no-filter behavior unchanged.
- **Test:** Call every existing endpoint with no params → response identical to pre-Phase-1. Call with filters → response correctly narrowed.
- **Outcome:** Filtering is available; nothing else in the app is aware anything changed.

### Phase 2 — Filter Options + Frontend Filter Bar
- **Scope:** Add `/filters/options` endpoint. Build `FilterBar.tsx` and wire it into `AnalyticsDashboard.tsx` as a new section, passing filter state into existing V1 API calls (now filter-aware from Phase 1).
- **Test:** Manual QA — selecting filters narrows the existing dashboard views; clearing filters restores full data.
- **Outcome:** Users can filter the existing V1 views. No new charts yet.

### Phase 3 — Visualization
- **Scope:** Add chart components (`TrendLineChart`, `DepartmentBarChart`, `CategoryDonutChart`, `CriterionPieChart`, `FundingAreaChart`, `CoverageHeatMap`). Wire them into `AnalyticsDashboard.tsx` as new tabs/sections consuming existing (now filterable) data.
- **Test:** Visual QA per chart; confirm underlying data matches the existing table/card values for the same filters.
- **Outcome:** Existing data is now visualized, not just tabulated. No backend changes in this phase.

### Phase 4 — Drill-Down
- **Scope:** Create `drilldownService.js` and the `/drilldown/:kpi` endpoint(s). Build `DrilldownTable.tsx` and wire click-through from KPI cards/charts.
- **Test:** Click each KPI → correct filtered record list appears with working search/sort/pagination.
- **Outcome:** Every KPI is explorable at the record level.

### Phase 5 — Benchmark Analysis
- **Scope:** Transcribe the attached University Benchmark manual into `benchmarkThresholds.js`. Create `benchmarkService.js` and the `/benchmark` endpoints. Build `BenchmarkPage.tsx`/tab.
- **Test:** For each of the four currently-seeded metrics (3.4.4, 3.2.2, 3.4.5, 3.2.1) and any others added later, manually verify the computed status/gap against the benchmark manual by hand for at least one known data point.
- **Outcome:** Current-vs-benchmark comparison is live for every existing metric with a matching benchmark entry.

### Phase 6 — Trend Analysis + Recommendation Engine
- **Scope:** Create `trendService.js` (year-over-year, dept-vs-dept, faculty-vs-faculty, five-year trend) and `recommendationEngine.js` (rule table consuming Phase 5's benchmark output plus trend deltas). Add corresponding endpoints and a "Trends"/"Recommendations" tab.
- **Test:** Verify trend deltas against manually computed values for a known two-period dataset; verify recommendation text is triggered only when the corresponding rule condition is actually true.
- **Outcome:** Full comparative and advisory layer is live.

### Phase 7 — Report Generation
- **Scope:** Create `reportService.js` and the three exporters (`pdfExporter.js`, `excelExporter.js`, `csvExporter.js`). Add `/reports/types` and `/reports/:reportType/generate`. Build `ReportsPage.tsx`/tab and the shared Export UI control (also retrofitted onto Phase 4's drill-down tables).
- **Test:** Generate each report type in each format; confirm exported values match the on-screen dashboard/benchmark/trend values for the same filters. Load-test with current data volumes to confirm no timeout issues (see Regression Analysis note on async job queues).
- **Outcome:** Full V2 scope delivered. Re-run the complete regression checklist below across all seven phases' combined surface area before considering V2 complete.

---

## Final Checklist

- [ ] **Phase 1:** Create `server/modules/analytics/services/filterService.js`; extend existing V1 route handlers with optional filter params; confirm zero-param responses are byte-identical to pre-change baseline.
- [ ] **Phase 2:** Add `GET /api/faculty/analytics/filters/options`; create `src/components/analytics/FilterBar.tsx`; wire into `AnalyticsDashboard.tsx` as an additive section.
- [ ] **Phase 3:** Create chart components under `src/components/analytics/charts/`; add chart tabs/sections to `AnalyticsDashboard.tsx`; verify chart values match existing table values for identical filters.
- [ ] **Phase 4:** Create `server/modules/analytics/services/drilldownService.js`; add `GET /api/faculty/analytics/drilldown/:kpi`; create `src/pages/analytics/drilldown/DrilldownTable.tsx`; wire KPI click-through.
- [ ] **Phase 5:** Transcribe the attached benchmark manual into `server/modules/analytics/data/benchmarkThresholds.js`; create `server/modules/analytics/services/benchmarkService.js`; add `GET /api/faculty/analytics/benchmark` and `/benchmark/:metricId`; create `src/pages/analytics/benchmark/BenchmarkPage.tsx`.
- [ ] **Phase 6:** Create `server/modules/analytics/services/trendService.js` and `server/modules/analytics/services/recommendationEngine.js`; add `GET /api/faculty/analytics/trend` and `/recommendations`; add corresponding frontend tab(s).
- [ ] **Phase 7:** Create `server/modules/analytics/services/reportService.js` and `server/modules/analytics/exporters/{pdfExporter,excelExporter,csvExporter}.js`; add `GET /reports/types` and `POST /reports/:reportType/generate`; create `src/pages/analytics/reports/ReportsPage.tsx`; add shared Export UI control.
- [ ] **Permission wiring:** Add every new endpoint key used above as additive rows in `server/modules/analytics/permissions/analyticsScopes.js`; do not modify `requireAnalyticsScope.js` itself.
- [ ] **Regression pass:** Re-verify all 12 original V1 endpoints (no filters) return identical output to the pre-V2 baseline.
- [ ] **Regression pass:** Re-verify `hod.js`, `vc.js`, `admin.js`, `faculty.js`, and student-module routes are untouched (diff against pre-V2 baseline).
- [ ] **Regression pass:** Re-verify `VCDashboard.tsx`, `HODDashboard.tsx`, `AdminDashboard.tsx`, `FacultyDashboard.tsx` render identically to pre-V2 baseline.
- [ ] **Documentation:** Append a "V2" section to `server/modules/analytics/README.md` describing new endpoints, services, and the benchmark data source — additive documentation only.
- [ ] **Final verification:** Confirm `analyticsService.js`, `Metric.js`, `Faculty.js`, `StudentProfile.js`, `analyticsScopes.js`'s resolver logic, and `requireAnalyticsScope.js` contain no modifications beyond the explicitly-permitted additive rows in `analyticsScopes.js`.
