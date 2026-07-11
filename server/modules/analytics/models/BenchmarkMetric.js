/**
 * BenchmarkMetric.js
 *
 * Mongoose model for the `benchmarkmetrics` collection.
 *
 * Each document represents one NAAC metric with its full threshold table
 * as parsed from the University Benchmark Manual PDF.
 *
 * Threshold bands are stored as an ordered array — the service evaluates
 * them top-to-bottom and uses the first band where value falls in range.
 *
 * metricType:
 *   'quantitative' — numeric scoring via threshold bands (QnM)
 *   'qualitative'  — option-based scoring (A/B/C/D/E)
 *
 * unit:
 *   'count' | 'percentage' | 'ratio' | 'amount_lakhs' | 'days' | 'years' | 'option'
 *
 * The `computedField` links this benchmark metric to the analytics engine:
 *   When set, benchmarkService will call calculateMetric(computedField) to
 *   get the live value. When null, the service looks for a matching
 *   InstitutionMetric document instead (for non-formula metrics).
 */

'use strict';

const mongoose = require('mongoose');

const thresholdBandSchema = new mongoose.Schema({
  score:      { type: Number, required: true },           // 0, 1, 2, 3, or 4
  min:        { type: Number, default: null },            // null for option-based
  max:        { type: Number, default: null },            // null = Infinity
  label:      { type: String, default: '' },              // e.g. ">=10", "7-10"
  status:     {
    type: String,
    enum: ['above', 'meets', 'below', 'option'],
    default: 'below',
  },
}, { _id: false });

const benchmarkMetricSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────────────────
  metricId: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
  },
  metricName: {
    type:     String,
    required: true,
    trim:     true,
  },
  description: {
    type:    String,
    default: '',
  },

  // ── NAAC hierarchy ──────────────────────────────────────────────────────────
  criterion: {
    type:     String,
    required: true,
    trim:     true,
    // e.g. "Criterion 3 – Research, Innovations and Extension"
  },
  criterionNumber: {
    type: Number,
    // e.g. 3
  },
  keyIndicator: {
    type:     String,
    required: true,
    trim:     true,
    // e.g. "3.4 Research Publications and Awards"
  },
  maxScore: {
    type:    Number,
    default: 0,
    // The score weight in parentheses from the PDF, e.g. 20 for metric 3.4.4
  },

  // ── Threshold data ──────────────────────────────────────────────────────────
  metricType: {
    type:    String,
    enum:    ['quantitative', 'qualitative'],
    default: 'quantitative',
  },
  unit: {
    type:    String,
    enum:    ['count', 'percentage', 'ratio', 'amount_lakhs', 'days', 'years', 'option'],
    default: 'count',
  },
  // The "benchmark" value = the minimum value needed for score=4 (top band)
  benchmarkValue: {
    type:    Number,
    default: null,
  },
  // Ordered array of scoring bands, score 4 first
  bands: {
    type:    [thresholdBandSchema],
    default: [],
  },

  // ── Engine linkage ──────────────────────────────────────────────────────────
  // When set, benchmarkService calls calculateMetric(computedField) for live value.
  // When null, service looks up InstitutionMetric(metricId) for manually-entered value.
  computedField: {
    type:    String,
    default: null,
    // matches a metricId in the Metric collection that the analytics engine can calculate
  },

  // ── Recommendation text ────────────────────────────────────────────────────
  improvementHint: {
    type:    String,
    default: '',
  },

  // ── Control ────────────────────────────────────────────────────────────────
  active: {
    type:    Boolean,
    default: true,
  },

  // Phase 18: direction field for ranking (aligned with Metric model)
  direction: {
    type:    String,
    enum:    ['higherIsBetter', 'lowerIsBetter'],
    default: 'higherIsBetter',
  },
}, {
  timestamps: true,
  collection: 'benchmarkmetrics',
});

benchmarkMetricSchema.index({ criterion: 1 });
benchmarkMetricSchema.index({ criterionNumber: 1 });
benchmarkMetricSchema.index({ active: 1 });

module.exports = mongoose.model('BenchmarkMetric', benchmarkMetricSchema);
