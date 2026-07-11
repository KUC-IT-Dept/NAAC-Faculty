# ANALYTICS V3 — IMPLEMENTATION SPECIFICATION

**Target system:** NAAC-Faculty (ProfCV) — unified faculty/student profile & IQAC analytics platform
**Prepared for:** Implementation by an autonomous coding agent (Kiro)
**Prepared from:** Full static analysis of the uploaded source tree (`NAAC-Faculty-main`)
**Status of current system:** Stable, in production use. Analytics V1 and Analytics V2 already exist and are live.
**Mandate:** Enhance the Analytics module into a full Decision Support / BI / Reporting system for Higher Authorities (HOD, VC, IQAC Director, Admin). **Do not redesign, refactor, or touch anything outside the Analytics module and its direct, additive integration points.**

---

## 0. How This Document Is Organized

1. Ground rules this spec (and any implementation of it) must obey
2. As-is analysis of the real codebase — architecture, auth, data, existing analytics
3. Gap analysis — precisely what V2 does *not* yet do, including two functional bugs
4. Complete metric catalogue — every metric derivable from the actual schema, not a generic list
5. Analytics design — Absolute / Normalized / Individual (drill-down) modes
6. Filter system design
7. Comparison modes design
8. Visualization/chart recommendations, metric by metric
9. Report generation design
10. Benchmark comparison layer (redesign to fix real scoping defects)
11. AI-ready recommendation layer (forward-looking placeholder, not implemented now)
12. File analysis: Modify / Create / Must-Not-Touch, each with a reason
13. API design: new endpoints, all additive and backward compatible
14. Implementation phases
15. Final developer checklist

Everything in this document is grounded in the actual files in the repository — file paths, field names, and existing behavior are quoted from source, not assumed.

---

## 1. Ground Rules (Non-Negotiable)

These rules apply to whichever agent implements this spec:

1. **No redesign.** The current system is stable and in production. V3 is a pure *addition* on top of V1 + V2.
2. **Additive-only backend.** New services, new routes, new models, new seeders. Existing files (`analyticsService.js`, `Metric.js`, `Faculty.js` models, V1/V2 routes, dashboards) must not be edited unless explicitly listed in §12.1 with a justification and a guarantee of backward compatibility.
3. **Byte-identical V1/V2 behavior.** Every existing endpoint must return exactly what it returns today when called with the same parameters. New query parameters must be optional and default to current behavior when omitted.
4. **No new business logic duplicated.** Analytics only *derives* from Faculty / StudentProfile / Department / BenchmarkMetric / Metric — it must never become a second source of truth for faculty data.
5. **Prefer new files over modifying existing ones.** When a capability must attach to an existing file (e.g., mounting a new router in `server/index.js`), make the smallest possible one-line addition and nothing else.
6. **Every phase must leave the system deployable.** No phase may leave the server unable to boot or the existing Analytics tabs unable to render.
7. **Role/scope model is reused, not replaced.** All new endpoints go through the existing `auth` → `requireAnalyticsScope(key)` chain and the existing `analyticsScopes.js` single-source-of-truth table.

---

## 2. As-Is Analysis

### 2.1 High-Level Architecture

This is a single Node/Express + MongoDB/Mongoose backend (`server/index.js`) serving a React 19 + TypeScript + Vite frontend (`src/`), organized as two "modules": `faculty` and `student`, plus a shared `analytics` module and a shared `auth` module.

**Live backend entry point:** `server/index.js` (run via `npm start` → `node index.js`, confirmed in `server/package.json`). This is the only file that matters for routing/mounting.

**Dead/legacy files that must be ignored and never modified or treated as live:**
- `server/server.js` — a 25-line standalone Express app with only a multer `/upload` route and its own `app.listen(5000, ...)`. It is not required anywhere and not started by any npm script. Confirmed dead code.
- `server/routes/*.js` (top-level, e.g. `server/routes/analytics.js`) — an older duplicate of `server/modules/faculty/routes/*.js`. The top-level `server/routes/analytics.js` has **no auth middleware at all** and duplicate `console.log` debug statements — it is not mounted in `server/index.js` (only `server/modules/faculty/routes/*` are required there). Confirmed dead code, but **do not delete it** (out of scope — deletion is a modification of stable-system footprint that was not requested).

Mounted routers (from `server/index.js`, faculty side):
```
/api/faculty/auth        → modules/faculty/routes/auth.js
/api/faculty/admin       → modules/faculty/routes/admin.js
/api/faculty/me          → modules/faculty/routes/faculty.js
/api/faculty/public      → modules/faculty/routes/public.js
/api/faculty/upload      → modules/faculty/routes/upload.js
/api/faculty/departments → modules/faculty/routes/departments.js
/api/faculty/directory   → modules/faculty/routes/directory.js
/api/faculty/vc          → modules/faculty/routes/vc.js
/api/faculty/hod         → modules/faculty/routes/hod.js
/api/faculty/analytics   → modules/faculty/routes/analytics.js        (V1, 12 endpoints)
/api/faculty/analytics   → modules/analytics/routes/analyticsAccess.js (my-access)
/api/faculty/analytics   → modules/analytics/routes/analyticsV2.js    (V2, 9 endpoints)
```
All three analytics routers are mounted on the same `/api/faculty/analytics` prefix — this is the existing pattern V3 must continue.

### 2.2 Authentication & Authorization

- Central identity: `server/auth/models/User.model.js`, roles from `server/auth/constants/roles.js`:
  `student, faculty, hod, vc, iqac_director, staff, superadmin` (plus `admin`, used throughout the analytics scope table alongside `superadmin`).
- Request-level auth for the faculty module: `server/modules/faculty/middleware/auth.js` — verifies JWT, loads `req.user` from `User` model. No department-injection logic here; `req.user.department` is read directly off the stored user document.
- **Analytics-specific authorization is a separate, well-isolated layer** — this is the most reusable part of the existing system and V3 must plug into it exactly as-is:
  - `server/modules/analytics/permissions/analyticsScopes.js` — single source of truth mapping `role → endpointKey → scopeLevel` (`self | department | university | institution | full`).
  - `server/modules/analytics/middleware/requireAnalyticsScope.js` — factory middleware; reads the table, attaches `req.analyticsScope = { level, department, userId }`, or 403s.
  - `server/modules/analytics/routes/analyticsAccess.js` — `GET /api/faculty/analytics/my-access`, tells the frontend which endpoints the caller may use. `AnalyticsDashboard.tsx` calls this first and conditionally renders/loads sections — **this pattern must be preserved and extended, not replaced.**

**Important existing gap:** `iqac_director` has full scope entries in `analyticsScopes.js` (equal to `vc`, but with its own `institution` scope level) **but there is no frontend route for this role at all.** `src/App.tsx`'s `ProtectedRoute` type is `'admin' | 'faculty' | 'vc' | 'hod'` only — `iqac_director` and `staff` cannot reach `/*/analytics` today because there is no `/iqac/*` route tree, login redirect, or dashboard shell for them. This is a real gap directly relevant to the stated primary objective ("for Higher Authorities") and is addressed in §12.2 and §14.

### 2.3 Data Models (source of truth for the metric catalogue in §4)

**`server/models/Faculty.js` and `server/modules/faculty/models/Faculty.js` are byte-identical** (verified via diff) — both are used by different parts of the codebase; analytics services import the `modules/faculty/models/Faculty` copy. Do not consolidate these — out of scope, and duplication is already a tolerated existing state.

The Faculty schema (`facultySchema`) has 24 top-level sections. Every array-typed section is a rich source of metrics; nearly all of it is **currently unused by analytics**:

| Section (schema field) | Type | Currently used by analytics? |
|---|---|---|
| `personalInfo` | object | No |
| `qualifications[]` | array | No |
| `eligibilityTests[]` | array | No |
| `employmentDetails` | object | Partially (`department`, `designation`) |
| `workExperience[]` | array | No |
| `publications[]` | array | Yes (count only) |
| `awards[]` | array | **No** |
| `projects[]` | array | Yes (count + `amountSanctioned` sum) |
| `patents[]` | array | Yes (count only) |
| `researchGuidance` (object with `studentDetails[]`) | object/array | **No** |
| `adminResponsibilities[]` | array | No |
| `fdpWorkshops[]` | array | **No** |
| `onlineCourses[]` | array | **No** |
| `memberships[]` | array | **No** |
| `internationalExperience[]` | array | **No** |
| `qualityAssurance[]` | array | **No** |
| `departmentalCharges[]` | array | No |
| `specialAssignments[]` | array | No |
| `extraInstitutionalActivities[]` | array | No |
| `adminNonAcademicResponsibilities[]` | array | No |
| `academicAdministration[]` | array | No |
| `researchAndInnovation[]` | array | No |
| `examinationAndEvaluation[]` | array | No |
| `administrativeSupport[]` | array | No |
| `documents` | object (URL map) | No |
| `completionPercentage`, `profileComplete` | scalar | Yes |

