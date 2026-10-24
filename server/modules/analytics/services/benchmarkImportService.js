/**
 * benchmarkImportService.js
 *
 * Lifecycle of an administrator-controlled benchmark catalogue import:
 *
 *   upload/manual -> draft (editable, flagged) -> approve -> activate
 *                                                   \-> reject
 *   rollback(previous version)  = re-activate an earlier approved version
 *
 * Guarantees
 *   - Nothing touches the live `benchmarkmetrics` collection before activate().
 *   - Flags are ALWAYS recomputed on the server (client flags are never trusted).
 *   - Approval refuses unresolved errors and unreviewed warnings.
 *   - Activation never deletes: replaced/absent definitions stay in the earlier
 *     version's snapshot, and the pre-import catalogue is snapshotted first.
 *   - deleteImport() removes only a non-live version (+ its stored PDF); audit entries are kept.
 *   - Every state change writes a BenchmarkAuditLog entry.
 */

'use strict';

const crypto = require('crypto');
const BenchmarkMetric = require('../models/BenchmarkMetric');
const BenchmarkImport = require('../models/BenchmarkImport');
const BenchmarkAuditLog = require('../models/BenchmarkAuditLog');
const BenchmarkImportFile = require('../models/BenchmarkImportFile');
const Metric = require('../models/Metric');
const parser = require('./benchmarkPdfParser');
const { cleanText } = parser;
const scoring = require('./benchmarkScoring');

// 12 MB: the PDF is stored in MongoDB (16 MB document limit), so the cap sits safely below it.
const MAX_PDF_BYTES = 12 * 1024 * 1024;
const MAX_CONCURRENT_EXTRACTIONS = 2;
const CHUNK_PAGES = 4;
const EXTRACTION_BUDGET_MS = 90 * 1000;
let extractionsInFlight = 0;
const MAX_PDF_PAGES = 80;

class ImportError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const actorOf = (user) => ({
  id: user && (user._id || user.id) ? String(user._id || user.id) : null,
  name: (user && (user.name || user.username || user.email)) || null,
});

async function audit(action, importId, user, details = {}, metricId = null) {
  await BenchmarkAuditLog.create({
    action, importId: importId ? String(importId) : null, metricId: metricId || null,
    actor: { ...actorOf(user), role: user && user.role ? user.role : null },
    at: new Date(), details,
  });
}

const STOP = new Set(['the', 'of', 'and', 'for', 'to', 'in', 'by', 'a', 'an', 'is', 'are', 'or', 'on', 'during', 'last', 'five', 'years', 'year', 'per', 'with', 'as', 'at', 'from', 'that', 'has', 'have', 'number', 'percentage', 'total', 'institution', 'university']);
function tokens(text) {
  return new Set(String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t)));
}
function similarity(a, b) {
  const A = tokens(a); const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((t) => { if (B.has(t)) inter += 1; });
  return inter / Math.min(A.size, B.size);
}

function newRowId(rows) {
  const n = rows.reduce((m, r) => Math.max(m, Number(String(r.rowId || '').replace(/\D/g, '')) || 0), 0) + 1;
  return `r${n}`;
}

/** Recompute derived band fields (min/max/inclusive/status) from the label text. */
function deriveBands(bands) {
  return (bands || []).map((b) => {
    const p = scoring.parseBandLabel(b.label);
    const score = Number(b.score);
    return {
      score, label: String(b.label == null ? '' : b.label).replace(/\s+/g, ''),
      min: p.min, max: p.max, minInclusive: p.minInclusive, maxInclusive: p.maxInclusive,
      status: score >= 3 ? 'above' : score === 2 ? 'meets' : 'below',
    };
  });
}

async function loadContext() {
  const [docs, metrics] = await Promise.all([BenchmarkMetric.find().lean(), Metric.find().lean()]);
  return {
    existing: new Map(docs.map((d) => [d.metricId, d])),
    metricCatalog: new Map(metrics.map((m) => [m.metricId, m])),
    docs,
  };
}

/** Attach catalogue matches (never creates duplicates, never overwrites a mapping silently). */
function applyMatching(rows, ctx) {
  const usedExisting = new Set();
  rows.forEach((r) => {
    const ex = ctx.existing.get(r.metricId);
    r.match = { existing: !!ex, sameMeaning: null, similarity: null, suggestedFrom: null, computedField: null };
    if (ex) {
      usedExisting.add(ex.metricId);
      const sim = similarity(r.description, ex.description);
      r.match.similarity = Number(sim.toFixed(2));
      r.match.sameMeaning = sim >= 0.3;
      const first = !r.matchDefaultsApplied; // defaults are applied once; later admin edits always win
      if (r.match.sameMeaning) {
        if (first) {
          if (r.source === 'pdf') {
            if (ex.metricName) r.metricName = ex.metricName;
            if (!r.unitCues || r.unitCues.length === 0) r.unit = r.scoringType === 'categorical' ? 'option' : (ex.unit || r.unit);
          }
          if (r.computedField === undefined) r.computedField = ex.computedField || null;
          r.improvementHint = r.improvementHint || ex.improvementHint || '';
        }
      } else if (r.computedField === undefined) {
        r.computedField = null; // different meaning: never inherit the old analytics mapping
      }
    }
    r.matchDefaultsApplied = true;
  });
  // A different existing doc that describes the same thing (e.g. 3.4.5_books) -> suggest, and list for deactivation.
  rows.forEach((r) => {
    if (r.match.existing && r.match.sameMeaning) return;
    let best = null;
    ctx.docs.forEach((d) => {
      if (d.metricId === r.metricId || usedExisting.has(d.metricId)) return;
      const sim = similarity(r.description, d.description);
      if (sim >= 0.6 && (!best || sim > best.sim)) best = { d, sim };
    });
    if (best) {
      const firstSuggest = r.computedField === undefined || r.computedField === null;
      r.match.suggestedFrom = { metricId: best.d.metricId, similarity: Number(best.sim.toFixed(2)) };
      if (firstSuggest && !r.edited) r.computedField = best.d.computedField || null;
      if (!r.edited && best.d.metricName && (!r.metricName || r.metricName.endsWith('...'))) r.metricName = best.d.metricName;
      if (!r.edited) r.improvementHint = r.improvementHint || best.d.improvementHint || '';
    }
  });
  rows.forEach((r) => { if (r.computedField === undefined) r.computedField = null; r.match.computedField = r.computedField; });
  return rows;
}

