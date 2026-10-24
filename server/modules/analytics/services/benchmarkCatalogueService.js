/**
 * benchmarkCatalogueService.js
 *
 * Administrator management of the LIVE benchmark catalogue (the documents the
 * Analytics -> Benchmark page reads):
 *   list / search / filter, inspect, add manually, edit, deactivate, reactivate,
 *   per-record history, delete (inactive only), analytics-metric options for the mapping picker.
 *
 * Rules
 *   - Definitions only. Institutional values are never stored here.
 *   - "Deactivate" hides a record from Analytics and keeps it. Only an inactive record can then be
 *     permanently deleted (deleteRecord), and the deletion is audited.
 *   - Every change is validated with the same server-side rules as imports
 *     (benchmarkPdfParser.validateRow); errors block the change.
 *   - Every change is audited with before/after and bumps `source.revision`.
 *   - Caches are invalidated so Analytics reflects the change immediately.
 *   - Catalogue VERSIONS (imports) are separate: a rollback restores a version's
 *     snapshot, replacing later manual edits (they stay in the audit trail).
 */

'use strict';

const BenchmarkMetric = require('../models/BenchmarkMetric');
const BenchmarkAuditLog = require('../models/BenchmarkAuditLog');
const Metric = require('../models/Metric');
const parser = require('./benchmarkPdfParser');
const importSvc = require('./benchmarkImportService');

const { ImportError } = importSvc;

// Standard NAAC criterion names, used only when the catalogue has no entry for that number yet.
const CRITERION_NAMES = {
  1: 'Curricular Aspects', 2: 'Teaching-Learning and Evaluation', 3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources', 5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management', 7: 'Institutional Values and Best Practices',
};
const METRIC_ID_RE = /^\d\.\d+\.\d+(?:_[A-Za-z0-9]{1,20})?$/;

const invalidate = () => { try { require('./referenceDataCache').invalidate(); } catch { /* optional */ } };

function snapshot(d) {
  if (!d) return null;
  return {
    metricId: d.metricId, active: d.active !== false, description: d.description, criterion: d.criterion, unit: d.unit,
    maxScore: d.maxScore, scoringType: d.scoringType || (d.metricType === 'qualitative' ? 'categorical' : 'numeric'),
    bands: (d.bands || []).map((b) => `${b.score}:${b.label}`), computedField: d.computedField || null, period: d.period || null,
    revision: (d.source && d.source.revision) || 0,
  };
}

function summaryOf(d, metricCatalog) {
  const mapped = !!d.computedField;
  const m = mapped && metricCatalog ? metricCatalog.get(d.computedField) : null;
  const src = d.source || {};
  const origin = src.origin || (d.catalogVersionId ? 'import' : 'seed');
  return {
    metricId: d.metricId, metricName: d.metricName, description: d.description, criterion: d.criterion, criterionNumber: d.criterionNumber,
    keyIndicator: d.keyIndicator, maxScore: d.maxScore, unit: d.unit, period: d.period || null,
    scoringType: d.scoringType || (d.metricType === 'qualitative' ? 'categorical' : 'numeric'),
    direction: (d.scoringType === 'categorical' || d.metricType === 'qualitative') ? null : (d.direction || null),
    bands: (d.bands || []).map((b) => ({ score: b.score, label: b.label })), options: d.options || [],
    active: d.active !== false, computedField: d.computedField || null, mapped,
    mappingStatus: !mapped ? 'unmapped' : (m ? (m.supported === false ? 'unsupported' : 'mapped') : 'unknown_metric'),
    formula: d.formula || '', notes: d.notes || '', improvementHint: d.improvementHint || '',
    source: { origin, versionNo: src.versionNo || null, filename: src.filename || null, documentVersion: src.documentVersion || null,
      approvedBy: src.approvedBy || null, revision: src.revision || 0, editedBy: src.editedBy || null, editedAt: src.editedAt || null, page: src.page || null },
    lifecycle: d.lifecycle || null,
  };
}

async function ctx() {
  const [docs, metrics] = await Promise.all([BenchmarkMetric.find().lean(), Metric.find().lean()]);
  return { docs, existing: new Map(docs.map((d) => [d.metricId, d])), metricCatalog: new Map(metrics.map((m) => [m.metricId, m])) };
}

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

// ── Queries ──────────────────────────────────────────────────────────────────

