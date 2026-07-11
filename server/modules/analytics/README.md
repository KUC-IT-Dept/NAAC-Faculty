# Analytics Engine Phase 1 - Supported Metrics

## Overview

The Analytics Engine calculates IQAC metrics dynamically using metadata stored in the `metrics` collection. Each metric defines:

* Metric ID
* Metric Name
* Source Collection
* Field Path
* Formula Type

The engine reads these definitions and computes values automatically.

---

## Supported Metrics

### 3.4.4 - Research Publications

**Criterion:** Research & Publications

**Source Collection:** faculties

**Field Path:** publications

**Formula Type:** count

**Calculation Logic:**

* For each faculty record, count the number of publication entries.
* Sum all publication counts across faculty members.

**Example Result:**

```json
{
  "metricId": "3.4.4",
  "metricName": "Research Publications",
  "value": 6
}
```

---

### 3.2.2 - Research Projects

**Criterion:** Research Projects

**Source Collection:** faculties

**Field Path:** projects

**Formula Type:** count

**Calculation Logic:**

* Count project entries for each faculty.
* Sum all project counts.

**Example Result:**

```json
{
  "metricId": "3.2.2",
  "metricName": "Research Projects",
  "value": 3
}
```

---

### 3.4.5 - Patents

**Criterion:** Innovation & Intellectual Property

**Source Collection:** faculties

**Field Path:** patents

**Formula Type:** count

**Calculation Logic:**

* Count patent entries for each faculty.
* Sum all patent counts.

**Example Result:**

```json
{
  "metricId": "3.4.5",
  "metricName": "Patents",
  "value": 1
}
```

---

### 3.2.1 - Research Funding

**Criterion:** Research Funding

**Source Collection:** faculties

**Field Path:** projects

**Formula Type:** sum

**Sum Field:** amountSanctioned

**Calculation Logic:**

* Read the `amountSanctioned` value from each project.
* Convert comma-separated values into numbers.
* Sum all sanctioned amounts.

**Example Result:**

```json
{
  "metricId": "3.2.1",
  "metricName": "Research Funding",
  "value": 5500000
}
```

---

## Implemented API Endpoints

### Get Metric Registry

```http
GET /api/analytics/metrics
```

Returns all configured metrics.

---

### Coverage Analysis

```http
GET /api/analytics/coverage
```

Returns metric coverage and availability.

---

### Calculate Single Metric

```http
GET /api/analytics/metric/:metricId
```

Example:

```http
GET /api/analytics/metric/3.4.4
```

---

### Analytics Dashboard

```http
GET /api/analytics/dashboard
```

Returns all supported metric values in a single response.

---

## Supported Formula Types

### count

Counts records inside an array field.

Examples:

* publications
* projects
* patents

---

### sum

Adds numeric values from a specified field.

Examples:

* amountSanctioned

---

## Future Phase 2 Enhancements

* average formula
* percentage formula
* weighted score formula
* NAAC score mapping
* Criterion-wise dashboards
* Department-wise analytics
* Trend analysis
* Year-wise filtering
* Data quality scoring
* Automated IQAC report generation

---

## Access Control

Analytics endpoints are protected by a two-layer middleware chain:

```
auth  →  requireAnalyticsScope(endpointKey)  →  route handler
```

### Scope Model

| Role           | Scope Level   | Data Boundary                                  |
|----------------|---------------|------------------------------------------------|
| `faculty`      | `self`        | Own profile only (profile-completion endpoint) |
| `hod`          | `department`  | All faculty in `req.user.department`           |
| `vc`           | `university`  | All departments, institution-wide data         |
| `iqac_director`| `institution` | Full institutional / NAAC-focused data         |
| `admin`        | `full`        | Unrestricted — all data                        |
| `superadmin`   | `full`        | Unrestricted — all data                        |

### Relevant Files

| File | Responsibility |
|------|----------------|
| `server/modules/analytics/permissions/analyticsScopes.js` | Role → endpoint → scope-level mapping (single source of truth) |
| `server/modules/analytics/middleware/requireAnalyticsScope.js` | Middleware factory — reads scope config, attaches `req.analyticsScope` or returns 403 |
| `server/modules/analytics/routes/analyticsAccess.js` | `GET /api/faculty/analytics/my-access` — returns permitted endpoints for the caller's role |
| `server/modules/faculty/routes/analytics.js` | All 12 analytics routes — each protected with `auth` + `requireAnalyticsScope()` |

### Separation of Concerns