function flagRows(rows, ctx) {
  const flagged = parser.revalidateAll(rows, { existing: ctx.existing, metricCatalog: ctx.metricCatalog });
  flagged.forEach((r) => {
    if (r.match && r.match.existing && r.match.sameMeaning === false && !r.excluded) {
      r.flags.push({ code: 'meaning_differs', severity: 'warning', message: `Metric ${r.metricId} exists in the catalogue with a different meaning (similarity ${r.match.similarity}). Its analytics mapping was NOT carried over.` });
    }
    if (r.match && r.match.suggestedFrom && !r.excluded) {
      r.flags.push({ code: 'matches_other_metric', severity: 'warning', message: `Same meaning as existing metric ${r.match.suggestedFrom.metricId}; its analytics mapping was reused. That older entry will be listed for deactivation on replace.` });
    }
    if (r.computedField && !ctx.metricCatalog.has(r.computedField) && !r.excluded) {
      r.flags.push({ code: 'unknown_computed_field', severity: 'warning', message: `Analytics metric "${r.computedField}" does not exist; current value will show as insufficient data.` });
    }
  });
  return flagged;
}

const summarize = (imp) => ({
  id: String(imp._id), versionNo: imp.versionNo, documentVersion: imp.documentVersion, sourceFilename: imp.sourceFilename,
  origin: imp.origin, status: imp.status, uploadedBy: imp.uploadedBy, uploadedAt: imp.uploadedAt, reviewedBy: imp.reviewedBy, reviewedAt: imp.reviewedAt,
  activatedBy: imp.activatedBy, sourceStored: !!imp.sourceStored, approvedBy: imp.approvedBy,
  approvedAt: imp.approvedAt, activatedAt: imp.activatedAt, rowCount: (imp.rows || []).length,
  includedCount: (imp.rows || []).filter((r) => !r.excluded).length,
  errorCount: (imp.rows || []).filter((r) => !r.excluded && (r.flags || []).some((f) => f.severity === 'error')).length,
});

async function nextVersionNo() {
  const last = await BenchmarkImport.find().sort({ versionNo: -1 }).limit(1);
  const top = Array.isArray(last) && last[0] ? last[0].versionNo : 0;
  return (top || 0) + 1;
}

async function mustGet(id) {
  let imp = null;
  try { imp = await BenchmarkImport.findById(id); } catch { imp = null; }
  if (!imp) throw new ImportError(404, 'Import not found.');
  return imp;
}

// ── Extraction failures: classify, log (server side only), answer safely ─────

/**
 * What went wrong while reading the PDF?
 *  - the uploaded file is bad          -> 422 (the admin can fix it)
 *  - the PDF engine is unusable        -> 503 (a deployment problem, NOT the file)
 *  - anything else (our own bug)       -> 500 with a reference to the server log
 */
function classifyExtractionError(e) {
  const name = (e && e.name) || '';
  if (e && e.code === 'EXTRACTION_TIMEOUT') {
    return { category: 'timeout', status: 422, message: 'The PDF took too long to process and was stopped. Split it or upload a smaller file.' };
  }
  if (e && e.code === 'EXTRACTOR_UNAVAILABLE') {
    return { category: 'extractor_unavailable', status: 503, code: 'PDF_EXTRACTOR_UNAVAILABLE',
      message: 'The PDF processing component is not available on the server, so the file was not processed (this is not a problem with your PDF). Ask the server administrator to run "npm install" in the server folder and restart it.' };
  }
  if (e && e.code === 'EXTRACTOR_INCOMPATIBLE') {
    return { category: 'extractor_incompatible', status: 503, code: 'PDF_EXTRACTOR_INCOMPATIBLE',
      message: 'The PDF processing library installed on the server is not a supported version, so the file was not processed (this is not a problem with your PDF). Ask the server administrator to reinstall the server dependencies.' };
  }
  if (name === 'PasswordException') {
    return { category: 'password', status: 422, code: 'PDF_PASSWORD_PROTECTED', message: 'This PDF is password-protected. Remove the password and upload it again.' };
  }
  if (['InvalidPDFException', 'MissingPDFException', 'FormatError', 'XRefParseException'].includes(name)) {
    return { category: 'invalid_pdf', status: 422, code: 'PDF_UNREADABLE', message: 'The file is not a valid, readable PDF (it may be damaged or truncated).' };
  }
  return { category: 'internal', status: 500, code: 'PDF_PROCESSING_ERROR', message: 'An unexpected error occurred while processing the PDF.' };
}

/**
 * Logs the ORIGINAL exception (name, code, message, stack, cause chain) for operators.
 * Deliberately excludes the PDF's bytes/text, the uploader's file name and any user data.
 */
