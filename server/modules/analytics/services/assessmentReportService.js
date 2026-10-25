'use strict';

/**
 * assessmentReportService.js - institutional NAAC assessment report.
 *
 * Built only from what the system actually holds: benchmark evaluations from benchmarkService
 * (which already refuse to invent values) plus a few headline institutional totals from the
 * analytics engine. Nothing is estimated. A metric that cannot be calculated is listed with the
 * exact reason and the action that would fix it, never as 0 and never as a guessed score.
 */

const Faculty = require('../../faculty/models/Faculty');
const { getAllBenchmarks } = require('./benchmarkService');
const { calculateMetric } = require('./analyticsService');
const { buildFacultyFilter, mergeFilters, extractExperienceFilter } = require('./filterService');

const CRITERION_NAMES = {
  1: 'Curricular Aspects', 2: 'Teaching-Learning and Evaluation', 3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources', 5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management', 7: 'Institutional Values and Best Practices',
};

// What each "Insufficient data" reason means and what fixes it.
const REASONS = {
  no_analytics_mapping: ['No institutional data source is mapped to this benchmark.', 'Map it to an analytics metric in the Benchmark Catalogue if one exists; otherwise this indicator needs a data-collection module.'],
  analytics_metric_not_defined: ['The mapped analytics metric does not exist in this environment.', 'Re-map it in the Benchmark Catalogue and restart the server so the metric registry syncs.'],
  analytics_metric_unsupported: ['The mapped analytics metric is not supported by the current data model.', 'Choose a supported metric, or extend the profile form to capture the needed data.'],
  source_fields_missing: ['Required source fields are not captured in faculty records.', 'Add the missing field to the profile form, then re-run the report.'],
  no_institutional_records: ['No faculty or student records exist in the selected scope.', 'Check filters and scope; confirm profiles have been entered.'],
  calculation_failed: ['The value could not be calculated from the stored records.', 'Check the source entries for malformed values (for example amounts typed with text).'],
  unit_mismatch: ['The mapped metric is in a different unit from the benchmark, so it was not compared.', 'Map to a metric in the same unit (count, percentage, ratio, years or INR).'],
  zero_denominator: ['A ratio or percentage has no denominator (for example no faculty in scope).', 'Check filters and scope.'],
  component_insufficient: ['A component metric of this ratio could not be calculated.', 'Resolve the component metric first.'],
  component_metric_missing: ['A component metric of this ratio is not defined.', 'Check the metric registry.'],
  no_source_values: ['No faculty has entered the source value (for example total experience).', 'Ask faculty to complete the relevant profile section.'],
  unknown_formula_type: ['The mapped metric uses an unknown formula type.', 'Correct the metric definition.'],
  qualitative_requires_assessment: ['This is an A to E qualitative indicator and no assessment has been recorded.', 'Record the institutional self-assessment for this indicator.'],
  value_outside_all_bands: ['The value does not fall inside any score band of the benchmark.', 'Review the band boundaries in the Benchmark Catalogue.'],
};

const UNIT_SUFFIX = { percentage: '%', amount_lakhs: ' lakhs', days: ' days', years: ' yrs', ratio: '', count: '', option: '' };

function fmt(v, unit) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'number') return String(v);
  const n = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  return n + (UNIT_SUFFIX[unit] || '');
}

function critNo(b) {
  const n = Number(b.criterionNumber);
  return n >= 1 && n <= 7 ? n : null;
}

function scopeLabel(scope, query) {
  const parts = [scope && scope.level === 'department' && scope.department ? `Department: ${scope.department}` : 'Institution-wide'];
  for (const k of ['department', 'year', 'category', 'level', 'from', 'to']) if (query && query[k]) parts.push(`${k}: ${Array.isArray(query[k]) ? query[k].join(', ') : query[k]}`);
  return parts.join(' | ');
}

