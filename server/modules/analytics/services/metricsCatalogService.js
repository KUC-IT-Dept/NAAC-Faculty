/**
 * metricsCatalogService.js
 *
 * Returns the full metric registry for the V3 metrics catalogue endpoint.
 * Reads all Metric documents from the DB and enriches them with static
 * view-mode metadata from the METRIC_INVENTORY, so the frontend can build
 * a metric picker that knows which views each metric supports.
 *
 * This service:
 *   - Never queries Faculty or StudentProfile directly
 *   - Never duplicates calculation logic
 *   - Is read-only and scope-agnostic (scope filtering happens at the
 *     calculation layer, not here)
 */

'use strict';

const Metric = require('../models/Metric');

// ── Static view-mode metadata ─────────────────────────────────────────────────
// Keyed by formulaType. Describes which view modes are supported by default
// for any metric using that formula type. Individual metrics can override.

const FORMULA_VIEW_MODES = {
  count:                  { absolute: true,  perFaculty: true,  percentage: true,  perStudent: true,  individual: true,  trend: true,  benchmark: true,  comparison: true,  drilldown: true,  export: true  },
  conditionalCount:       { absolute: true,  perFaculty: true,  percentage: true,  perStudent: true,  individual: true,  trend: true,  benchmark: false, comparison: true,  drilldown: true,  export: true  },
  sum:                    { absolute: true,  perFaculty: true,  percentage: false, perStudent: true,  individual: true,  trend: true,  benchmark: true,  comparison: true,  drilldown: true,  export: true  },
  objectSum:              { absolute: true,  perFaculty: true,  percentage: false, perStudent: true,  individual: true,  trend: false, benchmark: true,  comparison: true,  drilldown: false, export: true  },
  average:                { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: true,  trend: true,  benchmark: false, comparison: true,  drilldown: true,  export: true  },
  percentage:             { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: false, trend: true,  benchmark: true,  comparison: true,  drilldown: false, export: true  },
  ratio:                  { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: true,  trend: true,  benchmark: false, comparison: true,  drilldown: true,  export: true  },
  metricPercentage:       { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: false, trend: true,  benchmark: true,  comparison: true,  drilldown: false, export: true  },
  facultyCount:           { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: false, trend: true,  benchmark: true,  comparison: true,  drilldown: true,  export: true  },
  studentCount:           { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: false, trend: true,  benchmark: false, comparison: false, drilldown: false, export: true  },
  studentConditionalCount:{ absolute: true,  perFaculty: false, percentage: true,  perStudent: false, individual: false, trend: false, benchmark: false, comparison: false, drilldown: false, export: true  },
  studentExists:          { absolute: true,  perFaculty: false, percentage: true,  perStudent: false, individual: false, trend: false, benchmark: false, comparison: false, drilldown: false, export: true  },
  distinctGroupCount:     { absolute: true,  perFaculty: false, percentage: false, perStudent: false, individual: false, trend: false, benchmark: false, comparison: false, drilldown: false, export: true  },
};

// ── Recommended chart mapping ─────────────────────────────────────────────────

const FORMULA_CHART = {
  count:            'bar',
  conditionalCount: 'bar',
  sum:              'area',
  objectSum:        'bar',
  average:          'bar',
  percentage:       'gauge',
  ratio:            'bar',
  metricPercentage: 'gauge',
  facultyCount:     'stat',
  studentCount:     'stat',
};

// ── Centralized Criterion Normalization ────────────────────────────────────────

/**
 * Normalizes criterion number (1-7) from a Metric object or BenchmarkMetric object.
 * Returns an integer 1-7 or null if ambiguous/unrecognized.
 *
 * Precedence order:
 * 1. Valid explicit criterionNumber (1-7)
 * 2. Structured criterion metadata
 * 3. Unambiguous metricId prefix (e.g. "3.4.4", "2.2.2", "3.2.1_B")
 * 4. Recognized legacy criterion string
 * 5. null when ambiguous
 */