function logExtractionFailure(ref, category, e, ctx) {
  const chain = [];
  for (let cur = e, i = 0; cur && i < 4; cur = cur.cause, i += 1) {
    chain.push({ name: cur.name, code: cur.code, message: String(cur.message || '').slice(0, 500), stack: cur.stack });
  }
  let pdfjsVersion = null;
  try { pdfjsVersion = require('pdfjs-dist/package.json').version; } catch { /* not installed */ }
  console.error('[benchmark-import] PDF extraction failed', JSON.stringify({
    ref, category, node: process.version, pdfjsVersion, fileSize: ctx.size, fileHash: String(ctx.hash || '').slice(0, 12), errors: chain,
  }, null, 2));
}

// ── PDF validation ───────────────────────────────────────────────────────────

function validatePdfBuffer(buffer, mimetype) {
  if (!buffer || !buffer.length) throw new ImportError(400, 'No file was uploaded.');
  if (buffer.length > MAX_PDF_BYTES) throw new ImportError(413, `File is larger than ${MAX_PDF_BYTES / 1024 / 1024} MB.`);
  if (mimetype && mimetype !== 'application/pdf') throw new ImportError(415, 'Only PDF files are accepted.');
  if (buffer.slice(0, 5).toString('latin1') !== '%PDF-') throw new ImportError(415, 'The file is not a valid PDF (missing PDF header).');
}

// ── Create ───────────────────────────────────────────────────────────────────

async function createFromPdf({ buffer, filename, mimetype, documentVersion, user }) {
  try { validatePdfBuffer(buffer, mimetype); } catch (e) {
    await audit('upload_rejected', null, user, { filename, reason: e.message });
    throw e;
  }
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Retry-safe: re-uploading the same file while its draft is still open returns that draft.
  const sameDraft = await BenchmarkImport.find({ fileHash, status: 'draft' }).limit(1);
  if (Array.isArray(sameDraft) && sameDraft.length) {
    await audit('upload_reused', sameDraft[0]._id, user, { filename, fileHash });
    sameDraft[0].reused = true;
    return sameDraft[0];
  }

  if (extractionsInFlight >= MAX_CONCURRENT_EXTRACTIONS) {
    throw new ImportError(429, 'Other benchmark PDFs are being processed. Please retry in a minute.');
  }
  await audit('upload', null, user, { filename, size: buffer.length, fileHash });

  extractionsInFlight += 1;
  let parsed; let stats;
  try {
    const pp = parser.createPageParser();
    stats = await parser.extractPagesChunked(buffer, {
      chunkSize: CHUNK_PAGES, maxPages: MAX_PDF_PAGES, timeBudgetMs: EXTRACTION_BUDGET_MS, onPage: (pg) => pp.feed(pg),
    });
    parsed = pp.finish();
  } catch (e) {
    const info = classifyExtractionError(e);
    const ref = crypto.randomBytes(4).toString('hex');
    logExtractionFailure(ref, info.category, e, { size: buffer.length, hash: fileHash });
    await audit('extract_failed', null, user, {
      filename, category: info.category, ref, errorName: String((e && e.name) || ''), errorCode: e && e.code != null ? String(e.code) : null,
      error: String((e && e.message) || '').slice(0, 300),
    });
    const extra = { ref };
    if (info.code) extra.code = info.code;
    const withRef = ['internal', 'extractor_unavailable', 'extractor_incompatible'].includes(info.category) ? `${info.message} (reference ${ref})` : info.message;
    throw new ImportError(info.status, withRef, extra);
  } finally {
    extractionsInFlight -= 1;
  }
  if (stats.tooManyPages) {
    await audit('extract_failed', null, user, { filename, error: 'too many pages', pages: stats.numPages });
    throw new ImportError(413, `The PDF has ${stats.numPages} pages; the limit is ${MAX_PDF_PAGES}.`);
  }
  if (parsed.scannedPages.length === stats.numPages) {
    await audit('extract_failed', null, user, { filename, error: 'no text layer', pages: stats.numPages });
    throw new ImportError(422, 'This PDF has no readable text layer (it looks scanned). OCR is not built into the server: add a text layer first (for example with ocrmypdf) and upload again, or create a manual draft and enter the benchmarks by hand.', { code: 'SCANNED_PDF', scannedPages: parsed.scannedPages });
  }
  if (parsed.rows.length === 0) {
    await audit('extract_failed', null, user, { filename, error: 'no metric rows' });
    throw new ImportError(422, 'No NAAC benchmark metrics were recognised in this PDF. It does not look like a Benchmark Document.', { code: 'NOT_A_BENCHMARK_DOCUMENT' });
  }

  const ctx = await loadContext();
  const dup = await BenchmarkImport.find({ fileHash }).limit(1);
  const rows = parsed.rows.map((r, i) => ({ ...r, rowId: `r${i + 1}` }));
  applyMatching(rows, ctx);
  const flagged = flagRows(rows, ctx);

  const warnings = [...parsed.warnings];
  if (parsed.scannedPages.length) warnings.push(`Pages without a text layer were skipped: ${parsed.scannedPages.join(', ')}. Add their metrics manually.`);
  if (Array.isArray(dup) && dup.length) warnings.push(`This exact file was already imported as version ${dup[0].versionNo}.`);

  const imp = await BenchmarkImport.create({
    versionNo: await nextVersionNo(), documentVersion: cleanText(documentVersion, 80), sourceFilename: cleanText(String(filename || 'benchmark.pdf').split(/[\\/]/).pop(), 200), fileHash, fileSize: buffer.length,
    origin: 'pdf', status: 'draft', pageCount: stats.numPages, scannedPages: parsed.scannedPages, warnings, criteria: parsed.criteria,
    processing: { chunks: stats.chunks, chunkSize: CHUNK_PAGES, pagesProcessed: stats.numPages, ms: stats.ms },
    rows: flagged, uploadedBy: actorOf(user), uploadedAt: new Date(),
  });

  // Private copy of the source document (admin-only download), keyed by import id.
  if (process.env.BENCHMARK_STORE_SOURCE_PDF !== 'false') {
    try {
      await BenchmarkImportFile.create({ importId: String(imp._id), fileHash, size: buffer.length, data: buffer });
      imp.sourceStored = true;
      await imp.save();
    } catch (e) { warnings.push('The source PDF could not be stored; evidence text is still available for every row.'); }
  }
  await audit('extract', imp._id, user, { rows: flagged.length, scannedPages: parsed.scannedPages, warnings: warnings.length, chunks: stats.chunks, ms: stats.ms });
  return imp;
}

