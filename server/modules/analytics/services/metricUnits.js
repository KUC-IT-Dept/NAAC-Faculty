'use strict';

/**
 * metricUnits.js - unit kinds for analytics metrics vs benchmark units, so a value is only
 * scored against bands it is actually expressed in. Never guesses: incompatible => no value.
 *
 * Metric kinds : count | percentage | ratio | currency_inr | currency_inr_per_faculty | years | decimal
 * Benchmark units (BenchmarkMetric.unit): count | percentage | ratio | years | days | amount_lakhs | option
 */

const LAKH = 100000;

function metricKind(m) {
  if (!m) return null;
  const f = m.formulaType;
  if (f === 'metricPercentage' || f === 'percentage') return 'percentage';
  if (f === 'sum') return 'currency_inr';
  if (f === 'ratio') return m.numeratorMetric === '3.2.1' ? 'currency_inr_per_faculty' : 'ratio';
  if (f === 'average') return m.metricId === 'emp.avgExperience' ? 'years' : 'decimal';
  return 'count';
}

/**
 * @returns {{ok:boolean, factor:number, reason?:string}} factor converts metric value to benchmark unit.
 */
function unitCompatibility(metric, benchmarkUnit) {
  const kind = metricKind(metric);
  const unit = benchmarkUnit || 'count';
  if (unit === 'option') return { ok: false, factor: 1, reason: 'qualitative' };
  if (unit === 'amount_lakhs' && kind === 'currency_inr') return { ok: true, factor: 1 / LAKH };
  if (unit === kind) return { ok: true, factor: 1 };
  // A generic average (no declared unit) can carry a duration such as average days.
  if (kind === 'decimal' && unit === 'days') return { ok: true, factor: 1 };
  return { ok: false, factor: 1, reason: 'unit_mismatch', metricKind: kind, benchmarkUnit: unit };
}

module.exports = { metricKind, unitCompatibility, LAKH };