async function list(query = {}) {
  const { docs, metricCatalog } = await ctx();
  const q = String(query.q || '').trim().toLowerCase();
  const criterion = num(query.criterion);
  const status = ['active', 'inactive'].includes(query.status) ? query.status : 'all';
  const version = query.version == null || query.version === '' ? null : String(query.version);
  const mapping = ['mapped', 'unmapped'].includes(query.mapping) ? query.mapping : null;

  const all = docs.map((d) => summaryOf(d, metricCatalog));
  const versionOf = (s) => (s.source.origin === 'manual' ? 'manual' : s.source.origin === 'seed' ? 'seed' : String(s.source.versionNo));
  const filtered = all.filter((s) => {
    if (q && !(`${s.metricId} ${s.description} ${s.metricName}`.toLowerCase().includes(q))) return false;
    if (criterion && s.criterionNumber !== criterion) return false;
    if (status === 'active' && !s.active) return false;
    if (status === 'inactive' && s.active) return false;
    if (version && versionOf(s) !== version) return false;
    if (mapping === 'mapped' && !s.mapped) return false;
    if (mapping === 'unmapped' && s.mapped) return false;
    return true;
  });
  const idKey = (id) => id.split(/[._]/).map((p) => (/^\d+$/.test(p) ? p.padStart(4, '0') : p)).join('.');
  filtered.sort((a, b) => (idKey(a.metricId) < idKey(b.metricId) ? -1 : 1));

  const limit = Math.min(Math.max(num(query.limit) || 50, 1), 100);
  const page = Math.max(num(query.page) || 1, 1);
  const facets = {
    versions: [...new Set(all.map(versionOf))].sort(),
    criteria: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ number: n, count: all.filter((s) => s.criterionNumber === n).length })),
    totals: { all: all.length, active: all.filter((s) => s.active).length, inactive: all.filter((s) => !s.active).length, unmapped: all.filter((s) => !s.mapped).length },
  };
  return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit, facets };
}

async function get(metricId) {
  const { existing, metricCatalog } = await ctx();
  const d = existing.get(metricId);
  if (!d) throw new ImportError(404, 'Benchmark metric not found.');
  const s = summaryOf(d, metricCatalog);
  const m = d.computedField ? metricCatalog.get(d.computedField) : null;
  return {
    ...s,
    bandsDetail: (d.bands || []).map((b) => ({ score: b.score, label: b.label, min: b.min == null ? null : b.min, max: b.max == null ? null : b.max, minInclusive: b.minInclusive !== false, maxInclusive: b.maxInclusive !== false })),
    benchmarkValue: d.benchmarkValue == null ? null : d.benchmarkValue,
    analyticsMetric: m ? { metricId: m.metricId, metricName: m.metricName, formulaType: m.formulaType || null, supported: m.supported !== false, criterion: m.criterion || null } : null,
  };
}

async function history(metricId) {
  const rows = await BenchmarkAuditLog.find({ metricId }).sort({ at: -1 }).limit(100);
  return Array.isArray(rows) ? rows : [];
}

async function metricOptions() {
  const metrics = await Metric.find().lean();
  return metrics.map((m) => ({ metricId: m.metricId, metricName: m.metricName, formulaType: m.formulaType || null, supported: m.supported !== false }))
    .sort((a, b) => (a.metricId < b.metricId ? -1 : 1));
}

// ── Row <-> document helpers ─────────────────────────────────────────────────

function toRow(doc) { return importSvc.rowFromDoc(doc, 0); }

function pseudoImport(doc) {
  const src = doc.source || {};
  return {
    _id: doc.catalogVersionId || null, sourceFilename: src.filename || null, documentVersion: src.documentVersion || null,
    uploadedAt: src.importedAt || null, approvedBy: { name: src.approvedBy || null }, approvedAt: src.approvedAt || null,
    versionNo: src.versionNo || null, origin: doc.catalogVersionId ? 'pdf' : 'baseline',
  };
}

function problemsOf(flags) { return flags.filter((f) => f.severity === 'error'); }