async function getSourceFile(importId, user) {
  const imp = await mustGet(importId);
  let f = null;
  try { f = await BenchmarkImportFile.findOne({ importId: String(imp._id) }); } catch { f = null; }
  if (!f) throw new ImportError(404, 'The source PDF was not stored for this import.');
  await audit('source_download', imp._id, user, { size: f.size });
  return { data: Buffer.from(f.data), size: f.size, fileHash: f.fileHash };
}

async function createManualDraft({ documentVersion, user }) {
  const imp = await BenchmarkImport.create({
    versionNo: await nextVersionNo(), documentVersion: documentVersion || '', origin: 'manual', status: 'draft',
    rows: [], uploadedBy: actorOf(user), uploadedAt: new Date(),
  });
  await audit('manual_create', imp._id, user, {});
  return imp;
}

// ── Row editing ──────────────────────────────────────────────────────────────

const EDITABLE = ['metricId', 'metricName', 'description', 'details', 'criterionNumber', 'criterion', 'keyIndicator', 'maxScore',
  'unit', 'period', 'scoringType', 'computedField', 'bands', 'options', 'excluded', 'reviewed', 'improvementHint', 'formula', 'notes'];
const TEXT_LIMITS = { metricName: 200, description: 2000, details: 2000, criterion: 200, keyIndicator: 200, period: 120, improvementHint: 500, formula: 500, notes: 500 };

function sanitizePatch(patch) {
  const out = {};
  EDITABLE.forEach((k) => { if (patch && Object.prototype.hasOwnProperty.call(patch, k)) out[k] = patch[k]; });
  if ('metricId' in out) out.metricId = cleanText(out.metricId, 40);
  Object.keys(TEXT_LIMITS).forEach((k) => { if (k in out) out[k] = cleanText(out[k], TEXT_LIMITS[k]); });
  if ('criterionNumber' in out) out.criterionNumber = Number(out.criterionNumber);
  if ('maxScore' in out) out.maxScore = out.maxScore === '' || out.maxScore === null ? null : Number(out.maxScore);
  if ('computedField' in out) out.computedField = out.computedField ? cleanText(out.computedField, 120) : null;
  if ('excluded' in out) out.excluded = !!out.excluded;
  if ('reviewed' in out) out.reviewed = !!out.reviewed;
  if ('scoringType' in out && !['numeric', 'categorical', 'none'].includes(out.scoringType)) delete out.scoringType;
  if ('bands' in out) {
    out.bands = Array.isArray(out.bands) ? out.bands.slice(0, 5).map((b) => ({ score: Number(b.score), label: cleanText(b.label, 30) })) : [];
  }
  if ('options' in out) {
    out.options = Array.isArray(out.options) ? out.options.slice(0, 5).map((o) => ({ label: cleanText(o.label, 1).toUpperCase(), score: Number(o.score), text: cleanText(o.text, 600) })) : [];
  }
  return out;
}

function finalizeRow(row) {
  row.bands = deriveBands(row.bands);
  if (row.scoringType === 'categorical') row.direction = null;
  else row.direction = row.bands.length ? scoring.inferDirection(row.bands) : null;
  if (!row.scoringType || row.scoringType === 'none') row.scoringType = row.bands.length ? (scoring.isCategorical(row.bands) ? 'categorical' : 'numeric') : 'none';
  if (row.scoringType === 'categorical' && (!row.options || !row.options.length)) {
    row.options = ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, score: 4 - i, text: '' }));
  }
  return row;
}

async function saveRows(imp, rows) {
  imp.rows = rows;
  if (typeof imp.markModified === 'function') imp.markModified('rows');
  await imp.save();
}

async function updateRow(importId, rowId, patch, user) {
  const imp = await mustGet(importId);
  if (imp.status !== 'draft') throw new ImportError(409, 'Only a draft import can be edited.');
  const rows = imp.rows.map((r) => ({ ...r }));
  const idx = rows.findIndex((r) => r.rowId === rowId);
  if (idx < 0) throw new ImportError(404, 'Row not found.');
  const clean = sanitizePatch(patch);
  const before = { metricId: rows[idx].metricId, excluded: rows[idx].excluded };
  const onlyExcludeToggle = Object.keys(clean).length === 1 && 'excluded' in clean;
  Object.assign(rows[idx], clean);
  if (!('reviewed' in clean) && !onlyExcludeToggle) rows[idx].reviewed = false; // content edit => needs a fresh review
  finalizeRow(rows[idx]);
  rows[idx].source = rows[idx].source || 'pdf';
  rows[idx].edited = true;

  const ctx = await loadContext();
  applyMatching(rows, ctx);
  const flagged = flagRows(rows, ctx);
  // reviewed only sticks when no errors remain
  flagged.forEach((r) => { if (r.reviewed && r.flags.some((f) => f.severity === 'error')) r.reviewed = false; });
  imp.reviewedBy = actorOf(user); imp.reviewedAt = new Date();
  await saveRows(imp, flagged);
  await audit('row_edit', imp._id, user, { rowId, before, fields: Object.keys(clean) }, rows[idx].metricId);
  return flagged[idx];
}

