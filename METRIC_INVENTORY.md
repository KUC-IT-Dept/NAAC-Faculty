# METRIC INVENTORY — NAAC Faculty Analytics System

**Version:** V3  
**Last Updated:** Analytics V3, Phase 1  
**Purpose:** Single source of truth for every analytics metric in the system.  
**Audience:** Developers, IQAC, Higher Authorities, QA Engineers.

This document is maintained alongside the code. Every new metric added to
`analyticsV3MetricSeeder.js` or `benchmarkSeeder.js` must have a corresponding
entry here. Every metric removed must be struck out with a deprecation note.

---

## How to Read This Inventory

Each metric entry contains:

| Field | Description |
|-------|-------------|
| **Metric ID** | Unique key in the `Metric` collection (`metricId` field). Used as the primary lookup key everywhere. |
| **Metric Name** | Human-readable display name. |
| **Source Model** | MongoDB model the data is read from. |
| **Source Field(s)** | Dot-notation path(s) within the model. |
| **Formula Type** | Engine formula type key (maps to a `case` in `calculateMetric()`). |
| **Unit** | Measurement unit for display. |
| **View Modes** | Which analytics views this metric supports (✅ = supported, ⚠ = partial, ❌ = not applicable). |
| **Supported Filters** | Query params from `filterService.js` that meaningfully narrow this metric. |
| **Recommended Chart** | Best chart type(s) for this metric. |
| **Drill-down Target** | KPI key for `drilldownService.js` (if applicable). |
| **Report Types** | Which `reportService.js` report types include this metric. |
| **Benchmark Support** | Whether a `BenchmarkMetric` document exists with thresholds. |
| **Comparison Support** | Supported comparison modes. |
| **Status** | `live` = V1/V2 (in production), `seeded` = V3 seeded but not yet exposed via route, `planned` = documented but not yet seeded. |

---

## View Mode Key

| Symbol | Mode | Description |
|--------|------|-------------|
| ✅ | Absolute | Raw aggregate count/sum — e.g. "Total Publications = 247" |
| ✅ | Normalized | Per-faculty or per-student ratio — e.g. "2.7 publications per faculty" |
| ✅ | Individual | Single faculty's value — e.g. "Dr. X has 14 publications" |
| ✅ | Trend | Year-over-year change — e.g. "↑ 18% from last year" |
| ✅ | Benchmark | Current vs NAAC threshold — e.g. "Score 3 of 4 (meets benchmark)" |
| ✅ | Comparison | Entity-vs-entity — e.g. "CS dept vs ECE dept" |
| ✅ | Drill-down | Record-level list — e.g. list of individual publications |
| ✅ | Export | Available in PDF/Excel/CSV reports |
| ❌ | Not applicable | Mode is not meaningful for this metric type |
| ⚠ | Partial | Supported but with caveats noted inline |

---

## Section 1 — Research Publications (`Faculty.publications[]`)


### 3.4.4 — Total Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.4` |
| **Metric Name** | Research Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `live` (V1) |
| **Absolute** | ✅ |
| **Normalized** | ✅ via `ratio.pubsperfaculty` |
| **Individual** | ✅ count per faculty |
| **Trend** | ✅ `yearOverYear` (one of the default 3 series) |
| **Benchmark** | ✅ `BenchmarkMetric: 3.4.4` — NAAC 3.4.4, max score 20 |
| **Comparison** | ✅ dept-vs-dept, faculty-vs-faculty, current-vs-previous |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `research-output` report |
| **Filters** | `department`, `year`, `pubType`, `category`, `level` |
| **Recommended Chart** | Bar chart (by dept), Line chart (trend), Stat card (KPI) |

---