async function validateRowAgainstCatalogue(row, context, { isNew }) {
  const existing = new Map(context.existing);
  if (isNew) existing.delete(row.metricId); // a brand-new id is checked for duplicates separately
  const flags = parser.validateRow(row, { existing, metricCatalog: context.metricCatalog, seenIds: new Map([[row.metricId, 1]]) });
  if (row.computedField && !context.metricCatalog.has(row.computedField)) {
    flags.push({ code: 'unknown_computed_field', severity: 'warning', message: `Analytics metric "${row.computedField}" does not exist; current value will read "Insufficient data".` });
  }
  return flags;
}

// ── Mutations ────────────────────────────────────────────────────────────────

async function create(payload, user) {
  const context = await ctx();
  const clean = importSvc.sanitizePatch(payload || {});
  const metricId = clean.metricId || '';
  if (!METRIC_ID_RE.test(metricId)) throw new ImportError(400, 'Metric ID must look like 3.4.4 (optionally with a suffix such as 3.4.5_books).', { flags: [{ code: 'bad_metric_id', severity: 'error', message: 'Invalid metric ID.' }] });
  if (context.existing.has(metricId)) throw new ImportError(409, `Metric ${metricId} already exists. Edit it instead.`);

  const n = Number(clean.criterionNumber);
  if (!(n >= 1 && n <= 7)) throw new ImportError(400, 'Criterion must be a number from 1 to 7.');
  const sameCrit = context.docs.find((d) => d.criterionNumber === n);
  const row = {
    rowId: 'r1', metricId, metricName: '', description: '', details: '', formula: '', notes: '', criterionNumber: n,
    criterion: (sameCrit && sameCrit.criterion) || `Criterion ${n} \u2013 ${CRITERION_NAMES[n]}`, keyIndicator: '', maxScore: null,
    unit: 'count', unitCues: [], period: null, scoringType: 'none', direction: null, bands: [], options: [], page: null,
    source: 'manual', reviewed: true, excluded: false,
    ...clean,
  };
  row.criterionNumber = n;
  if (!row.metricName) row.metricName = row.description.length > 90 ? `${row.description.slice(0, 87)}...` : row.description || metricId;
  importSvc.finalizeRow(row);
  row.computedField = row.computedField || null;

  const flags = await validateRowAgainstCatalogue(row, context, { isNew: true });
  const errors = problemsOf(flags);
  if (errors.length) throw new ImportError(400, errors.map((f) => f.message).join(' '), { flags });

  const now = new Date();
  const doc = importSvc.docFromRow(row, { _id: null, sourceFilename: null, documentVersion: null, uploadedAt: now, approvedBy: { name: null }, approvedAt: null, versionNo: null, origin: 'pdf' });
  doc.catalogVersionId = null;
  doc.source = { filename: null, documentVersion: null, importedAt: now, approvedBy: null, approvedAt: null, versionNo: null, origin: 'manual', revision: 1, editedBy: importSvc.actorOf(user).name, editedAt: now, page: null };
  await BenchmarkMetric.updateOne({ metricId }, { $set: doc }, { upsert: true });
  invalidate();
  await importSvc.audit('record_create', null, user, { after: snapshot(doc), warnings: flags.filter((f) => f.severity === 'warning').map((f) => f.code) }, metricId);
  return { record: await get(metricId), flags };
}

