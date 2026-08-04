/**
 * analyticsV3.js
 *
 * V3 analytics router. Mounted at /api/faculty/analytics (same prefix as V1/V2).
 * Every route uses the identical auth → requireAnalyticsScope() chain.
 * No existing V1/V2 endpoint is modified or removed.
 */

'use strict';

const express  = require('express');
const { auth } = require('../../faculty/middleware/auth');
const requireAnalyticsScope = require('../middleware/requireAnalyticsScope');

const { getMetricsCatalogue } = require('../services/metricsCatalogService');
const {
  getNormalizedMetric,
  getDefaultNormalizedMetrics,
} = require('../services/normalizedMetricsService');
const Faculty = require('../../faculty/models/Faculty');

function tryRequire(path) {
  try { return require(path); } catch { return null; }
}

const router = express.Router();

// ── GET /filters/options (V3 extended) ───────────────────────────────────────
// Returns all V2 filter options PLUS V3 additions: qualifications + experienceRange.
// Express routes match first-registered; since V2 registers /filters/options first
// and V3 is mounted after, this route only fires if the client includes
// ?v3=true — otherwise V2 handles it. This preserves V2 backward compatibility.
router.get(
  '/filters/options',
  auth,
  requireAnalyticsScope('filterOptions'),
  async (req, res) => {
    // Only intercept if client requests V3-extended options
    if (req.query.v3 !== 'true') {
      return res.status(404).json({ message: 'Use ?v3=true for extended filter options.' });
    }
    try {
      const scope      = req.analyticsScope;
      const baseFilter = scope.level === 'department' && scope.department
        ? { 'employmentDetails.department': scope.department }
        : {};

      const [
        departments, designations, pubYears, pubCategories, pubLevels, pubTypes,
        projectCategories, projectStatuses, fundingAgencies, patentStatuses,
        qualificationLevels, experienceVals, awardCategories,
      ] = await Promise.all([
        Faculty.distinct('employmentDetails.department',   baseFilter),
        Faculty.distinct('employmentDetails.designation',  baseFilter),
        Faculty.distinct('publications.year',              baseFilter),
        Faculty.distinct('publications.journalCategory',   baseFilter),
        Faculty.distinct('publications.level',             baseFilter),
        Faculty.distinct('publications.type',              baseFilter),
        Faculty.distinct('projects.projectCategory',       baseFilter),
        Faculty.distinct('projects.status',                baseFilter),
        Faculty.distinct('projects.fundingAgency',         baseFilter),
        Faculty.distinct('patents.status',                 baseFilter),
        Faculty.distinct('qualifications.degreeLevel',     baseFilter),
        Faculty.distinct('employmentDetails.totalExperienceYears', baseFilter),
        Faculty.distinct('awards.awardCategory',           baseFilter),
      ]);

      const clean = arr => arr.filter(v => v && String(v).trim() !== '').sort();

      // Derive experience range from stored string values
      const expNums = experienceVals
        .map(v => parseFloat(String(v || '0')))
        .filter(n => !isNaN(n) && n >= 0);
      const experienceRange = expNums.length > 0
        ? { min: Math.min(...expNums), max: Math.max(...expNums) }
        : { min: 0, max: 0 };

      res.json({
        // V2 fields (identical structure)
        departments:       clean(departments),
        designations:      clean(designations),
        publicationYears:  clean(pubYears).sort((a, b) => b - a),
        journalCategories: clean(pubCategories),
        publicationLevels: clean(pubLevels),
        publicationTypes:  clean(pubTypes),
        projectCategories: clean(projectCategories),
        projectStatuses:   clean(projectStatuses),
        fundingAgencies:   clean(fundingAgencies),
        patentStatuses:    clean(patentStatuses),
        programLevels:     [],       // student-side unchanged
        // V3 additions
        qualificationLevels: clean(qualificationLevels),
        awardCategories:     clean(awardCategories),
        experienceRange,
      });
    } catch (err) {
      console.error('[V3] /filters/options', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /metrics-catalogue ────────────────────────────────────────────────────
// Returns all Metric documents enriched with view-mode metadata.
// Query params: ?criterion=, ?formulaType=, ?supportedOnly=true
router.get(
  '/metrics-catalogue',
  auth,
  requireAnalyticsScope('metricsCatalogue'),
  async (req, res) => {
    try {
      const catalogue = await getMetricsCatalogue({
        criterion:     req.query.criterion,
        formulaType:   req.query.formulaType,
        supportedOnly: req.query.supportedOnly === 'true',
      });
      res.json({ total: catalogue.length, metrics: catalogue });
    } catch (err) {
      console.error('[V3] /metrics-catalogue', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /normalized/:metricId ─────────────────────────────────────────────────
// Returns normalized (per-faculty) value for one metric.
// If :metricId is "default", returns the default normalized dashboard set.
router.get(
  '/normalized/:metricId',
  auth,
  requireAnalyticsScope('normalized'),
  async (req, res) => {
    try {
      const scope = req.analyticsScope;
      const { metricId } = req.params;

      if (metricId === 'default') {
        const results = await getDefaultNormalizedMetrics(scope, req.query);
        return res.json(results);
      }

      const result = await getNormalizedMetric(metricId, scope, req.query);
      if (!result) return res.status(404).json({ message: `Metric '${metricId}' not found` });
      res.json(result);
    } catch (err) {
      console.error('[V3] /normalized', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /dashboard-v3 (Phase 7 prep) ──────────────────────────────────────────
router.get(
  '/dashboard-v3',
  auth,
  requireAnalyticsScope('dashboard'),
  async (req, res) => {
    try {
      const Metric = require('../models/Metric');
      // Phase 6: use calculateMetricFromDoc to skip redundant Metric.findOne
      // per metric — docs are already fetched in batch above.
      const { calculateMetricFromDoc } = require('../services/analyticsService');
      const { buildFacultyFilter, mergeFilters } = require('../services/filterService');

      const scope = req.analyticsScope;
      const deptFilter = scope.level === 'department' && scope.department
        ? { 'employmentDetails.department': scope.department }
        : {};
      const userFilter = buildFacultyFilter(req.query);
      const combinedFilter = mergeFilters(deptFilter, userFilter);

      const metrics = await Metric.find().lean();
      
      // Phase 9: Compute facultyCount/studentCount once per request
      const viewMode = req.query.viewMode;
      const precomputedCounts = {};
      if (viewMode === 'perFaculty' || viewMode === 'percentage') {
        precomputedCounts.facultyCount = await Faculty.countDocuments(combinedFilter);
      } else if (viewMode === 'perStudent') {
        const StudentProfile = require('../../student/models/StudentProfile');
        precomputedCounts.studentCount = await StudentProfile.countDocuments();
      }

      // Phase 5: parallel execution — Promise.all preserves insertion order.
      // Each metric is individually guarded so one failure does not crash the batch.
      const dashboard = (await Promise.all(
        metrics.map(metric =>
          calculateMetricFromDoc(metric, combinedFilter, { viewMode, precomputedCounts })
            .catch(err => {
              console.error(`[V3] /dashboard-v3 metric ${metric.metricId} failed:`, err.message);
              return null;
            })
        )
      )).filter(r => r !== null);
      res.json(dashboard);
    } catch (err) {
      console.error('[V3] /dashboard-v3', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /department-performance-v3 (Phase 7 prep) ───────────────────────────
router.get(
  '/department-performance-v3',
  auth,
  requireAnalyticsScope('departmentPerformance'),
  async (req, res) => {
    try {
      const { calculateMetric } = require('../services/analyticsService');
      const { buildFacultyFilter, mergeFilters } = require('../services/filterService');
      
      const scope = req.analyticsScope;
      const deptFilter = scope.level === "department" && scope.department
          ? { "employmentDetails.department": scope.department }
          : {};
      const userFilter = buildFacultyFilter(req.query);
      const combinedFilter = mergeFilters(deptFilter, userFilter);
      
      const departments = await Faculty.distinct('employmentDetails.department', combinedFilter);
      const cleanDepartments = departments.filter(d => d && String(d).trim() !== '');
      
      const result = await Promise.all(cleanDepartments.map(async (dept) => {
          const dFilter = mergeFilters(combinedFilter, { 'employmentDetails.department': dept });

          // Query dedup: facultyCount previously ran as its own countDocuments()
          // call against the exact same filter as this find() — reuse the
          // fetched records' length instead of a second round-trip.
          const facultyRecords = await Faculty.find(dFilter).lean();
          const facultyCount = facultyRecords.length;
          const totalCompletion = facultyRecords.reduce((sum, f) => sum + (f.completionPercentage || 0), 0);
          const averageCompletion = facultyCount > 0 ? Number((totalCompletion / facultyCount).toFixed(2)) : 0;

          // Run the remaining metric calculations concurrently instead of
          // sequentially — same query count, far less wall-clock time.
          // Funding metricId fix: '3.1.2.funding' never existed as a seeded
          // Metric document (the real research-funding metric is '3.2.1',
          // sum of projects[].amountSanctioned — see reportService.js for
          // the equivalent V2 calculation). That typo made calculateMetric()
          // resolve to null every time, which is why funding always showed ₹0.
          const [pubsResult, projsResult, patsResult, fundResult] = await Promise.all([
            calculateMetric('3.4.4.journal', dFilter, { viewMode: req.query.viewMode }),
            calculateMetric('3.2.2', dFilter, { viewMode: req.query.viewMode }),
            calculateMetric('3.4.5', dFilter, { viewMode: req.query.viewMode }),
            calculateMetric('3.2.1', dFilter, { viewMode: req.query.viewMode }),
          ]);

          return {
              department: dept,
              facultyCount,
              averageCompletion,
              publications: pubsResult ? pubsResult.value : 0,
              projects: projsResult ? projsResult.value : 0,
              patents: patsResult ? patsResult.value : 0,
              // null (not 0) when the funding metric itself is unavailable,
              // so the frontend can distinguish "no data" from "zero funding".
              funding: fundResult ? fundResult.value : null,
          };
      }));
      res.json(result);
    } catch (err) {
      console.error('[V3] /department-performance-v3', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── Phase 3+ endpoints (stubbed — return 503 until their services exist) ──────
// These stubs ensure the router registers the path correctly so /my-access
// can advertise them, but they degrade gracefully until Phase 3 lands.

router.get('/drilldown/department/:deptName/faculty',
  auth, requireAnalyticsScope('drilldown'), async (req, res) => {
    const svc = tryRequire('../services/facultyProfileAnalyticsService');
    if (!svc) return res.status(503).json({ message: 'Available in Phase 3.' });
    try {
      const result = await svc.getDepartmentFacultyList(
        req.params.deptName, req.analyticsScope, req.query
      );
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

router.get('/faculty/:facultyId/profile-analytics',
  auth, requireAnalyticsScope('facultyProfile'), async (req, res) => {
    const svc = tryRequire('../services/facultyProfileAnalyticsService');
    if (!svc) return res.status(503).json({ message: 'Available in Phase 3.' });
    try {
      const result = await svc.getFacultyProfileAnalytics(
        req.params.facultyId, req.analyticsScope, req.query
      );
      if (!result) return res.status(404).json({ message: 'Faculty not found.' });
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

router.get('/comparisons/department-vs-average',
  auth, requireAnalyticsScope('comparisons'), async (req, res) => {
    const svc = tryRequire('../services/benchmarkService');
    if (!svc || !svc.getDepartmentBenchmark)
      return res.status(503).json({ message: 'Available in Phase 5.' });
    try {
      const { deptName, metricId } = req.query;
      if (!deptName || !metricId)
        return res.status(400).json({ message: 'deptName and metricId are required.' });
      const result = await svc.getDepartmentBenchmark(deptName, metricId, req.analyticsScope, req.query);
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

// ── GET /comparisons/faculty-vs-department-average ────────────────────────────
// Compares a single faculty member's metric value against their department avg.
// Query params: facultyId (required), metricId (required)
router.get('/comparisons/faculty-vs-department-average',
  auth, requireAnalyticsScope('comparisons'), async (req, res) => {
    const svc = tryRequire('../services/benchmarkService');
    if (!svc || !svc.getFacultyVsDepartmentAverage)
      return res.status(503).json({ message: 'Available in Phase 5.' });
    try {
      const { facultyId, metricId } = req.query;
      if (!facultyId || !metricId)
        return res.status(400).json({ message: 'facultyId and metricId are required.' });
      const result = await svc.getFacultyVsDepartmentAverage(
        facultyId, metricId, req.analyticsScope, req.query
      );
      if (!result) return res.status(404).json({ message: 'Faculty not found.' });
      res.json(result);
    } catch (err) {
      if (err.status === 403) return res.status(403).json({ message: err.message });
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/benchmark/department/:deptName',
  auth, requireAnalyticsScope('departmentBenchmark'), async (req, res) => {
    const svc = tryRequire('../services/benchmarkService');
    if (!svc || !svc.getAllDepartmentBenchmarks)
      return res.status(503).json({ message: 'Available in Phase 5.' });
    try {
      const result = await svc.getAllDepartmentBenchmarks(
        req.params.deptName, req.analyticsScope, req.query
      );
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

router.get('/benchmark/department/:deptName/:metricId',
  auth, requireAnalyticsScope('departmentBenchmark'), async (req, res) => {
    const svc = tryRequire('../services/benchmarkService');
    if (!svc || !svc.getDepartmentBenchmark)
      return res.status(503).json({ message: 'Available in Phase 5.' });
    try {
      const result = await svc.getDepartmentBenchmark(
        req.params.deptName, req.params.metricId, req.analyticsScope, req.query
      );
      if (!result) return res.status(404).json({ message: 'No benchmark data found.' });
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

// ── GET /benchmark/all-departments/:metricId — dept-vs-dept for one metric ────
router.get('/benchmark/all-departments/:metricId',
  auth, requireAnalyticsScope('departmentBenchmark'), async (req, res) => {
    const svc = tryRequire('../services/benchmarkService');
    if (!svc || !svc.getAllDepartmentsBenchmark)
      return res.status(503).json({ message: 'Available in Phase 5.' });
    try {
      const result = await svc.getAllDepartmentsBenchmark(
        req.params.metricId, req.analyticsScope, req.query
      );
      res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

// ── GET /reports-v3/types (Phase 7 prep) ───────────────────────────────────────
router.get(
  '/reports-v3/types',
  auth,
  requireAnalyticsScope('reportTypes'),
  async (req, res) => {
    const reportServiceV3 = tryRequire('../services/reportServiceV3');
    if (!reportServiceV3) {
      return res.status(503).json({ message: 'V3 Report service not available.' });
    }
    try {
      const scope = req.analyticsScope;
      const types = reportServiceV3.getAvailableReportTypesV3(scope);
      res.json(types);
    } catch (err) {
      console.error('[V3] /reports-v3/types error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /reports-v3/:reportType/generate (Phase 7 prep) ──────────────────────
router.post(
  '/reports-v3/:reportType/generate',
  auth,
  requireAnalyticsScope('reportGenerate'),
  async (req, res) => {
    const reportServiceV3 = tryRequire('../services/reportServiceV3');
    const csvExporter   = tryRequire('../exporters/csvExporter');
    const excelExporter = tryRequire('../exporters/excelExporter');
    const pdfExporter   = tryRequire('../exporters/pdfExporter');

    if (!reportServiceV3) {
      return res.status(503).json({ message: 'V3 Report service not available.' });
    }

    try {
      const scope      = req.analyticsScope;
      const reportType = req.params.reportType;
      const format     = (req.query.format || 'pdf').toLowerCase();

      const payload = await reportServiceV3.generateReportV3(reportType, scope, req.query);

      if (format === 'excel' && excelExporter) {
        const buffer = excelExporter.exportToExcel(payload.rows, payload.title);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
        return res.send(buffer);
      }

      if (format === 'csv' && csvExporter) {
        const csv = csvExporter.exportToCsv(payload.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
        return res.send(csv);
      }

      if (pdfExporter) {
        const buffer = await pdfExporter.exportToPdf(payload.rows, payload.title);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
        return res.send(buffer);
      }

      res.status(503).json({ message: 'Exporters not yet available (Phase 7).' });
    } catch (err) {
      console.error('[V3] /reports-v3/generate error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── Phase 18: Department Ranking Endpoint ────────────────────────────────────
router.get(
  '/rankings/:metricId',
  auth,
  requireAnalyticsScope('rankings'),
  async (req, res) => {
    try {
      const { calculateMetric } = require('../services/analyticsService');
      const { calculateMetricFromDoc } = require('../services/analyticsService');
      const { buildFacultyFilter, mergeFilters } = require('../services/filterService');
      const { getMetric } = require('../services/referenceDataCache');
      const Faculty = require('../../faculty/models/Faculty');
      
      const scope = req.analyticsScope;
      const metricId = req.params.metricId;
      const viewMode = req.query.viewMode || 'absolute';
      
      // Phase 8 cache reuse: getMetric() serves from the 5-minute in-memory
      // cache instead of issuing a fresh Metric.findOne() every request.
      const metricDoc = await getMetric(metricId);
      if (!metricDoc) {
        return res.status(404).json({ message: `Metric '${metricId}' not found` });
      }
      
      const direction = metricDoc.direction || 'higherIsBetter';
      
      // Build combined filter
      const deptFilter = scope.level === 'department' && scope.department
        ? { 'employmentDetails.department': scope.department }
        : {};
      const userFilter = buildFacultyFilter(req.query);
      const combinedFilter = mergeFilters(deptFilter, userFilter);
      
      // Get all departments from the filter
      const departments = await Faculty.distinct('employmentDetails.department', combinedFilter);
      const cleanDepartments = departments.filter(d => d && String(d).trim() !== '');
      
      // Precompute faculty counts for per-faculty normalization if needed
      const facultyCounts = {};
      if (viewMode === 'perFaculty') {
        await Promise.all(cleanDepartments.map(async (dept) => {
          const deptFilter = mergeFilters(combinedFilter, { 'employmentDetails.department': dept });
          const facultyCountResult = await calculateMetric('facultycount', deptFilter);
          facultyCounts[dept] = facultyCountResult ? facultyCountResult.value : 1; // Avoid division by zero
        }));
      }
      
      // Calculate metric for each department
      const rankings = await Promise.all(cleanDepartments.map(async (dept) => {
        const deptFilter = mergeFilters(combinedFilter, { 'employmentDetails.department': dept });
        
        // Calculate absolute value
        const result = await calculateMetricFromDoc(metricDoc, deptFilter, { viewMode: 'absolute' });
        const absoluteValue = result ? result.value : 0;
        
        // Calculate per-faculty value if requested
        let perFacultyValue = absoluteValue;
        if (viewMode === 'perFaculty' && facultyCounts[dept] > 0) {
          perFacultyValue = absoluteValue / facultyCounts[dept];
        }
        
        return {
          department: dept,
          absoluteValue,
          perFacultyValue,
          facultyCount: facultyCounts[dept] || 0,
        };
      }));
      
      // Sort based on direction and view mode
      const sortedRankings = [...rankings].sort((a, b) => {
        const valueA = viewMode === 'perFaculty' ? a.perFacultyValue : a.absoluteValue;
        const valueB = viewMode === 'perFaculty' ? b.perFacultyValue : b.absoluteValue;
        
        if (direction === 'higherIsBetter') {
          return valueB - valueA; // Descending for higherIsBetter
        } else {
          return valueA - valueB; // Ascending for lowerIsBetter
        }
      });
      
      // Add ranking positions
      const rankingsWithPosition = sortedRankings.map((item, index) => ({
        rank: index + 1,
        ...item,
      }));
      
      res.json({
        metricId,
        metricName: metricDoc.metricName,
        direction,
        viewMode,
        rankings: rankingsWithPosition,
        totalDepartments: cleanDepartments.length,
      });
    } catch (err) {
      console.error('[V3] /rankings/:metricId error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
