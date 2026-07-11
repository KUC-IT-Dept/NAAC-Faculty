/**
 * runAllSeeders.js
 *
 * Runs benchmark and analytics data seeders in the correct order.
 * Idempotent — safe to rerun at any time.
 *
 * Usage:
 *   node server/seeders/runAllSeeders.js
 *   node server/seeders/runAllSeeders.js --dry-run
 *   node server/seeders/runAllSeeders.js --benchmark-only
 *   node server/seeders/runAllSeeders.js --data-only
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const { seed: seedBenchmarks }         = require('./benchmarkSeeder');
const { seed: seedAnalyticsData }      = require('./analyticsDataSeeder');
const { seed: seedV3Metrics }          = require('./analyticsV3MetricSeeder');
const { update: updateComputedFields } = require('./benchmarkComputedFieldUpdater');

const isDryRun      = process.argv.includes('--dry-run');
const benchmarkOnly = process.argv.includes('--benchmark-only');
const dataOnly      = process.argv.includes('--data-only');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqac';

async function main() {
  console.log('\n🚀 NAAC Analytics Seeder Suite');
  console.log('================================');
  if (isDryRun) console.log('⚠  DRY RUN — no data will be written\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected\n');

  if (!dataOnly) {
    console.log('─── Phase 1: Benchmark Metrics ───────────────────────────');
    await seedBenchmarks(isDryRun);
    console.log('─── Phase 1b: V3 Metrics Catalogue ──────────────────────');
    await seedV3Metrics(isDryRun);
    // Phase 5: wire computedField on BenchmarkMetric docs that have matching
    // V3 Metric documents. Must run after both seeders above.
    console.log('─── Phase 5: Wire computedField on BenchmarkMetrics ──────');
    await updateComputedFields(isDryRun);
  }

  if (!benchmarkOnly) {
    console.log('─── Phase 2: Analytics Faculty/Publication Data ──────────');
    await seedAnalyticsData(isDryRun);
  }

  await mongoose.disconnect();
  console.log('\n🎉 All seeders completed successfully.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Seeder failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
