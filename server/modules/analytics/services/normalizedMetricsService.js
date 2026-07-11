/**
 * normalizedMetricsService.js
 *
 * Computes normalized (per-faculty, per-student, or percentage) metric values
 * for the V3 normalized mode endpoint.
 *
 * Design:
 *   - Wraps the existing calculateMetric() engine — never duplicates logic
 *   - For ratio/metricPercentage metrics: calls calculateMetric() which already
 *     handles the numerator/denominator split internally
 *   - For absolute metrics: divides by facultycount to derive per-faculty ratio
 *   - Scope-aware: passes the combined filter to calculateMetric()
 *
 * Returns a standardized shape so the frontend can render any normalized
 * metric the same way regardless of its underlying formula type.
 */

'use strict';

const { calculateMetric } = require('./analyticsService');
const { buildFacultyFilter, mergeFilters } = require('./filterService');

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

/**
 * Returns a normalized view for a given metric.
 *
 * For ratio / metricPercentage metrics: calculateMetric() already computes
 * the normalized value internally — we call it once and return the result
 * with additional context.
 *
 * For count / sum metrics: we compute the absolute value and divide by the
 * faculty headcount within the same scope, producing a per-faculty ratio.
 *
 * @param {string} metricId   - The metric to normalize
 * @param {object} scope      - req.analyticsScope
 * @param {object} query      - req.query
 * @returns {Promise<object>}
 */
async function getNormalizedMetric(metricId, scope, query = {}) {
  const base       = scopeFilter(scope);
  const userFilter = buildFacultyFilter(query);
  const combined   = mergeFilters(base, userFilter);

  // Get the absolute value of the requested metric (scope-filtered)
  const absoluteResult = await calculateMetric(metricId, combined);
  if (!absoluteResult) {
    return null;
  }

  // Get the faculty count within the same scope/filter
  const facultyCountResult = await calculateMetric('facultycount', combined);
  const facultyCount = facultyCountResult ? facultyCountResult.value : 0;

  // Compute per-faculty ratio (guard against division by zero)
  const perFaculty = facultyCount > 0
    ? Number((absoluteResult.value / facultyCount).toFixed(4))
    : 0;

  // Compute percentage of facultyCount (only meaningful for count metrics)
  const percentageOfFaculty = facultyCount > 0
    ? Number((absoluteResult.value / facultyCount * 100).toFixed(2))
    : 0;

  return {
    metricId:             absoluteResult.metricId,
    metricName:           absoluteResult.metricName,
    absoluteValue:        absoluteResult.value,
    facultyCount,
    perFaculty,
    percentageOfFaculty,
    scope: {
      level:      scope.level,
      department: scope.department || null,
    },
    filters: Object.keys(combined).length > 0 ? combined : null,
  };
}

/**
 * Returns normalized values for all metrics in a given list.
 * Used by the "Normalized Overview" tab to load a dashboard of per-faculty
 * ratios in a single request.
 *
 * @param {string[]} metricIds  - Array of metricId strings
 * @param {object}   scope
 * @param {object}   query
 * @returns {Promise<Array>}
 */
async function getNormalizedMetrics(metricIds, scope, query = {}) {
  const results = await Promise.all(
    metricIds.map(id => getNormalizedMetric(id, scope, query).catch(() => null))
  );
  return results.filter(Boolean);
}

/**
 * Returns normalized values for the default "key research metrics" set.
 * Used when no specific metricIds are requested — provides a useful default
 * overview without requiring the caller to know all metric IDs.
 */
const DEFAULT_NORMALIZED_METRICS = [
  'ratio.pubsperfaculty',
  'ratio.projectsperfaculty',
  'ratio.patentsperfaculty',
  'ratio.fundingperfaculty',
  'pct.phdholders',
];

async function getDefaultNormalizedMetrics(scope, query = {}) {
  return getNormalizedMetrics(DEFAULT_NORMALIZED_METRICS, scope, query);
}

module.exports = {
  getNormalizedMetric,
  getNormalizedMetrics,
  getDefaultNormalizedMetrics,
  DEFAULT_NORMALIZED_METRICS,
};