This confirms the task brief's premise directly: **publications, projects, patents are the only research metrics currently wired into analytics.** Awards, patents-by-status breakdowns, books-vs-journals-vs-chapters breakdowns, PhD/M.Phil guidance counts, FDP/workshop participation, memberships, international experience, and all seven "administrative/extension" section arrays are completely dark to analytics today, despite being fully captured in the data model. §4 catalogues all of these.

**`server/modules/student/models/StudentProfile.js`** — large schema (`academic_details`, `personal_details`, `contact_details`, `health_details`, `family_details`, `education_details`, plus more not fully enumerated here). Analytics currently reads only `academic_details.faculty` (for "department") and `academic_details.programLevel`, plus a naive whole-document field-completion percentage in `getStudentProfileCompletion()`.

**Naming mismatch to be aware of (do not silently "fix" — document and design around it):** Faculty department lives at `employmentDetails.department` (free-text string). Student department lives at `academic_details.faculty` (also free text, doc comment implies it may hold a department name) and there is a **separate** `academic_details.department` field in the same schema. Because both are freeform strings entered independently, a student-faculty ratio computed by joining on these strings is only as reliable as manual data-entry consistency. V3 must treat this as a soft join and make the caveat visible in the UI (see §4.10, §5.3).

**`server/models/Department.js`** — `{ name, hod, createdBy }` only. No campus, no target/quota fields, no strength target. Confirms "Department Strength" and "Campus" filters from the brief are not natively modeled; V3 must derive department strength as *faculty headcount* (computed from Faculty records) and campus filtering can only be added if a `campus` field exists somewhere — it does not, in `employmentDetails` or elsewhere. **Campus filter is therefore deferred** (see §6, §14 Phase 8 note) rather than fabricated.