async function addRow(importId, data, user) {
  const imp = await mustGet(importId);
  if (imp.status !== 'draft') throw new ImportError(409, 'Only a draft import can be edited.');
  const rows = imp.rows.map((r) => ({ ...r }));
  const base = {
    rowId: newRowId(rows), metricId: '', metricName: '', description: '', details: '', criterionNumber: null, criterion: '', keyIndicator: '',
    maxScore: null, unit: 'count', unitCues: [], period: null, scoringType: 'none', direction: null, bands: [], options: [], page: null,
    source: 'manual', reviewed: false, excluded: false, computedField: undefined,
  };
  const row = Object.assign(base, sanitizePatch(data));
  row.reviewed = false;
  finalizeRow(row);
  rows.push(row);
  const ctx = await loadContext();
  applyMatching(rows, ctx);
  const flagged = flagRows(rows, ctx);
  imp.reviewedBy = actorOf(user); imp.reviewedAt = new Date();
  await saveRows(imp, flagged);
  await audit('row_add', imp._id, user, { rowId: row.rowId, metricId: row.metricId }, row.metricId);
  return flagged[flagged.length - 1];
}

// ── Approve / reject ─────────────────────────────────────────────────────────

async function approve(importId, user) {
  const imp = await mustGet(importId);
  if (imp.status !== 'draft') throw new ImportError(409, `Only a draft can be approved (this one is ${imp.status}).`);
  const ctx = await loadContext();
  const rows = flagRows(imp.rows.map((r) => ({ ...r })), ctx);
  const included = rows.filter((r) => !r.excluded);
  const problems = [];
  if (included.length === 0) problems.push('There are no included metrics to approve.');
  included.forEach((r) => {
    const errs = r.flags.filter((f) => f.severity === 'error');
    const warns = r.flags.filter((f) => f.severity === 'warning');
    if (errs.length) problems.push(`${r.metricId || r.rowId}: ${errs.map((f) => f.message).join(' ')}`);
    else if (warns.length && !r.reviewed) problems.push(`${r.metricId}: has warnings that have not been marked as reviewed.`);
  });
  if (problems.length) {
    await audit('approve_rejected', imp._id, user, { problems: problems.slice(0, 50) });
    throw new ImportError(422, 'The import cannot be approved yet.', { problems });
  }
  const res = await BenchmarkImport.findOneAndUpdate(
    { _id: imp._id, status: 'draft' },
    { $set: { status: 'approved', approvedBy: actorOf(user), approvedAt: new Date(), rows } },
    { new: true },
  );
  if (!res) throw new ImportError(409, 'The import changed state; reload and try again.');
  await audit('approve', imp._id, user, { included: included.length, excluded: rows.length - included.length });
  return res;
}

async function reject(importId, user) {
  const imp = await mustGet(importId);
  if (!['draft', 'approved'].includes(imp.status)) throw new ImportError(409, `A ${imp.status} import cannot be rejected.`);
  const res = await BenchmarkImport.findOneAndUpdate({ _id: imp._id, status: imp.status }, { $set: { status: 'rejected' } }, { new: true });
  if (!res) throw new ImportError(409, 'The import changed state; reload and try again.');
  await audit('reject', imp._id, user, {});
  return res;
}

// ── Activation / rollback ────────────────────────────────────────────────────

function docFromRow(row, imp) {
  const categorical = row.scoringType === 'categorical';
  const target = categorical ? null : scoring.benchmarkTarget(row.bands, row.direction);
  return {
    metricId: row.metricId,
    metricName: row.metricName || row.metricId,
    description: row.description,
    details: row.details || '',
    formula: row.formula || '',
    notes: row.notes || '',
    criterion: row.criterion,
    criterionNumber: row.criterionNumber,
    keyIndicator: row.keyIndicator,
    maxScore: row.maxScore == null ? 0 : row.maxScore,
    metricType: categorical ? 'qualitative' : 'quantitative',
    scoringType: categorical ? 'categorical' : 'numeric',
    unit: row.unit,
    period: row.period || null,
    benchmarkValue: target === undefined ? null : target,
    bands: row.bands.map((b) => ({ score: b.score, min: b.min, max: b.max, label: b.label, status: b.status, minInclusive: b.minInclusive, maxInclusive: b.maxInclusive })),
    options: categorical ? (row.options || []) : [],
    direction: categorical ? 'higherIsBetter' : (row.direction || 'higherIsBetter'),
    computedField: row.computedField || null,
    improvementHint: row.improvementHint || '',
    active: true,
    catalogVersionId: imp._id,
    source: {
      filename: imp.sourceFilename || null, documentVersion: imp.documentVersion || null, importedAt: imp.uploadedAt || null,
      approvedBy: (imp.approvedBy && imp.approvedBy.name) || null, approvedAt: imp.approvedAt || null, versionNo: imp.versionNo,
      origin: imp.origin === 'baseline' ? 'seed' : 'import', revision: 0, editedBy: null, editedAt: null, page: row.page || null,
    },
    lifecycle: { deactivatedAt: null, deactivatedBy: null, reason: '' },
  };
}