async function update(metricId, patch, user) {
  const context = await ctx();
  const live = context.existing.get(metricId);
  if (!live) throw new ImportError(404, 'Benchmark metric not found.');
  const clean = importSvc.sanitizePatch(patch || {});
  delete clean.metricId; delete clean.excluded; delete clean.reviewed; // the ID is immutable; lifecycle has its own endpoints
  if (Object.keys(clean).length === 0) throw new ImportError(400, 'No editable fields supplied.');

  const row = Object.assign(toRow(live), clean, { source: 'manual', reviewed: true, excluded: false });
  if (clean.criterionNumber !== undefined) {
    const n = Number(clean.criterionNumber);
    if (!(n >= 1 && n <= 7)) throw new ImportError(400, 'Criterion must be a number from 1 to 7.');
    const sameCrit = context.docs.find((d) => d.criterionNumber === n);
    if (!clean.criterion) row.criterion = (sameCrit && sameCrit.criterion) || `Criterion ${n} \u2013 ${CRITERION_NAMES[n]}`;
  }
  importSvc.finalizeRow(row);
  row.computedField = row.computedField || null;

  const flags = await validateRowAgainstCatalogue(row, context, { isNew: false });
  const errors = problemsOf(flags);
  if (errors.length) throw new ImportError(400, errors.map((f) => f.message).join(' '), { flags });

  const before = snapshot(live);
  const now = new Date();
  const doc = importSvc.docFromRow(row, pseudoImport(live));
  const prev = live.source || {};
  doc.catalogVersionId = live.catalogVersionId || null;
  doc.active = live.active !== false;
  doc.lifecycle = live.lifecycle || { deactivatedAt: null, deactivatedBy: null, reason: '' };
  doc.source = {
    ...(prev || {}), origin: prev.origin || (live.catalogVersionId ? 'import' : 'seed'), revision: (prev.revision || 0) + 1,
    editedBy: importSvc.actorOf(user).name, editedAt: now,
    filename: prev.filename || null, documentVersion: prev.documentVersion || null, versionNo: prev.versionNo || null,
    importedAt: prev.importedAt || null, approvedBy: prev.approvedBy || null, approvedAt: prev.approvedAt || null, page: prev.page || null,
  };
  await BenchmarkMetric.updateOne({ metricId }, { $set: doc });
  invalidate();
  await importSvc.audit('record_update', null, user, { before, after: snapshot(doc), fields: Object.keys(clean), warnings: flags.filter((f) => f.severity === 'warning').map((f) => f.code) }, metricId);
  return { record: await get(metricId), flags };
}

async function setActive(metricId, active, reason, user) {
  const context = await ctx();
  const live = context.existing.get(metricId);
  if (!live) throw new ImportError(404, 'Benchmark metric not found.');
  if ((live.active !== false) === active) throw new ImportError(409, active ? 'This metric is already active.' : 'This metric is already inactive.');
  if (active) {
    const flags = await validateRowAgainstCatalogue(toRow(live), context, { isNew: false });
    const errors = problemsOf(flags);
    if (errors.length) throw new ImportError(422, `Cannot reactivate: ${errors.map((f) => f.message).join(' ')} Edit the metric first.`, { flags });
  }
  const now = new Date();
  const who = importSvc.actorOf(user).name;
  const why = parser.cleanText(reason, 200);
  await BenchmarkMetric.updateOne({ metricId }, { $set: {
    active, 'lifecycle.deactivatedAt': active ? null : now, 'lifecycle.deactivatedBy': active ? null : who, 'lifecycle.reason': active ? '' : why,
    'source.revision': ((live.source && live.source.revision) || 0) + 1, 'source.editedBy': who, 'source.editedAt': now,
  } });
  invalidate();
  await importSvc.audit(active ? 'record_reactivate' : 'record_deactivate', null, user, { reason: why, before: snapshot(live) }, metricId);
  return get(metricId);
}

/**
 * Permanently deletes ONE live benchmark record. Only an INACTIVE record can be deleted: an active one is
 * being scored by Analytics, so it must be deactivated first (existing lifecycle). Shared analytics metric
 * definitions, other benchmark records and all audit entries are untouched; a full snapshot of the deleted
 * record is written to the audit log. Note: re-activating/rolling back a catalogue VERSION whose snapshot
 * contains this metric ID would add it back.
 */
async function deleteRecord(metricId, user) {
  const live = await BenchmarkMetric.findOne({ metricId }).lean();
  if (!live) throw new ImportError(404, 'Benchmark metric not found.');
  if (live.active !== false) {
    await importSvc.audit('delete_rejected', null, user, { reason: 'RECORD_ACTIVE' }, metricId);
    throw new ImportError(409, `${metricId} is active and is being used by Analytics. Deactivate it first, then delete it.`, { code: 'RECORD_ACTIVE' });
  }
  const res = await BenchmarkMetric.deleteOne({ metricId, active: false });
  if (res && res.deletedCount === 0) throw new ImportError(409, 'The metric changed state or was already deleted; reload and try again.');
  invalidate();
  const src = live.source || {};
  await importSvc.audit('record_delete', live.catalogVersionId || null, user, {
    before: snapshot(live), description: live.description, origin: src.origin || (live.catalogVersionId ? 'import' : 'seed'),
    versionNo: src.versionNo || null, deactivatedBy: (live.lifecycle && live.lifecycle.deactivatedBy) || null,
  }, metricId);
  return { deleted: true, metricId };
}

module.exports = { list, get, history, metricOptions, create, update, setActive, deleteRecord, summaryOf, CRITERION_NAMES };