**`server/modules/analytics/models/Metric.js`** — a dynamic, DB-driven metric definition. Currently only 4 documents are seeded/used in practice (per `server/modules/analytics/README.md`): `3.4.4` (publications, count), `3.2.2` (projects, count), `3.4.5` (patents, count), `3.2.1` (funding, sum via `amountSanctioned`). Supported `formulaType`s already implemented in `analyticsService.calculateMetric()`: `count`, `sum`, `conditionalCount`, `objectSum`, `percentage`, `ratio`, `facultyCount`, `studentCount`, `studentConditionalCount`, `studentExists`, `metricPercentage`. **This means the calculation engine already supports far more than 4 metrics — it is simply not fed more `Metric` documents.** This is the single highest-leverage gap: most of the new metrics in §4 require zero new calculation code, only new `Metric` seed documents plus (where the formula type needs a field that doesn't exist yet, e.g. counting by sub-document condition) reuse of `conditionalCount`, which is already implemented and already supports exactly this (`fieldPath` + `conditionField` + `conditionValue`).

**`server/modules/analytics/models/BenchmarkMetric.js`** and **`server/seeders/benchmarkSeeder.js`** — 44 real NAAC metrics are seeded from the University Benchmark Manual PDF (`University_Benchmarks (2)-2.pdf`, present in the repo root), spanning Criteria 1–7, each with full 5-band (0–4) scoring thresholds. **Only 4 of these 44 have `computedField` set** (`3.2.1`, `3.2.2`, `3.4.4`, `3.4.5` — same four as above). The other 40 benchmark metrics exist in the database with real NAAC thresholds but return `currentValue: null` forever, because nothing computes them. This is the second-highest-leverage gap.

### 2.4 Analytics Module Inventory (files that exist today)

```
server/modules/analytics/
  permissions/analyticsScopes.js         role → endpoint → scope table
  middleware/requireAnalyticsScope.js    scope-attaching middleware
  services/analyticsService.js           calculateMetric() engine + student helpers
  services/filterService.js              query → Mongo filter fragment builders
  services/drilldownService.js           publications/projects/patents/faculty row lists
  services/trendService.js               yearOverYear / deptVsDept / facultyVsFaculty / fiveYear
  services/benchmarkService.js           threshold evaluation against BenchmarkMetric docs
  services/recommendationEngine.js       pure rule evaluator over benchmark output
  services/reportService.js              6 report types → {title, rows}
  exporters/csvExporter.js               papaparse-based CSV
  exporters/excelExporter.js             xlsx-based .xlsx buffer
  exporters/pdfExporter.js               pdfkit-based .pdf buffer
  models/Metric.js                       dynamic metric definitions (4 seeded)
  models/BenchmarkMetric.js              NAAC threshold bands (44 seeded)
  data/benchmarkThresholds.js            legacy static thresholds (superseded by BenchmarkMetric, kept for compat)
  routes/analyticsAccess.js              GET /my-access
  routes/analyticsV2.js                  9 V2 endpoints (all lazily require their service via tryRequire)
```
```
server/modules/faculty/routes/analytics.js   12 V1 endpoints (metrics/coverage/metric/dashboard/
                                              profile-completion/profile-summary/departments/
                                              department-performance/4 student-* endpoints)
```
```
src/
  lib/analyticsApi.ts        typed V1 wrappers
  lib/analyticsV2Api.ts      typed V2 wrappers + AnalyticsFilters type
  pages/analytics/AnalyticsDashboard.tsx      tabs: overview / charts / benchmark / reports
  pages/analytics/drilldown/DrilldownTable.tsx
  pages/analytics/benchmark/BenchmarkPage.tsx
  pages/analytics/reports/ReportsPage.tsx
  components/analytics/FilterBar.tsx
  components/analytics/charts/DepartmentBarChart.tsx
  components/analytics/charts/TrendLineChart.tsx
  components/analytics/charts/FundingAreaChart.tsx
  components/analytics/charts/CoverageHeatMap.tsx
  components/analytics/charts/CategoryDonutChart.tsx
  components/analytics/charts/CriterionPieChart.tsx
```
Routes mounted for: `/hod/analytics`, `/vc/analytics`, `/admin/analytics` (all render the same `AnalyticsDashboard`). **No `/iqac/analytics` route exists.**

Chart library: `recharts@3.1.0` is already a frontend dependency — it natively supports `BarChart`, `LineChart`, `AreaChart`, `PieChart` (donut via `innerRadius`), `RadarChart`, `Treemap`, `ScatterChart`, and `RadialBarChart` (usable as a gauge). **No new chart library needs to be installed** for any chart type requested in the brief (§8 confirms mapping).

Backend export libraries already installed: `papaparse`, `xlsx`, `pdfkit` — sufficient for CSV/Excel/PDF across all new report types; no new dependency needed.

### 2.5 Seeded Data Characteristics (important for anyone testing V3)

`server/seeders/analyticsDataSeeder.js` deliberately stratifies three departments — Computer Science (above benchmark), Electronics & Communication (near benchmark), Business Administration (below benchmark) — across 5 academic years, specifically so that benchmark/trend/report features have meaningfully differentiated data to display. Any new metric added in V3 should, where reasonable, extend this seeder (additively) so newly-surfaced metrics (awards, FDP, research guidance, memberships, international experience) also have differentiated demo data, otherwise new charts will render as flat zero lines even though the code works correctly. This is called out explicitly in the phased checklist (§15).

---

## 3. Gap Analysis — V2 → V3

This is the concrete difference between what exists today and the brief's requirements. Every later section of this document exists to close one or more of these gaps.

| # | Gap | Evidence | Addressed in |
|---|---|---|---|
| G1 | Only 3 of 24 Faculty data sections feed analytics (publications, projects, patents) | §2.3 table | §4 (full catalogue), §14 Phase 2 |
| G2 | Only 4 of 44 seeded NAAC benchmark metrics have live values | `benchmarkSeeder.js` grep: 40× `computedField: null` | §10, §14 Phase 5 |
| G3 | **Benchmark values are not scope-filtered** — `benchmarkService.getMetricBenchmark()` calls `calculateMetric(doc.computedField)` with no scope/filter argument at all, and `analyticsService.calculateMetric()` takes only `metricId` — it always queries the *entire* Faculty collection. An HOD viewing "Benchmark" today sees institution-wide numbers, not their department's numbers, even though the UI implies a department-scoped view. | `analyticsService.js` L6 signature `calculateMetric(metricId)`; `benchmarkService.js` L93 `calculateMetric(doc.computedField)` — no scope passed | §10.2 (fix), §14 Phase 5 |
| G4 | No department-vs-university-average or faculty-vs-department-average comparison exists anywhere (only dept-vs-dept and faculty-vs-faculty *rankings*, not average deltas) | `trendService.js` — only 4 trend types, none is an average-delta comparison | §7, §14 Phase 6 |
| G5 | No "individual mode" drill-down: click department → faculty list (exists, `drilldown/faculty`) → click one faculty → **complete cross-category analytics for that person** (does not exist; drilldown only returns flat profile-completion rows, not an aggregated multi-metric profile) | `drilldownService.js` `getFacultyDrilldown()` returns only `department/designation/appointment/completion`, no publication/project/patent/award counts per person | §5.3, §12.2, §14 Phase 3 |
| G6 | Report catalogue covers 6 types; brief requests Department, Faculty, Research, Publication, Funding, Patent, Student, IQAC, Criterion, NAAC, University, Benchmark reports (12 named types) | `reportService.js` `REPORT_TYPES` array, 6 entries | §9, §14 Phase 7 |
| G7 | No percentage/normalized "per faculty" metrics anywhere in the API (publications-per-faculty, funding-per-faculty, etc. must currently be computed client-side, if at all — they are not computed server-side) | No division/ratio metric currently seeded in `Metric` collection besides the unused `ratio`/`metricPercentage` formula types | §4.11, §5.2 |
| G8 | `iqac_director` role has full backend scope config but **no frontend route exists** to reach analytics at all | `App.tsx` `ProtectedRoute` role union + route list — no `iqac` path | §12.2, §14 Phase 8 |
| G9 | Filters cover only: department, designation, publication year/category/level/type, project category/status/agency/date-range, patent status, program, studentDept. Brief requests additionally: Faculty (single-select drilldown, exists via search), Qualification, Experience, Campus, Academic Year (exists implicitly via `year`/`from`/`to` but no single canonical "Academic Year" dropdown), Research Area (does not exist as a field — nearest proxy is `journalCategory`/`projectCategory`) | `filterService.js` `buildFacultyFilter()` | §6, §14 Phase 4 |
| G10 | No AI/recommendation layer beyond the existing rule-based `recommendationEngine.js` (which only reads already-computed benchmark gaps) — brief explicitly marks this "(future)" | `recommendationEngine.js` | §11 (architecture only, not implemented) |
| G11 | No treemap / radar / scatter / gauge charts exist yet, though `recharts` supports all of them | `components/analytics/charts/*` — only bar/line/area/donut/pie/heatmap-as-cards exist | §8, §14 Phase 6 |
| G12 | Export exists for drilldown rows and generated reports, but not for the Overview tab's raw dashboard/coverage/department-performance tables, nor for any new normalized/individual views | `analyticsV2.js` — export only wired to `/drilldown/:kpi/export` and `/reports/:reportType/generate` | §9.4 |

---

## 4. Complete Metric Catalogue

Every metric below is derivable from fields that **actually exist** in the current schema (§2.3). Each entry lists: proposed `metricId`, source field path, proposed `formulaType` (reusing the existing engine — see §2.3), and which NAAC criterion it plausibly maps to (for report/criterion grouping in §9). Metrics already live are marked ✅; net-new are marked 🆕.

### 4.1 Publications (Faculty.publications[])
| metricId | Description | fieldPath / condition | formulaType | Status |
|---|---|---|---|---|
| `3.4.4` | Total publications | `publications` | count | ✅ live |
| `3.4.4.journal` | Journal articles only | `publications`, condition `type = Journal Articles` | conditionalCount | 🆕 |
| `3.4.4.bookchapter` | Book chapters | `publications`, condition `type = Book Chapters` | conditionalCount | 🆕 |
| `3.4.5_books` | Books authored/edited | `publications`, condition `type = Books Authored / Edited` | conditionalCount | 🆕 (already has a benchmark placeholder `3.4.5_books`, no computedField yet — see G2) |
| `3.4.3` | Conference papers | `publications`, condition `type = Conference Papers` | conditionalCount | 🆕 |
| `pub.scopus` | Scopus-indexed publications | `publications`, condition `indexedIn = Scopus` | conditionalCount | 🆕 |
| `pub.wos` | Web of Science-indexed | `publications`, condition `indexedIn = WoS` | conditionalCount | 🆕 |
| `pub.ugccare` | UGC-CARE indexed | `publications`, condition `indexedIn = UGC Care` | conditionalCount | 🆕 |
| `pub.international` | International-level publications | `publications`, condition `level = International` | conditionalCount | 🆕 |
| `pub.national` | National-level publications | `publications`, condition `level = National` | conditionalCount | 🆕 |
| `pub.peerreviewed` | Peer-reviewed publications | `publications`, condition `peerReviewed = Yes` | conditionalCount | 🆕 |
| `pub.avgimpactfactor` | Average impact factor | `publications.impactFactor` | 🆕 aggregation (new formulaType `average`, see §4.12) | 🆕 |

### 4.2 Research Projects & Funding (Faculty.projects[])
| metricId | Description | fieldPath / condition | formulaType | Status |
|---|---|---|---|---|
| `3.2.2` | Total projects | `projects` | count | ✅ live |
| `3.2.1` | Total funding sanctioned | `projects.amountSanctioned` | sum | ✅ live |
| `proj.ongoing` | Ongoing projects | `projects`, condition `status = Ongoing` | conditionalCount | 🆕 |
| `proj.completed` | Completed projects | `projects`, condition `status = Completed` | conditionalCount | 🆕 |
| `proj.major` | Major projects | `projects`, condition `projectCategory = Major` | conditionalCount | 🆕 |
| `proj.minor` | Minor projects | `projects`, condition `projectCategory = Minor` | conditionalCount | 🆕 |
| `proj.international` | International-funded projects | `projects`, condition `projectCategory = International` | conditionalCount | 🆕 |
| `proj.pi` | Projects as Principal Investigator | `projects`, condition `role = PI` | conditionalCount | 🆕 |
| `proj.byagency.<agency>` | Funding by agency (SERB/DST/UGC/AICTE/ICMR/DBT/Industry) | `projects`, condition `fundingAgency = <agency>` | conditionalCount / sum | 🆕 |

### 4.3 Patents (Faculty.patents[])
| metricId | Description | fieldPath / condition | formulaType | Status |
|---|---|---|---|---|
| `3.4.5` | Total patents | `patents` | count | ✅ live |
| `patent.filed` | Filed | `patents`, condition `status = Filed` | conditionalCount | 🆕 |
| `patent.published` | Published | `patents`, condition `status = Published` | conditionalCount | 🆕 |
| `patent.granted` | Granted | `patents`, condition `status = Granted` | conditionalCount | 🆕 |

### 4.4 Awards (Faculty.awards[]) — currently completely dark
| metricId | Description | fieldPath / condition | formulaType | Status |
|---|---|---|---|---|
| `awards.total` | Total awards | `awards` | count | 🆕 |
| `awards.international` | International-level awards | `awards`, condition `level = International` | conditionalCount | 🆕 |
| `awards.national` | National-level awards | `awards`, condition `level = National` | conditionalCount | 🆕 |
| `awards.state` | State-level awards | `awards`, condition `level = State` | conditionalCount | 🆕 |

### 4.5 Research Guidance / PhD & M.Phil (Faculty.researchGuidance)
This is an *object* with both scalar string counters and a `studentDetails[]` array — needs care in formula design.
| metricId | Description | fieldPath / condition | formulaType | Status |
|---|---|---|---|---|
| `phd.completed` | PhD scholars guided to completion | `researchGuidance.phdCompleted` | objectSum (numeric string) | 🆕 |
| `phd.inprogress` | PhD scholars currently guided | `researchGuidance.phdInProgress` | objectSum | 🆕 |
| `mphil.completed` | M.Phil completed | `researchGuidance.mphilCompleted` | objectSum | 🆕 |
| `mphil.inprogress` | M.Phil in progress | `researchGuidance.mphilInProgress` | objectSum | 🆕 |
| `pg.supervised` | PG projects supervised | `researchGuidance.pgProjectsSupervised` | objectSum | 🆕 |
| `guides.count` | Number of faculty who are recognized PhD guides (>0 in either PhD field) | derived — count of Faculty where `phdCompleted` or `phdInProgress` > 0 | 🆕 new formulaType `existsNumericGtZero` (or reuse `conditionalCount` with a `$ne: '0'` style condition) | 🆕 |

### 4.6 FDP / Workshops / Seminars (Faculty.fdpWorkshops[]) — currently dark
| metricId | Description | fieldPath / condition | formulaType |
|---|---|---|---|
| `fdp.total` | Total FDP/workshop participations | `fdpWorkshops` | count |
| `fdp.online` | Online mode | `fdpWorkshops`, condition `mode = Online` | conditionalCount |
| `fdp.offline` | Offline/in-person mode | `fdpWorkshops`, condition `mode = Offline` | conditionalCount |

### 4.7 Online Courses & Certifications (Faculty.onlineCourses[]) — dark
| metricId | Description | fieldPath | formulaType |
|---|---|---|---|
| `courses.total` | Total certifications | `onlineCourses` | count |

### 4.8 Memberships (Faculty.memberships[]) — dark
| metricId | Description | fieldPath / condition | formulaType |
|---|---|---|---|
| `membership.total` | Total professional memberships | `memberships` | count |
| `membership.life` | Life memberships | `memberships`, condition `membershipType = Life` | conditionalCount |

### 4.9 International Experience (Faculty.internationalExperience[]) — dark
| metricId | Description | fieldPath / condition | formulaType |
|---|---|---|---|
| `intl.total` | Total international engagements | `internationalExperience` | count |
| `intl.research` | For research purpose | `internationalExperience`, condition `purpose = Research` | conditionalCount |

### 4.10 Extension, Administration & Quality Assurance (7 array sections) — all dark
`adminResponsibilities`, `departmentalCharges`, `specialAssignments`, `extraInstitutionalActivities`, `adminNonAcademicResponsibilities`, `academicAdministration`, `researchAndInnovation`, `examinationAndEvaluation`, `administrativeSupport`, `qualityAssurance` — each becomes a simple `count` metric (`admin.total`, `deptcharges.total`, `specialassign.total`, `extrainst.total`, `adminnonacad.total`, `acadadmin.total`, `researchinnov.total`, `examseval.total`, `adminsupport.total`, `qa.total`). These map to NAAC Criteria 5, 6, and 7 (Student Support/Governance/Institutional Values & Extension) and are currently 100% invisible to Higher Authorities despite faculty filling them in. Low implementation cost (all `count` formulaType, already supported), high completeness value.

### 4.11 Faculty Profile / Qualification / Experience (Faculty.qualifications[], eligibilityTests[], employmentDetails, workExperience[])
| metricId | Description | fieldPath / condition | formulaType |
|---|---|---|---|
| `qual.phdholders` | Faculty holding a PhD | `qualifications`, condition `degreeLevel = Ph.D` | conditionalCount (per-faculty existence, not per-entry — see §4.12 note on faculty-level vs entry-level conditional counts) |
| `qual.netset` | Faculty with NET/SET/GATE qualification | `eligibilityTests`, condition `examName in [NET, SET, GATE]` | conditionalCount |
| `emp.byDesignation.<designation>` | Faculty count by designation | `employmentDetails.designation` | distinct + count (existing `/departments` pattern, generalized) |
| `emp.byAppointment.<type>` | Faculty by nature of appointment (Regular/Ad-hoc/Contract/Guest) | `employmentDetails.natureOfAppointment` | distinct + count |
| `emp.avgExperience` | Average total experience (years) | `employmentDetails.totalExperienceYears` | average (new formulaType, §4.12) |
| `emp.retirementPipeline` | Faculty retiring within N years | `employmentDetails.dateOfRetirement` | date-window count (new, computed in a dedicated service function rather than the generic engine — dates are free-text strings, not real Date types, so this must be a defensive parser) |

### 4.12 Profile Completion (existing, extend grouping only)
`completionPercentage` (✅ live, per-faculty) — already aggregated as department average. V3 adds: completion-percentage **distribution buckets** (0–25/26–50/51–75/76–100%) for a KPI-card / gauge view, and **section-level completion** (which of the 24 sections are empty vs filled per faculty) — this second one is genuinely new logic (not a simple engine formula) and belongs in a dedicated service function, not a `Metric` document (see §12.1, new file `profileCompletionDetailService.js`).

**New formula types required in `analyticsService.calculateMetric()`** (additive `case` branches only — the existing `switch` statement is extended, never restructured):
- `average` — mean of a numeric-ish string field across matching sub-documents or faculty (needed for `pub.avgimpactfactor`, `emp.avgExperience`).
- `distinctGroupCount` — generalizes the bespoke logic already hand-written in `/departments` and `/department-performance` (group-by a field, count per group) so it can be reused for `emp.byDesignation`, `emp.byAppointment`, and future group-bys without copy-pasting the reduce loop a third time. This is a **refactor-safe addition**: it does not change what `/departments` or `/department-performance` return (those routes are untouched — §12.1), it just gives *new* metrics the same capability through the generic engine instead of hand-rolled code.

### 4.13 Derived / Normalized (Percentage Mode) Metrics
These are **ratios of two already-computable metrics** and should use the existing `ratio` or `metricPercentage` formulaType (already implemented, currently unused):
- Publications per faculty = `3.4.4` ÷ `facultyCount`
- Projects per faculty = `3.2.2` ÷ `facultyCount`
- Funding per faculty (₹) = `3.2.1` ÷ `facultyCount`
- Patents per faculty = `3.4.5` ÷ `facultyCount`
- PhD guides per faculty = `phd.inprogress` ÷ `facultyCount`
- % faculty with PhD = `metricPercentage(qual.phdholders, facultyCount)`
- % profile completion ≥ 80% = `metricPercentage(count where completionPercentage≥80, facultyCount)`
- Target achievement % = `currentValue ÷ benchmarkValue × 100` for any benchmarked metric (computed in `benchmarkService`, not the generic engine — it already returns `gap`; V3 adds `achievementPercent` alongside it, see §10.1)

### 4.14 Student-Side Metrics (StudentProfile — existing 3 + new)
Existing: total students, students by department (`getStudentDepartments`), by program level (`getProgramLevels`), profile completion summary.
New, still derivable from the current schema without adding fields:
- Students by admission category (`academic_details.admissionCategory`)
- Students by mode of study (`academic_details.modeOfStudy`)
- Student-Faculty ratio per department — **caveated join**, see §2.3; implement as `studentCount(dept) ÷ facultyCount(dept)` where `dept` match is a case-insensitive trim comparison, and surface a "data consistency" badge in the UI when the two department name sets don't fully overlap (computed once at request time, cheap).

### 4.15 Metrics Explicitly Not Implementable Without New Fields (documented, not fabricated)
The brief mentions several categories that **do not exist in the current schema** and must not be faked:
- **Citation Count, H-index, Google Scholar/Scopus live sync** — `personalInfo.orcidId/googleScholarId/scopusId` exist only as *ID strings*, no citation data is stored or fetched. Out of scope for V3 (would require a new external API integration — flagged as a V4/future candidate, not built here).
- **Placement data** — no placement fields exist anywhere in `StudentProfile` or `Faculty`. Out of scope.
- **MoUs, Community Service, Extension (as a distinct metric)** — partially covered by `extraInstitutionalActivities[]` and `qualityAssurance[]` (§4.10) but no dedicated "MoU" field exists. The closest proxy (`extraInstitutionalActivities`, `administrativeCharge` field) is used and clearly labeled as a proxy, not invented as new schema.
- **Campus filter** — no `campus` field exists on Faculty or Department (§2.3). Deferred.

---

## 5. Analytics Design — Three Modes

### 5.1 Absolute Mode
Direct aggregate counts/sums, exactly like today's `department-performance` endpoint but generalized across the full metric catalogue in §4. Implementation: a new `metricsCatalogService.js` exposes a registry of all §4 metric definitions (mirrors, and is seeded into, the `Metric` collection) and a single endpoint `GET /analytics/v3/metrics/catalogue` lists them with category tags for the frontend to build a metric picker. Absolute values reuse `calculateMetric()` unchanged.

### 5.2 Percentage / Normalized Mode
A dedicated service (`normalizedMetricsService.js`) wraps pairs of absolute metrics (numerator/denominator) using the existing `ratio`/`metricPercentage` formula types (§4.13). Every normalized metric definition explicitly names its numerator and denominator metricIds so the UI can show both the ratio and the two raw numbers it came from (avoids the classic BI mistake of showing a % with no way to see what it's built from).

### 5.3 Individual (Drill-Down) Mode
This is the mode with the biggest functional gap (G5). Design:

```
Department (click)
   │  GET /analytics/v3/drilldown/department/:deptName/faculty
   │  → list of faculty in department with headline KPIs
   │    (publications, projects, patents, awards, completion%)
   ▼
Faculty (click)
   │  GET /analytics/v3/faculty/:facultyId/profile-analytics
   │  → single-faculty aggregation across ALL categories in §4:
   │    publications breakdown, projects breakdown, patents breakdown,
   │    awards, research guidance, FDP, courses, memberships,
   │    international experience, admin/extension activity counts,
   │    profile completion by section, qualification & experience summary
   ▼
   (optional) further drill into a specific category
   │  Reuses existing drilldownService.js KPI configs (publications/
   │  projects/patents) PLUS new KPI configs for awards/fdp/courses/
   │  memberships/internationalExperience/researchGuidance — additive
   │  entries in the same KPI_CONFIG object, same function signature.
```
`getDrilldown()` in `drilldownService.js` is extended (additive `KPI_CONFIG` entries only, existing entries untouched) to support the new KPIs. The faculty-level "complete profile" endpoint is new (`facultyProfileAnalyticsService.js`) because it aggregates *across* many arrays for one document, which is a different shape than the existing flatten-across-many-faculty drilldown pattern — it does not belong inside `drilldownService.js` and must not be forced into it.

Both HOD (own department only, enforced by existing `scopeFilter()` pattern) and VC/IQAC/Admin (any department) can use this mode; access is governed by the existing `requireAnalyticsScope('drilldown')` and a new `requireAnalyticsScope('facultyProfile')` key.

---

## 6. Filter System Design

Extends `filterService.js` **additively** — new optional query params, new optional filter-fragment builders, zero changes to existing exported functions' behavior when new params are absent.

| Filter | Field path | New / Existing |
|---|---|---|
| Academic Year | `publications.year` / `projects.startDate` / `patents.dateOfFiling` (already `year`/`from`/`to`) | Existing, relabeled as a single "Academic Year" dropdown client-side (backend unchanged) |
| Department | `employmentDetails.department` | Existing |
| Faculty | single faculty `_id` or `username` | New param `facultyId`, adds `{ _id: facultyId }` fragment |
| Program | `academic_details.programLevel` | Existing (student filter) |
| Category | `publications.journalCategory` | Existing (`category`) |
| Date Range | `projects.startDate` `from`/`to` | Existing |
| Research Area | No dedicated field exists; proxy via `journal`/`title` keyword search in drilldown search, not a structured filter | Documented limitation, not fabricated |
| Publication Type | `publications.type` | Existing (`pubType`) |
| Funding Agency | `projects.fundingAgency` | Existing |
| Journal Category | `publications.journalCategory` | Existing (same as Category above — unify in UI, not two filters) |
| Patent Status | `patents.status` | Existing |
| Project Status | `projects.status` | Existing |
| Qualification | `qualifications.degreeLevel` | New — `qualification` param → `{ qualifications: { $elemMatch: { degreeLevel } } }` |
| Experience | `employmentDetails.totalExperienceYears` range | New — `minExperience`/`maxExperience` params → numeric-cast range filter (defensive parse, since stored as string) |
| Campus | Not modeled | Deferred (§4.15) — filter option omitted from UI until a `campus` field is added to `Department`/`employmentDetails` in a future phase |

`GET /filters/options` (existing V2 endpoint) is extended additively to also return `qualifications`, `experienceRange` (min/max observed), and continues to omit `campus`.

---

## 7. Comparison Modes Design

| Comparison | Status | Design |
|---|---|---|
| Department vs Department | ✅ exists (`trend?type=deptVsDept`) | No change |
| Faculty vs Faculty | ✅ exists (`trend?type=facultyVsFaculty`, publications only) | Extend to accept a `metric` query param so any §4 metric can be compared, not just publication count (additive parameter, default remains `publications` to preserve current behavior) |
| Year vs Year | ✅ exists (`trend?type=yearOverYear`) | Extend the same way (currently hardcoded to publications/projects/patents series — generalize the series list additively, keep the 3 default series when no `metrics` param given) |
| Five Year Trend | ✅ exists (`trend?type=fiveYear`) | No change |
| Current vs Previous | 🆕 | New `trend?type=currentVsPrevious` — compares the most recent academic year against the one before it for a chosen metric; small addition to `trendService.js` |
| Current vs Benchmark | ✅ exists (`benchmark` endpoint gives gap) | Fixed for scoping (G3, §10.2) |
| Department vs University Average | 🆕 | New `benchmarkService.getDepartmentVsAverage(deptName, metricId)` — computes the metric scoped to one department vs scoped to the whole university, using the scope-aware `calculateMetric` from §10.2 |
| Faculty vs Department Average | 🆕 | New `facultyProfileAnalyticsService.compareToDepartmentAverage(facultyId, metricId)` — reuses the individual-mode faculty aggregation (§5.3) against the department absolute-mode aggregation (§5.1) |

---

## 8. Visualization & Chart Recommendations

All chart types below are natively available in the already-installed `recharts@3.1.0` — **no new dependency required**.

| Metric type | Chart | Why |
|---|---|---|
| Department totals (publications, projects, patents, awards counts) | **Bar Chart** (existing `DepartmentBarChart.tsx`, reused) | Discrete categories, direct magnitude comparison — already implemented, extend to accept any metric |
| Long department name lists / many categories | **Horizontal Bar** | Avoids label collision that vertical bars get with 8+ departments; recharts `layout="vertical"` on the same `BarChart` component — implement as a `horizontal` prop on the existing component, not a new file |
| Publication type mix per department (Journal/Chapter/Book/Conference stacked) | **Stacked Bar** | Shows both total and composition in one chart; new variant of `DepartmentBarChart` using recharts' stacked `Bar` `stackId` |
| Category share (journal categories, patent status mix) | **Donut** (existing `CategoryDonutChart.tsx`, reused) | Part-to-whole with a readable center label slot |
| Metric distribution across a small fixed set (criterion scores) | **Pie** (existing `CriterionPieChart.tsx`, reused) | Simple part-to-whole for ≤6 slices |
| Funding trend over time | **Area Chart** (existing `FundingAreaChart.tsx`, reused) | Emphasizes cumulative magnitude over time, already implemented |
| Year-over-year multi-series (publications/projects/patents/funding together) | **Line Chart** (existing `TrendLineChart.tsx`, reused) | Best for showing multiple trend lines against a shared time axis |
| Data completeness / coverage per metric | **Heat Map** (existing `CoverageHeatMap.tsx`, reused, card-grid style) | Already implemented as colour-coded cards; keep as-is |
| Multi-dimensional faculty/department profile (e.g., research, teaching-admin, extension, quality — 4–6 axes) | **Radar Chart** 🆕 | Ideal for "individual mode" faculty profile view and department multi-axis comparison — recharts `RadarChart`/`PolarGrid`/`Radar` |
| Hierarchical breakdown (University → Department → Faculty contribution size) | **Treemap** 🆕 | Recharts `Treemap` component — good for showing relative size of many departments/faculty at once without a long list |
| Two-variable relationships (e.g., experience years vs publication count, to spot correlation) | **Scatter Plot** 🆕 | Recharts `ScatterChart` — useful for HOD/VC spotting outliers (e.g., high experience, low output) |
| Single KPI against a target (e.g., completion % vs 100%, funding vs benchmark) | **Gauge** 🆕 | Implement via recharts `RadialBarChart` with a single bar (a well-known recharts gauge pattern) — no new library |
| Any 0–100% completion or achievement metric inline in a table/card | **Progress Bar** 🆕 | Plain HTML/CSS (as already used for coverage cards) — no chart library needed |
| Top-line numbers (total faculty, total publications, avg completion) | **KPI Cards** (existing `StatCard` component in `AnalyticsDashboard.tsx`, reused) | Already implemented; V3 generalizes it to accept any §4 metric, and adds an optional benchmark-delta indicator |

New chart components to create (additive files only, existing 6 chart components are not modified):
`RadarProfileChart.tsx`, `HierarchyTreemap.tsx`, `CorrelationScatterChart.tsx`, `GaugeChart.tsx`, `StackedBarChart.tsx` (or a `stacked` prop added to `DepartmentBarChart.tsx` — implementer's choice, either is additive).

---

## 9. Report Generation Design

Extends `reportService.js`'s `REPORT_TYPES` registry and `GENERATORS` map **additively** — the 6 existing report types and their generator functions are untouched.

| Report | Key | Rows source | New/Existing |
|---|---|---|---|
| Faculty Profile Completion | `faculty-profile` | existing | ✅ existing |
| Department Performance Summary | `department-summary` | existing | ✅ existing |
| Research Publications | `research-output` | existing | ✅ existing |
| Research Projects | `projects` | existing | ✅ existing |
| Patents | `patents` | existing | ✅ existing |
| NAAC Benchmark Analysis | `benchmark` | existing (improves automatically once G2/G3 are fixed — more rows will have real `currentValue`s) | ✅ existing |
| Awards Report | `awards` | `Faculty.awards[]` flattened, same pattern as `patentsReport()` | 🆕 |
| Books & Book Chapters Report | `books` | `Faculty.publications[]` filtered to book/chapter types | 🆕 |
| Research Guidance (PhD/M.Phil) Report | `research-guidance` | `Faculty.researchGuidance` + `studentDetails[]` flattened | 🆕 |
| FDP / Workshop Participation Report | `fdp-workshops` | `Faculty.fdpWorkshops[]` flattened | 🆕 |
| Faculty Individual Report | `faculty-individual` | one faculty's full §5.3 aggregation, single-row-per-category sections | 🆕 (uses §5.3's `facultyProfileAnalyticsService`) |
| Student Report | `student-summary` | `StudentProfile` — by department/program/admission category | 🆕 |
| IQAC Criterion Report | `iqac-criterion` | groups all §4 metrics by their mapped NAAC criterion number (1–7), for one criterion at a time (`?criterionNumber=3`) | 🆕 |
| NAAC Full Institutional Report | `naac-institutional` | all `BenchmarkMetric` rows with current value, gap, score — institution-wide, superset of the existing `benchmark` report but organized by criterion with sub-totals | 🆕 |
| University-Wide Summary Report | `university-summary` | single-row institution totals across every §4 absolute metric — an executive-summary export | 🆕 |
| Benchmark Gap / Improvement Report | `benchmark-gaps` | same data as `benchmark` report but filtered to `status='below'` only, sorted by `gap` descending — a "what needs attention" export | 🆕 |

`getAvailableReportTypes(scope)` continues to filter by `scopes` array per report type exactly as today; new report types default to `['university', 'institution', 'full']` (VC/IQAC/Admin only) unless explicitly marked department-safe (e.g. `faculty-individual`, `awards`, `books`, `fdp-workshops`, `research-guidance` are department-safe like the existing `faculty-profile`/`department-summary`).

Formats: every new report type supports `pdf`/`excel`/`csv` through the **existing, unmodified** exporters (`csvExporter.js`, `excelExporter.js`, `pdfExporter.js`) — these are generic row-array-to-file converters and need no changes.

### 9.4 Export Parity for Overview/Normalized/Individual Views
The `department-summary` report already covers most of Overview-tab data. V3 adds one more export path: a generic `GET /analytics/v3/export?view=<absolute|normalized|individual>&format=<csv|excel|pdf>&...filters` that reuses the same three exporters for ad-hoc exports of whatever the user is currently looking at, rather than requiring a named report type for every possible view. This closes G12 without growing `REPORT_TYPES` unboundedly.

---

## 10. Benchmark Comparison Layer (Redesign)

### 10.1 Expand Coverage (fixes G2)
For each of the 40 currently-`computedField: null` benchmark metrics in `benchmarkSeeder.js`:
1. Add the matching `Metric` document (formula type per §4's catalogue — most are `count`/`conditionalCount`/`sum`, already supported by the engine).
2. Set `computedField` on the corresponding `BenchmarkMetric` document to that new `Metric`'s `metricId`.
3. Re-run `benchmarkSeeder.js` (idempotent upsert — safe to re-run, per its own docstring).

Not every one of the 44 NAAC metrics can be computed from this schema (e.g., some are qualitative/document-verification metrics like "Curriculum feedback obtained from stakeholders" — genuinely not derivable from Faculty/Student data). These are explicitly left with `computedField: null` and the benchmark UI already handles that gracefully (`status: 'unknown'`, threshold table still shown) — **do not force a fake computation onto metrics that cannot honestly be derived.** A short audit table should be produced during implementation (§15 checklist item) classifying all 44 metrics as Computable / Not Computable-from-current-data, with the latter clearly labeled "Manual entry required" in the UI rather than silently hidden.

Also add: `achievementPercent` field alongside the existing `gap` field in `benchmarkService`'s output (`currentValue ÷ benchmarkValue × 100`, capped/labeled appropriately when `benchmarkValue` is 0 or the metric is qualitative) — this directly satisfies the brief's "Target Achievement %" requirement (§4.13) and is a small additive change to the existing return object shape (new key added, no existing key removed or renamed).

### 10.2 Fix Scope-Blindness (fixes G3 — the most important correctness fix in this document)
Today: `calculateMetric(metricId)` always queries the full `Faculty` collection; `benchmarkService` passes `scope` around only "for API consistency" per its own code comment but never uses it in the actual DB query.

**Fix design (additive, non-breaking):**
- Add an optional second parameter to `analyticsService.calculateMetric(metricId, filter = {})`. When `filter` is `{}` (the default), behavior is **byte-identical** to today — this preserves every existing caller (`server/modules/faculty/routes/analytics.js`'s V1 endpoints call `calculateMetric(metricId)` with one argument and must keep working unchanged).
- `benchmarkService.getMetricBenchmark(metricId, scope, query)` is updated to build the same `scopeFilter(scope)` + `buildFacultyFilter(query)` combination already used everywhere else in the V2 services (`drilldownService.js`, `trendService.js`, `reportService.js` all already do this — `benchmarkService.js` is the one outlier that doesn't), and pass it as `calculateMetric(metricId, combinedFilter)`.
- Net effect: HOD-scoped benchmark views will now show the HOD's department's real numbers instead of institution-wide numbers. VC/IQAC/Admin (unfiltered scope) see no change in output, because their `scopeFilter()` already returns `{}`.
- This is a **bug fix**, not a redesign — it makes the benchmark tab consistent with every other V2 tab's existing scoping behavior, using a pattern already proven elsewhere in the same module.

### 10.3 Department & Faculty Benchmark Comparison (fixes G4's benchmark half)
New functions in `benchmarkService.js` (additive):
- `getDepartmentBenchmark(deptName, metricId)` — same evaluation logic (§`evaluateBands`, unchanged), fed a department-filtered `calculateMetric` call from §10.2.
- `getAllDepartmentsBenchmark(metricId)` — one row per department, for the "Department vs University Average" and "Department vs Benchmark" comparison views.

---

## 11. AI-Ready Recommendation Layer (Future — Architecture Only)

The brief explicitly marks this "(future)". V3 does **not** implement an ML/LLM-backed recommendation engine. It only ensures the data layer is shaped so one can be added later without further backend rework:

- Keep `recommendationEngine.js` as the deterministic, rule-based baseline (unchanged).
- New file `recommendationDataAdapter.js` (additive, unused by any route yet) — a pure function that takes the full §4 metric catalogue values for a given scope (department/faculty/institution) and returns one normalized JSON payload shaped for eventual LLM prompting (metric name, current value, benchmark, historical trend points, department average). This is the "AI-ready" contract: any future recommendation model (rule-based, statistical, or LLM-based) consumes this one adapter rather than needing to know about Mongo/Faculty schema internals directly.
- No route is added for this in V3. It exists purely as a stable internal seam so a V4 "AI Recommendations" feature is additive, not a rewrite.

---

## 12. File Analysis

### 12.1 Files to Modify (minimal, additive edits only — each with justification)

| File | Change | Why minimal/safe |
|---|---|---|
| `server/modules/analytics/services/analyticsService.js` | Add optional `filter` param to `calculateMetric()` (default `{}`); add `average` and `distinctGroupCount` `case` branches to the existing `switch` | Default param preserves every existing call site exactly; new `case`s are unreachable by existing `formulaType` values already in the DB |
| `server/modules/analytics/services/benchmarkService.js` | Pass the scope-derived filter into `calculateMetric()` (§10.2); add `achievementPercent` to returned object; add `getDepartmentBenchmark`/`getAllDepartmentsBenchmark` exports | Existing exported function signatures unchanged; new key is additive; new functions are additive exports |
| `server/modules/analytics/services/drilldownService.js` | Add new `KPI_CONFIG` entries (awards, fdp, courses, memberships, internationalExperience, researchGuidance) | `KPI_CONFIG` is already designed as an extensible map; existing entries untouched |
| `server/modules/analytics/services/trendService.js` | Add `metric` query param support to `facultyVsFacultyTrend`/`yearOverYearTrend` (default preserves current 3-series behavior); add `currentVsPrevious` case | Additive `case` in existing `switch`; defaulted param |
| `server/modules/analytics/services/reportService.js` | Add new entries to `REPORT_TYPES` array and `GENERATORS` map; add new generator functions | Existing entries/functions untouched |
| `server/modules/analytics/services/filterService.js` | Add `qualification`, `minExperience`/`maxExperience`, `facultyId` handling to `buildFacultyFilter()` | New `if` blocks only; existing filter keys' logic untouched |
| `server/modules/analytics/permissions/analyticsScopes.js` | Add new endpoint keys (`facultyProfile`, `metricsCatalogue`, `departmentBenchmark`, etc.) to `ENDPOINT_KEYS` and each role's scope map, including adding `iqac_director`/appropriate rows where missing | Table is explicitly designed for row/key addition per its own header comment |
| `server/modules/analytics/routes/analyticsV2.js` OR a new `analyticsV3.js` | New route handlers for §13 endpoints | **Recommendation: create `server/modules/analytics/routes/analyticsV3.js` instead of extending `analyticsV2.js`**, to keep the V2 file exactly as delivered and make V3's additions independently auditable/revertable. Mount it in `server/index.js` alongside the other two (one new `require` + one new `app.use` line, same pattern as V2's own addition) |
| `server/index.js` | Add `const analyticsV3Routes = require('./modules/analytics/routes/analyticsV3');` and `app.use('/api/faculty/analytics', analyticsV3Routes);` | Two-line addition, same proven pattern used for V2, no other line touched |
| `server/seeders/benchmarkSeeder.js` | Set `computedField` on the 40 currently-null entries where a matching new `Metric` exists (§10.1) | Idempotent upsert seeder, safe to re-run per its own docstring; no structural change |
| `src/lib/analyticsV2Api.ts` OR new `src/lib/analyticsV3Api.ts` | Typed wrappers for new endpoints | **Recommendation: new `analyticsV3Api.ts` file**, same reasoning as the backend route file — keeps V2's delivered surface immutable |
| `src/App.tsx` | Add `iqac` to the `ProtectedRoute` role union type; add `/iqac/*` route tree mirroring the existing `/vc/*`/`/hod/*` pattern, including `/iqac/analytics` | Necessary to close G8; additive route entries only, no existing route removed or changed. **This is the one frontend-shell change outside the Analytics module itself** — flagged explicitly here because it's the only place V3 must touch something other than analytics files, and it is required because the brief's "Higher Authorities" audience includes the IQAC Director role, which currently cannot log in to see analytics at all. |
| `src/pages/analytics/AnalyticsDashboard.tsx` | Add new tabs (`Individual`, `Comparisons`) to the existing tab bar, each rendering new components; extend the existing `allowed.has(...)` pattern for new endpoint keys | Existing tabs (`overview`/`charts`/`benchmark`/`reports`) and their rendering logic are untouched; new tabs are additional `activeTab === '...'` blocks following the exact same conditional-render pattern already used |

### 12.2 Files to Create (all new, zero collision risk)

**Backend:**
- `server/modules/analytics/services/normalizedMetricsService.js` (§5.2)
- `server/modules/analytics/services/facultyProfileAnalyticsService.js` (§5.3, individual mode)
- `server/modules/analytics/services/metricsCatalogService.js` (§5.1, catalogue listing)
- `server/modules/analytics/services/recommendationDataAdapter.js` (§11, future seam only)
- `server/modules/analytics/routes/analyticsV3.js` (§13)
- `server/seeders/analyticsV3MetricSeeder.js` — seeds the ~40 new `Metric` documents from §4 (kept separate from `benchmarkSeeder.js` so metric-definition seeding and benchmark-threshold seeding remain independently runnable, matching the existing `runAllSeeders.js` composition pattern)

**Frontend:**
- `src/lib/analyticsV3Api.ts`
- `src/pages/analytics/individual/DepartmentFacultyList.tsx`
- `src/pages/analytics/individual/FacultyProfileAnalytics.tsx`
- `src/pages/analytics/comparisons/ComparisonPanel.tsx` (dept-vs-avg, faculty-vs-dept-avg, current-vs-previous)
- `src/components/analytics/charts/RadarProfileChart.tsx`
- `src/components/analytics/charts/HierarchyTreemap.tsx`
- `src/components/analytics/charts/CorrelationScatterChart.tsx`
- `src/components/analytics/charts/GaugeChart.tsx`
- `src/components/analytics/charts/StackedBarChart.tsx`
- `src/pages/iqac/IQACDashboard.tsx` (thin shell mirroring `VCDashboard.tsx`'s pattern only enough to host navigation + the existing `AnalyticsDashboard` — not a rebuild of VC's 1600-line dashboard; IQAC's dashboard can be minimal since IQAC's primary need is analytics, not faculty-hierarchy management)

### 12.3 Files That Must NOT Be Modified (with reasons)

| File | Reason |
|---|---|
| `server/modules/analytics/services/analyticsService.js` — its existing `case` branches and the `getStudentProfile*`/`getProgramLevels` functions | Only the described additive changes in §12.1 are permitted; the 10 existing formula-type branches, all existing exports, and all existing function bodies stay byte-identical |
| `server/modules/analytics/models/Metric.js`, `server/modules/analytics/models/BenchmarkMetric.js` | Schemas already support everything V3 needs (confirmed in §2.3); no field additions required |
| `server/modules/faculty/models/Faculty.js`, `server/models/Faculty.js` | Explicit brief instruction: derive, never alter, business data models. Every metric in §4 was chosen specifically because it needs no schema change |
| `server/modules/student/models/StudentProfile.js` | Same reason; V3 only reads existing fields |
| `server/models/Department.js` | Same reason; campus/target fields are deferred (§4.15), not added |
| `server/modules/faculty/routes/analytics.js` (V1) | Existing, stable, production V1 surface — zero changes, per Ground Rule 3 |
| `server/modules/analytics/routes/analyticsV2.js` | Delivered, stable V2 surface — V3 builds alongside it in a new file, not inside it (§12.1 rationale) |
| `server/modules/analytics/routes/analyticsAccess.js` | `/my-access` logic is generic (reads whatever is in `analyticsScopes.js`) — it automatically picks up new V3 endpoint keys once they're added to the scopes table; no code change needed here at all |
| `src/pages/vc/VCDashboard.tsx`, `src/pages/hod/HODDashboard.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/pages/faculty/FacultyDashboard.tsx` | Explicit brief instruction: existing dashboards untouched. They do not import or depend on Analytics module internals beyond navigating to `/*/analytics`, which already exists |
| `src/context/AuthContext.tsx`, `src/lib/api.ts` | Confirmed by the existing V2 README as intentionally unmodified; V3 continues that guarantee — all new API calls reuse the same shared `api` axios instance already exported from `api.ts`, imported (not edited) |
| `server/server.js`, `server/routes/*.js` (top-level legacy) | Dead code, unrelated to the live system (§2.1); out of scope to touch or delete |
| Any file under `server/modules/student/*` except read-only imports of `StudentProfile` model | Student module is a separate, independently-owned module; V3 only reads it for analytics, exactly as V1/V2 already do |

---

## 13. API Design — New Endpoints

All new endpoints are mounted under the existing `/api/faculty/analytics` prefix (matching V1/V2 convention) via the new `analyticsV3.js` router, and all follow the identical `auth → requireAnalyticsScope(key) → handler` pattern as every existing endpoint. No existing endpoint path, method, or response shape changes.

| Method | Path | Purpose | Scope key |
|---|---|---|---|
| GET | `/metrics-catalogue` | Full §4 metric registry with categories, for building metric pickers | `metricsCatalogue` |
| GET | `/normalized/:metricId` | Per-faculty or per-department normalized ratio (§5.2, §4.13) | `normalized` |
| GET | `/drilldown/department/:deptName/faculty` | Faculty list within a department with headline KPIs (§5.3 step 1) | `drilldown` (reuses existing key) |
| GET | `/faculty/:facultyId/profile-analytics` | Complete cross-category analytics for one faculty (§5.3 step 2) | `facultyProfile` |
| GET | `/comparisons/department-vs-average` | Department vs university average, any metric (§7) | `comparisons` |
| GET | `/comparisons/faculty-vs-department-average` | Faculty vs their department's average, any metric (§7) | `comparisons` |
| GET | `/trend?type=currentVsPrevious` | New trend type on the existing `/trend` path pattern — **actually implemented as a new `case` inside the existing V2 `/trend` route/service**, listed here for completeness of the comparison feature, not as a new route | `trend` (existing key) |
| GET | `/benchmark/department/:deptName` | Department-scoped benchmark table (§10.3) | `departmentBenchmark` |
| GET | `/benchmark/department/:deptName/:metricId` | Single-metric department benchmark detail | `departmentBenchmark` |
| GET | `/filters/options` (extended, same path) | Adds `qualifications`, `experienceRange` to existing V2 response — **modifies the existing V2 handler additively**, not a new route | `filterOptions` (existing key) |
| GET | `/reports/types` (existing path, response grows automatically as `REPORT_TYPES` grows) | No route change needed | `reportTypes` (existing key) |
| POST | `/reports/:reportType/generate` (existing path, new `reportType` values accepted automatically via the `GENERATORS` map) | No route change needed | `reportGenerate` (existing key) |
| GET | `/export` | Generic ad-hoc export for overview/normalized/individual views (§9.4) | `export` (new key) |

Every new scope key above must be added to `analyticsScopes.js` for at minimum `hod` (department-level where applicable), `vc`, `iqac_director`, `admin`, `superadmin` — following the exact existing row pattern for each role block.

---

## 14. Implementation Phases

Each phase is independently deployable, independently testable, and leaves the system fully working if implementation stops after that phase.

**Phase 0 — Verification baseline (no code)**
Snapshot current responses for all 12 V1 + 9 V2 endpoints (no-filter and with-filter cases) to use as regression fixtures. Confirms Ground Rule 3 is testable, not just asserted.

**Phase 1 — Metric catalogue expansion (backend only, invisible to users)**
Create `analyticsV3MetricSeeder.js`, seed all §4 net-new `Metric` documents. Add `average`/`distinctGroupCount` formula-type branches to `calculateMetric()`. No route changes yet. Verify via direct `calculateMetric()` calls / a temporary script, not yet exposed via API.

**Phase 2 — Metrics catalogue + normalized mode endpoints**
Create `metricsCatalogService.js`, `normalizedMetricsService.js`, `analyticsV3.js` router with `/metrics-catalogue` and `/normalized/:metricId`. Mount router in `server/index.js`. Add scope rows. Regression-test Phase 0 fixtures still pass.

**Phase 3 — Individual (drill-down) mode**
Create `facultyProfileAnalyticsService.js`. Add `/drilldown/department/:deptName/faculty` and `/faculty/:facultyId/profile-analytics`. Extend `drilldownService.js` `KPI_CONFIG` with awards/fdp/courses/memberships/internationalExperience/researchGuidance. Frontend: `DepartmentFacultyList.tsx`, `FacultyProfileAnalytics.tsx`, wired into a new "Individual" tab in `AnalyticsDashboard.tsx`.

**Phase 4 — Extended filters**
Extend `filterService.js` (`qualification`, experience range, `facultyId`). Extend `/filters/options` response. Update `FilterBar.tsx` additively (new optional filter controls, existing ones unchanged).

**Phase 5 — Benchmark expansion & scope fix**
Wire `computedField` for the ~40 dormant `BenchmarkMetric` docs where computable (produce the audit table from §10.1 first). Fix `calculateMetric` scope-blindness (§10.2, the highest-value correctness fix). Add `achievementPercent`. Add `getDepartmentBenchmark`/`getAllDepartmentsBenchmark`. Add `/benchmark/department/:deptName[/:metricId]` routes. **Test explicitly:** HOD login must now see department-scoped benchmark numbers different from VC's institution-wide numbers for the same metric — this is the regression test that proves G3 is fixed.

**Phase 6 — Comparisons & new chart types**
Add `currentVsPrevious` trend type; generalize `facultyVsFaculty`/`yearOverYear` to accept a `metric` param (default unchanged). Add `/comparisons/*` endpoints. Create the 5 new chart components (§8). Add a "Comparisons" tab to `AnalyticsDashboard.tsx`.

**Phase 7 — Report catalogue expansion**
Add the 9 new report types + generator functions to `reportService.js` (§9). Add `/export` generic endpoint (§9.4). No exporter file changes needed (existing 3 exporters are format-generic).

**Phase 8 — IQAC Director frontend access (closes G8)**
Add `iqac` to `App.tsx`'s role union and route tree; create `IQACDashboard.tsx` shell. Verify `iqac_director` login → `/iqac/analytics` renders every tab their `analyticsScopes.js` `institution`-level permissions allow, identically to how `vc`'s `university`-level permissions already render.

**Phase 9 — Data seeding for new metrics (demo/QA quality)**
Extend `analyticsDataSeeder.js` additively so the existing CS/ECE/MBA stratification also produces differentiated awards, FDP, research-guidance, memberships, and international-experience data, so Phases 3–7's new charts/reports are demonstrably meaningful rather than all-zero. This phase can run any time after Phase 1 and does not block any other phase.

Recommended order: 0 → 1 → 2 → 5 (fix is high value, low risk) → 3 → 4 → 6 → 7 → 8 → 9 (or interleave 9 with each earlier phase's new metrics as they land — either is safe since it only touches seed data).

---

## 15. Final Developer Checklist (for Kiro)

- [ ] Run Phase 0: capture baseline responses for all 21 existing endpoints (12 V1 + 9 V2), no-filter and with representative filters.
- [ ] Confirm `server/index.js` is the only server entry point exercised in dev/prod before touching anything (`npm start` → `node index.js`); never route changes through `server/server.js` or `server/routes/*.js`.
- [ ] Phase 1: add `average` and `distinctGroupCount` cases to `analyticsService.calculateMetric()`; confirm the `switch` statement's existing 10 cases are unchanged, only new cases appended.
- [ ] Phase 1: create and run `analyticsV3MetricSeeder.js`; confirm it is idempotent (safe re-run) like `benchmarkSeeder.js`.
- [ ] Phase 2: create `analyticsV3.js`, mount in `server/index.js` with exactly one new `require` + one new `app.use` line.
- [ ] Phase 2: for every new endpoint, add rows in `analyticsScopes.js` for `hod`/`vc`/`iqac_director`/`admin`/`superadmin` (and `faculty` only where self-scoped access makes sense).
- [ ] Phase 3: verify individual-mode drill-down enforces HOD's own-department restriction (an HOD must not be able to open a faculty profile outside their department by manipulating `facultyId`) — add an explicit server-side department check in `facultyProfileAnalyticsService.js`, not just reliance on frontend hiding.
- [ ] Phase 5: produce and include the "44 NAAC metrics — Computable vs Manual-entry-required" audit table as a code comment or markdown note alongside `benchmarkSeeder.js`.
- [ ] Phase 5: write and run the specific regression test described in Phase 5 above (HOD-scoped benchmark ≠ VC-scoped benchmark for the same metricId, when department data differs — use the existing CS/ECE/MBA stratified seed data to make this observable).
- [ ] Phase 5: confirm `calculateMetric(metricId)` called with **no second argument** anywhere in the existing V1 route file still returns identical values to the Phase-0 baseline.
- [ ] Phase 8: confirm `iqac_director` can log in and reach `/iqac/analytics`, and that `faculty`/`student` roles still cannot reach any `/*/analytics` route (no privilege regression).
- [ ] Throughout: every new file goes through `requireAnalyticsScope`; no new route is ever left unauthenticated (a direct, easy-to-miss mistake given the dead top-level `server/routes/analytics.js` file demonstrates this exact mistake already exists elsewhere in the repo as a cautionary example — do not repeat it).
- [ ] Throughout: re-run Phase 0's baseline fixtures after every phase; any diff on an existing (non-new) field is a stop-the-line regression.
- [ ] Final: update `server/modules/analytics/README.md` additively (new "Analytics V3" section, following the exact structure already used for the "Analytics V2" section) — do not rewrite the V1/V2 sections.
- [ ] Final: confirm no file outside `server/modules/analytics/*`, `server/seeders/analyticsV3MetricSeeder.js`, `server/index.js` (2 lines), `src/lib/analyticsV3Api.ts`, `src/pages/analytics/*`, `src/pages/iqac/*`, `src/components/analytics/*`, and `src/App.tsx` (route additions only) was modified.