async function headlineFigures(scope, query) {
  const scoped = scope && scope.level === 'department' && scope.department ? { 'employmentDetails.department': scope.department } : {};
  const filter = mergeFilters(scoped, buildFacultyFilter(query || {}));
  const facultyN = await Faculty.countDocuments(extractExperienceFilter(filter).cleanFilter);
  const out = [{ label: 'Faculty records in scope', value: facultyN, unit: 'count' }];
  if (facultyN === 0) return out;
  for (const [id, label, unit, div] of [['3.4.4', 'Publications recorded', 'count', 1], ['3.2.2', 'Research projects recorded', 'count', 1], ['3.4.5', 'Patents recorded', 'count', 1], ['3.2.1', 'Sanctioned research funding (INR lakhs)', 'amount_lakhs', 100000]]) {
    const r = await calculateMetric(id, filter, { viewMode: 'absolute' }).catch(() => null);
    if (r && typeof r.value === 'number' && Number.isFinite(r.value)) out.push({ label, value: Number((r.value / div).toFixed(2)), unit });
  }
  return out;
}

function summarise(entries) {
  const assessed = entries.filter((e) => e.score !== null && e.score !== undefined);
  const count = (s) => assessed.filter((e) => e.status === s).length;
  return {
    total: entries.length, assessed: assessed.length, insufficient: entries.length - assessed.length,
    above: count('above'), meets: count('meets'), below: count('below'),
    meanScore: assessed.length ? Number((assessed.reduce((s, e) => s + e.score, 0) / assessed.length).toFixed(2)) : null,
  };
}

async function assessmentReport(scope, query = {}) {
  const benchmarks = await getAllBenchmarks(scope, query);
  const figures = await headlineFigures(scope, query);
  const all = summarise(benchmarks);

  const criteria = [];
  for (let n = 1; n <= 7; n += 1) {
    const list = benchmarks.filter((b) => critNo(b) === n);
    if (!list.length) { criteria.push({ number: n, name: CRITERION_NAMES[n], ...summarise([]), metrics: [] }); continue; }
    criteria.push({ number: n, name: CRITERION_NAMES[n], ...summarise(list), metrics: list.map(toMetricRow) });
  }
  const unnumbered = benchmarks.filter((b) => critNo(b) === null);
  if (unnumbered.length) criteria.push({ number: null, name: 'Unclassified criterion', ...summarise(unnumbered), metrics: unnumbered.map(toMetricRow) });

  const metricRows = criteria.flatMap((c) => c.metrics);
  const gaps = metricRows
    .filter((m) => m.assessed && m.status === 'below')
    .sort((a, b) => (a.achievementPercent ?? 0) - (b.achievementPercent ?? 0));
  const missing = metricRows.filter((m) => !m.assessed);
  const reasonCounts = {};
  for (const m of missing) reasonCounts[m.reasonText] = (reasonCounts[m.reasonText] || 0) + 1;

  const recommendations = [
    ...gaps.map((m) => ({ type: 'improvement', metricId: m.metricId, metric: m.metricName, criterion: m.criterionLabel, priority: m.score !== null && m.score <= 1 ? 'High' : 'Medium', text: m.recommendation || `Current value ${m.current} is below the benchmark ${m.benchmark}. No improvement hint is recorded for this indicator.` })),
    ...missing.map((m) => ({ type: 'data', metricId: m.metricId, metric: m.metricName, criterion: m.criterionLabel, priority: 'Data', text: m.action })),
  ];

  const reportMetricRows = metricRows.map((m) => ({
    'Criterion': m.criterionLabel, 'Metric ID': m.metricId, 'Metric': m.metricName, 'Unit': m.unit,
    'Current Value': m.assessed ? m.current : 'Insufficient data', 'Benchmark Value': m.benchmark,
    'Gap': m.gap, 'Achievement (%)': m.achievementPercent, 'Score (0-4)': m.score, 'Status': m.statusLabel,
    'Why no value': m.assessed ? '' : m.reasonText, 'Recommended action': m.assessed ? (m.status === 'below' ? m.recommendation : '') : m.action,
  }));

  return {
    title: 'NAAC Institutional Assessment Report',
    rows: reportMetricRows,
    assessment: {
      generatedAt: new Date().toISOString(), scope: scopeLabel(scope, query),
      executiveSummary: executiveSummary(all, criteria, figures, gaps, missing),
      figures, overall: all, criteria, gaps, missing, reasonCounts, recommendations,
      notes: [
        'Scores are benchmark band scores (0 to 4) from the active benchmark catalogue. This report does not compute an official NAAC grade.',
        'Values are calculated from faculty and institutional records currently in the system; indicators without a source are shown as missing, never as zero.',
        'Criterion averages cover assessed indicators only; read them together with the coverage count.',
      ],
    },
  };
}

