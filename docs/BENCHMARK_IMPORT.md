# NAAC Benchmark Management and PDF Import

Admin → **Benchmark Management** (`/admin/benchmark-import`) is the single place where administrators manage the benchmark
*definitions* (the scoring rules) that **Analytics → Benchmark** scores institutional data against. Institutional values are never
stored here: they are always calculated from institutional records through the mapped analytics metric.

Three tabs: **Catalogue** (live definitions) · **PDF import & versions** · **Audit log**. Every rule below is enforced on the server
(`auth` + `adminOnly`: admin/superadmin); the UI is only an interface.

## 1. Catalogue (live definitions)

* Search by metric ID or description (literal text, not a regex); filter by **Criterion 1–7**, **status**, **import version / origin**
  (import vN, seeded, added manually) and **mapped/unmapped**; paginated (25 per page, max 100).
* **Inspect**: description, unit, weight, period, direction, every score band as printed *and* as an interval with inclusivity
  (`[15, 20)`), categorical option texts, the mapped analytics metric (name, formula type, supported?), source/version/revision and the per-record history.
* **Add** manually, **Edit** (metric ID is immutable), **Deactivate / Reactivate** (with a reason). There is **no delete**: a deactivated
  metric disappears from Analytics at once but is kept with who/when/why.
* Same server validation as imports. Errors (no bands, unreadable/conflicting band such as `20-10`, mixed letters and numbers, bad unit, bad ID, criterion outside 1–7…) refuse the change;
  warnings (e.g. unknown analytics mapping) are returned and shown. Free text is stripped of control characters and length-capped.
* Every change writes an audit entry with the actor and a before/after snapshot, bumps `source.revision`, and invalidates the benchmark cache, so Analytics reflects it immediately.
* Manual edits apply to the live record directly (one admin action, fully audited). Catalogue **versions** are separate: a rollback restores a version's snapshot, which replaces later manual edits; those edits stay in the audit trail.

## 2. PDF import → review → approve → activate

`upload → draft → (edit, review) → approve → preview → activate`  ·  `reject`  ·  `rollback` to a previously active version.

* **A failed or abandoned import never changes the live catalogue.** Upload only creates a draft.
* **Upload checks:** admin only; PDF content type *and* `%PDF-` header; ≤ 12 MB; ≤ 80 pages; must contain recognisable metric rows; ≤ 2 PDFs processed at once (third gets HTTP 429).
* **Storage:** the PDF is kept **privately in MongoDB** (`benchmarkimportfiles`, keyed by import id, with hash and size). It is not on a public path or on the host's ephemeral disk, there is no user-supplied path (file names are never used for storage; only the base name is kept as a label), and it is served only by `GET …/benchmark-imports/:id/source` (admin only, `private, no-store`, `nosniff`, fixed download name). Set `BENCHMARK_STORE_SOURCE_PDF=false` to skip storing; review still works from the per-row evidence text.
* **Bounded processing:** pages are read in chunks of 4 and handed to the parser one at a time (nothing is accumulated), the event loop is yielded between chunks, and a 90 s time budget stops runaway files (HTTP 422, no draft).
* **Retry-safe:** uploading the identical file while its draft is still open returns that draft (HTTP 200, `reused: true`) instead of creating another version. Re-uploading a file that was already approved/activated creates a new draft with an explicit warning.
* **Extracted:** metric ID, criterion, key indicator, description, option texts (A–E), sub-points, weighted score, unit (inferred), applicable period, score bands 4→0, direction, optional printed formula (kept as display text only) and notes, plus **source evidence** (page numbers and the raw text each row was read from; “Open source PDF” opens the stored PDF at that page).
* **Flags (recomputed server-side on every edit):** *errors* block approval: no bands, unreadable/reversed band, non-monotonic bands, mixed band types, duplicate ID in the import, bad unit/ID. *Warnings* must be ticked “Reviewed”: ambiguous unit, unusual band layout (`ambiguous_row`), broken text spacing, conflicts with the live catalogue, same ID but different meaning (analytics mapping is not carried over), equivalent to another live metric. *Info*: unmapped metric, formula not executable, period not stated.
* **Categorical** A–E benchmarks stay categorical (no numeric thresholds invented). A metric with no bands in the PDF (e.g. 2.7.1) is flagged; enter bands manually or exclude it.
* **Preview before activating:** `GET …/:id/preview?mode=merge|replace` lists **additions, modifications (with the changed fields), deactivations, unchanged** and metrics kept active. The UI requires the preview for the chosen mode before enabling *Activate*.
  `merge` = partial update (only included rows; other metrics stay active, only an equivalent older entry such as `3.4.5_books` is deactivated); `replace` = full replacement (metrics not in the version are deactivated, never deleted).
