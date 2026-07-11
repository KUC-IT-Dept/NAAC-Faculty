/**
 * analyticsV2.js
 *
 * New additive router for Analytics V2 endpoints.
 * Mounted at /api/faculty/analytics (same prefix as V1) in server/index.js.
 *
 * Every route reuses the identical auth + requireAnalyticsScope() pattern
 * from V1 — no new permission mechanism is introduced.
 *
 * V2 endpoints:
 *   GET  /filters/options          — available filter values for FilterBar
 *   GET  /drilldown/:kpi           — record-level list for a KPI
 *   GET  /drilldown/:kpi/export    — export drill-down (csv/excel/pdf)
 *   GET  /benchmark                — all metrics vs benchmark thresholds
 *   GET  /benchmark/:metricId      — single metric benchmark detail
 *   GET  /trend                    — period/entity comparison
 *   GET  /recommendations          — rule-based recommendations
 *   GET  /reports/types            — list available report types for this role
 *   POST /reports/:reportType/generate — generate and download a report
 */

'use strict';

const express  = require('express');
const { auth } = require('../../faculty/middleware/auth');
const requireAnalyticsScope = require('../middleware/requireAnalyticsScope');

// ── Service imports (each phase activates more) ───────────────────────────────
const Faculty         = require('../../faculty/models/Faculty');
const StudentProfile  = require('../../student/models/StudentProfile');
const { buildFacultyFilter, buildStudentFilter, mergeFilters } = require('../services/filterService');

// Phase 5+ services — required lazily below so the server still boots if a
// later-phase file hasn't been created yet (each phase is independently deployable).
function tryRequire(path) {
  try { return require(path); } catch { return null; }
}

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a scope-aware base filter from req.analyticsScope.
 * Mirrors the existing V1 deptFilter pattern.
 */