function toMetricRow(b) {
  const assessed = b.score !== null && b.score !== undefined;
  const [reasonText, action] = REASONS[b.insufficientReason] || ['The value could not be calculated.', 'Review the mapping and source data.'];
  const n = critNo(b);
  return {
    metricId: b.metricId, metricName: b.metricName, unit: b.unit, assessed,
    criterionLabel: n ? `Criterion ${n}` : 'Unclassified',
    current: assessed ? fmt(b.currentValue, b.unit) : null, currentRaw: assessed ? b.currentValue : null,
    benchmark: b.scoringType === 'categorical' ? 'Grade A' : fmt(b.benchmarkValue, b.unit),
    gap: assessed && b.gap !== null && b.gap !== undefined ? Number(b.gap.toFixed ? b.gap.toFixed(2) : b.gap) : null,
    achievementPercent: assessed ? b.achievementPercent : null,
    score: assessed ? b.score : null, maxScore: b.maxScore ?? null, status: b.status, statusLabel: b.statusLabel,
    direction: b.direction, recommendation: b.recommendation || '',
    reasonText: assessed ? '' : reasonText, action: assessed ? '' : action, reasonCode: assessed ? null : b.insufficientReason,
  };
}

function executiveSummary(all, criteria, figures, gaps, missing) {
  const lines = [];
  if (all.total === 0) return ['No active benchmark indicators are configured, so no assessment could be produced. Import or add benchmarks in the Benchmark Catalogue.'];
  lines.push(`${all.assessed} of ${all.total} benchmark indicators could be assessed from institutional records (${Math.round((all.assessed / all.total) * 100)}% coverage); ${all.insufficient} could not be calculated.`);
  if (all.assessed) {
    lines.push(`Among assessed indicators, ${all.above} are above benchmark, ${all.meets} meet it and ${all.below} are below. The mean band score is ${all.meanScore} out of 4.`);
    const rated = criteria.filter((c) => c.assessed > 0 && c.meanScore !== null);
    if (rated.length) {
      const best = rated.reduce((a, b) => (b.meanScore > a.meanScore ? b : a));
      const worst = rated.reduce((a, b) => (b.meanScore < a.meanScore ? b : a));
      if (rated.length > 1 && best.number !== worst.number) lines.push(`Strongest assessed criterion: Criterion ${best.number} (${best.meanScore}/4). Weakest: Criterion ${worst.number} (${worst.meanScore}/4).`);
    }
  } else {
    lines.push('No indicator currently has enough data for a score, so no performance conclusion is drawn.');
  }
  if (gaps.length) lines.push(`Largest shortfalls: ${gaps.slice(0, 3).map((g) => `${g.metricId} ${g.metricName} (${g.current} vs ${g.benchmark})`).join('; ')}.`);
  const noSource = missing.filter((m) => m.reasonCode === 'no_analytics_mapping').length;
  if (noSource) lines.push(`${noSource} indicators have no data source mapped; they need either a mapping or a data-collection process before they can be assessed.`);
  const f = figures.find((x) => x.label.startsWith('Faculty'));
  if (f) lines.push(`Basis: ${f.value} faculty record(s) in the selected scope.`);
  return lines;
}

module.exports = { assessmentReport, CRITERION_NAMES, REASONS };
