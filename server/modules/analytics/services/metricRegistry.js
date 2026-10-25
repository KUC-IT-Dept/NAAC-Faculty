'use strict';

/**
 * metricRegistry.js - keeps the `metrics` collection in step with the code-defined
 * definitions. Upserts definitions only (never faculty/student data, never benchmark
 * documents), so it is safe in production and idempotent.
 */

const Metric = require('../models/Metric');
const { getMetricDefinitions } = require('../data/metricDefinitions');

async function syncMetricRegistry({ log = console } = {}) {
  const defs = getMetricDefinitions();
  const ops = defs.map((d) => ({
    updateOne: {
      filter: { metricId: d.metricId },
      update: { $set: { missingFields: [], ...d } },
      upsert: true,
    },
  }));
  const res = await Metric.bulkWrite(ops, { ordered: false });
  try { require('./referenceDataCache').invalidate(); } catch { /* cache optional */ }
  const summary = { defined: defs.length, inserted: res.upsertedCount || 0, modified: res.modifiedCount || 0 };
  log.log(`[metricRegistry] ${summary.defined} metric definitions (${summary.inserted} new, ${summary.modified} updated)`);
  return summary;
}

module.exports = { syncMetricRegistry };
