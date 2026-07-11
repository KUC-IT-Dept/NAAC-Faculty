/**
 * benchmarkThresholds.js
 *
 * Static lookup table mapping NAAC metric IDs to their benchmark
 * threshold values. This data is derived from the University's internal
 * benchmark manual and NAAC accreditation criteria.
 *
 * Structure per entry:
 *   metricId        — matches Metric.metricId in the database
 *   metricName      — human-readable name (for display, not keying)
 *   criterion       — NAAC criterion string (matches Metric.criterion)
 *   keyIndicator    — NAAC Key Performance Indicator number
 *   benchmarkValue  — the institution's target/benchmark value
 *   unit            — 'count' | 'percentage' | 'ratio' | 'amount'
 *   thresholds      — ordered bands: [ { min, max, status, score } ]
 *                     status: 'above' | 'meets' | 'below'
 *   improvementHint — short action text for the recommendation engine
 *
 * To add a new metric: add a new entry keyed by its metricId.
 * To update a threshold: change the numbers here only.
 * Nothing else needs to change.
 *
 * NOTE: benchmarkValue and threshold bands below reflect typical NAAC
 * norms for an Indian university. Adjust to your institution's actual
 * approved benchmark manual before deploying to production.
 */

'use strict';

const BENCHMARK_THRESHOLDS = {

  // ── 3.4.4 — Research Publications ────────────────────────────────────────
  '3.4.4': {
    metricId:       '3.4.4',
    metricName:     'Research Publications',
    criterion:      'Research & Publications',
    keyIndicator:   '3.4.4',
    benchmarkValue: 50,
    unit:           'count',
    thresholds: [
      { min: 50,  max: Infinity, status: 'above',  score: 4 },
      { min: 30,  max: 49,       status: 'meets',  score: 3 },
      { min: 10,  max: 29,       status: 'below',  score: 2 },
      { min: 0,   max: 9,        status: 'below',  score: 1 },
    ],
    improvementHint: 'Encourage faculty to publish in Scopus/WoS-indexed journals. Target at least 50 publications per academic year.',
  },

  // ── 3.2.2 — Research Projects ─────────────────────────────────────────────
  '3.2.2': {
    metricId:       '3.2.2',
    metricName:     'Research Projects',
    criterion:      'Research Projects',
    keyIndicator:   '3.2.2',
    benchmarkValue: 10,
    unit:           'count',
    thresholds: [
      { min: 10,  max: Infinity, status: 'above',  score: 4 },
      { min: 6,   max: 9,        status: 'meets',  score: 3 },
      { min: 3,   max: 5,        status: 'below',  score: 2 },
      { min: 0,   max: 2,        status: 'below',  score: 1 },
    ],
    improvementHint: 'Support faculty in applying for externally-funded projects (UGC, DST, SERB, DBT). Target at least 10 active projects.',
  },

  // ── 3.4.5 — Patents ───────────────────────────────────────────────────────
  '3.4.5': {
    metricId:       '3.4.5',
    metricName:     'Patents',
    criterion:      'Innovation & Intellectual Property',
    keyIndicator:   '3.4.5',
    benchmarkValue: 5,
    unit:           'count',
    thresholds: [
      { min: 5,   max: Infinity, status: 'above',  score: 4 },
      { min: 3,   max: 4,        status: 'meets',  score: 3 },
      { min: 1,   max: 2,        status: 'below',  score: 2 },
      { min: 0,   max: 0,        status: 'below',  score: 1 },
    ],
    improvementHint: 'Establish an IPR cell to guide faculty through the patent filing process. Target at least 5 patents filed/granted per year.',
  },

  // ── 3.2.1 — Research Funding ──────────────────────────────────────────────
  '3.2.1': {
    metricId:       '3.2.1',
    metricName:     'Research Funding',
    criterion:      'Research Funding',
    keyIndicator:   '3.2.1',
    benchmarkValue: 5000000,    // ₹50 lakh
    unit:           'amount',
    thresholds: [
      { min: 5000000,  max: Infinity,  status: 'above',  score: 4 },
      { min: 2000000,  max: 4999999,   status: 'meets',  score: 3 },
      { min: 500000,   max: 1999999,   status: 'below',  score: 2 },
      { min: 0,        max: 499999,    status: 'below',  score: 1 },
    ],
    improvementHint: 'Pursue major research grants from national agencies (SERB, DST, ICMR). Target ₹50 lakh or more in total sanctioned funding per year.',
  },

};

/**
 * Returns the threshold entry for a given metricId, or null if not found.
 *
 * @param {string} metricId
 * @returns {object|null}
 */
function getThreshold(metricId) {
  return BENCHMARK_THRESHOLDS[metricId] || null;
}

/**
 * Returns the status band for a given metricId + computed value.
 *
 * @param {string} metricId
 * @param {number} value
 * @returns {{ status: string, score: number, benchmarkValue: number, gap: number }|null}
 */
function evaluateThreshold(metricId, value) {
  const entry = getThreshold(metricId);
  if (!entry) return null;

  const band = entry.thresholds.find(t => value >= t.min && value <= t.max);
  const status = band ? band.status : 'below';
  const score  = band ? band.score  : 1;
  const gap    = entry.benchmarkValue - value;

  return {
    benchmarkValue:  entry.benchmarkValue,
    unit:            entry.unit,
    gap:             Number(gap.toFixed(2)),
    status,
    score,
    improvementHint: entry.improvementHint,
  };
}

module.exports = {
  BENCHMARK_THRESHOLDS,
  getThreshold,
  evaluateThreshold,
};