- **Authentication** (`auth` middleware): confirms identity, populates `req.user`. Never modified.
- **Scope resolution** (`requireAnalyticsScope`): confirms permission, attaches `req.analyticsScope`. Knows about roles, not metrics.
- **Analytics calculation** (`analyticsService.js`): computes values. Never modified. Has no knowledge of roles.

To add a new role or endpoint, update only `analyticsScopes.js`.

---

## Analytics V2

Built as an additive enhancement on top of V1. No existing files, routes, or services were removed or broken.

### New Services

| File | Responsibility |
|------|----------------|
| `services/filterService.js` | Translates `req.query` params into Mongo filter fragments. Zero DB access, zero role awareness. |
| `services/drilldownService.js` | Returns paginated record-level lists (publications, projects, patents, faculty) with search/sort. |
| `services/benchmarkService.js` | Calls `calculateMetric()` and compares results against `benchmarkThresholds.js`. |
| `services/trendService.js` | Year-over-year, dept-vs-dept, faculty-vs-faculty, and 5-year trend calculations. |
| `services/recommendationEngine.js` | Pure rule evaluator: maps below-benchmark metrics to prioritised improvement text. |
| `services/reportService.js` | Assembles format-agnostic JSON report payloads by role/type. |

### Benchmark Data

`data/benchmarkThresholds.js` — static lookup table keyed by `metricId`. Update threshold values here only; no other file needs to change.

Currently seeded metrics with benchmarks: `3.4.4`, `3.2.2`, `3.4.5`, `3.2.1`.

### Exporters

| File | Output |
|------|--------|
| `exporters/csvExporter.js` | CSV string via `papaparse` |
| `exporters/excelExporter.js` | `.xlsx` buffer via `xlsx` |
| `exporters/pdfExporter.js` | `.pdf` buffer via `pdfkit` |

### New V2 Endpoints

All mounted at `/api/faculty/analytics/` via `routes/analyticsV2.js`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/filters/options` | Available filter values for FilterBar dropdowns |
| `GET` | `/drilldown/:kpi` | Paginated record list (publications/projects/patents/faculty) |
| `GET` | `/drilldown/:kpi/export` | Export drill-down as csv/excel/pdf |
| `GET` | `/benchmark` | All metrics vs NAAC benchmark thresholds |
| `GET` | `/benchmark/:metricId` | Single metric benchmark detail |
| `GET` | `/trend` | Year-over-year / dept-vs-dept / 5-year trend |
| `GET` | `/recommendations` | Rule-based improvement recommendations |
| `GET` | `/reports/types` | Report types available to caller's role |
| `POST` | `/reports/:reportType/generate` | Generate and download a report |

### Filtering

All V1 endpoints now accept optional query parameters (applied via `filterService.js`):
`department`, `designation`, `year`, `category`, `level`, `pubType`, `projectCategory`, `projectStatus`, `fundingAgency`, `from`, `to`, `patentStatus`, `program`, `studentDept`.

Calling any endpoint with **no** query params produces byte-identical responses to pre-V2 baseline.

### Frontend (V2)

| File | Role |
|------|------|
| `src/lib/analyticsV2Api.ts` | Typed wrappers for all V2 endpoints |
| `src/components/analytics/FilterBar.tsx` | Collapsible filter control bar |
| `src/components/analytics/charts/DepartmentBarChart.tsx` | Bar chart by department |
| `src/components/analytics/charts/TrendLineChart.tsx` | Multi-series line chart |
| `src/components/analytics/charts/CategoryDonutChart.tsx` | Donut chart by category |
| `src/components/analytics/charts/CriterionPieChart.tsx` | Pie chart by metric |
| `src/components/analytics/charts/FundingAreaChart.tsx` | Stacked area chart for funding |
| `src/components/analytics/charts/CoverageHeatMap.tsx` | Colour-coded coverage cards |
| `src/pages/analytics/drilldown/DrilldownTable.tsx` | Generic paginated drill-down table |
| `src/pages/analytics/benchmark/BenchmarkPage.tsx` | Benchmark comparison table |
| `src/pages/analytics/reports/ReportsPage.tsx` | Report generation and download UI |

`AnalyticsDashboard.tsx` is extended with four tabs: Overview (all V1 content, untouched), Charts, Benchmark, Reports. Existing V1 rendering is structurally unchanged.

### Confirmed Unmodified Files

`analyticsService.js`, `Metric.js`, `Faculty.js`, `StudentProfile.js`, `requireAnalyticsScope.js`, all existing dashboard pages (`VCDashboard`, `HODDashboard`, `AdminDashboard`, `FacultyDashboard`), `AuthContext.tsx`, `api.ts`.