* **Publishing strategy (not a database transaction):** the target documents are built and validated against the Mongoose schema **before any write**; then written; if any write fails the touched documents are restored and documents created by the attempt are removed, the version stays `approved`, and the failure is audited (retry is safe). MongoDB multi-document transactions are not assumed (they need a replica set); if you run one, wrapping `applyVersion` in a session is a straightforward hardening.
* **History/rollback:** every version is an immutable snapshot. The first activation also snapshots the pre-existing seeded catalogue as a *baseline* version so even that is restorable. Recorded per version: uploaded by, last reviewed by, approved by, activated by (also for rollbacks).
* **Audit log** (`benchmarkauditlogs`, append-only) records upload / upload_reused / upload_rejected / extract / extract_failed / row_add / row_edit / approve / approve_rejected / activate / activate_failed / replace / rollback / reject / baseline_snapshot / source_download, **one `record_change` entry per benchmark that an activation or rollback added, modified (with fields) or deactivated**, and `record_create/update/deactivate/reactivate` for manual changes, each addressable by metric ID.

### OCR / scanned PDFs / tables
* Extraction reads the PDF **text layer** with `pdfjs-dist` and assigns band cells to the score columns by x-position (so wrapped cells such as `1000-` / `1500` are joined). No external AI service or API key is used or needed.
* **OCR is not built in.** A PDF with no text layer is rejected with `SCANNED_PDF` and guidance. Recommended fallback: add a text layer first (for example `ocrmypdf scan.pdf searchable.pdf`) and upload that, or use a manual draft. OCR inside the web process would need rasterisation (native `canvas`) plus Tesseract language data, which the Render/Netlify setup does not provide.
* The parser is tuned to the General University Manual layout. Other layouts may yield no rows (then the file is rejected as “not a benchmark document”) or rows flagged for review. It never fills a missing value silently.

