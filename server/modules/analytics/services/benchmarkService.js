/**
 * benchmarkService.js  —  V3 (scope-aware, achievement percent, dept comparisons)
 *
 * Changes from V2:
 *   1. calculateMetric() now receives a scope-derived filter (fixes G3 scope-blindness).
 *      Callers with no filter (VC/admin) receive byte-identical responses to V2.
 *   2. achievementPercent added to every response object (additive field, no removal).
 *   3. New exports: getDepartmentBenchmark, getAllDepartmentsBenchmark.
 *
 * All existing callers (analyticsV2.js, reportService.js, recommendationEngine.js)
 * use getAllBenchmarks(scope, query) — signature unchanged, behavior improved.
 */

'use strict';

const { calculateMetric }   = require('./analyticsService');
const BenchmarkMetric       = require('../models/BenchmarkMetric');
const Faculty               = require('../../faculty/models/Faculty');
const { buildFacultyFilter, mergeFilters } = require('./filterService');

// ── Scope filter helper ───────────────────────────────────────────────────────

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

// ── Scoring ───────────────────────────────────────────────────────────────────
// Band parsing / direction / numeric & categorical evaluation live in
// benchmarkScoring.js (pure, unit-tested). Direction is derived from the bands,
// so lower-is-better metrics (days, grievance %, student ratios) gap correctly.

const scoring = require('./benchmarkScoring');

const STATUS_LABEL = { above: 'Above', meets: 'Meets', below: 'Below', unknown: 'Insufficient data' };

function computeAchievementPercent(currentValue, target, direction) {
  if (target === null || target === undefined || currentValue === null || currentValue === undefined) return null;
  if (direction === 'lowerIsBetter') {
    if (currentValue <= 0) return 100;
    return Number(Math.min((target / currentValue) * 100, 999).toFixed(2));
  }
  if (target === 0) return null;
  return Number(Math.min((currentValue / target) * 100, 999).toFixed(2));
}

function catalogInfo(doc) {
  const src = doc.source || {};
  const origin = src.origin || (doc.catalogVersionId ? 'import' : 'seed');
  if (origin === 'manual') {
    return { origin: 'manual', versionNo: src.versionNo || null, documentVersion: null, sourceFilename: null, importedAt: null, approvedBy: null, approvedAt: null, editedBy: src.editedBy || null, editedAt: src.editedAt || null, revision: src.revision || 0 };
  }
  if (origin === 'import') {
    return {
      origin: 'import', versionNo: src.versionNo || null, documentVersion: src.documentVersion || null,
      sourceFilename: src.filename || null, importedAt: src.importedAt || null,
      approvedBy: src.approvedBy || null, approvedAt: src.approvedAt || null,
    };
  }
  return { origin: 'seed', versionNo: null, documentVersion: null, sourceFilename: null, importedAt: null, approvedBy: null, approvedAt: null };
}

// ── Build response object ─────────────────────────────────────────────────────
// All pre-existing keys keep their names and meaning; new keys are additive.

function buildResponse(doc, currentValue, ev, reason) {
  const insufficient = ev.score === null || ev.score === undefined;
  const status = insufficient ? 'unknown' : ev.status;
  return {
    metricId:           doc.metricId,
    metricName:         doc.metricName,
    description:        doc.description,
    criterion:          doc.criterion,
    criterionNumber:    doc.criterionNumber,
    keyIndicator:       doc.keyIndicator,
    maxScore:           doc.maxScore,
    metricType:         doc.metricType,
    currentValue:       insufficient ? null : currentValue,
    benchmarkValue:     ev.target === null || ev.target === undefined ? (doc.benchmarkValue === undefined ? null : doc.benchmarkValue) : ev.target,
    unit:               doc.unit,
    gap:                insufficient ? null : ev.gap,
    achievementPercent: insufficient ? null : computeAchievementPercent(currentValue, ev.target, ev.direction),
    status,
    score:              insufficient ? null : ev.score,
    recommendation:     doc.improvementHint || '',
    bands:              doc.bands,
    // additive (PDF-import era)
    insufficientData:   insufficient,
    insufficientReason: insufficient ? reason : null,
    statusLabel:        STATUS_LABEL[status],
    scoringType:        ev.categorical ? 'categorical' : 'numeric',
    direction:          ev.categorical ? null : (ev.direction || doc.direction || null),
    period:             doc.period || null,
    bandLabel:          ev.bandLabel || null,
    options:            doc.options || [],
    catalog:            catalogInfo(doc),
    analyticsMapped:    !!doc.computedField,
    formula:            doc.formula || '',
    notes:              doc.notes || '',
  };
}