function scopeFilter(scope) {
  if (scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — GET /filters/options
// Returns available distinct values for each filter dimension so that
// FilterBar.tsx can populate its dropdowns dynamically.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/filters/options',
  auth,
  requireAnalyticsScope('filterOptions'),
  async (req, res) => {
    try {
      const scope      = req.analyticsScope;
      const baseFilter = scopeFilter(scope);

      // Fetch distinct values in parallel from the Faculty collection.
      const [
        departments,
        designations,
        pubYears,
        pubCategories,
        pubLevels,
        pubTypes,
        projectCategories,
        projectStatuses,
        fundingAgencies,
        patentStatuses,
        programLevels,
      ] = await Promise.all([
        Faculty.distinct('employmentDetails.department', baseFilter),
        Faculty.distinct('employmentDetails.designation', baseFilter),
        Faculty.distinct('publications.year',             baseFilter),
        Faculty.distinct('publications.journalCategory',  baseFilter),
        Faculty.distinct('publications.level',            baseFilter),
        Faculty.distinct('publications.type',             baseFilter),
        Faculty.distinct('projects.projectCategory',      baseFilter),
        Faculty.distinct('projects.status',               baseFilter),
        Faculty.distinct('projects.fundingAgency',        baseFilter),
        Faculty.distinct('patents.status',                baseFilter),
        StudentProfile.distinct('academic_details.programLevel', {}),
      ]);

      // Clean: remove empty/null entries and sort.
      const clean = (arr) =>
        arr.filter(v => v && String(v).trim() !== '').sort();

      res.json({
        departments:      clean(departments),
        designations:     clean(designations),
        publicationYears: clean(pubYears).sort((a, b) => b - a), // newest first
        journalCategories:clean(pubCategories),
        publicationLevels:clean(pubLevels),
        publicationTypes: clean(pubTypes),
        projectCategories:clean(projectCategories),
        projectStatuses:  clean(projectStatuses),
        fundingAgencies:  clean(fundingAgencies),
        patentStatuses:   clean(patentStatuses),
        programLevels:    clean(programLevels),
      });
    } catch (err) {
      console.error('[V2] /filters/options error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — GET /drilldown/:kpi
// Returns the underlying record list for a KPI, with search / sort / pagination.
// Supported kpi values: publications, projects, patents, faculty
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/drilldown/:kpi',
  auth,
  requireAnalyticsScope('drilldown'),
  async (req, res) => {
    const drilldownService = tryRequire('../services/drilldownService');
    if (!drilldownService) {
      return res.status(503).json({ message: 'Drilldown service not yet available (Phase 4).' });
    }
    try {
      const scope   = req.analyticsScope;
      const { kpi } = req.params;
      const result  = await drilldownService.getDrilldown(kpi, scope, req.query);
      res.json(result);
    } catch (err) {
      console.error('[V2] /drilldown error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — GET /drilldown/:kpi/export
// Exports the record list as csv / excel / pdf.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/drilldown/:kpi/export',
  auth,
  requireAnalyticsScope('drilldown'),
  async (req, res) => {
    const drilldownService = tryRequire('../services/drilldownService');
    const csvExporter      = tryRequire('../exporters/csvExporter');
    const excelExporter    = tryRequire('../exporters/excelExporter');
    const pdfExporter      = tryRequire('../exporters/pdfExporter');

    if (!drilldownService) {
      return res.status(503).json({ message: 'Drilldown service not yet available (Phase 4).' });
    }

    try {
      const scope   = req.analyticsScope;
      const { kpi } = req.params;
      const format  = (req.query.format || 'csv').toLowerCase();

      // Fetch all records (no pagination for export).
      const exportQuery = { ...req.query, page: '1', pageSize: '100000' };
      const result      = await drilldownService.getDrilldown(kpi, scope, exportQuery);
      const rows        = result.records || [];

      if (format === 'excel' && excelExporter) {
        const buffer = excelExporter.exportToExcel(rows, `${kpi} Drilldown`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${kpi}-drilldown.xlsx"`);
        return res.send(buffer);
      }

      if (format === 'pdf' && pdfExporter) {
        const buffer = await pdfExporter.exportToPdf(rows, `${kpi} Drilldown`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${kpi}-drilldown.pdf"`);
        return res.send(buffer);
      }

      // Default: CSV
      if (csvExporter) {
        const csv = csvExporter.exportToCsv(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${kpi}-drilldown.csv"`);
        return res.send(csv);
      }

      res.status(503).json({ message: 'Exporters not yet available (Phase 7).' });
    } catch (err) {
      console.error('[V2] /drilldown/export error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — GET /benchmark
// Returns current value vs benchmark threshold for all metrics.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/benchmark',
  auth,
  requireAnalyticsScope('benchmark'),
  async (req, res) => {
    const benchmarkService = tryRequire('../services/benchmarkService');
    if (!benchmarkService) {
      return res.status(503).json({ message: 'Benchmark service not yet available (Phase 5).' });
    }
    try {
      const scope  = req.analyticsScope;
      const result = await benchmarkService.getAllBenchmarks(scope, req.query);
      res.json(result);
    } catch (err) {
      console.error('[V2] /benchmark error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — GET /benchmark/:metricId
// Returns benchmark detail for a single metric.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/benchmark/:metricId',
  auth,
  requireAnalyticsScope('benchmark'),
  async (req, res) => {
    const benchmarkService = tryRequire('../services/benchmarkService');
    if (!benchmarkService) {
      return res.status(503).json({ message: 'Benchmark service not yet available (Phase 5).' });
    }
    try {
      const scope  = req.analyticsScope;
      const result = await benchmarkService.getMetricBenchmark(req.params.metricId, scope, req.query);
      if (!result) return res.status(404).json({ message: 'Benchmark not found for this metric.' });
      res.json(result);
    } catch (err) {
      console.error('[V2] /benchmark/:metricId error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — GET /trend
// Computes period-over-period or entity-vs-entity comparison.
// Query params: type (yearOverYear|deptVsDept|facultyVsFaculty|fiveYear),
//               plus any filter params supported by filterService.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/trend',
  auth,
  requireAnalyticsScope('trend'),
  async (req, res) => {
    const trendService = tryRequire('../services/trendService');
    if (!trendService) {
      return res.status(503).json({ message: 'Trend service not yet available (Phase 6).' });
    }
    try {
      const scope  = req.analyticsScope;
      const result = await trendService.getTrend(scope, req.query);
      res.json(result);
    } catch (err) {
      console.error('[V2] /trend error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — GET /recommendations
// Returns rule-based improvement recommendations.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/recommendations',
  auth,
  requireAnalyticsScope('recommendations'),
  async (req, res) => {
    const benchmarkService    = tryRequire('../services/benchmarkService');
    const recommendationEngine = tryRequire('../services/recommendationEngine');
    if (!benchmarkService || !recommendationEngine) {
      return res.status(503).json({ message: 'Recommendation engine not yet available (Phase 6).' });
    }
    try {
      const scope      = req.analyticsScope;
      const benchmarks = await benchmarkService.getAllBenchmarks(scope, req.query);
      const result     = recommendationEngine.getRecommendations(benchmarks);
      res.json(result);
    } catch (err) {
      console.error('[V2] /recommendations error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 — GET /reports/types
// Lists report types available to the caller's role/scope.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/reports/types',
  auth,
  requireAnalyticsScope('reportTypes'),
  async (req, res) => {
    const reportService = tryRequire('../services/reportService');
    if (!reportService) {
      return res.status(503).json({ message: 'Report service not yet available (Phase 7).' });
    }
    try {
      const scope = req.analyticsScope;
      const types = reportService.getAvailableReportTypes(scope);
      res.json(types);
    } catch (err) {
      console.error('[V2] /reports/types error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 — POST /reports/:reportType/generate
// Generates and streams a report in the requested format (pdf/excel/csv).
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/reports/:reportType/generate',
  auth,
  requireAnalyticsScope('reportGenerate'),
  async (req, res) => {
    const reportService = tryRequire('../services/reportService');
    const csvExporter   = tryRequire('../exporters/csvExporter');
    const excelExporter = tryRequire('../exporters/excelExporter');
    const pdfExporter   = tryRequire('../exporters/pdfExporter');

    if (!reportService) {
      return res.status(503).json({ message: 'Report service not yet available (Phase 7).' });
    }

    try {
      const scope      = req.analyticsScope;
      const reportType = req.params.reportType;
      const format     = (req.query.format || 'pdf').toLowerCase();

      const payload = await reportService.generateReport(reportType, scope, req.query);

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
      console.error('[V2] /reports/generate error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