### Upload errors and troubleshooting
Every extraction failure is classified, logged on the server with the **original exception, stack and cause chain** (never the PDF's bytes/text or the uploaded file name) under a short `reference`, shown to the admin as the same reference, and audited (`extract_failed` with category, name, code).

| HTTP | `code` | Meaning | What to do |
|---|---|---|---|
| 503 | `PDF_EXTRACTOR_UNAVAILABLE` | The PDF engine (`pdfjs-dist@3.x`) cannot be loaded on the server. **Not a problem with the file.** | `npm install` in `server/`, restart. |
| 503 | `PDF_EXTRACTOR_INCOMPATIBLE` | A different `pdfjs-dist` major is installed (4.x/5.x have no CommonJS `legacy/build/pdf.js`). | Reinstall server dependencies (`pdfjs-dist` must be 3.x as in `package.json`). |
| 422 | `PDF_PASSWORD_PROTECTED` | Encrypted PDF. | Remove the password. |
| 422 | `PDF_UNREADABLE` | Damaged/truncated PDF. | Re-export the PDF. |
| 422 | `SCANNED_PDF` / `NOT_A_BENCHMARK_DOCUMENT` | No text layer / no metric rows recognised. | OCR first, or manual draft. |
| 500 | `PDF_PROCESSING_ERROR` | Unexpected error in our code. | Send the reference; the stack is in the server log. |

The server logs `[benchmark-import] PDF engine ready (pdfjs-dist x.y.z, node vN)` or `PDF engine NOT usable: …` at start-up, and **Admin → Benchmark Management → status** (`GET /admin/benchmark-imports/status`) shows `pdfExtractor` (version, compatibility and a deep self-check that extracts text from a built-in PDF).

## 3. Scoring and Analytics integration
* `>=x`, `>x`, `<=x`, `<x`; `a-b` means `a ≤ v < b`; `a:1` ratios use `a`. Direction is derived from the bands; the gap is always shortfall-positive. Categorical metrics accept only A–E values.
* **Insufficient data** (`currentValue/gap/score = null`, `insufficientReason`) when the metric is unmapped, the analytics metric is undefined/unsupported, there are no institutional records, the calculation fails, or no A–E assessment exists. A computed `0` with records present is a real value.
* `GET /api/faculty/analytics/benchmark` keeps its shape and keys; additive keys: `catalog{origin: seed|import|manual, versionNo, sourceFilename, approvedBy, editedBy, revision}`, `analyticsMapped`, `insufficientReason`, `statusLabel`, `bandLabel`, `scoringType`, `direction`, `formula`, `notes`. Only **active** records are returned. `GET /benchmark/catalogue-status` explains an empty table.
* The old static `server/modules/analytics/data/benchmarkThresholds.js` is **not used by any code** (verified by search) and is marked deprecated; there is no second threshold list to conflict with the database.
* Definitions are institution-wide (the project has no tenant model). Authorization is role-based on the server.

## 4. API (all `auth` + `adminOnly`)
Catalogue `/api/faculty/admin/benchmark-catalogue`: `GET /` (q, criterion, status, version, mapping, page, limit) · `GET /metric-options` · `GET /:metricId` · `GET /:metricId/history` · `POST /` · `PATCH /:metricId` · `POST /:metricId/deactivate` · `POST /:metricId/reactivate`.
Imports `/api/faculty/admin/benchmark-imports`: `GET /status` · `GET /audit-log` · `GET /` · `POST /upload` · `POST /manual` · `GET /:id` · `GET /:id/preview` · `GET /:id/source` · `POST /:id/rows` · `PATCH /:id/rows/:rowId` · `POST /:id/approve` · `POST /:id/activate {mode}` · `POST /:id/rollback` · `POST /:id/reject`.

## 5. Safe procedure to import and publish the manual
1. Admin → Benchmark Management → **PDF import & versions**. Read the *Catalogue status* card (database name, active/mapped counts, warnings).
2. Choose `University_Benchmarks (2)-2.pdf`, enter a document version, **Upload & extract**. A draft is created; nothing is live.
3. Review rows. Use *Only rows needing attention*, open **Evidence** beside a row to compare with the PDF page, fix bands/units/mapping (e.g. 5.3.1 prints `20-10`), **exclude** metrics you will not publish (2.7.1 has no bands), tick **Reviewed** on warnings.
4. **Approve** (refused while errors/unreviewed warnings remain). Still not live.
5. Choose **Merge** or **Replace**, read the **Preview** (additions / modifications / deactivations), then **Activate**. Analytics now serves the version; the cache is invalidated.
6. Check Analytics → Benchmark. If wrong: **Roll back** the previous version in the versions list (or fix individual records in the Catalogue tab).

## 6. Production deployment checklist (no `seed:all`)
- [ ] Deploy backend (Render) and frontend (Netlify); no frontend config change is needed (same API base).
- [ ] `npm install` in `server/` (new dependency `pdfjs-dist@3.11.174`; its optional `canvas` may fail to build — extraction still works, a harmless polyfill warning is logged).
- [ ] No env vars required. Optional: `BENCHMARK_STORE_SOURCE_PDF=false`.
- [ ] Never run `seed:all` against production. If the *Catalogue status* card says the analytics Metric catalogue is empty, run only `npm run seed:v3metrics` once against the production `MONGO_URI` (existing script).
- [ ] Sign in as an administrator on the deployed site and follow section 5. Do not rely on `seed:benchmarks`.
- [ ] New collections are created on first use: `benchmarkimports`, `benchmarkauditlogs`, `benchmarkimportfiles`. `BenchmarkMetric` only gains optional fields.
- [ ] Multi-instance deployments: the reference cache is invalidated on the instance that served the change; others refresh within the 5-minute TTL.

### Why the deployed site showed “No benchmark data available” (static diagnosis)
Benchmarks are read from `benchmarkmetrics`, filled only by manual scripts (`seed:benchmarks` / `seed:all`); the server never seeds on start-up. Localhost had its own seeded database; production never did.
The old UI printed that message only for an HTTP 200 with an empty array, so the API route, CORS and response shape work and the production catalogue was empty. This was derived from the source; **the deployed services were not reachable from the development environment and were not tested.**

## 7. Local setup and tests
```
cd server && npm install && cd .. && npm install
npx tsc -b && npm run build                                   # frontend typecheck + production build
cd server/tests/phase6-benchmark-import   && node test.js      # parser on the real PDF, scoring, import lifecycle
cd ../phase7-benchmark-management          && node test.js      # catalogue CRUD, preview, storage, audit, Analytics, schema conformance
cd ../../..
JSDOM_PATH=<path>/node_modules/jsdom node tests/benchmark/run.mjs            # Benchmark table
JSDOM_PATH=<path>/node_modules/jsdom node tests/benchmark-catalogue/run.mjs  # catalogue management UI
```
Models are faked in the backend tests (no MongoDB in the sandbox); a separate section validates every generated document against the **real** Mongoose schemas.


## Deleting versions and benchmark records

Deletion is deliberately narrow: **one item at a time, administrators only, always confirmed, always audited.** There is no "delete all".

| What | Endpoint | Allowed when | Refused (409) when |
|---|---|---|---|
| A catalogue **version** (draft rows + its stored source PDF) | `DELETE /api/faculty/admin/benchmark-imports/:id` | status `draft`, `approved`, `rejected`, or `superseded` with no live record pointing at it | `active` (`VERSION_ACTIVE`), the pre-import baseline snapshot (`VERSION_BASELINE`), a version a live record still references (`VERSION_IN_USE`) |
| One **live benchmark record** | `DELETE /api/faculty/admin/benchmark-catalogue/:metricId` | the record is **inactive** (deactivate it first) | the record is active and therefore used by Analytics (`RECORD_ACTIVE`) |

Invalid or unknown identifiers return 404; non-administrators get 403, anonymous callers 401.

Never removed: analytics metric definitions (`metrics`), other versions, other benchmark records, and **any audit entry**.
Each deletion appends a `version_delete` / `record_delete` entry (who, role, when, plus a snapshot of what was removed);
refused attempts append `delete_rejected`. In the UI a confirmation dialog names the item and requires typing its identifier
(e.g. `v3` or `2.4.2`); the button is disabled while the request runs. Note: activating or rolling back a version whose
snapshot contains a deleted metric ID would add that metric back.