// ── Reliable current value ────────────────────────────────────────────────────
// Never fabricates a zero: a value is only returned when the metric is mapped,
// defined, supported, and there are institutional records to compute it from.

async function resolveCurrentValue(doc, scope, query) {
  if (!doc.computedField) return { value: null, reason: 'no_analytics_mapping' };
  const { getMetric } = require('./referenceDataCache');
  const metric = await getMetric(doc.computedField);
  if (!metric) return { value: null, reason: 'analytics_metric_not_defined' };
  if (metric.supported === false) return { value: null, reason: 'analytics_metric_unsupported' };
  if (Array.isArray(metric.missingFields) && metric.missingFields.length) return { value: null, reason: 'source_fields_missing' };

  const combined = mergeFilters(scopeFilter(scope), buildFacultyFilter(query));
  try {
    if (String(metric.formulaType || '').startsWith('student')) {
      const StudentProfile = require('../../student/models/StudentProfile');
      if ((await StudentProfile.countDocuments({})) === 0) return { value: null, reason: 'no_institutional_records' };
    } else if ((await Faculty.countDocuments(combined)) === 0) {
      return { value: null, reason: 'no_institutional_records' };
    }
    const computed = await calculateMetric(doc.computedField, combined, { viewMode: query.viewMode });
    const v = computed ? computed.value : null;
    if (typeof v !== 'number' || !Number.isFinite(v)) return { value: null, reason: 'calculation_failed' };
    return { value: v, reason: 'ok' };
  } catch {
    return { value: null, reason: 'calculation_failed' };
  }
}

// ── Single metric benchmark (from doc) ────────────────────────────────────────
// evaluateBenchmarkDoc contains all logic; getMetricBenchmark is a thin wrapper
// that fetches the doc first. Batch callers pass already-fetched docs.

async function evaluateBenchmarkDoc(doc, scope, query = {}) {
  const categorical = doc.metricType === 'qualitative' || scoring.isCategorical(doc.bands);
  const { value, reason } = await resolveCurrentValue(doc, scope, query);

  let ev;
  let why = reason;
  if (categorical) {
    // A letter grade needs an assessment; a number is never coerced into A-E.
    ev = scoring.evaluateCategorical(doc.bands, typeof value === 'string' ? value : null);
    if (ev.score === null && reason === 'ok') why = 'qualitative_requires_assessment';
    if (ev.score === null && reason === 'no_analytics_mapping') why = 'qualitative_requires_assessment';
    ev.categorical = true;
  } else {
    ev = scoring.evaluateNumeric(doc.bands, value, doc.direction);
    if (ev.score === null && reason === 'ok') why = 'value_outside_all_bands';
  }
  return buildResponse(doc, value, ev, why);
}

async function getMetricBenchmark(metricId, scope, query = {}) {
  const { getBenchmarkMetric } = require('./referenceDataCache');
  const doc = await getBenchmarkMetric(metricId);
  if (!doc || !doc.active) return null;
  return evaluateBenchmarkDoc(doc, scope, query);
}

// ── All active metrics benchmark ──────────────────────────────────────────────

async function getAllBenchmarks(scope, query = {}) {
  const { getBenchmarkMetrics } = require('./referenceDataCache');
  let docs = await getBenchmarkMetrics();

  docs = docs.filter(d => d.active);

  if (query.criterion) {
    const regex = new RegExp(query.criterion, 'i');
    docs = docs.filter(d => regex.test(d.criterion));
  }
  if (query.criterionNumber) {
    const num = parseInt(query.criterionNumber, 10);
    docs = docs.filter(d => d.criterionNumber === num);
  }

  docs.sort((a, b) => {
    if (a.criterionNumber !== b.criterionNumber) {
      return a.criterionNumber - b.criterionNumber;
    }
    return String(a.metricId).localeCompare(String(b.metricId));
  });

  // Phase 6: call evaluateBenchmarkDoc directly — docs are already fetched,
  // eliminating redundant per-item BenchmarkMetric.findOne inside getMetricBenchmark.
  const results = await Promise.all(
    docs.map(d => evaluateBenchmarkDoc(d, scope, query).catch(() => null))
  );
  return results.filter(Boolean);
}

// ── Department benchmark (V3 new) ─────────────────────────────────────────────

/**
 * Benchmark for a specific department — scopes calculation to that dept.
 * Generic: works for any metricId with a computedField.
 */
async function getDepartmentBenchmark(deptName, metricId, scope, query = {}) {
  const deptScope = { level: 'department', department: deptName, userId: null };
  return getMetricBenchmark(metricId, deptScope, query);
}

