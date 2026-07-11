/**
 * benchmarkComputedFieldUpdater.js
 *
 * Idempotent updater that wires computedField on BenchmarkMetric documents
 * to their matching V3 Metric IDs where a live calculation is possible.
 *
 * Based on the computability audit in ANALYTICS_V3_IMPLEMENTATION.md §10.1 / §15.
 * Metrics that are genuinely not computable from the schema stay null
 * (they appear as status: 'unknown' in the benchmark UI — intentional,
 * not a bug — see spec §10.1 "do not force a fake computation").
 *
 * Run: node server/seeders/benchmarkComputedFieldUpdater.js
 *      node server/seeders/benchmarkComputedFieldUpdater.js --dry-run
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 5 §15 AUDIT TABLE — 44 NAAC Benchmark Metrics: Computable vs Manual
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Key: [C] = Computable from current Faculty/Student schema
 *      [M] = Manual entry required (data not captured in current schema)
 *      [P] = Partial proxy (computable but not a perfect match to NAAC criteria)
 *
 * CRITERION 1 — Curricular Aspects
 *   1.2.1  New Courses Introduced (%)                          [M] No course DB
 *   1.3.2  Value-Added / Certificate / MOOC Courses            [M] No student course enrollment DB
 *   1.3.3  Programs with Field/Research Projects (%)           [M] No program-level field in DB
 *   1.4.1  Structured Feedback System                          [M] Qualitative option, not in schema
 *
 * CRITERION 2 — Teaching-Learning and Evaluation
 *   2.1.1  Enrollment Percentage                               [M] No enrollment targets in DB
 *   2.1.2  Reserved Category Seats Filled (%)                  [M] No category seat data
 *   2.2.2  Student-Teacher Ratio                               [P] Computable as studentCount÷facultyCount
 *          → computedField: null (soft join unreliable per §2.3)
 *   2.4.1  Full-Time Teachers Appointed Against Sanctioned (%) [M] No sanctioned posts in DB
 *   2.4.2  Teachers with Ph.D (%)                              [C] → pct.phdholders
 *   2.4.3  Average Teaching Experience (Years)                 [C] → emp.avgExperience
 *   2.5.1  Days to Declare Results                             [M] No examination result dates in DB
 *   2.5.2  Student Grievances About Evaluation (%)             [M] No grievance data in DB
 *   2.5.3  Examination Automation Status                       [M] Qualitative
 *   2.6.2  Pass Percentage of Students                         [M] No exam result data in DB
 *
 * CRITERION 3 — Research, Innovations and Extension
 *   3.1.2  Seed Money to Teachers (INR Lakhs/year)             [M] No seed money field in DB
 *   3.1.3  Teachers with Fellowship/Financial Support (%)      [M] No fellowship field in DB
 *   3.1.4  JRF/SRF Among Enrolled PhD Scholars (%)            [M] No JRF/SRF field in DB
 *   3.2.1  Research Funding (INR in Lakhs)                     [C] → 3.2.1 (amountSanctioned sum)
 *   3.2.2  Research Projects per Teacher                       [C] → ratio.projectsperfaculty
 *   3.3.2  Awards for Research/Innovations                     [C] → awards.total
 *   3.4.2  Patents Awarded                                     [C] → patent.granted
 *   3.4.3  PhDs Awarded per Recognised Guide                   [P] → phd.completed (total, not per-guide)
 *          → computedField: phd.completed (proxy: total PhDs completed across all faculty)
 *   3.4.4  Research Papers per Teacher (UGC Journals)          [C] → ratio.pubsperfaculty
 *   3.4.5  Total Patents                                       [C] → 3.4.5
 *   3.4.5_books Books/Chapters per Teacher                     [C] → 3.4.5_books
 *   3.4.7  Average Citation Index                              [M] No citation data in DB (§4.15)
 *   3.4.8  h-Index of University                               [M] No h-index data in DB (§4.15)
 *   3.5.1  Consultancy Revenue (INR Lakhs)                     [M] No consultancy revenue field
 *   3.6.2  Extension and Outreach Programs                     [P] → extrainst.total (proxy)
 *   3.7.1  Functional MoUs                                     [M] No MoU field in DB
 *
 * CRITERION 4 — Infrastructure
 *   4.1.2  Infrastructure Expenditure (%)                      [M] No financial data in DB
 *   4.3.2  Student-Computer Ratio                              [M] No computer inventory in DB
 *   4.4.1  Expenditure on Infrastructure Maintenance (%)       [M] No maintenance expenditure data
 *
 * CRITERION 5 — Student Support and Progression
 *   5.1.3  Scholarships/Freeships to Students (%)              [M] No scholarship data in DB
 *   5.1.4  Capacity Building / Skill Enhancement Schemes       [M] Qualitative
 *   5.2.1  Placement and Higher Studies (%)                    [M] No placement data (§4.15)
 *   5.2.2  Students Qualifying National/International Exams (%)  [M] No qualifying exam data
 *   5.3.1  Awards for Students in Sports/Cultural Activities   [M] No student awards field
 *   5.4.1  Alumni Contributions (INR Lakhs)                    [M] No alumni contribution data
 *
 * CRITERION 6 — Governance, Leadership and Management
 *   6.3.2  Teachers with Financial Support for Conferences (%) [P] → fdp.total (proxy)
 *          → computedField: fdp.total (proxy: FDP participation count)
 *   6.3.3  Teachers Completing FDP/MDP (%)                     [C] → pct.fdpparticipants
 *          (Note: pct.fdpparticipants not yet seeded; use fdp.total as proxy for now)
 *          → computedField: fdp.total
 *   6.4.2  Government Grants for Infrastructure (INR Lakhs)    [M] No grant-specific field
 *
 * CRITERION 7 — Institutional Values
 *   7.1.2  Alternate Energy Sources                            [M] Qualitative / infrastructure
 *   7.1.4  Water Conservation Facilities                       [M] Qualitative / infrastructure
 *
 * Summary: 11 Computable [C], 6 Partial proxy [P], 27 Manual entry required [M]
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose        = require('mongoose');
const BenchmarkMetric = require('../modules/analytics/models/BenchmarkMetric');

// ── Mapping: BenchmarkMetric.metricId → Metric.metricId (computedField) ──────
// Only entries where a live calculation is possible from the current schema.
// All others intentionally remain null (Manual entry required).
//
// Entries marked [P] are proxies — they compute a related but not identical
// value. The UI shows them with status badges so operators understand the
// caveat (spec §10.1).

const COMPUTED_FIELD_MAP = {
  // Criterion 2 — Teacher Profile
  '2.4.2': 'pct.phdholders',         // [C] % teachers with PhD
  '2.4.3': 'emp.avgExperience',      // [C] average teaching experience

  // Criterion 3 — Research
  '3.2.1': '3.2.1',                  // [C] research funding (sum of amountSanctioned)
  '3.2.2': 'ratio.projectsperfaculty', // [C] projects per teacher
  '3.3.2': 'awards.total',           // [C] awards for research/innovation
  '3.4.2': 'patent.granted',         // [C] patents awarded (granted = awarded)
  '3.4.3': 'phd.completed',          // [P] PhDs per guide — proxy: total PhDs completed
  '3.4.4': 'ratio.pubsperfaculty',   // [C] research papers per teacher
  '3.4.5': '3.4.5',                  // [C] total patents
  '3.4.5_books': '3.4.5_books',      // [C] books/chapters

  // Criterion 3 — Extension (proxy)
  '3.6.2': 'extrainst.total',        // [P] extension/outreach programs proxy

  // Criterion 6 — Faculty development (proxy)
  '6.3.2': 'fdp.total',              // [P] teachers with financial support (FDP proxy)
  '6.3.3': 'fdp.total',              // [P] teachers completing FDP (FDP count proxy)
};

async function update(dryRun = false) {
  const entries = Object.entries(COMPUTED_FIELD_MAP);
  console.log(`\n📋 Benchmark computedField mappings to apply: ${entries.length}`);

  let updated = 0, skipped = 0, errors = 0;

  for (const [benchmarkId, computedField] of entries) {
    try {
      const doc = await BenchmarkMetric.findOne({ metricId: benchmarkId });
      if (!doc) {
        console.log(`  SKIP (not found): ${benchmarkId}`);
        skipped++;
        continue;
      }
      if (doc.computedField === computedField) {
        console.log(`  OK   (already set): ${benchmarkId} → ${computedField}`);
        skipped++;
        continue;
      }
      if (dryRun) {
        console.log(`  [DRY] ${benchmarkId} → ${computedField}`);
        updated++;
        continue;
      }
      await BenchmarkMetric.updateOne(
        { metricId: benchmarkId },
        { $set: { computedField } }
      );
      console.log(`  SET  ${benchmarkId} → ${computedField}`);
      updated++;
    } catch (err) {
      console.error(`  ERR  ${benchmarkId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped, ${errors} errors.\n`);
}

const isDryRun = process.argv.includes('--dry-run');

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqac';
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB connected');
      await update(isDryRun);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌', err.message);
      process.exit(1);
    });
}

module.exports = { update };
