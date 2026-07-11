# ANALYTICS V4 — IMPLEMENTATION DOCUMENT

Source of truth: `ANALYTICS_REVIEW_AND_IMPROVEMENT.md`. This document is execution-only.

## Global Rules
- [ ] Analytics V1 untouched (`server/modules/faculty/routes/analytics.js`, `server/modules/analytics/services/analyticsService.js`'s pre-existing V1 formula cases, `server/modules/analytics/data/benchmarkThresholds.js`)
- [ ] Analytics V2 untouched (`server/modules/analytics/routes/analyticsV2.js`, `server/modules/analytics/services/reportService.js`, `src/components/analytics/FilterBar.tsx` behavior for existing consumers)
- [ ] All new/changed logic lives in Analytics V3 files (`analyticsV3.js`, V3 services, V3 frontend components/pages)
- [ ] Wire existing components before creating new ones
- [ ] Reuse existing services; no duplicate calculation logic
- [ ] Each phase independently buildable and revertible
- [ ] Each phase endable in one session
- [ ] No code in this document — implementation only, written by the executing agent

## Phase Index
1. Remove duplicate debug query (Issue 4)
2. Fix `/dashboard-v3` scope/filter blindness (Issue 3)
3. Fix View Mode applied to invalid formula types (Issue 14)
4. Fix unstable filter object causing spurious refetches (Issue 11)
5. Parallelize `/dashboard-v3` metric loop (Issue 1)
6. Remove redundant Metric/BenchmarkMetric re-lookups (Issues 2, 5)
7. Scope Overview-tab batch fetch to active tab (Issue 10)
8. Cache Metric/BenchmarkMetric reference data (Issue 6)
9. Compute facultyCount/studentCount once per request (Issue 13)
10. Preserve tab state across switches (Issue 7)
11. Deduplicate yearOverYear / currentVsPrevious (Issue 8)
12. Wire Individual Mode (Department Faculty List + Faculty Profile Analytics)
13. HOD-specific dashboard view
14. Fix CriterionPieChart aggregation (7 criteria, not 63 metrics)
15. Wire orphaned charts (Radar, Treemap, Scatter, StackedBar)
16. Wire FilterBarV3 (qualification + experience filters)
17. Consolidate reportService / reportServiceV3 duplication
18. Department ranking view (generic, any metric)
19. View Mode scope-of-effect visibility
20. Shared `scopeFilter()` utility consolidation
21. (Optional/Large) Mongo aggregation rewrite of per-department loops

---

# Phase 1 - Remove Duplicate Debug Query
**Goal:** Eliminate duplicate `countDocuments()` call and debug logs in `studentCount` case.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/analyticsService.js` (V3 additive edit only — do not touch V1 formula cases other than this one block)

**Files Untouched:** Everything else in the module.

**Implementation Tasks:**
- [ ] Locate `case "studentCount"` block
- [ ] Remove the 3 `console.log` lines
- [ ] Remove the second `await StudentProfile.countDocuments()` call used only for logging
- [ ] Keep single `value = await StudentProfile.countDocuments();`

**Verification Checklist:**
- [ ] `studentCount`-type metrics return identical values before/after
- [ ] No console output from this case
- [ ] Only one `countDocuments()` call per `studentCount` metric evaluation (verify via query logging/profiler)

**Regression Risk:** None (dead debug code removal only).

**Rollback Plan:** Re-add removed lines from version control diff.

**Stop Point:** After verification checklist passes.

---

# Phase 2 - Fix `/dashboard-v3` Scope/Filter Blindness
**Goal:** `/dashboard-v3` must apply `req.analyticsScope` + `req.query` filters, matching `/department-performance-v3`'s existing pattern.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/routes/analyticsV3.js` (`/dashboard-v3` handler only)

**Files Untouched:** `/department-performance-v3` (already correct — use as template), all V1/V2 routes.

**Implementation Tasks:**
- [ ] In `/dashboard-v3` handler, build `deptFilter` from `req.analyticsScope` (copy exact pattern from `/department-performance-v3`)
- [ ] Build `userFilter` via `buildFacultyFilter(req.query)`
- [ ] Merge via `mergeFilters(deptFilter, userFilter)`
- [ ] Pass combined filter into every `calculateMetric(metric.metricId, combinedFilter, { viewMode })` call in the loop (replace hardcoded `{}`)

**Verification Checklist:**
- [ ] HOD login → Overview tab shows department-scoped values, not institution-wide
- [ ] VC/Admin login → values unchanged from before this fix (scope resolves to `{}`)
- [ ] Applying a Department/Year/Category filter on Overview tab changes KPI card values
- [ ] No change to `/dashboard` (V1) or `/benchmark` (V2) responses

**Regression Risk:** Low — mirrors an already-proven pattern in the same file.

**Rollback Plan:** Revert `combinedFilter` back to `{}` in the `calculateMetric` calls.

**Stop Point:** After HOD vs VC scoping verified with seeded stratified data (CS/ECE/MBA).

---

# Phase 3 - Fix View Mode Applied to Invalid Formula Types
**Goal:** Skip View Mode normalization for `percentage`, `metricPercentage`, `ratio` formula types (per `FORMULA_VIEW_MODES` in `metricsCatalogService.js`).

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/analyticsService.js` (`calculateMetric`'s viewMode normalization block only)

**Files Untouched:** `metricsCatalogService.js` (read-only reference for the check), all formula-type `case` blocks above the normalization step.

**Implementation Tasks:**
- [ ] Import/reference `FORMULA_VIEW_MODES` (or replicate the disallowed-formula-type list: `percentage`, `metricPercentage`, `ratio`)
- [ ] Before applying `perFaculty`/`percentage`/`perStudent` normalization, check if `metric.formulaType` is in the disallowed set
- [ ] If disallowed: skip normalization, return absolute value unchanged
- [ ] If disallowed and viewMode ≠ absolute: add a response flag (e.g., `normalizationSkipped: true`) so frontend can indicate "N/A for this view"

**Verification Checklist:**
- [ ] A `metricPercentage`/`percentage`/`ratio` metric returns identical value across all 4 View Modes
- [ ] A `count`/`sum`/`conditionalCount`/`average` metric still normalizes correctly per View Mode
- [ ] Response includes `normalizationSkipped` flag where applicable

**Regression Risk:** Low — additive guard clause only.

**Rollback Plan:** Remove the guard clause; restore unconditional normalization.

**Stop Point:** After confirming no ratio/percentage-type metric changes value across View Modes.

---

# Phase 4 - Fix Unstable Filter Object Reference
**Goal:** Eliminate spurious refetches on Benchmark/Comparisons tabs caused by inline `{...filters, viewMode}` object creation.

**Files Created:** None

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (memoize combined filter object; update `BenchmarkPage`/`ComparisonPanel` prop passing)
- `src/pages/analytics/benchmark/BenchmarkPage.tsx` (accept `filters` + `viewMode` as separate props, OR accept memoized combined object — pick one approach and apply consistently)
- `src/pages/analytics/comparisons/ComparisonPanel.tsx` (same as above)

**Files Untouched:** `DrilldownTable.tsx` (already receives stable `filters` reference), `ReportsPage.tsx`.

**Implementation Tasks:**
- [ ] In `AnalyticsDashboard.tsx`, wrap `{ ...filters, viewMode }` in `useMemo(() => ({ ...filters, viewMode }), [filters, viewMode])`
- [ ] Pass the memoized object to `BenchmarkPage` and `ComparisonPanel`
- [ ] Confirm `BenchmarkPage`'s `useEffect([filters])` and `ComparisonPanel`'s `useEffect([selectedMetric, filters])` now only fire on actual value changes

**Verification Checklist:**
- [ ] Opening/closing the Drilldown panel on Charts tab does NOT trigger Benchmark/Comparisons refetch (confirm via network tab, if those tabs were previously mounted)
- [ ] Changing an actual filter value still triggers exactly one refetch per affected tab
- [ ] No duplicate network requests on unrelated parent re-renders

**Regression Risk:** Low — memoization is behavior-preserving for actual filter changes.

**Rollback Plan:** Remove `useMemo`, revert to inline spread.

**Stop Point:** After confirming zero spurious refetches via browser network tab during unrelated state changes.

---

# Phase 5 - Parallelize `/dashboard-v3` Metric Loop
**Goal:** Replace sequential `for...of` + `await` loop with parallel `Promise.all`.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/routes/analyticsV3.js` (`/dashboard-v3` handler only)

**Files Untouched:** `/dashboard` (V1, sequential loop preserved — do not touch).

**Implementation Tasks:**
- [ ] Replace `for (const metric of metrics) { await calculateMetric(...) }` with `await Promise.all(metrics.map(metric => calculateMetric(metric.metricId, combinedFilter, { viewMode })))`
- [ ] Confirm response array order is preserved (Promise.all preserves order — no extra sorting needed)

**Verification Checklist:**
- [ ] `/dashboard-v3` response identical (same metrics, same values, same order) before/after
- [ ] Measured response time reduced (compare before/after wall-clock time with ~63 seeded metrics)
- [ ] No unhandled promise rejections if one metric calculation fails (wrap individual calls in `.catch()` returning null/fallback, filter nulls if needed)

**Regression Risk:** Low-Medium — verify error handling for individual metric failures doesn't crash the whole batch.

**Rollback Plan:** Revert to `for...of` loop.

**Stop Point:** After response-time improvement confirmed and error handling verified.

---

# Phase 6 - Remove Redundant Metric/BenchmarkMetric Re-lookups
**Goal:** Stop re-fetching documents already held in memory by batch callers.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/analyticsService.js` (add `calculateMetricFromDoc(metricDoc, filter, options)` internal function; have `calculateMetric` call it after its own lookup)
- `server/modules/analytics/routes/analyticsV3.js` (`/dashboard-v3` uses `calculateMetricFromDoc` with already-fetched `metrics` array)
- `server/modules/analytics/services/benchmarkService.js` (refactor `getMetricBenchmark` into `evaluateBenchmarkDoc(doc, scope, query)` + thin wrapper; `getAllBenchmarks` calls `evaluateBenchmarkDoc` directly on already-fetched `docs`)

**Files Untouched:** V1 `/dashboard` route, V2 `/benchmark` route signatures (must remain callable identically), `getMetricBenchmark`/`getAllBenchmarks` exported function signatures (unchanged, internals only).

**Implementation Tasks:**
- [ ] Export `calculateMetricFromDoc` from `analyticsService.js` alongside existing `calculateMetric`
- [ ] `calculateMetric(metricId, filter, options)` becomes: fetch doc, then delegate to `calculateMetricFromDoc(doc, filter, options)`
- [ ] Update `/dashboard-v3` to call `calculateMetricFromDoc` directly with the already-fetched `metric` object (skip redundant `Metric.findOne`)
- [ ] In `benchmarkService.js`, extract `evaluateBenchmarkDoc(doc, scope, query)` containing all logic currently in `getMetricBenchmark` after its `BenchmarkMetric.findOne` call
- [ ] `getMetricBenchmark(metricId, scope, query)` becomes: fetch doc, delegate to `evaluateBenchmarkDoc`
- [ ] `getAllBenchmarks` calls `evaluateBenchmarkDoc(doc, scope, query)` directly on each already-fetched `docs` entry (no per-item `findOne`)

**Verification Checklist:**
- [ ] `calculateMetric()` still works standalone (single-metric callers unaffected — check V1 routes)
- [ ] `getMetricBenchmark()` still works standalone (single-metric callers unaffected — check V2 `/benchmark/:metricId`)
- [ ] `/dashboard-v3` and `/benchmark` (V2) produce identical output to before this phase
- [ ] Query count reduced (verify via DB query logging: expect ~50% fewer `Metric`/`BenchmarkMetric` lookups in batch endpoints)

**Regression Risk:** Medium — touches a shared function used by V1 and V2 callers; requires careful signature preservation.

**Rollback Plan:** Revert `analyticsService.js` and `benchmarkService.js` to pre-phase versions; re-point `/dashboard-v3` to `calculateMetric`.

**Stop Point:** After confirming V1 `/dashboard`, V2 `/benchmark`, and V3 `/dashboard-v3` all produce unchanged output with fewer queries.

---

# Phase 7 - Scope Overview-Tab Batch Fetch to Active Tab
**Goal:** Filter/View Mode changes while on non-Overview tabs must not trigger the 8-endpoint Overview batch fetch.

**Files Created:** None

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (fetch effect logic)

**Files Untouched:** `BenchmarkPage.tsx`, `ComparisonPanel.tsx`, `ReportsPage.tsx`, `DrilldownTable.tsx` (already self-fetch independently — no change needed).

**Implementation Tasks:**
- [ ] Add `activeTab` to the fetch effect's condition: only run the 8-endpoint `Promise.all` batch when `activeTab === 'overview'` (or `'charts'`, if Charts tab still depends on `deptPerf`/`coverage`/`dashboard` state — confirm dependency first)
- [ ] Ensure switching INTO Overview/Charts tab (if data not yet loaded for current filters/viewMode) triggers the fetch at that point
- [ ] Ensure filters/viewMode changes while already on Overview/Charts still refetch as before

**Verification Checklist:**
- [ ] Changing a filter while on Reports/Benchmark/Comparisons tab does NOT fire Overview-batch network requests
- [ ] Switching to Overview/Charts tab after such a change loads correct filtered data
- [ ] No stale data shown on Overview/Charts after a filter change made while on another tab, once user navigates back

**Regression Risk:** Medium — must ensure Overview data isn't permanently stale after off-tab filter changes.

**Rollback Plan:** Remove `activeTab` condition; restore unconditional fetch on `[filters, viewMode]`.

**Stop Point:** After confirming both no-wasted-fetch and no-stale-data behavior.

---

# Phase 8 - Cache Metric/BenchmarkMetric Reference Data
**Goal:** In-memory cache for near-static `Metric` and `BenchmarkMetric` collections.

**Files Created:**
- `server/modules/analytics/services/referenceDataCache.js` (new shared cache module)

**Files Modified:**
- `server/modules/analytics/services/analyticsService.js` (use cache for `Metric.findOne`/`Metric.find`)
- `server/modules/analytics/services/benchmarkService.js` (use cache for `BenchmarkMetric.find`/`findOne`)
- `server/modules/analytics/services/metricsCatalogService.js` (use cache for `Metric.find`)
- `server/seeders/analyticsV3MetricSeeder.js` (invalidate cache after seeding, if process is long-running during seed)
- `server/seeders/benchmarkSeeder.js` (same, if applicable)

**Files Untouched:** V1 route files, V2 route files (consume the same services but require no direct changes).

**Implementation Tasks:**
- [ ] Create `referenceDataCache.js` with `getMetrics()`, `getMetric(metricId)`, `getBenchmarkMetrics()`, `getBenchmarkMetric(metricId)` — each backed by an in-memory cache with TTL (few minutes) or load-once-at-startup + manual invalidation
- [ ] Add `invalidate()` export for seeders to call after writes
- [ ] Replace direct `Metric.find()`/`Metric.findOne()` calls in `analyticsService.js`/`metricsCatalogService.js` with cache calls
- [ ] Replace direct `BenchmarkMetric.find()`/`findOne()` calls in `benchmarkService.js` with cache calls

**Verification Checklist:**
- [ ] All existing endpoints (V1/V2/V3) return identical data after caching introduced
- [ ] Re-running a seeder and immediately querying reflects new/changed metrics (cache invalidation works)
- [ ] Reduced DB query count confirmed via profiler on repeat requests within TTL window

**Regression Risk:** Medium — stale-cache risk if invalidation is missed after manual DB edits outside seeders.

**Rollback Plan:** Revert service files to direct Mongoose calls; delete cache module.

**Stop Point:** After confirming cache correctness (fresh data after reseed) and query-count reduction.

---

# Phase 9 - Compute facultyCount/studentCount Once Per Request
**Goal:** Remove per-metric redundant count queries during View Mode normalization.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/analyticsService.js` (`calculateMetric`/`calculateMetricFromDoc` — accept optional precomputed counts)
- `server/modules/analytics/routes/analyticsV3.js` (`/dashboard-v3` — compute `facultyCount`/`studentCount` once, pass to each `calculateMetricFromDoc` call)

**Files Untouched:** V1 `/dashboard` (unaffected — doesn't use viewMode).

**Implementation Tasks:**
- [ ] Add optional `precomputedCounts: { facultyCount?, studentCount? }` to `options` param of `calculateMetricFromDoc`
- [ ] In normalization block, use `precomputedCounts` if provided; else fall back to existing per-call query (preserves backward compatibility for other callers)
- [ ] In `/dashboard-v3`, compute `facultyCount`/`studentCount` once (respecting combined filter) before the `Promise.all` loop, pass into every call

**Verification Checklist:**
- [ ] `/dashboard-v3` output unchanged for all View Modes
- [ ] Query count for a non-absolute View Mode load drops from ~1-per-metric to 1 total (plus the batch metric queries)
- [ ] Other callers of `calculateMetric` without precomputed counts still work unchanged

**Regression Risk:** Low — additive optional parameter, backward compatible.

**Rollback Plan:** Remove `precomputedCounts` param usage; revert to per-call counting.

**Stop Point:** After confirming query-count reduction for View Mode switches.

---

# Phase 10 - Preserve Tab State Across Switches
**Goal:** Stop discarding fetched state when switching tabs; avoid refetch on tab revisit within a session.

**Files Created:** None (or one shared cache hook if chosen approach requires it — see tasks)

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (render all tab bodies, toggle visibility via CSS instead of conditional mount; OR introduce shared per-tab data cache keyed by filters+viewMode)

**Files Untouched:** Internal logic of `BenchmarkPage.tsx`, `ComparisonPanel.tsx`, `ReportsPage.tsx`, `DrilldownTable.tsx` (only their mount/unmount lifecycle changes, not their fetch logic).

**Implementation Tasks:**
- [ ] Choose approach: (a) render all 5 tab bodies simultaneously, hide inactive ones via `display: none`, or (b) add a lightweight cache (e.g., `useRef` map keyed by `${tab}-${JSON.stringify(filters)}-${viewMode}`) storing last-fetched result per tab
- [ ] Implement chosen approach
- [ ] Ensure hidden/cached tabs still refetch when filters/viewMode actually change

**Verification Checklist:**
- [ ] Switching Overview → Benchmark → Overview → Benchmark does not refetch Benchmark data twice for identical filters
- [ ] Changing filters while a tab is hidden/cached correctly invalidates its stale cached data before next display
- [ ] No memory leak from keeping all tabs mounted (if approach (a) chosen) — verify acceptable

**Regression Risk:** Medium — approach (a) changes component lifecycle broadly; approach (b) adds cache-invalidation complexity.

**Rollback Plan:** Revert to conditional `{activeTab === 'x' && <Component/>}` rendering.

**Stop Point:** After confirming no redundant refetches on tab revisit and correct invalidation on filter change.

---

# Phase 11 - Deduplicate yearOverYear / currentVsPrevious
**Goal:** `currentVsPreviousTrend` reuses `yearOverYearTrend`'s computed series instead of recomputing.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/trendService.js` (`currentVsPreviousTrend`, `getTrend` dispatch logic)
- `src/pages/analytics/comparisons/ComparisonPanel.tsx` (if request shape changes — confirm no change needed if backend contract stays the same)

**Files Untouched:** `yearOverYearTrend`, `deptVsDeptTrend`, `facultyVsFacultyTrend`, `fiveYearTrend` signatures.

**Implementation Tasks:**
- [ ] Compute a single `yearOverYearTrend` call covering the years needed for both "Year Over Year" display and "Current vs Previous" (use 5-year window, extract last 2 data points for current-vs-previous)
- [ ] Derive `currentVsPreviousTrend`'s return shape from the already-computed series' last two entries instead of calling `yearOverYearTrend` again
- [ ] If `ComparisonPanel` issues both requests separately, consider consolidating into one backend call returning both shapes (optional — only if low risk)

**Verification Checklist:**
- [ ] `currentVsPrevious` response values identical before/after
- [ ] Confirm only one `Faculty.find()` scan occurs per Comparisons-tab load (was two)
- [ ] `yearOverYear` standalone requests unaffected

**Regression Risk:** Low-Medium — verify year-window edge cases (e.g., fewer than 2 years of data).

**Rollback Plan:** Revert `currentVsPreviousTrend` to independent `yearOverYearTrend` call.

**Stop Point:** After confirming single-scan behavior and unchanged output values.

---

# Phase 12 - Wire Individual Mode (Department Faculty List + Faculty Profile Analytics)
**Goal:** Expose already-built, scope-enforced backend (`facultyProfileAnalyticsService.js`) via new frontend pages and a dashboard tab.

**Files Created:**
- `src/pages/analytics/individual/DepartmentFacultyList.tsx`
- `src/pages/analytics/individual/FacultyProfileAnalytics.tsx`

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (add `'individual'` to `activeTab` union and tab bar; render `DepartmentFacultyList`/`FacultyProfileAnalytics` with drill-in navigation between them)

**Files Untouched:**
- `server/modules/analytics/services/facultyProfileAnalyticsService.js` (already correct — no backend changes)
- `server/modules/analytics/routes/analyticsV3.js` (`/drilldown/department/:deptName/faculty`, `/faculty/:facultyId/profile-analytics` routes already exist)
- `src/lib/analyticsV3Api.ts` (`getDepartmentFacultyList`, `getFacultyProfileAnalytics` already exist)

**Implementation Tasks:**
- [ ] `DepartmentFacultyList.tsx`: call `getDepartmentFacultyList(deptName, filters)`, render sortable table (name, designation, completion%, headline KPIs), row click → navigate to `FacultyProfileAnalytics` for that faculty
- [ ] `FacultyProfileAnalytics.tsx`: call `getFacultyProfileAnalytics(facultyId)`, render grouped metrics (`metrics` object by group), section completion list, back-to-list navigation
- [ ] Add `'individual'` tab to `AnalyticsDashboard.tsx` tab bar and conditional render block
- [ ] For HOD scope: default department to HOD's own department (from `access.department`), skip department picker
- [ ] For VC/Admin/IQAC scope: show department picker before listing faculty

**Verification Checklist:**
- [ ] HOD can view own department's faculty list and drill into any faculty in that department
- [ ] HOD cannot view another department's faculty list or drill into out-of-department faculty (403 surfaced correctly in UI)
- [ ] VC/Admin can view any department's faculty list and any faculty's profile
- [ ] Faculty profile view shows all metric groups (research/development/profile/extension/other) with correct values
- [ ] Section completion list matches actual faculty data

**Regression Risk:** Low — purely additive new pages/tab; no existing tab/route logic changed.

**Rollback Plan:** Remove `'individual'` tab entry and new page files; no backend rollback needed (untouched).

**Stop Point:** After HOD scope-enforcement and VC full-access both verified end-to-end.

---

# Phase 13 - HOD-Specific Dashboard View
**Goal:** Distinct HOD information architecture, reusing existing endpoints, not a filtered VC view.

**Files Created:**
- `src/pages/analytics/hod/HODAnalyticsView.tsx`

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (conditionally render `HODAnalyticsView` instead of the standard tab set when `access.role === 'hod'`, OR route-level split — confirm approach with existing `access` state already available)

**Files Untouched:** VC/Admin/IQAC rendering path (standard tab set unchanged), all backend services (compose existing endpoints only).

**Implementation Tasks:**
- [ ] Build `HODAnalyticsView.tsx` composing: Pending/Incomplete Profiles list (sort `getDepartmentFacultyList` by completion ascending), Faculty Performance table (reuse Phase 12's `DepartmentFacultyList` table), Individual drill-in (reuse Phase 12's `FacultyProfileAnalytics`), Department vs University Average (reuse `ComparisonPanel`'s existing comparison functions, default department to HOD's own), Qualification/Experience distribution (new small chart using existing filter-options experience/qualification data), Department Benchmark summary (reuse existing `BenchmarkPage`, already department-scoped), Administrative/Workload counts (surface existing dark metrics: `adminResponsibilities`, `departmentalCharges`, `specialAssignments` via metrics catalogue)
- [ ] In `AnalyticsDashboard.tsx`, branch rendering: if `access.role === 'hod'` (or `access.scopeLevel === 'department'`), render `HODAnalyticsView`; else render existing tab set unchanged

**Verification Checklist:**
- [ ] HOD login renders `HODAnalyticsView`, not the standard 6-tab layout
- [ ] VC/Admin/IQAC login unaffected — standard tab set renders exactly as before this phase
- [ ] All HOD view sections load correctly scoped to HOD's own department
- [ ] No dept-vs-dept comparison chart or university-wide student breakdown shown to HOD

**Regression Risk:** Low-Medium — branching logic in a shared component; verify VC/Admin path unaffected.

**Rollback Plan:** Remove role branch; all roles fall back to standard tab set.

**Stop Point:** After confirming HOD and non-HOD paths both render correctly with no cross-contamination.

---

# Phase 14 - Fix CriterionPieChart Aggregation
**Goal:** Aggregate by 7 NAAC criteria instead of charting all ~63 individual metrics.

**Files Created:** None

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (data preparation before passing to `CriterionPieChart`)
- `src/components/analytics/charts/CriterionPieChart.tsx` (only if input shape needs adjusting — prefer pre-aggregating in the dashboard and keeping the chart component unchanged if possible)

**Files Untouched:** `metricsCatalogService.js` (`criterionNumber` already available per metric).

**Implementation Tasks:**
- [ ] Before rendering `CriterionPieChart`, group `dashboard` metrics by `criterionNumber` (via catalogue lookup or metric metadata already present in response) and sum values per criterion (1–7)
- [ ] Pass the 7-entry aggregated array to `CriterionPieChart` instead of the raw ~63-entry `dashboard` array
- [ ] Label slices "Criterion 1 — Curricular Aspects" etc.

**Verification Checklist:**
- [ ] Pie chart shows ≤7 slices with distinct colors, readable legend
- [ ] Slice values sum correctly to each criterion's total
- [ ] No individual-metric-level pie chart remains showing 60+ slices anywhere

**Regression Risk:** Low — presentation-layer aggregation only.

**Rollback Plan:** Revert to passing raw `dashboard` array.

**Stop Point:** After visual confirmation of readable legend with real seeded data.

---

# Phase 15 - Wire Orphaned Charts (Radar, Treemap, Scatter, StackedBar)
**Goal:** Connect existing unused chart components to real data per review's chart-mapping table.

**Files Created:** None (components already exist)

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` or `HODAnalyticsView.tsx`/individual-mode pages (wherever each chart's target metric lives) — add usages of:
  - `RadarProfileChart.tsx` → multi-axis faculty/department profile (research/teaching/admin/extension), likely in `FacultyProfileAnalytics.tsx` (Phase 12) or department summary view
  - `HierarchyTreemap.tsx` → university→department→faculty size comparison, likely replacing/augmenting Charts tab
  - `CorrelationScatterChart.tsx` → experience-years vs publication-count, likely a new "Insights" section on Charts tab or HOD view
  - `StackedBarChart.tsx` → publication-type mix per department, Charts tab

**Files Untouched:** The chart component files themselves (already correct — wiring only, no component logic changes unless a prop mismatch is found).

**Implementation Tasks:**
- [ ] Confirm each chart component's expected prop shape by inspecting its existing (unused) implementation
- [ ] For each chart, identify or add the data-fetching call needed to supply that shape (reuse existing endpoints: `getMetricsCatalogue`, `getFacultyProfileAnalytics`, `getDepartmentPerformanceV3`, etc. — do not create new backend endpoints unless no existing endpoint supplies the needed shape)
- [ ] Add each chart to its target page with a `SectionHeading`
- [ ] If a needed data shape doesn't exist yet (e.g., publication-type breakdown per department), extend an existing service function additively rather than creating a new one, per Global Rules

**Verification Checklist:**
- [ ] Radar chart renders on faculty profile view with correct multi-axis values
- [ ] Treemap renders department/faculty size comparison correctly
- [ ] Scatter chart renders experience-vs-publications with correct data points
- [ ] StackedBar renders publication-type mix per department
- [ ] No existing chart or tab broken by these additions

**Regression Risk:** Low — additive chart placements; risk is limited to any new data-shaping code added.

**Rollback Plan:** Remove new chart usages; components remain in codebase unused as before.

**Stop Point:** After all 4 charts confirmed rendering correctly with real/seeded data.

---

# Phase 16 - Wire FilterBarV3
**Goal:** Replace live `FilterBar` (V2) with `FilterBarV3` (qualification + experience-range filters) in the V3 dashboard.

**Files Created:** None (`FilterBarV3.tsx` already exists)

**Files Modified:**
- `src/pages/analytics/AnalyticsDashboard.tsx` (import `FilterBarV3` instead of `FilterBar`)

**Files Untouched:**
- `src/components/analytics/FilterBar.tsx` (V2 — must remain untouched and available for any other consumer)
- `src/lib/analyticsV2Api.ts` `getFilterOptions` (V2 — untouched)

**Implementation Tasks:**
- [ ] Confirm `FilterBarV3`'s prop contract matches (`value`, `onChange`) or adapt call site
- [ ] Confirm `FilterBarV3` calls `getFilterOptionsV3` (with `?v3=true`) internally — verify, don't modify unless broken
- [ ] Replace `<FilterBar .../>` with `<FilterBarV3 .../>` in `AnalyticsDashboard.tsx`
- [ ] Remove now-unused `FilterBar` import from `AnalyticsDashboard.tsx` (file itself stays untouched)

**Verification Checklist:**
- [ ] All V2 filter dimensions still present and functional in `FilterBarV3`
- [ ] Qualification and Experience Range filters now visible and functional
- [ ] Selecting qualification/experience filters correctly changes filtered results across tabs
- [ ] No other page/component that still imports V2 `FilterBar` is affected

**Regression Risk:** Low — swap is isolated to one import + one JSX usage in one file.

**Rollback Plan:** Revert import back to `FilterBar`.

**Stop Point:** After confirming full filter parity plus new fields working end-to-end.

---

# Phase 17 - Consolidate reportService / reportServiceV3 Duplication
**Goal:** Single extensible report registry; eliminate duplicate generator functions.

**Files Created:** None

**Files Modified:**
- `server/modules/analytics/services/reportService.js` — **only if** Global Rule "V2 untouched" allows additive exports; otherwise treat as read-only reference and do NOT modify (see task note below)
- `server/modules/analytics/services/reportServiceV3.js` (primary target of consolidation)
- `server/modules/analytics/routes/analyticsV3.js` (`/reports-v3/*` routes — update require paths only if generator source moves)

**Files Untouched:** `server/modules/analytics/routes/analyticsV2.js`, V2 `/reports/*` endpoints and their behavior (must remain byte-identical).

**Implementation Tasks:**
- [ ] **Decision point:** Because V2 must remain untouched, do NOT edit `reportService.js`. Instead, have `reportServiceV3.js` import and reuse V2's existing generator functions (`facultyProfileReport`, `departmentSummaryReport`, `researchOutputReport`, `projectsReport`, `patentsReport`, `benchmarkReport`) by importing them from `reportService.js` rather than redefining them
- [ ] Confirm V2's generator functions are exported (add exports in `reportService.js` only if not already exported — this is additive, not a behavior change, and does not alter any existing V2 endpoint output)
- [ ] `reportServiceV3.js`'s `GENERATORS` map: reuse imported V2 functions for the 6 shared report types; keep only `awards`/`books` (and any other genuinely V3-only types) as locally-defined generators
- [ ] Remove the duplicated function bodies from `reportServiceV3.js` for the 6 shared types

**Verification Checklist:**
- [ ] V2 `/reports/:type/generate` output unchanged for all 6 original types
- [ ] V3 `/reports-v3/:type/generate` output unchanged for all 8 types (6 reused + awards + books)
- [ ] No duplicate generator function bodies remain across the two files for shared types
- [ ] A hypothetical future fix to a shared generator (e.g., `departmentSummaryReport`) now only requires editing one place

**Regression Risk:** Medium — touches the V2 file's export surface; must confirm this is additive-only and doesn't alter any existing V2 route behavior.

**Rollback Plan:** Revert `reportServiceV3.js` to its duplicated-body version; revert any added exports in `reportService.js`.

**Stop Point:** After confirming byte-identical V2 report output and correct V3 report output using shared generators.

---

# Phase 18 - Department Ranking View (Generic, Any Metric)
**Goal:** Rank all departments by any selected metric, with Absolute/Per-Faculty toggle and higher/lower-is-better awareness.

**Files Created:**
- `src/pages/analytics/rankings/DepartmentRankingView.tsx`

**Files Modified:**
- `server/modules/analytics/models/Metric.js` (add optional `direction` field: `'higherIsBetter' | 'lowerIsBetter'`, default `'higherIsBetter'`)
- `server/modules/analytics/models/BenchmarkMetric.js` (same optional `direction` field)
- `server/modules/analytics/routes/analyticsV3.js` (new route: `GET /rankings/:metricId` — generic "all departments, absolute or normalized value, sorted by direction")
- `server/modules/analytics/permissions/analyticsScopes.js` (add `rankings` endpoint key for relevant roles)
- `src/lib/analyticsV3Api.ts` (add `getDepartmentRanking(metricId, filters)` wrapper)
- `src/pages/analytics/AnalyticsDashboard.tsx` (add ranking view entry point, e.g., within Comparisons tab or a new sub-tab)

**Files Untouched:** `benchmarkService.getAllDepartmentsBenchmark` (reused for benchmark-aware ranking, not modified), V1/V2 files.

**Implementation Tasks:**
- [ ] Add `direction` field to `Metric`/`BenchmarkMetric` schemas (default `'higherIsBetter'` to preserve current implicit assumption for existing documents)
- [ ] New route `/rankings/:metricId`: for each department, compute absolute value (reuse `calculateMetricFromDoc`/`calculateMetric` with department filter) and per-faculty value; sort descending or ascending per `direction`
- [ ] `DepartmentRankingView.tsx`: metric picker (reuse `getMetricsCatalogue`), Absolute/Per-Faculty toggle (reuse `ViewModeSelector` pattern or a simpler 2-way toggle), ranked table with best/weakest highlighted
- [ ] Register `rankings` scope key for `hod` (own department shown in context of full ranking, read-only), `vc`/`iqac_director`/`admin`/`superadmin` (full ranking)

**Verification Checklist:**
- [ ] Ranking correctly sorts descending for "higher is better" metrics, ascending for "lower is better" metrics
- [ ] Absolute vs Per-Faculty toggle produces different orderings where department sizes differ (verify with seeded CS/ECE/MBA data)
- [ ] HOD sees full ranking (read-only) but cannot drill into other departments' faculty lists from this view (respects Phase 12's scope enforcement)
- [ ] Existing `Metric`/`BenchmarkMetric` documents without `direction` set default correctly to `'higherIsBetter'` with no crash

**Regression Risk:** Low-Medium — schema addition is optional/additive; verify no existing query assumes `direction` absence means something else.

**Rollback Plan:** Remove new route, new page, revert schema field additions (safe since optional and unused elsewhere).

**Stop Point:** After confirming correct ranking direction and Absolute/Per-Faculty toggle behavior.

---

# Phase 19 - View Mode Scope-of-Effect Visibility
**Goal:** Make it visible to the user which tabs/views View Mode actually affects.

**Files Created:** None

**Files Modified:**
- `src/components/analytics/ViewModeSelector.tsx` (accept a `disabled`/`inactive` prop or tooltip explaining scope)
- `src/pages/analytics/AnalyticsDashboard.tsx` (pass tab-aware disabled/label state to `ViewModeSelector` based on `activeTab`)

**Files Untouched:** Backend View Mode logic (Phases 3 and 9 already fixed correctness; this phase is UI-only).

**Implementation Tasks:**
- [ ] Define per-tab View Mode applicability: Overview/Individual = fully applies (post Phase 3 fix); Department Performance = applies to 4 of 6 fields (flag this nuance or fix the remaining 2 fields as a follow-up); Benchmark = should NOT apply (confirm decision from review: benchmark comparisons should stay absolute per NAAC manual semantics) — if adopted, stop sending `viewMode` to benchmark calls and grey out selector on Benchmark tab; Comparisons = wire up per Phase 9-style fix, or grey out if deferred; Reports/Drilldown/Rankings = not applicable, grey out
- [ ] Update `ViewModeSelector` to show disabled state + short label ("Not applicable on this tab") when `activeTab` is in the not-applicable set
- [ ] If Benchmark is decided to be View-Mode-immune (recommended per review), remove `viewMode` from the query params sent to `getBenchmarks`

**Verification Checklist:**
- [ ] View Mode selector visibly disabled/labeled on tabs where it has no effect
- [ ] View Mode selector fully functional on tabs where it does apply
- [ ] Benchmark tab values no longer change when View Mode is switched (if that design decision is adopted)

**Regression Risk:** Low — UI-only changes plus one query-param removal.

**Rollback Plan:** Revert `ViewModeSelector` to always-enabled; restore `viewMode` param to benchmark calls if removed.

**Stop Point:** After confirming selector state accurately reflects backend behavior on every tab.

---

# Phase 20 - Shared `scopeFilter()` Utility Consolidation
**Goal:** Single shared implementation of `scopeFilter(scope)`, replacing 5 duplicated copies.

**Files Created:**
- `server/modules/analytics/services/scopeFilterUtil.js`

**Files Modified:**
- `server/modules/analytics/routes/analyticsV3.js` (import shared util, remove local copy)
- `server/modules/analytics/services/benchmarkService.js` (same)
- `server/modules/analytics/services/trendService.js` (same)
- `server/modules/analytics/services/drilldownService.js` (same)
- `server/modules/analytics/services/reportServiceV3.js` (same)

**Files Untouched:** V1 files, V2 `reportService.js` (if it also has a local copy, leave it — V2 untouched), `analyticsV2.js`.

**Implementation Tasks:**
- [ ] Create `scopeFilterUtil.js` exporting `scopeFilter(scope)` with the exact existing logic (`{ 'employmentDetails.department': scope.department }` when `scope.level === 'department' && scope.department`, else `{}`)
- [ ] Replace each of the 5 local definitions with an import from the shared util
- [ ] Confirm no behavioral difference (logic is identical across all 5 current copies per the review)

**Verification Checklist:**
- [ ] All 5 consuming files produce identical scope-filtering behavior after the swap
- [ ] Full regression pass across V3 endpoints (dashboard-v3, department-performance-v3, benchmark/*, trend, drilldown/*, reports-v3/*)

**Regression Risk:** Low — pure refactor, logic unchanged.

**Rollback Plan:** Revert each file to its local `scopeFilter` definition; delete shared util.

**Stop Point:** After confirming no behavior change across all consuming endpoints.

---

# Phase 21 - (Optional/Large) Mongo Aggregation Rewrite of Per-Department Loops
**Goal:** Replace repeated per-department `calculateMetric` loops (in `/department-performance-v3`, `departmentSummaryReport`, `getAllDepartmentsBenchmark`) with Mongo aggregation pipelines.

**Files Created:**
- `server/modules/analytics/services/departmentAggregationService.js`

**Files Modified:**
- `server/modules/analytics/routes/analyticsV3.js` (`/department-performance-v3` uses new service)
- `server/modules/analytics/services/reportServiceV3.js` (`departmentSummaryReport` uses new service)
- `server/modules/analytics/services/benchmarkService.js` (`getAllDepartmentsBenchmark` uses new service where applicable)

**Files Untouched:** V1/V2 files; `facultyProfileAnalyticsService.js` (already efficient single-document pattern — do not change).

**Implementation Tasks:**
- [ ] Design a single aggregation pipeline (`$match` scope/filter → `$group` by department → `$sum`/`$avg` per metric field) covering the metrics currently computed per-department (publications, projects, patents, funding, faculty count, avg completion)
- [ ] Implement `computeMetricsAcrossDepartments(metricIds, filter)` in the new service using this pipeline
- [ ] Migrate the 3 call sites to use this shared function instead of their individual loops
- [ ] Extend pipeline coverage incrementally if additional metrics are needed beyond the initial 6

**Verification Checklist:**
- [ ] Output identical to pre-migration per-department loop results for all 3 call sites
- [ ] Single aggregation query per request instead of N queries per department
- [ ] Response time improved measurably at current data scale, and verified to scale better under larger seeded data volumes

**Regression Risk:** High — most invasive phase; touches core calculation approach for department-level data across 3 call sites.

**Rollback Plan:** Revert each of the 3 call sites to its original per-department loop; keep new service file unused/removed.

**Stop Point:** After full regression pass confirms identical output across all 3 call sites, with measured performance improvement.