function normalizeCriterion(metric) {
  if (!metric) return null;

  // 1. Valid explicit criterionNumber
  if (typeof metric.criterionNumber === 'number' && metric.criterionNumber >= 1 && metric.criterionNumber <= 7) {
    return metric.criterionNumber;
  }
  if (typeof metric.criterionNumber === 'string') {
    const parsed = parseInt(metric.criterionNumber, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) return parsed;
  }

  const CRITERION_STRING_MAP = {
    'Curricular Aspects': 1,
    'Criterion 1 – Curricular Aspects': 1,
    'Criterion 1': 1,

    'Teaching-Learning and Evaluation': 2,
    'Teacher Profile & Quality': 2,
    'Criterion 2 – Teaching-Learning and Evaluation': 2,
    'Criterion 2': 2,

    'Research & Publications': 3,
    'Research Projects': 3,
    'Resource Mobilization': 3,
    'Innovation & Intellectual Property': 3,
    'Innovation & Awards': 3,
    'Research Guidance': 3,
    'International Linkage': 3,
    'Research, Innovations and Extension': 3,
    'Criterion 3 – Research, Innovations and Extension': 3,
    'Criterion 3': 3,

    'Infrastructure': 4,
    'Infrastructure and Learning Resources': 4,
    'Criterion 4 – Infrastructure and Learning Resources': 4,
    'Criterion 4': 4,

    'Administration & Extension': 5,
    'Student Progression': 5,
    'Student Support and Progression': 5,
    'Criterion 5 – Student Support and Progression': 5,
    'Criterion 5': 5,

    'Faculty Development': 6,
    'Professional Engagement': 6,
    'Quality Assurance': 6,
    'Governance': 6,
    'Governance, Leadership and Management': 6,
    'Criterion 6 – Governance, Leadership and Management': 6,
    'Criterion 6': 6,

    'Institutional Values': 7,
    'Institutional Values and Best Practices': 7,
    'Criterion 7 – Institutional Values and Best Practices': 7,
    'Criterion 7': 7,
  };

  // 2 & 4. Structured or Recognized legacy criterion string
  if (metric.criterion && typeof metric.criterion === 'string') {
    const trimmed = metric.criterion.trim();
    if (CRITERION_STRING_MAP[trimmed]) {
      return CRITERION_STRING_MAP[trimmed];
    }
    const match = trimmed.match(/^Criterion\s*([1-7])/i) || trimmed.match(/^([1-7])\s*[-–]/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 7) return num;
    }
  }

  // 3. Unambiguous metricId prefix
  if (metric.metricId && typeof metric.metricId === 'string') {
    const id = metric.metricId.trim();
    const prefixMatch = id.match(/^([1-7])\./);
    if (prefixMatch) {
      const num = parseInt(prefixMatch[1], 10);
      if (num >= 1 && num <= 7) return num;
    }
  }

  // 5. null when ambiguous
  return null;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Returns the full metric catalogue with view-mode metadata.
 *
 * @param {object} options
 * @param {string} [options.criterion]        - Filter by criterion string (partial, case-insensitive)
 * @param {string} [options.formulaType]      - Filter by formula type
 * @param {boolean} [options.supportedOnly]   - If true, only return metrics with supported: true
 * @returns {Promise<Array>}
 */
