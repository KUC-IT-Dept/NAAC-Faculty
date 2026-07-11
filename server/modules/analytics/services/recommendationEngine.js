/**
 * recommendationEngine.js
 *
 * Pure rule evaluator. Takes the output of benchmarkService.getAllBenchmarks()
 * and maps each below-benchmark metric to a prioritised recommendation.
 *
 * This module:
 *   - Has zero database access
 *   - Has zero knowledge of HTTP (no req/res)
 *   - Only consumes plain benchmark JSON already computed upstream
 *   - Is independently unit-testable with mock input data
 *
 * Rule priority assignment:
 *   high   — status === 'below' AND score === 1 (critical gap)
 *   medium — status === 'below' AND score === 2 (moderate gap)
 *   low    — status === 'meets' (on track but room to improve)
 *   (above-benchmark metrics are excluded from recommendations)
 */

'use strict';

/**
 * @typedef {object} BenchmarkEntry
 * @property {string} metricId
 * @property {string} metricName
 * @property {string} criterion
 * @property {number} currentValue
 * @property {number} benchmarkValue
 * @property {number} gap
 * @property {string} status        - 'above' | 'meets' | 'below'
 * @property {number} score
 * @property {string} recommendation
 */

/**
 * @typedef {object} Recommendation
 * @property {string} metricId
 * @property {string} metricName
 * @property {string} criterion
 * @property {'high'|'medium'|'low'} priority
 * @property {string} message
 * @property {number} currentValue
 * @property {number} benchmarkValue
 * @property {number} gap
 */

/**
 * Evaluates a list of benchmark entries and returns prioritised recommendations.
 *
 * @param {BenchmarkEntry[]} benchmarks
 * @returns {Recommendation[]}
 */
function getRecommendations(benchmarks) {
  if (!Array.isArray(benchmarks) || benchmarks.length === 0) return [];

  const recommendations = [];

  for (const entry of benchmarks) {
    // Metrics already above benchmark: no recommendation needed.
    if (entry.status === 'above') continue;

    let priority;
    if (entry.status === 'below' && entry.score <= 1) {
      priority = 'high';
    } else if (entry.status === 'below' && entry.score <= 2) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    recommendations.push({
      metricId:       entry.metricId,
      metricName:     entry.metricName,
      criterion:      entry.criterion,
      priority,
      message:        entry.recommendation,
      currentValue:   entry.currentValue,
      benchmarkValue: entry.benchmarkValue,
      gap:            entry.gap,
    });
  }

  // Sort: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);

  return recommendations;
}

module.exports = { getRecommendations };