### 3.4.4.journal — Journal Articles

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.4.journal` |
| **Metric Name** | Journal Articles |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].type` |
| **Formula Type** | `conditionalCount` (condition: `type = Journal Articles`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ ratio against `facultycount` |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ No dedicated BenchmarkMetric; rolls up into `3.4.4` |
| **Comparison** | ✅ dept-vs-dept |
| **Drill-down** | ✅ `drilldown/publications` (filter by type) |
| **Export** | ✅ `research-output`, `books` |
| **Filters** | `department`, `year`, `category`, `level` |
| **Recommended Chart** | Stacked bar (composition within total publications) |

---

### 3.4.4.bookchapter — Book Chapters

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.4.bookchapter` |
| **Metric Name** | Book Chapters |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].type` |
| **Formula Type** | `conditionalCount` (condition: `type = Book Chapters`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ Rolls up into `3.4.5_books` (books + chapters combined) |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `books` report |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Stacked bar alongside journal articles and conference papers |

---

### 3.4.5_books — Books Authored / Edited

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.5_books` |
| **Metric Name** | Books Authored / Edited |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].type` |
| **Formula Type** | `conditionalCount` (condition: `type = Books Authored / Edited`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ✅ `BenchmarkMetric: 3.4.5_books` — NAAC 3.4.5, max score 10 |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `books` report |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart, Stat card |

---

### 3.4.3 — Conference Papers

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.3` |
| **Metric Name** | Conference Papers |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].type` |
| **Formula Type** | `conditionalCount` (condition: `type = Conference Papers`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ No dedicated NAAC threshold for conference papers |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `research-output` |
| **Filters** | `department`, `year`, `level` |
| **Recommended Chart** | Stacked bar, Donut (share of conference vs journal) |

---

### pub.scopus — Scopus-Indexed Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.scopus` |
| **Metric Name** | Scopus-Indexed Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].indexedIn` |
| **Formula Type** | `conditionalCount` (condition: `indexedIn = Scopus`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ Maps to `3.4.8` (h-index) indirectly; no direct threshold |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `research-output` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart, Donut (Scopus vs WoS vs UGC share) |

---

### pub.wos — Web of Science Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.wos` |
| **Metric Name** | Web of Science Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].indexedIn` |
| **Formula Type** | `conditionalCount` (condition: `indexedIn = WoS`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ Feeds into NAAC `3.4.7` (citation index) indirectly |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `research-output` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart, Donut |

---

### pub.ugccare — UGC-CARE Listed Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.ugccare` |
| **Metric Name** | UGC-CARE Listed Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].indexedIn` |
| **Formula Type** | `conditionalCount` (condition: `indexedIn = UGC Care`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ Feeds into `3.4.4` total count benchmark |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/publications` |
| **Export** | ✅ `research-output` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Donut (UGC vs Scopus vs WoS share) |

---

### pub.international — International Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.international` |
| **Metric Name** | International Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].level` |
| **Formula Type** | `conditionalCount` (condition: `level = International`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ |
| **Export** | ✅ |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Stacked bar (International vs National), Gauge (% international) |

---

### pub.national — National Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.national` |
| **Metric Name** | National Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].level` |
| **Formula Type** | `conditionalCount` (condition: `level = National`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ |
| **Export** | ✅ |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Stacked bar alongside `pub.international` |

---

### pub.peerreviewed — Peer-Reviewed Publications

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.peerreviewed` |
| **Metric Name** | Peer-Reviewed Publications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].peerReviewed` |
| **Formula Type** | `conditionalCount` (condition: `peerReviewed = Yes`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ |
| **Export** | ✅ |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Gauge (% peer-reviewed), Donut |

---

### pub.avgimpactfactor — Average Impact Factor

| Field | Value |
|-------|-------|
| **Metric ID** | `pub.avgimpactfactor` |
| **Metric Name** | Average Impact Factor |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `publications[].impactFactor` |
| **Formula Type** | `average` |
| **Unit** | Decimal |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ (mean across all publications) |
| **Normalized** | ❌ Already a ratio by nature |
| **Individual** | ✅ average across one faculty's publications |
| **Trend** | ✅ year-over-year average |
| **Benchmark** | ⚠ Related to NAAC `3.4.7` (citation index); no direct threshold here |
| **Comparison** | ✅ dept-vs-dept average |
| **Drill-down** | ✅ sorted by `impactFactor` desc |
| **Export** | ✅ `research-output` |
| **Filters** | `department`, `year`, `category` |
| **Recommended Chart** | Bar chart (dept avg), Scatter plot (experience vs impact factor) |
| **Note** | `impactFactor` is stored as a free-text string; non-numeric values are silently skipped by the `average` formula handler |

---

## Section 2 — Research Projects & Funding (`Faculty.projects[]`)


### 3.2.2 — Total Research Projects

| Field | Value |
|-------|-------|
| **Metric ID** | `3.2.2` |
| **Metric Name** | Research Projects |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `projects[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `live` (V1) |
| **Absolute** | ✅ |
| **Normalized** | ✅ via `ratio.projectsperfaculty` |
| **Individual** | ✅ |
| **Trend** | ✅ `yearOverYear` (one of the default 3 series) |
| **Benchmark** | ✅ `BenchmarkMetric: 3.2.2` — NAAC 3.2.2, max score 15 |
| **Comparison** | ✅ dept-vs-dept |
| **Drill-down** | ✅ `drilldown/projects` |
| **Export** | ✅ `projects` report |
| **Filters** | `department`, `projectCategory`, `projectStatus`, `fundingAgency`, `from`, `to` |
| **Recommended Chart** | Bar chart (by dept), Area chart (funding trend), Stat card |

---

### 3.2.1 — Research Funding (₹)

| Field | Value |
|-------|-------|
| **Metric ID** | `3.2.1` |
| **Metric Name** | Research Funding |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `projects[].amountSanctioned` |
| **Formula Type** | `sum` |
| **Unit** | Currency (₹) |
| **Status** | `live` (V1) |
| **Absolute** | ✅ |
| **Normalized** | ✅ via `ratio.fundingperfaculty` |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ✅ `BenchmarkMetric: 3.2.1` — NAAC 3.2.1, max score 25 (in Lakhs) |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/projects` (sorted by amount) |
| **Export** | ✅ `projects`, `department-summary` |
| **Filters** | `department`, `fundingAgency`, `projectCategory`, `from`, `to` |
| **Recommended Chart** | Area chart (cumulative over time), Bar chart (by dept), Stat card |
| **Note** | `amountSanctioned` stored as comma-formatted string; parsed defensively |

---

### proj.ongoing / proj.completed — Project Status Breakdown

| Field | Value |
|-------|-------|
| **Metric ID** | `proj.ongoing`, `proj.completed` |
| **Metric Name** | Ongoing / Completed Projects |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `projects[].status` |
| **Formula Type** | `conditionalCount` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/projects` |
| **Export** | ✅ `projects` |
| **Filters** | `department`, `fundingAgency`, `from`, `to` |
| **Recommended Chart** | Donut (Ongoing vs Completed share), Stacked bar |

---

### proj.major / proj.minor / proj.international / proj.industry — Project Category Breakdown

| Field | Value |
|-------|-------|
| **Metric ID** | `proj.major`, `proj.minor`, `proj.international`, `proj.industry` |
| **Metric Name** | Projects by Category |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `projects[].projectCategory` |
| **Formula Type** | `conditionalCount` per category |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ (roll up into `3.2.2` for benchmark purposes) |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/projects` |
| **Export** | ✅ `projects` |
| **Filters** | `department`, `fundingAgency`, `projectStatus`, `from`, `to` |
| **Recommended Chart** | Donut (category share), Stacked bar (by dept) |

---

### proj.pi — Projects as Principal Investigator

| Field | Value |
|-------|-------|
| **Metric ID** | `proj.pi` |
| **Metric Name** | Projects as Principal Investigator |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `projects[].role` |
| **Formula Type** | `conditionalCount` (condition: `role = PI`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/projects` |
| **Export** | ✅ `projects` |
| **Filters** | `department`, `projectCategory` |
| **Recommended Chart** | Bar chart (by dept PI count) |

---

## Section 3 — Patents (`Faculty.patents[]`)

### 3.4.5 — Total Patents

| Field | Value |
|-------|-------|
| **Metric ID** | `3.4.5` |
| **Metric Name** | Patents |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `patents[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `live` (V1) |
| **Absolute** | ✅ |
| **Normalized** | ✅ via `ratio.patentsperfaculty` |
| **Individual** | ✅ |
| **Trend** | ✅ `yearOverYear` (default series) |
| **Benchmark** | ✅ `BenchmarkMetric: 3.4.2` — NAAC 3.4.2 Patents Awarded, max score 15 |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/patents` |
| **Export** | ✅ `patents` report |
| **Filters** | `department`, `patentStatus` |
| **Recommended Chart** | Bar chart (by dept), Stat card |

---

### patent.filed / patent.published / patent.granted — Patent Status Breakdown

| Field | Value |
|-------|-------|
| **Metric ID** | `patent.filed`, `patent.published`, `patent.granted` |
| **Metric Name** | Patents by Status |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `patents[].status` |
| **Formula Type** | `conditionalCount` per status |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ `patent.granted` feeds `BenchmarkMetric: 3.4.2` most directly |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/patents` |
| **Export** | ✅ `patents` |
| **Filters** | `department` |
| **Recommended Chart** | Donut (Filed/Published/Granted share), Stacked bar (by dept) |

---

## Section 4 — Awards (`Faculty.awards[]`)

### awards.total — Total Awards

| Field | Value |
|-------|-------|
| **Metric ID** | `awards.total` |
| **Metric Name** | Total Awards |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `awards[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ (awards per faculty) |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ✅ `BenchmarkMetric: 3.3.2` — NAAC awards for research/innovation, max score 5 |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/awards` (V3 new KPI) |
| **Export** | ✅ `awards` report |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart (by dept), Stat card |

---

### awards.international / awards.national / awards.state — Awards by Level

| Field | Value |
|-------|-------|
| **Metric ID** | `awards.international`, `awards.national`, `awards.state` |
| **Metric Name** | Awards by Level |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `awards[].level` |
| **Formula Type** | `conditionalCount` per level |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/awards` |
| **Export** | ✅ `awards` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Donut (level share), Stacked bar |

---

## Section 5 — Research Guidance (`Faculty.researchGuidance`)


### phd.completed / phd.inprogress — PhD Guidance

| Field | Value |
|-------|-------|
| **Metric ID** | `phd.completed`, `phd.inprogress` |
| **Metric Name** | PhD Scholars Guided / In Progress |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `researchGuidance.phdCompleted`, `researchGuidance.phdInProgress` |
| **Formula Type** | `objectSum` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ (PhD students per recognized guide) |
| **Individual** | ✅ per faculty |
| **Trend** | ✅ |
| **Benchmark** | ✅ `BenchmarkMetric: 3.4.3` — PhDs per recognized guide, max score 15 |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/researchGuidance` (V3 new KPI) |
| **Export** | ✅ `research-guidance` report |
| **Filters** | `department` |
| **Recommended Chart** | Bar chart (by dept), Radar (for individual faculty profile) |
| **Note** | Fields stored as numeric strings; parsed with `Number()` in `objectSum` handler |

---

### mphil.completed / mphil.inprogress — M.Phil Guidance

| Field | Value |
|-------|-------|
| **Metric ID** | `mphil.completed`, `mphil.inprogress` |
| **Metric Name** | M.Phil Scholars Guided / In Progress |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `researchGuidance.mphilCompleted`, `researchGuidance.mphilInProgress` |
| **Formula Type** | `objectSum` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ No direct NAAC threshold; contextual |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/researchGuidance` |
| **Export** | ✅ `research-guidance` |
| **Filters** | `department` |
| **Recommended Chart** | Stacked bar alongside `phd.*` metrics |

---

### pg.supervised — PG Projects Supervised

| Field | Value |
|-------|-------|
| **Metric ID** | `pg.supervised` |
| **Metric Name** | PG Projects Supervised |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `researchGuidance.pgProjectsSupervised` |
| **Formula Type** | `objectSum` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/researchGuidance` |
| **Export** | ✅ `research-guidance` |
| **Filters** | `department` |
| **Recommended Chart** | Bar chart (by dept) |

---

## Section 6 — FDP / Workshops (`Faculty.fdpWorkshops[]`)

### fdp.total — FDP / Workshop Participations

| Field | Value |
|-------|-------|
| **Metric ID** | `fdp.total` |
| **Metric Name** | FDP / Workshop Participations |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `fdpWorkshops[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ (FDPs per faculty) |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ✅ `BenchmarkMetric: 6.3.3` — % teachers completing FDP, max score 6 |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/fdp` (V3 new KPI) |
| **Export** | ✅ `fdp-workshops` report |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart (by dept), Trend line (year-on-year) |

---

### fdp.online / fdp.offline — FDP by Mode

| Field | Value |
|-------|-------|
| **Metric ID** | `fdp.online`, `fdp.offline` |
| **Metric Name** | Online / Offline FDP Participations |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `fdpWorkshops[].mode` |
| **Formula Type** | `conditionalCount` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/fdp` |
| **Export** | ✅ `fdp-workshops` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Donut (Online vs Offline share) |

---

## Section 7 — Online Courses (`Faculty.onlineCourses[]`)

### courses.total — Online Courses / Certifications

| Field | Value |
|-------|-------|
| **Metric ID** | `courses.total` |
| **Metric Name** | Online Courses / Certifications |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `onlineCourses[]` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ Contextual input to `1.3.2` (value-added courses) |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/courses` (V3 new KPI) |
| **Export** | ✅ `fdp-workshops` (combined) |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart (by dept) |

---

## Section 8 — Memberships (`Faculty.memberships[]`)

### membership.total / membership.life — Professional Memberships

| Field | Value |
|-------|-------|
| **Metric ID** | `membership.total`, `membership.life` |
| **Metric Name** | Professional Memberships / Life Memberships |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `memberships[]`, `memberships[].membershipType` |
| **Formula Type** | `count`, `conditionalCount` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/memberships` (V3 new KPI) |
| **Export** | ✅ `faculty-individual` |
| **Filters** | `department` |
| **Recommended Chart** | Bar chart (by dept), Donut (Life vs Annual) |

---

## Section 9 — International Experience (`Faculty.internationalExperience[]`)

### intl.total / intl.research — International Engagements

| Field | Value |
|-------|-------|
| **Metric ID** | `intl.total`, `intl.research` |
| **Metric Name** | International Engagements / Research Engagements |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `internationalExperience[]`, `internationalExperience[].purpose` |
| **Formula Type** | `count`, `conditionalCount` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/internationalExperience` (V3 new KPI) |
| **Export** | ✅ `faculty-individual` |
| **Filters** | `department`, `year` |
| **Recommended Chart** | Bar chart (by dept), Donut (purpose breakdown) |

---

## Section 10 — Administration & Extension (10 array sections)


All ten administration/extension sections follow the same pattern: simple `count` of array entries per faculty, aggregated institution-wide or department-scoped.

| Metric ID | Metric Name | Source Field | Benchmark Metric | Report |
|-----------|-------------|--------------|-----------------|--------|
| `admin.total` | Admin Responsibilities | `adminResponsibilities[]` | ❌ | `faculty-individual` |
| `deptcharges.total` | Departmental Charges | `departmentalCharges[]` | ❌ | `faculty-individual` |
| `specialassign.total` | Special Assignments | `specialAssignments[]` | ❌ | `faculty-individual` |
| `extrainst.total` | Extra-Institutional Activities | `extraInstitutionalActivities[]` | ❌ | `faculty-individual` |
| `adminnonacad.total` | Admin & Non-Academic Resp. | `adminNonAcademicResponsibilities[]` | ❌ | `faculty-individual` |
| `acadadmin.total` | Academic Administration | `academicAdministration[]` | ❌ | `faculty-individual` |
| `researchinnov.total` | Research & Innovation | `researchAndInnovation[]` | ❌ | `faculty-individual` |
| `examseval.total` | Examination & Evaluation | `examinationAndEvaluation[]` | ❌ | `faculty-individual` |
| `adminsupport.total` | Administrative Support | `administrativeSupport[]` | ❌ | `faculty-individual` |
| `qa.total` | Quality Assurance Activities | `qualityAssurance[]` | ⚠ feeds `6.5.2` | `iqac-criterion` |

**All ten share these properties:**

| Field | Value |
|-------|-------|
| **Source Model** | `Faculty` |
| **Formula Type** | `count` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ (per faculty) |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ (except `qa.total` — contextual) |
| **Comparison** | ✅ dept-vs-dept |
| **Drill-down** | ✅ via new V3 KPI configs |
| **Export** | ✅ `faculty-individual` |
| **Filters** | `department` |
| **Recommended Chart** | Radar chart (shows all 10 dimensions for one faculty or dept), Bar chart (by dept for one dimension) |


---

## Section 11 — Faculty Profile & Qualifications

### qual.phdholders — Faculty with PhD

| Field | Value |
|-------|-------|
| **Metric ID** | `qual.phdholders` |
| **Metric Name** | Faculty with PhD |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `qualifications[].degreeLevel` |
| **Formula Type** | `conditionalCount` (condition: `degreeLevel = Ph.D`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ via `pct.phdholders` |
| **Individual** | ✅ (has PhD: yes/no) |
| **Trend** | ✅ (year of passing available) |
| **Benchmark** | ✅ `BenchmarkMetric: 2.4.2` — % teachers with PhD, max score 40 |
| **Comparison** | ✅ dept-vs-dept PhD headcount |
| **Drill-down** | ✅ `drilldown/faculty` filtered by qualification |
| **Export** | ✅ `faculty-profile`, `iqac-criterion` |
| **Filters** | `department`, `qualification` |
| **Recommended Chart** | Gauge (% of faculty with PhD), Bar chart (by dept) |
| **Note** | Counts entries in `qualifications[]` where `degreeLevel = Ph.D` — a faculty with multiple doctorates is counted multiple times; acceptable for aggregation purposes |

---

### qual.netset — Faculty with NET/SET/GATE

| Field | Value |
|-------|-------|
| **Metric ID** | `qual.netset` |
| **Metric Name** | Faculty with NET/SET/GATE |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `eligibilityTests[].examName` |
| **Formula Type** | `conditionalCount` (condition: `examName = NET`) |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ✅ |
| **Individual** | ✅ |
| **Trend** | ✅ |
| **Benchmark** | ❌ No direct NAAC threshold; contextual for Teacher Profile |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/faculty` |
| **Export** | ✅ `faculty-profile` |
| **Filters** | `department` |
| **Recommended Chart** | Bar chart (by dept), Gauge (% NET qualified) |
| **Note** | Currently counts `examName = NET` only; extend conditionValue to a list for SET/GATE requires a new `conditionalCountMulti` formula type (planned, not yet implemented) |

---

### emp.avgExperience — Average Teaching Experience

| Field | Value |
|-------|-------|
| **Metric ID** | `emp.avgExperience` |
| **Metric Name** | Average Teaching Experience (Years) |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `employmentDetails.totalExperienceYears` |
| **Formula Type** | `average` |
| **Unit** | Years |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ (mean across dept or institution) |
| **Normalized** | ❌ Already a mean |
| **Individual** | ✅ individual years |
| **Trend** | ⚠ Not meaningful year-over-year (tenure grows linearly) |
| **Benchmark** | ✅ `BenchmarkMetric: 2.4.3` — avg experience ≥15 yrs, max score 10 |
| **Comparison** | ✅ dept-vs-dept average |
| **Drill-down** | ✅ `drilldown/faculty` sorted by experience |
| **Export** | ✅ `faculty-profile` |
| **Filters** | `department`, `designation`, `minExperience`, `maxExperience` |
| **Recommended Chart** | Bar chart (dept averages), Scatter plot (experience vs publications) |
| **Note** | `totalExperienceYears` stored as string; parsed as float; non-numeric values skipped |

---

### facultycount — Total Faculty Count

| Field | Value |
|-------|-------|
| **Metric ID** | `facultycount` |
| **Metric Name** | Total Faculty Count |
| **Source Model** | `Faculty` |
| **Source Field(s)** | Collection count |
| **Formula Type** | `facultyCount` |
| **Unit** | Count |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ |
| **Normalized** | ❌ Base denominator — not itself normalized |
| **Individual** | ❌ |
| **Trend** | ✅ (faculty headcount growth) |
| **Benchmark** | ✅ `BenchmarkMetric: 2.4.1` — % sanctioned posts filled |
| **Comparison** | ✅ |
| **Drill-down** | ✅ `drilldown/faculty` |
| **Export** | ✅ `faculty-profile`, `university-summary` |
| **Filters** | `department`, `designation` |
| **Recommended Chart** | Stat card, Bar chart (by dept) |
| **Note** | Scope-aware since V3 Phase 1 — `filter` param passed to `Faculty.countDocuments()` |

---

## Section 12 — Normalized / Ratio Metrics

These metrics are **derived** from two already-computable absolute metrics. They do not read the database directly — they call `calculateMetric()` twice (numerator + denominator) via the existing `ratio` or `metricPercentage` formula type.

| Metric ID | Name | Numerator | Denominator | Unit | Benchmark |
|-----------|------|-----------|-------------|------|-----------|
| `ratio.pubsperfaculty` | Publications per Faculty | `3.4.4` | `facultycount` | Ratio | ⚠ context for `3.4.4` |
| `ratio.projectsperfaculty` | Projects per Faculty | `3.2.2` | `facultycount` | Ratio | ⚠ context for `3.2.2` |
| `ratio.patentsperfaculty` | Patents per Faculty | `3.4.5` | `facultycount` | Ratio | ❌ |
| `ratio.fundingperfaculty` | Research Funding per Faculty (₹) | `3.2.1` | `facultycount` | Currency (₹) | ❌ |
| `pct.phdholders` | % Faculty with PhD | `qual.phdholders` | `facultycount` | Percentage | ✅ feeds `2.4.2` |

**All ratio/percentage metrics share:**

| Field | Value |
|-------|-------|
| **Source Model** | Derived (calls two other metrics) |
| **Status** | `seeded` (V3) |
| **Absolute** | ✅ (the ratio itself is the absolute value) |
| **Normalized** | ❌ Already normalized by definition |
| **Individual** | ✅ per-faculty version computed in `facultyProfileAnalyticsService` |
| **Trend** | ✅ year-over-year ratio trend |
| **Comparison** | ✅ dept A ratio vs dept B ratio |
| **Drill-down** | ✅ via underlying numerator's drill-down |
| **Export** | ✅ `university-summary`, `department-summary` |
| **Filters** | Same as numerator metric |
| **Recommended Chart** | Bar chart (ratio by dept), Gauge (achievement vs benchmark) |

---

## Section 13 — Student Metrics (`StudentProfile`)


### studentCount — Total Students

| Field | Value |
|-------|-------|
| **Metric ID** | (built-in `studentCount` formulaType, not a seeded Metric doc) |
| **Metric Name** | Total Students |
| **Source Model** | `StudentProfile` |
| **Source Field(s)** | Collection count |
| **Formula Type** | `studentCount` |
| **Unit** | Count |
| **Status** | `live` (V1) |
| **Absolute** | ✅ |
| **Normalized** | ❌ |
| **Individual** | ❌ |
| **Trend** | ✅ |
| **Benchmark** | ⚠ feeds student-faculty ratio `2.2.2` |
| **Comparison** | ✅ |
| **Drill-down** | ❌ (student profiles are a separate module) |
| **Export** | ✅ `student-summary` |
| **Filters** | `program`, `studentDept` |
| **Recommended Chart** | Stat card, Donut (by program level) |
| **Note** | `StudentProfile` uses `academic_details.faculty` for department (free-text string). Cross-join with Faculty department names is soft/inexact — a "data consistency" badge is recommended in the UI |

---

### Student Distribution Metrics (existing V1 aggregation functions)

These are computed by `getStudentDepartments()` and `getProgramLevels()` in `analyticsService.js` — they are not seeded `Metric` documents; they are bespoke aggregation functions called by V1 routes.

| Metric | Source Field | Unit | Status | Chart |
|--------|-------------|------|--------|-------|
| Students by department | `academic_details.faculty` | Count | `live` (V1) | Bar, Donut |
| Students by program level | `academic_details.programLevel` | Count | `live` (V1) | Donut, Bar |
| Student profile completion | all fields (recursive count) | Percentage | `live` (V1) | Gauge, Distribution histogram |
| Students by admission category | `academic_details.admissionCategory` | Count | `planned` (V3 Phase 2+) | Donut |
| Students by mode of study | `academic_details.modeOfStudy` | Count | `planned` | Donut |

---

## Section 14 — Profile Completion (`Faculty.completionPercentage`, `Faculty.profileComplete`)

| Field | Value |
|-------|-------|
| **Metric ID** | (computed inline in V1 route handlers, not a seeded Metric doc) |
| **Metric Name** | Profile Completion Percentage |
| **Source Model** | `Faculty` |
| **Source Field(s)** | `completionPercentage`, `profileComplete` |
| **Formula Type** | Computed inline (average, filter, bucket) |
| **Unit** | Percentage |
| **Status** | `live` (V1) |
| **Absolute** | ✅ per-faculty percentage; institution average |
| **Normalized** | ❌ Already a percentage |
| **Individual** | ✅ per-faculty breakdown by section (planned: `profileCompletionDetailService`) |
| **Trend** | ⚠ Completion is cumulative — year-over-year not naturally meaningful unless snapshot history is stored |
| **Benchmark** | ❌ No NAAC threshold directly; feeds quality indicators |
| **Comparison** | ✅ dept-vs-dept avg completion |
| **Drill-down** | ✅ `drilldown/faculty` sorted by completion% |
| **Export** | ✅ `faculty-profile` |
| **Filters** | `department`, `designation` |
| **Recommended Chart** | Gauge (institution avg vs 100%), CoverageHeatMap (per-metric), Histogram (distribution 0–25/26–50/51–75/76–100%) |

---

## Section 15 — NAAC Benchmark Computability Audit

This table classifies all 44 NAAC benchmark metrics (from `benchmarkSeeder.js`) as:
- ✅ **Computable** — a `Metric` document exists (or is seeded by V3) with `computedField` set
- ⚠ **Partial** — computable with caveats or approximate proxy
- ❌ **Manual** — not derivable from current schema; requires manual data entry

| Metric ID | Name | Status | Reason if Manual/Partial |
|-----------|------|--------|--------------------------|
| `1.2.1` | New Courses Introduced (%) | ❌ Manual | No programme/course catalogue in schema |
| `1.3.2` | Value-Added / MOOC Courses | ⚠ Partial | `onlineCourses[]` is a proxy; not an institutional enrolment count |
| `1.3.3` | Programs with Field Projects (%) | ❌ Manual | No programme-level data in schema |
| `1.4.1` | Structured Feedback System | ❌ Manual | Qualitative/documentary evidence |
| `2.1.1` | Enrollment Percentage | ❌ Manual | No intake quota field in schema |
| `2.1.2` | Reserved Category Seats Filled (%) | ❌ Manual | No reservation quota field |
| `2.2.2` | Student-Teacher Ratio | ⚠ Partial | Soft join `studentCount ÷ facultycount`; dept-level join is inexact (see §2.3 naming mismatch) |
| `2.4.1` | Full-Time Teachers Appointed (%) | ❌ Manual | No sanctioned-posts count in schema |
| `2.4.2` | Teachers with PhD (%) | ✅ via `pct.phdholders` | |
| `2.4.3` | Average Teaching Experience | ✅ via `emp.avgExperience` | |
| `2.5.1` | Days to Declare Results | ❌ Manual | Examination dates not in schema |
| `2.5.2` | Student Grievances (%) | ❌ Manual | No grievance tracking in schema |
| `2.5.3` | Examination Automation Status | ❌ Manual | Qualitative/documentary |
| `2.6.2` | Pass Percentage of Students | ❌ Manual | No result/grade data in StudentProfile |
| `3.1.2` | Seed Money to Teachers (Lakhs) | ❌ Manual | No institutional finance data in schema |
| `3.1.3` | Teachers with Fellowship (%) | ❌ Manual | No fellowship tracking field in schema |
| `3.1.4` | JRF/SRF among PhD Scholars (%) | ❌ Manual | No fellowship type on `researchGuidance.studentDetails[]` |
| `3.2.1` | Research Funding (Lakhs) | ✅ via `3.2.1` | Convert ₹ to Lakhs in display layer |
| `3.2.2` | Research Projects per Teacher | ✅ via `ratio.projectsperfaculty` | |
| `3.3.2` | Awards for Research/Innovation | ✅ via `awards.total` | |
| `3.4.2` | Patents Awarded | ✅ via `patent.granted` (granted = awarded) | |
| `3.4.3` | PhDs per Recognized Guide | ⚠ Partial | `phd.completed ÷ guides.count`; `guides.count` needs `existsNumericGtZero` formula type (planned) |
| `3.4.4` | Research Papers per Teacher (UGC) | ✅ via `ratio.pubsperfaculty` | |
| `3.4.5_books` | Books/Chapters per Teacher | ✅ via `3.4.5_books` count | |
| `3.4.7` | Average Citation Index | ❌ Manual | No citation data; `orcidId/scopusId` are IDs only |
| `3.4.8` | h-Index of University | ❌ Manual | Same — no citation data |
| `3.5.1` | Consultancy Revenue (Lakhs) | ❌ Manual | No consultancy income field in schema |
| `3.6.2` | Extension/Outreach Programs | ⚠ Partial | `extraInstitutionalActivities[]` + `specialAssignments[]` are proxies |
| `3.7.1` | Functional MoUs | ⚠ Partial | Proxy via `extraInstitutionalActivities[]` admin charges; no dedicated MoU field |
| `4.1.2` | Infrastructure Expenditure (%) | ❌ Manual | No financial expenditure data in schema |
| `4.2.2` | Library Expenditure (%) | ❌ Manual | Same |
| `4.3.2` | Student-Computer Ratio | ❌ Manual | No computer inventory in schema |
| `4.4.1` | Maintenance Expenditure (%) | ❌ Manual | Same |
| `5.1.1` | Students with Scholarships (%) | ❌ Manual | No scholarship tracking in StudentProfile |
| `5.2.1` | Placement Percentage | ❌ Manual | No placement data in schema |
| `5.2.2` | Students in Higher Education (%) | ❌ Manual | No progression data in schema |
| `5.2.3` | Students Qualifying National Exams | ❌ Manual | No competitive exam results in schema |
| `5.3.1` | Student Awards (Sports/Cultural) | ❌ Manual | No student awards field in StudentProfile |
| `5.4.1` | Alumni Contribution (Lakhs) | ❌ Manual | No alumni module in schema |
| `6.3.2` | Teachers with Conference Support (%) | ⚠ Partial | `fdp.total` is a weak proxy; no financial-support flag in `fdpWorkshops[]` |
| `6.3.3` | Teachers Completing FDP (%) | ✅ via `fdp.total ÷ facultycount` | |
| `6.4.2` | Government Grants for Infrastructure | ❌ Manual | No institutional grants data |
| `7.1.2` | Alternate Energy Sources | ❌ Manual | Qualitative/documentary |
| `7.1.4` | Water Conservation Facilities | ❌ Manual | Qualitative/documentary |

**Summary: 10 Computable ✅ | 6 Partial ⚠ | 28 Manual ❌**

Manual-entry metrics display threshold tables in the Benchmark tab with `status: 'unknown'` and a "Manual entry required" badge — this is already handled gracefully by the existing `benchmarkService.js` and `BenchmarkPage.tsx`.


---

## Section 16 — Metrics Not Implementable Without Schema Changes

These metrics are explicitly documented as **out of scope** for V3. They must not be fabricated. If a future version adds the required fields, the corresponding Metric document and seeder entry can be added at that time without changing any service logic.

| Metric | Missing Field | Schema Change Required |
|--------|--------------|----------------------|
| Citation Count per publication | `publications[].citationCount` | Add `citationCount: Number` to `publicationSchema` |
| H-Index per faculty | Derived from citation data | Requires citation count first |
| Live Scopus/WoS sync | External API data | New ETL pipeline + new schema fields |
| Placement rate | No placement module | New `PlacementRecord` model |
| Alumni contribution | No alumni module | New `AlumniContribution` model |
| Student scholarship count | `StudentProfile` has no scholarship field | Add `scholarships[]` to `StudentProfile` |
| Student competitive exam results | No results field | Add `competitiveExamResults[]` to `StudentProfile` |
| Campus filter | No `campus` field | Add `campus` to `Department` and `employmentDetails` |
| MoU count (dedicated) | No `MoU` model | New `MoU` model or field on `Department` |
| Retirement pipeline | `dateOfRetirement` is free-text string | Normalize to `Date` type for reliable date-window queries |

---

## Section 17 — Future Metric Design Principles

Every metric added in future phases should follow these rules, derived from the V3 specification:

1. **Source from existing schema fields only.** Never add a computed or derived field to `Faculty.js` or `StudentProfile.js` just to make a metric easier to calculate — derive it at query time instead.

2. **Use the existing formula type registry first.** Before creating a new `formulaType`, verify that `count`, `conditionalCount`, `sum`, `objectSum`, `average`, `ratio`, `metricPercentage`, `facultyCount`, `percentage`, `studentCount`, `studentConditionalCount`, `studentExists`, `distinctGroupCount` cannot satisfy the requirement. Most future metrics will reuse these.

3. **Design for all view modes.** When adding a metric, document all applicable view modes in this inventory. The backend service should be scope-aware from day one (`filter` param on `calculateMetric()`).

4. **One `Metric` document per atomic concept.** Do not create one "Publications" metric with a `type` parameter — create separate `Metric` documents for each type. This keeps the engine stateless and the API surface predictable.

5. **Normalized metrics are always derived, never stored.** Publication count is stored. Publications per faculty is a `ratio` metric that reads two stored counts at query time. Never pre-aggregate into a new field.

6. **Benchmarks are optional metadata.** A `BenchmarkMetric` document is separate from the `Metric` document. A computable metric with no NAAC threshold simply has no corresponding `BenchmarkMetric` — it still participates in all other view modes.

7. **Filters flow through `filterService.buildFacultyFilter()`.** New filter dimensions should be added there, not invented per-route. This keeps filter behavior consistent across all metrics.

8. **Drill-down is a KPI config entry, not a new service.** New drill-down targets are added to `KPI_CONFIG` in `drilldownService.js` — one object, three fields (`arrayField`, `searchFields`, `columns`). The pagination, search, and sort logic is shared.

9. **Reports are row generators, not new calculators.** New report types add a generator function to `reportService.js` that calls already-computed service functions. They never re-implement aggregation logic.

10. **Document before implementing.** Every new metric must have an entry in this inventory before its `Metric` document is seeded or its route is written.

---

## Appendix A — Quick Reference: Formula Type Capabilities

| Formula Type | Scope-aware (`filter`) | Works on | Example metric |
|---|---|---|---|
| `count` | ✅ | Array field — counts all entries | Total publications |
| `conditionalCount` | ✅ | Array field — counts entries matching one condition | Journal articles only |
| `sum` | ✅ | Array sub-field (numeric string) | Total research funding |
| `objectSum` | ✅ | Object field with numeric string values | PhD scholars completed |
| `average` | ✅ | Array or object field (numeric string) | Average impact factor |
| `percentage` | ✅ | Array field existence vs total faculty | Profile completion % |
| `ratio` | ✅ (propagated) | Two metric IDs (numerator ÷ denominator) | Publications per faculty |
| `metricPercentage` | ✅ (propagated) | Two metric IDs (numerator ÷ denominator × 100) | % faculty with PhD |
| `facultyCount` | ✅ | Collection count | Total faculty |
| `studentCount` | ❌ | Student collection count (no filter support yet) | Total students |
| `studentConditionalCount` | ❌ | Student field match | Students by admission category |
| `studentExists` | ❌ | Student field presence | Students with email |
| `distinctGroupCount` | ✅ | Distinct values of a field | Distinct designations |

**Note:** `student*` formula types do not yet pass `filter` — they always query the full `StudentProfile` collection. This is acceptable because student analytics are not currently scope-filtered by department in V1/V2 either. Scope filtering for student metrics is a future enhancement.

---

## Appendix B — Metric Seeding Location Reference

| Metric Group | Seeder File | Collection |
|---|---|---|
| V1 live metrics (3.4.4, 3.2.2, 3.4.5, 3.2.1) | Manual / existing DB | `metrics` |
| V3 new metrics (57 documents) | `server/seeders/analyticsV3MetricSeeder.js` | `metrics` |
| NAAC benchmark thresholds (44 documents) | `server/seeders/benchmarkSeeder.js` | `benchmarkmetrics` |
| Faculty demo data | `server/seeders/analyticsDataSeeder.js` | `faculties`, `users` |

---

*End of METRIC_INVENTORY.md — update this document whenever a metric is added, modified, or deprecated.*
