/**
 * analyticsV3MetricSeeder.js
 *
 * Seeds the `metrics` collection with all new Metric documents from
 * the Analytics V3 specification (§4 of ANALYTICS_V3_IMPLEMENTATION.md).
 *
 * The four already-existing V1 metrics (3.4.4, 3.2.2, 3.4.5, 3.2.1)
 * are NOT touched — this seeder only inserts net-new documents.
 *
 * Idempotent: uses updateOne + upsert so re-running is always safe.
 *
 * Run:  node server/seeders/analyticsV3MetricSeeder.js
 *       node server/seeders/analyticsV3MetricSeeder.js --dry-run
 *
 * After running, re-run benchmarkSeeder.js to wire computedField
 * on BenchmarkMetric documents that map to these new metricIds.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Metric   = require('../modules/analytics/models/Metric');

// ── Metric definitions ────────────────────────────────────────────────────────
// Each object is a full Metric document definition.
// Fields mirror the MetricSchema in server/modules/analytics/models/Metric.js:
//   metricId, metricName, criterion, description, formulaType,
//   fieldPath, sumField, conditionField, conditionValue,
//   numeratorMetric, denominatorMetric, numeratorField,
//   collection, supported, sourceModules

const { buildMetrics } = require('../modules/analytics/data/metricDefinitions');

// ── Seeder main ───────────────────────────────────────────────────────────────

async function seed(dryRun = false) {
  const metrics = buildMetrics();
  console.log(`\n📋 V3 metrics to seed: ${metrics.length}`);

  // The four already-existing V1 metricIds must not be duplicated
  const V1_IDS = new Set(['3.4.4', '3.2.2', '3.4.5', '3.2.1']);

  // Sanity check — warn if any V1 id accidentally appears
  const conflicts = metrics.filter(m => V1_IDS.has(m.metricId));
  if (conflicts.length > 0) {
    console.warn(`⚠  These metricIds overlap with V1 and will SKIP: ${conflicts.map(c => c.metricId).join(', ')}`);
  }
  const toSeed = metrics.filter(m => !V1_IDS.has(m.metricId));

  if (dryRun) {
    toSeed.forEach(m => console.log(`  [DRY] ${m.metricId.padEnd(28)} ${m.metricName}`));
    console.log(`\n✅ Dry run complete — ${toSeed.length} metrics would be upserted.\n`);
    return;
  }

  let upserted = 0, errors = 0;
  for (const metric of toSeed) {
    try {
      await Metric.updateOne(
        { metricId: metric.metricId },
        { $set: metric },
        { upsert: true }
      );
      upserted++;
    } catch (err) {
      console.error(`  ❌ ${metric.metricId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ V3 metric seeder complete: ${upserted} upserted, ${errors} errors.\n`);
  try {
    const cache = require('../modules/analytics/services/referenceDataCache');
    cache.invalidate();
    console.log('✅ In-memory reference cache invalidated.');
  } catch (e) {
    // ignore
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes('--dry-run');

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqac';
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB connected');
      await seed(isDryRun);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seed };
