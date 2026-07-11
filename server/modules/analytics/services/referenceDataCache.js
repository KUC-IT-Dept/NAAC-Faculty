'use strict';

const Metric = require('../models/Metric');
const BenchmarkMetric = require('../models/BenchmarkMetric');

let cachedMetrics = null;
let cachedBenchmarkMetrics = null;
let lastMetricsFetch = 0;
let lastBenchmarkFetch = 0;

const TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

async function getMetrics() {
  const now = Date.now();
  if (!cachedMetrics || now - lastMetricsFetch > TTL_MS) {
    cachedMetrics = await Metric.find().lean();
    lastMetricsFetch = now;
  }
  return cachedMetrics;
}

async function getMetric(metricId) {
  const metrics = await getMetrics();
  return metrics.find(m => m.metricId === metricId) || null;
}

async function getBenchmarkMetrics() {
  const now = Date.now();
  if (!cachedBenchmarkMetrics || now - lastBenchmarkFetch > TTL_MS) {
    cachedBenchmarkMetrics = await BenchmarkMetric.find().lean();
    lastBenchmarkFetch = now;
  }
  return cachedBenchmarkMetrics;
}

async function getBenchmarkMetric(metricId) {
  const benchmarks = await getBenchmarkMetrics();
  return benchmarks.find(b => b.metricId === metricId) || null;
}

function invalidate() {
  cachedMetrics = null;
  cachedBenchmarkMetrics = null;
  lastMetricsFetch = 0;
  lastBenchmarkFetch = 0;
}

module.exports = {
  getMetrics,
  getMetric,
  getBenchmarkMetrics,
  getBenchmarkMetric,
  invalidate,
};