/**
 * All benchmarks for one specific department.
 */
async function getAllDepartmentBenchmarks(deptName, scope, query = {}) {
  const deptScope = { level: 'department', department: deptName, userId: null };
  return getAllBenchmarks(deptScope, query);
}

/**
 * Compares all departments side-by-side for a given metric.
 * Returns one row per department with their benchmark evaluation.
 */
async function getAllDepartmentsBenchmark(metricId, scope, query = {}) {
  const departments = await Faculty.distinct('employmentDetails.department', {});
  const clean       = departments.filter(d => d && String(d).trim() !== '');

  const rows = await Promise.all(
    clean.map(async dept => {
      const result = await getDepartmentBenchmark(dept, metricId, scope, query).catch(() => null);
      return result ? { department: dept, ...result } : null;
    })
  );
  return rows.filter(Boolean);
}

/**
 * Compares a single faculty's metric value against their department average.
 * Returns: { facultyId, metricId, metricName, facultyValue, departmentAvg, delta, deltaPercent }
 */
async function getFacultyVsDepartmentAverage(facultyId, metricId, scope, query = {}) {
  const Faculty = require('../../faculty/models/Faculty');

  // Resolve faculty record
  const mongoose   = require('mongoose');
  const isObjectId = /^[a-f\d]{24}$/i.test(facultyId);
  const findQuery  = isObjectId ? { _id: mongoose.Types.ObjectId.createFromHexString(facultyId) } : { username: facultyId };
  const faculty    = await Faculty.findOne(findQuery).lean();
  if (!faculty) return null;

  const deptName = (faculty.employmentDetails?.department || '').trim();

  // HOD scope enforcement
  if (scope && scope.level === 'department' && scope.department) {
    if (scope.department.toLowerCase().trim() !== deptName.toLowerCase()) {
      const err = new Error('Access denied: faculty is outside your department scope.');
      err.status = 403;
      throw err;
    }
  }

  // Compute metric for this specific faculty
  const facultyFilter = { _id: faculty._id };
  const facultyResult = await calculateMetric(metricId, facultyFilter).catch(() => null);
  const facultyValue  = facultyResult ? facultyResult.value : null;

  // Compute metric scoped to the department
  const deptFilter  = { 'employmentDetails.department': deptName };
  const deptResult  = await calculateMetric(metricId, deptFilter).catch(() => null);
  const deptTotal   = deptResult ? deptResult.value : null;

  // Department average = dept total ÷ faculty count in dept
  const facultyCountResult = await calculateMetric('facultycount', deptFilter).catch(() => null);
  const deptFacultyCount   = facultyCountResult ? facultyCountResult.value : 0;
  const departmentAvg = (deptTotal !== null && deptFacultyCount > 0)
    ? Number((deptTotal / deptFacultyCount).toFixed(4))
    : null;

  const delta = (facultyValue !== null && departmentAvg !== null)
    ? Number((facultyValue - departmentAvg).toFixed(4))
    : null;
  const deltaPercent = (delta !== null && departmentAvg && departmentAvg !== 0)
    ? Number((delta / departmentAvg * 100).toFixed(2))
    : null;

  return {
    facultyId:      String(faculty._id),
    facultyName:    faculty.personalInfo?.fullName || faculty.username,
    department:     deptName,
    metricId,
    metricName:     facultyResult ? facultyResult.metricName : metricId,
    facultyValue,
    departmentAvg,
    delta,
    deltaPercent,
    deptFacultyCount,
  };
}

/** Lightweight catalogue summary so the UI can explain an empty table precisely. */
async function getCatalogueStatus() {
  const { getBenchmarkMetrics, getMetrics } = require('./referenceDataCache');
  const docs = (await getBenchmarkMetrics()).filter((d) => d.active);
  const metrics = await getMetrics();
  const versions = new Set(docs.filter((d) => d.catalogVersionId).map((d) => (d.source && d.source.versionNo) || null));
  return {
    activeMetrics: docs.length,
    mappedMetrics: docs.filter((d) => d.computedField).length,
    analyticsMetricDefinitions: metrics.length,
    importedVersions: [...versions].filter((v) => v !== null).sort((x, y) => x - y),
    hasCatalogue: docs.length > 0,
  };
}

module.exports = {
  getMetricBenchmark,
  getAllBenchmarks,
  getDepartmentBenchmark,
  getAllDepartmentBenchmarks,
  getAllDepartmentsBenchmark,
  getFacultyVsDepartmentAverage,
  evaluateBenchmarkDoc,
  resolveCurrentValue,
  getCatalogueStatus,
};