function rowFromDoc(d, i) {
  const categorical = d.metricType === 'qualitative';
  return {
    rowId: `r${i + 1}`, metricId: d.metricId, metricName: d.metricName, description: d.description || '', details: d.details || '', formula: d.formula || '', notes: d.notes || '',
    criterionNumber: d.criterionNumber, criterion: d.criterion, keyIndicator: d.keyIndicator, maxScore: d.maxScore,
    unit: d.unit, period: d.period || null, scoringType: categorical ? 'categorical' : 'numeric', direction: d.direction || null,
    bands: (d.bands || []).map((b) => ({ score: b.score, label: b.label, min: b.min, max: b.max, minInclusive: b.minInclusive, maxInclusive: b.maxInclusive, status: b.status })),
    options: d.options || [], computedField: d.computedField || null, improvementHint: d.improvementHint || '',
    source: 'baseline', reviewed: true, excluded: false, flags: [], active: d.active !== false,
  };
}

async function ensureBaselineSnapshot(user) {
  const unversioned = await BenchmarkMetric.find({ catalogVersionId: { $in: [null] } }).lean();
  const legacy = unversioned.filter((d) => !d.catalogVersionId);
  if (!legacy.length) return null;
  const existingBaseline = await BenchmarkImport.find({ origin: 'baseline' }).limit(1);
  if (Array.isArray(existingBaseline) && existingBaseline.length) return existingBaseline[0];
  const snap = await BenchmarkImport.create({
    versionNo: await nextVersionNo(), documentVersion: 'Pre-import catalogue', origin: 'baseline', status: 'active',
    sourceFilename: 'seeded catalogue', rows: legacy.map(rowFromDoc), uploadedBy: { id: null, name: 'system' }, uploadedAt: new Date(),
    approvedBy: { id: null, name: 'system (pre-existing catalogue)' }, approvedAt: new Date(), activatedAt: new Date(),
    activation: { mode: 'baseline', previousImportId: null, deactivatedMetricIds: [], action: 'baseline' },
  });
  await audit('baseline_snapshot', snap._id, user, { metrics: legacy.length });
  return snap;
}

// ── Activation planning (also used for the preview) ──────────────────────────

const DIFF_FIELDS = ['metricName', 'description', 'details', 'criterion', 'keyIndicator', 'maxScore', 'unit', 'period', 'scoringType',
  'direction', 'computedField', 'formula', 'notes', 'improvementHint'];
const bandKey = (bands) => (bands || []).slice().sort((a, b) => b.score - a.score).map((b) => String(b.label).replace(/\s+/g, '')).join('|');
const optKey = (opts) => (opts || []).slice().sort((a, b) => b.score - a.score).map((o) => `${o.label}:${o.text}`).join('|');

/** Which fields of a live document would change if `next` replaced it. */
function diffDoc(next, live) {
  const fields = [];
  DIFF_FIELDS.forEach((f) => { if ((next[f] == null ? '' : next[f]) !== (live[f] == null ? '' : live[f])) fields.push(f); });
  if (bandKey(next.bands) !== bandKey(live.bands)) fields.push('bands');
  if (optKey(next.options) !== optKey(live.options)) fields.push('options');
  if (live.active === false) fields.push('reactivated');
  return fields;
}

async function planVersion(imp, mode) {
  if (!['merge', 'replace'].includes(mode)) throw new ImportError(400, 'mode must be "merge" or "replace".');
  const included = imp.rows.filter((r) => !r.excluded);
  const ids = new Set(included.map((r) => r.metricId));
  const liveDocs = await BenchmarkMetric.find().lean();
  const liveById = new Map(liveDocs.map((d) => [d.metricId, d]));

  const additions = []; const modifications = []; const unchanged = [];
  included.forEach((r) => {
    const live = liveById.get(r.metricId);
    if (!live) { additions.push({ metricId: r.metricId }); return; }
    const fields = diffDoc(docFromRow(r, imp), live);
    if (fields.length) modifications.push({ metricId: r.metricId, fields }); else unchanged.push({ metricId: r.metricId });
  });
  const supersededIds = new Set();
  included.forEach((r) => { if (r.match && r.match.suggestedFrom) supersededIds.add(r.match.suggestedFrom.metricId); });
  const absent = liveDocs.filter((d) => d.active !== false && !ids.has(d.metricId)).map((d) => d.metricId);
  const deactivations = (mode === 'replace' ? absent : [...supersededIds].filter((id) => !ids.has(id) && liveById.has(id) && liveById.get(id).active !== false))
    .map((id) => ({ metricId: id, reason: mode === 'replace' ? 'not in this version (replace)' : 'superseded by an equivalent metric in this version' }));
  const keptActive = mode === 'merge' ? absent.filter((id) => !supersededIds.has(id)) : [];
  return { included, liveDocs, additions, modifications, unchanged, deactivations, keptActive };
}

async function previewActivation(importId, mode = 'merge') {
  const imp = await mustGet(importId);
  if (!['draft', 'approved', 'superseded'].includes(imp.status)) throw new ImportError(409, `A ${imp.status} version has no activation preview.`);
  const plan = await planVersion(imp, mode);
  return {
    importId: String(imp._id), versionNo: imp.versionNo, status: imp.status, mode,
    counts: { added: plan.additions.length, modified: plan.modifications.length, deactivated: plan.deactivations.length, unchanged: plan.unchanged.length, keptActive: plan.keptActive.length },
    additions: plan.additions, modifications: plan.modifications, deactivations: plan.deactivations, keptActive: plan.keptActive,
  };
}

