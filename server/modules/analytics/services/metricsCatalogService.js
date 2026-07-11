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

// ── Criterion → NAAC criterion number mapping ─────────────────────────────────

const CRITERION_NUMBER = {
  'Curricular Aspects':               1,
  'Teaching-Learning and Evaluation': 2,
  'Research & Publications':          3,
  'Research Projects':                3,
  'Resource Mobilization':            3,
  'Innovation & Intellectual Property': 3,
  'Innovation & Awards':              3,
  'Research Guidance':                3,
  'Faculty Development':              6,
  'Professional Engagement':          6,
  'International Linkage':            3,
  'Administration & Extension':       5,
  'Quality Assurance':                6,
  'Teacher Profile & Quality':        2,
  'Student Progression':              5,
  'Infrastructure':                   4,
  'Governance':                       6,
  'Institutional Values':             7,
};

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

  return sortedMetrics.map(m => {
    const viewModes = FORMULA_VIEW_MODES[m.formulaType] || {
      absolute: true, perFaculty: false, percentage: false, perStudent: false, individual: false,
      trend: false, benchmark: false, comparison: false,
      drilldown: false, export: true,
    };

    return {
      metricId:        m.metricId,
      metricName:      m.metricName,
      criterion:       m.criterion,
      criterionNumber: CRITERION_NUMBER[m.criterion] || null,
      description:     m.description || '',
      formulaType:     m.formulaType,
      sourceField:     m.fieldPath || null,
      unit:            inferUnit(m),
      viewModes,
      recommendedChart: FORMULA_CHART[m.formulaType] || 'bar',
      supported:       m.supported !== false,
      isNormalized:    ['ratio', 'metricPercentage', 'average', 'percentage'].includes(m.formulaType),
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

module.exports = { getMetricsCatalogue, getMetricCatalogueEntry };