async function getMetricsCatalogue(options = {}) {
  const { getMetrics } = require('./referenceDataCache');
  let metrics = await getMetrics();

  if (options.criterion) {
    const regex = new RegExp(options.criterion, 'i');
    metrics = metrics.filter(m => regex.test(m.criterion));
  }
  if (options.formulaType) {
    metrics = metrics.filter(m => m.formulaType === options.formulaType);
  }
  if (options.supportedOnly) {
    metrics = metrics.filter(m => m.supported === true);
  }

  const sortedMetrics = [...metrics].sort((a, b) => {
    const critA = a.criterion || '';
    const critB = b.criterion || '';
    const comp = critA.localeCompare(critB);
    if (comp !== 0) return comp;
    return String(a.metricId).localeCompare(String(b.metricId));
  });

// ── Primary Activity Metric Classification ──────────────────────────────────────
// Top-level metrics representing distinct underlying records/entities.
// Excludes breakdown dimensions (e.g., Scopus, journal, online FDP) and normalized ratios/percentages.
const PRIMARY_ACTIVITY_METRICS = new Set([
  '3.4.4',             // Research Publications
  '3.2.2',             // Research Projects
  '3.4.5',             // Patents
  'awards.total',      // Total Awards
  'fdp.total',         // FDP / Workshop Participations
  'courses.total',     // Online Courses / Certifications
  'membership.total',  // Professional Memberships
  'intl.total',        // International Engagements
  'phd.completed',     // PhD Scholars Guided to Completion
  'phd.inprogress',    // PhD Scholars In Progress
  'mphil.completed',   // M.Phil Scholars Completed
  'mphil.inprogress',  // M.Phil Scholars In Progress
  'pg.supervised',     // PG Projects Supervised
  'qual.phdholders',   // Faculty with PhD
  'qual.netset',       // Faculty with NET/SET/GATE
  'admin.total',       // Admin Responsibilities
  'deptcharges.total', // Departmental Charges
  'specialassign.total', // Special Assignments
  'extrainst.total',   // Extra-Institutional Activities
  'adminnonacad.total',// Admin Non-Academic
  'acadadmin.total',   // Academic Administration
  'researchinnov.total',// Research & Innovation
  'examseval.total',   // Exam & Eval
  'adminsupport.total',// Admin Support
  'qa.total',          // Quality Assurance
]);

  return sortedMetrics.map(m => {
    const viewModes = FORMULA_VIEW_MODES[m.formulaType] || {
      absolute: true, perFaculty: false, percentage: false, perStudent: false, individual: false,
      trend: false, benchmark: false, comparison: false,
      drilldown: false, export: true,
    };

    return {
      metricId:        m.metricId,
      metricName:      m.metricName,
      criterion:       m.criterion || null,
      criterionNumber: normalizeCriterion(m),
      description:     m.description || '',
      formulaType:     m.formulaType,
      sourceField:     m.fieldPath || null,
      unit:            inferUnit(m),
      viewModes,
      recommendedChart: FORMULA_CHART[m.formulaType] || 'bar',
      supported:       m.supported !== false,
      isNormalized:    ['ratio', 'metricPercentage', 'average', 'percentage'].includes(m.formulaType),
      isPrimaryActivity: PRIMARY_ACTIVITY_METRICS.has(m.metricId),
    };
  });
}

/**
 * Infers a human-readable unit label from metric metadata.
 * @param {object} m - Metric document
 * @returns {string}
 */
function inferUnit(m) {
  if (m.formulaType === 'sum' && m.metricId && m.metricId.includes('funding')) return 'Currency (₹)';
  if (m.formulaType === 'sum') return 'Currency (₹)';
  if (m.formulaType === 'average' && m.metricId === 'emp.avgExperience') return 'Years';
  if (m.formulaType === 'average') return 'Decimal';
  if (m.formulaType === 'metricPercentage' || m.formulaType === 'percentage') return 'Percentage (%)';
  if (m.formulaType === 'ratio') return 'Ratio';
  if (m.formulaType === 'facultyCount' || m.formulaType === 'studentCount') return 'Count';
  return 'Count';
}

/**
 * Returns a single metric's catalogue entry with view-mode metadata.
 * @param {string} metricId
 * @returns {Promise<object|null>}
 */
async function getMetricCatalogueEntry(metricId) {
  const catalogue = await getMetricsCatalogue({});
  return catalogue.find(m => m.metricId === metricId) || null;
}

module.exports = { getMetricsCatalogue, getMetricCatalogueEntry, normalizeCriterion };