async function applyVersion(imp, user, { mode, action }) {
  const plan = await planVersion(imp, mode);
  const baseline = await ensureBaselineSnapshot(user);
  const current = await BenchmarkImport.find({ status: 'active' });
  const previous = (Array.isArray(current) ? current : []).filter((c) => String(c._id) !== String(imp._id));
  const { included, liveDocs } = plan;
  const toDeactivate = plan.deactivations.map((d) => d.metricId);

  // Build every document first and validate against the schema BEFORE any write,
  // so an invalid version fails without touching the active catalogue.
  const docs = included.map((r) => docFromRow(r, imp));
  if (typeof BenchmarkMetric.hydrate === 'function') {
    for (const d of docs) {
      const err = BenchmarkMetric.hydrate(d).validateSync();
      if (err) { await audit('activate_failed', imp._id, user, { error: err.message, metricId: d.metricId }); throw new ImportError(422, `Metric ${d.metricId} failed schema validation: ${err.message}`); }
    }
  }

  const touched = new Set([...docs.map((d) => d.metricId), ...toDeactivate]);
  const backup = liveDocs.filter((d) => touched.has(d.metricId));
  try {
    for (const doc of docs) await BenchmarkMetric.updateOne({ metricId: doc.metricId }, { $set: doc }, { upsert: true });
    for (const id of toDeactivate) await BenchmarkMetric.updateOne({ metricId: id }, { $set: { active: false, 'lifecycle.deactivatedAt': new Date(), 'lifecycle.deactivatedBy': (actorOf(user).name || null), 'lifecycle.reason': `version ${imp.versionNo} (${mode})` } });
  } catch (e) {
    // restore what we touched
    const had = new Set(backup.map((d) => d.metricId));
    for (const d of backup) { try { const { _id, ...rest } = d; await BenchmarkMetric.updateOne({ metricId: d.metricId }, { $set: rest }, { upsert: true }); } catch { /* best effort */ } }
    // documents this attempt created did not exist before: remove them so nothing half-published is left behind
    for (const doc of docs) { if (!had.has(doc.metricId)) { try { await BenchmarkMetric.deleteOne({ metricId: doc.metricId }); } catch { /* best effort */ } } }
    await audit('activate_failed', imp._id, user, { error: e.message });
    throw new ImportError(500, 'Activation failed and the previous catalogue was restored.');
  }

  const now = new Date();
  for (const p of previous) {
    await BenchmarkImport.findOneAndUpdate({ _id: p._id }, { $set: { status: 'superseded', supersededAt: now } });
  }
  const summary = { added: plan.additions.length, modified: plan.modifications.length, deactivated: toDeactivate.length, unchanged: plan.unchanged.length };
  const res = await BenchmarkImport.findOneAndUpdate(
    { _id: imp._id },
    { $set: { status: 'active', activatedBy: actorOf(user), activatedAt: now, activation: { mode, action, summary, previousImportId: previous[0] ? String(previous[0]._id) : (baseline ? String(baseline._id) : null), deactivatedMetricIds: toDeactivate } } },
    { new: true },
  );
  try { require('./referenceDataCache').invalidate(); } catch { /* cache is optional */ }

  // One audit entry per benchmark record that actually changed (bounded by catalogue size).
  for (const a of plan.additions.slice(0, 500)) await audit('record_change', imp._id, user, { change: 'added', versionNo: imp.versionNo, mode, action }, a.metricId);
  for (const m of plan.modifications.slice(0, 500)) await audit('record_change', imp._id, user, { change: 'modified', fields: m.fields, versionNo: imp.versionNo, mode, action }, m.metricId);
  for (const d of plan.deactivations.slice(0, 500)) await audit('record_change', imp._id, user, { change: 'deactivated', reason: d.reason, versionNo: imp.versionNo, mode, action }, d.metricId);
  return { res, toDeactivate, previous, summary };
}

async function activate(importId, user, { mode = 'merge' } = {}) {
  const imp = await mustGet(importId);
  if (imp.status !== 'approved') throw new ImportError(409, 'Only an approved import can be activated. Approve it first.');
  const { res, toDeactivate, previous, summary } = await applyVersion(imp, user, { mode, action: 'activate' });
  await audit('activate', imp._id, user, { mode, versionNo: imp.versionNo, supersededVersions: previous.map((p) => p.versionNo), summary });
  if (previous.length || toDeactivate.length) {
    await audit('replace', imp._id, user, { replacedVersions: previous.map((p) => p.versionNo), deactivatedMetricIds: toDeactivate, mode });
  }
  return res;
}

async function rollback(importId, user) {
  const imp = await mustGet(importId);
  if (imp.status !== 'superseded' || !imp.approvedAt) throw new ImportError(409, 'Only a previously active, approved version can be restored.');
  // Restore that version exactly: metrics added by later versions are deactivated, never deleted.
  const { res, toDeactivate, previous, summary } = await applyVersion(imp, user, { mode: 'replace', action: 'rollback' });
  await audit('rollback', imp._id, user, { restoredVersion: imp.versionNo, fromVersions: previous.map((p) => p.versionNo), deactivatedMetricIds: toDeactivate, summary });
  return res;
}


// ── Deletion of a catalogue VERSION ──────────────────────────────────────────

/**
 * Permanently deletes one version (its draft rows and its privately stored source PDF).
 *
 * Allowed:  draft, approved, rejected  (never touched the live catalogue)
 *           superseded                 (only while no live benchmark record still points at it)
 * Refused:  active                     (it is the live catalogue; activate/roll back another version first)
 *           baseline snapshot          (it makes the very first import reversible)
 *           any version a live record still references
 *
 * Never deleted: live benchmark records (`benchmarkmetrics`), analytics metric definitions (`metrics`),
 * other versions, and ANY audit entry. The deletion itself is audited with a snapshot of what was removed.
 */
