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

// ── Band evaluation ───────────────────────────────────────────────────────────

function evaluateBands(doc, value) {
  const bands = doc.bands || [];
  for (const band of bands) {
    const lo = band.min !== null ? band.min : -Infinity;
    const hi = band.max !== null ? band.max :  Infinity;
    if (value >= lo && value <= hi) {
      return {
        status:          band.status,
        score:           band.score,
        benchmarkValue:  doc.benchmarkValue,
        unit:            doc.unit,
        gap:             Number((doc.benchmarkValue - value).toFixed(4)),
        improvementHint: doc.improvementHint || '',
      };
    }
  }
  return {
    status:          'below',
    score:           0,
    benchmarkValue:  doc.benchmarkValue,
    unit:            doc.unit,
    gap:             Number((doc.benchmarkValue - value).toFixed(4)),
    improvementHint: doc.improvementHint || '',
  };
}

// ── Achievement percent ───────────────────────────────────────────────────────

function computeAchievementPercent(currentValue, benchmarkValue) {
  if (benchmarkValue === null || benchmarkValue === 0 || currentValue === null) return null;
  return Number(Math.min((currentValue / benchmarkValue) * 100, 999).toFixed(2));
}

// ── Build response object ─────────────────────────────────────────────────────

function buildResponse(doc, currentValue, evaluation) {
  return {
    metricId:          doc.metricId,
    metricName:        doc.metricName,
    description:       doc.description,
    criterion:         doc.criterion,
    criterionNumber:   doc.criterionNumber,
    keyIndicator:      doc.keyIndicator,
    maxScore:          doc.maxScore,
    metricType:        doc.metricType,
    currentValue,
    benchmarkValue:    evaluation.benchmarkValue,
    unit:              evaluation.unit,
    gap:               evaluation.gap,
    achievementPercent: computeAchievementPercent(currentValue, evaluation.benchmarkValue),
    status:            evaluation.status,
    score:             evaluation.score,
    recommendation:    evaluation.improvementHint,
    bands:             doc.bands,
  };
}

// ── Single metric benchmark (from doc) ────────────────────────────────────────
// Phase 6: evaluateBenchmarkDoc contains all logic; getMetricBenchmark is a
// thin wrapper that fetches the doc first.  Batch callers call evaluateBenchmarkDoc
// directly with already-fetched docs, eliminating redundant BenchmarkMetric.findOne.

async function evaluateBenchmarkDoc(doc, scope, query = {}) {
  let currentValue = null;

  if (doc.computedField) {
    const base       = scopeFilter(scope);
    const userFilter = buildFacultyFilter(query);
    const combined   = mergeFilters(base, userFilter);
    try {
      const computed = await calculateMetric(doc.computedField, combined, { viewMode: query.viewMode });
      currentValue = computed ? computed.value : null;
    } catch {
      currentValue = null;
    }
  }

  const evaluation = currentValue !== null
    ? evaluateBands(doc, currentValue)
    : { status: 'unknown', score: null, benchmarkValue: doc.benchmarkValue,
        unit: doc.unit, gap: null, improvementHint: doc.improvementHint || '' };

  return buildResponse(doc, currentValue, evaluation);
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

module.exports = {
  getMetricBenchmark,
  getAllBenchmarks,
  getDepartmentBenchmark,
  getAllDepartmentBenchmarks,
  getAllDepartmentsBenchmark,
  getFacultyVsDepartmentAverage,
  evaluateBenchmarkDoc,
};