async function deleteImport(importId, user) {
  const imp = await mustGet(importId);
  const ref = { versionNo: imp.versionNo, status: imp.status, origin: imp.origin };
  const refuse = async (code, message, extra = {}) => {
    await audit('delete_rejected', imp._id, user, { ...ref, reason: code });
    throw new ImportError(409, message, { code, ...extra });
  };
  if (imp.status === 'active') await refuse('VERSION_ACTIVE', `Version ${imp.versionNo} is the active catalogue and cannot be deleted. Activate or roll back to another version first.`);
  if (imp.origin === 'baseline') await refuse('VERSION_BASELINE', `Version ${imp.versionNo} is the automatic snapshot of the pre-import catalogue. It is kept so the first import can be reversed.`);
  if (!['draft', 'approved', 'rejected', 'superseded'].includes(imp.status)) await refuse('VERSION_STATE', `A ${imp.status} version cannot be deleted.`);

  const live = await BenchmarkMetric.countDocuments({ catalogVersionId: imp._id });
  if (live > 0) await refuse('VERSION_IN_USE', `${live} live benchmark record${live === 1 ? ' still points' : 's still point'} to version ${imp.versionNo}, so it cannot be deleted. Deactivate/replace those records by activating another version first.`, { liveRecords: live });

  // Conditional delete: only if the status did not change since we read it (e.g. someone activated it meanwhile).
  const res = await BenchmarkImport.deleteOne({ _id: imp._id, status: imp.status });
  if (res && res.deletedCount === 0) throw new ImportError(409, 'The version changed state or was already deleted; reload and try again.');
  // Remove the privately stored source PDF belonging to exactly this version.
  const file = await BenchmarkImportFile.deleteOne({ importId: String(imp._id) });
  const sourceRemoved = !file || file.deletedCount === undefined ? !!imp.sourceStored : file.deletedCount > 0;

  await audit('version_delete', imp._id, user, {
    versionNo: imp.versionNo, status: imp.status, origin: imp.origin, documentVersion: imp.documentVersion || '',
    sourceFilename: imp.sourceFilename || null, fileHash: imp.fileHash || null, rowCount: (imp.rows || []).length,
    uploadedBy: imp.uploadedBy ? (imp.uploadedBy.name || null) : null, sourceRemoved,
  });
  return { deleted: true, id: String(imp._id), versionNo: imp.versionNo, status: imp.status };
}

// ── Queries ──────────────────────────────────────────────────────────────────

async function listImports() {
  const all = await BenchmarkImport.find().sort({ versionNo: -1 });
  return (Array.isArray(all) ? all : []).map(summarize);
}

async function getImport(id) { return mustGet(id); }

async function listAudit({ importId, limit = 200 } = {}) {
  const q = importId ? { importId: String(importId) } : {};
  const rows = await BenchmarkAuditLog.find(q).sort({ at: -1 }).limit(limit);
  return Array.isArray(rows) ? rows : [];
}

/** Diagnostics for "which catalogue is this environment actually serving?" */
async function getStatus() {
  const mongoose = require('mongoose');
  const [total, active, wired, metricDocs, activeImports, drafts] = await Promise.all([
    BenchmarkMetric.countDocuments({}), BenchmarkMetric.countDocuments({ active: true }),
    BenchmarkMetric.countDocuments({ active: true, computedField: { $ne: null } }),
    Metric.countDocuments({}), BenchmarkImport.find({ status: 'active' }), BenchmarkImport.countDocuments({ status: 'draft' }),
  ]);
  const act = Array.isArray(activeImports) && activeImports[0] ? activeImports[0] : null;
  const pdfExtractor = await parser.checkExtractor({ deep: true });
  return {
    database: mongoose.connection && mongoose.connection.name ? mongoose.connection.name : null,
    nodeEnv: process.env.NODE_ENV || null,
    benchmarkMetrics: { total, active, withAnalyticsMapping: wired },
    analyticsMetricDefinitions: metricDocs,
    activeVersion: act ? { id: String(act._id), versionNo: act.versionNo, documentVersion: act.documentVersion, sourceFilename: act.sourceFilename, origin: act.origin } : null,
    pendingDrafts: drafts,
    pdfExtractor,
    notes: [
      !pdfExtractor.compatible || pdfExtractor.deepCheck === 'failed' ? `The PDF engine is not usable on this server (${pdfExtractor.problem || 'unknown'}${pdfExtractor.detail ? `: ${pdfExtractor.detail}` : ''}). PDF uploads will fail until the server dependencies are reinstalled (npm install in server/).` : null,
      total === 0 ? 'The benchmark catalogue is EMPTY in this environment. Import and activate a benchmark PDF.' : null,
      active > 0 && wired === 0 ? 'No benchmark metric is mapped to an analytics metric, so every current value will read "Insufficient data".' : null,
      metricDocs === 0 ? 'The analytics Metric catalogue is empty in this environment (seed:v3metrics has not run), so no current value can be calculated.' : null,
    ].filter(Boolean),
  };
}

module.exports = {
  classifyExtractionError,
  ImportError, MAX_PDF_BYTES, createFromPdf, createManualDraft, updateRow, addRow, approve, reject, activate, rollback, deleteImport,
  listImports, getImport, listAudit, getStatus, summarize, similarity, docFromRow, rowFromDoc, validatePdfBuffer,
  previewActivation, getSourceFile, sanitizePatch, finalizeRow, loadContext, audit, actorOf, diffDoc, MAX_CONCURRENT_EXTRACTIONS,
};
