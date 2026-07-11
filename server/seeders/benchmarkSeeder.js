/**
 * benchmarkSeeder.js
 *
 * Populates the `benchmarkmetrics` collection from the University Benchmark
 * Manual PDF (General University Manual).
 *
 * Idempotent: uses updateOne + upsert so re-running updates existing docs
 * and inserts missing ones. Never creates duplicates.
 *
 * Run: node server/seeders/benchmarkSeeder.js
 * Or:  node server/seeders/benchmarkSeeder.js --dry-run  (prints, no write)
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const BenchmarkMetric = require('../modules/analytics/models/BenchmarkMetric');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a quantitative band array from the PDF table columns [4,3,2,1,0].
 *  Each col is a string like ">=10", "7-10", "<1", "<=20:1" etc.
 *  Returns bands sorted score desc (4 first). */
function buildBands(col4, col3, col2, col1, col0) {
  return [
    { score: 4, label: col4, ...parseRange(col4, true),  status: 'above'  },
    { score: 3, label: col3, ...parseRange(col3, false), status: 'above'  },
    { score: 2, label: col2, ...parseRange(col2, false), status: 'meets'  },
    { score: 1, label: col1, ...parseRange(col1, false), status: 'below'  },
    { score: 0, label: col0, ...parseRange(col0, false), status: 'below'  },
  ];
}

/** Parse a range string like ">=10", "7-10", "<5", "<=20:1", "20:1-30:1" into {min,max}. */
function parseRange(str, isTopBand) {
  if (!str || str.trim() === '') return { min: null, max: null };
  const s = str.trim().replace(/\s/g, '');

  // Ratio strings like "<=20:1" or "20:1-30:1" — extract first number
  const ratioVal = s => s.replace(/:1/g, '');

  if (s.startsWith('>=')) {
    const v = parseFloat(ratioVal(s.slice(2)));
    return { min: v, max: null }; // null = Infinity
  }
  if (s.startsWith('>')) {
    const v = parseFloat(ratioVal(s.slice(1)));
    return { min: v + 0.001, max: null };
  }
  if (s.startsWith('<=')) {
    const v = parseFloat(ratioVal(s.slice(2)));
    return { min: null, max: v }; // null min = 0
  }
  if (s.startsWith('<')) {
    const v = parseFloat(ratioVal(s.slice(1)));
    return { min: null, max: v - 0.001 };
  }
  // Range like "7-10" or "20:1-30:1"
  const dashIdx = s.lastIndexOf('-');
  if (dashIdx > 0) {
    const lo = parseFloat(ratioVal(s.slice(0, dashIdx)));
    const hi = parseFloat(ratioVal(s.slice(dashIdx + 1)));
    return { min: lo, max: hi };
  }
  const num = parseFloat(ratioVal(s));
  if (!isNaN(num)) return { min: num, max: num };
  return { min: null, max: null };
}

/** Build option-based bands (A=4, B=3, C=2, D=1, E=0) */
function optionBands() {
  return [
    { score: 4, label: 'A', min: null, max: null, status: 'above' },
    { score: 3, label: 'B', min: null, max: null, status: 'above' },
    { score: 2, label: 'C', min: null, max: null, status: 'meets' },
    { score: 1, label: 'D', min: null, max: null, status: 'below' },
    { score: 0, label: 'E', min: null, max: null, status: 'below' },
  ];
}

/** Extract the top-band min as benchmarkValue */
function benchmarkFromBands(bands) {
  const top = bands.find(b => b.score === 4);
  if (!top) return null;
  if (top.min !== null) return top.min;
  if (top.max !== null) return top.max;
  return null;
}

// ── All metrics from the PDF ──────────────────────────────────────────────────

function buildAllMetrics() {
  const metrics = [];

  // Helper to push
  const add = (m) => metrics.push(m);

  // ── CRITERION 1: Curricular Aspects ────────────────────────────────────────

  add({
    metricId: '1.2.1', metricName: 'New Courses Introduced (%)',
    description: 'Percentage of new courses introduced out of total number of courses across all programmes during last five years',
    criterion: 'Criterion 1 – Curricular Aspects', criterionNumber: 1,
    keyIndicator: '1.2 Academic Flexibility', maxScore: 30,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=20', '15-20', '10-15', '5-10', '<5'),
    computedField: null,
    improvementHint: 'Introduce at least 20% new courses every five years. Review syllabi regularly and add emerging area electives.',
  });

  add({
    metricId: '1.3.2', metricName: 'Value-Added / Certificate / MOOC Courses',
    description: 'Number of certificate/value-added courses/Diploma/online courses (MOOCS/SWAYAM/NPTEL etc.) where students enrolled and benefitted during last five years',
    criterion: 'Criterion 1 – Curricular Aspects', criterionNumber: 1,
    keyIndicator: '1.3 Curriculum Enrichment', maxScore: 30,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=50', '40-50', '20-40', '5-20', '<5'),
    computedField: null,
    improvementHint: 'Enroll students in SWAYAM/NPTEL courses. Target ≥50 value-added courses per five-year period.',
  });

  add({
    metricId: '1.3.3', metricName: 'Programs with Field/Research Projects/Internships (%)',
    description: 'Percentage of programmes that have components of field projects/research projects/internships during last five years',
    criterion: 'Criterion 1 – Curricular Aspects', criterionNumber: 1,
    keyIndicator: '1.3 Curriculum Enrichment', maxScore: 5,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=80', '60-80', '40-60', '20-40', '<20'),
    computedField: null,
    improvementHint: 'Ensure ≥80% of all programmes include mandatory field projects, research projects, or internship components.',
  });

  add({
    metricId: '1.4.1', metricName: 'Structured Feedback System',
    description: 'Structured feedback for curriculum obtained regularly from stakeholders and feedback processes classified accordingly',
    criterion: 'Criterion 1 – Curricular Aspects', criterionNumber: 1,
    keyIndicator: '1.4 Feedback System', maxScore: 20,
    metricType: 'qualitative', unit: 'option',
    bands: optionBands(),
    computedField: null,
    improvementHint: 'Collect feedback from all stakeholders, analyse it, take action, communicate to relevant bodies and host on website (Level A).',
  });

  return metrics;
}

function buildCriterion2Metrics() {
  const metrics = [];
  const add = m => metrics.push(m);

  // ── CRITERION 2: Teaching-Learning and Evaluation ──────────────────────────

  add({
    metricId: '2.1.1', metricName: 'Enrollment Percentage',
    description: 'Enrollment Percentage',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.1 Student Enrolment and Profile', maxScore: 5,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=90', '80-90', '70-80', '50-70', '<50'),
    computedField: null,
    improvementHint: 'Achieve ≥90% enrollment. Strengthen admission outreach and reduce dropouts.',
  });

  add({
    metricId: '2.1.2', metricName: 'Reserved Category Seats Filled (%)',
    description: 'Percentage of seats filled against reserved categories (SC, ST, OBC etc.) as per applicable reservation policy during last five years',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.1 Student Enrolment and Profile', maxScore: 5,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=80', '70-80', '50-70', '40-50', '<40'),
    computedField: null,
    improvementHint: 'Ensure ≥80% reserved category seats are filled. Conduct targeted outreach for SC/ST/OBC candidates.',
  });

  add({
    metricId: '2.2.2', metricName: 'Student-Teacher Ratio',
    description: 'Student-Full time teacher ratio for latest completed academic year',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.2 Catering to Student Diversity', maxScore: 15,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('<=20:1', '20:1-30:1', '30:1-50:1', '50:1-60:1', '>60:1'),
    computedField: null,
    improvementHint: 'Maintain student-teacher ratio ≤20:1. Recruit full-time faculty against sanctioned posts.',
  });

  add({
    metricId: '2.4.1', metricName: 'Full-Time Teachers Appointed Against Sanctioned Posts (%)',
    description: 'Percentage of full time teachers appointed against the number of sanctioned posts during last five years',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.4 Teacher Profile and Quality', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=90', '80-90', '70-80', '50-70', '<50'),
    computedField: null,
    improvementHint: 'Fill ≥90% of sanctioned faculty positions. Expedite recruitment processes.',
  });

  add({
    metricId: '2.4.2', metricName: 'Teachers with Ph.D (%)',
    description: 'Percentage of full time teachers with Ph.D./D.M/M.Ch./D.N.B Super specialty during last five years',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.4 Teacher Profile and Quality', maxScore: 40,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=80', '70-80', '60-70', '50-60', '<50'),
    computedField: null,
    improvementHint: 'Ensure ≥80% of full-time teachers hold Ph.D. degrees. Support faculty pursuing doctoral programmes.',
  });

  add({
    metricId: '2.4.3', metricName: 'Average Teaching Experience (Years)',
    description: 'Average teaching experience of full time teachers for latest completed academic year (in years)',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.4 Teacher Profile and Quality', maxScore: 10,
    metricType: 'quantitative', unit: 'years',
    bands: buildBands('>=15', '12-15', '9-12', '6-9', '<6'),
    computedField: null,
    improvementHint: 'Maintain average teaching experience ≥15 years. Retain experienced faculty with incentive programmes.',
  });

  add({
    metricId: '2.5.1', metricName: 'Days to Declare Results',
    description: 'Number of days from last semester/year-end exam till last date of declaration of results year-wise during last five years',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.5 Evaluation Process and Reforms', maxScore: 10,
    metricType: 'quantitative', unit: 'days',
    bands: buildBands('<20', '20-30', '30-40', '40-50', '>=50'),
    computedField: null,
    improvementHint: 'Declare results within 20 days of last examination. Automate result processing.',
  });

  add({
    metricId: '2.5.2', metricName: 'Student Grievances About Evaluation (%)',
    description: 'Percentage of student complaints/grievances about evaluation against total students appeared during last five years',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.5 Evaluation Process and Reforms', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('<1', '1-5', '5-10', '10-15', '>=15'),
    computedField: null,
    improvementHint: 'Keep grievances below 1%. Improve transparency in evaluation and provide answer script review mechanisms.',
  });

  add({
    metricId: '2.5.3', metricName: 'Examination Automation Status',
    description: 'Status of automation of Examination division along with approved Examination Manual/ordinance',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.5 Evaluation Process and Reforms', maxScore: 10,
    metricType: 'qualitative', unit: 'option',
    bands: optionBands(),
    computedField: null,
    improvementHint: 'Implement 100% automation of the Examination division including EMS (Level A).',
  });

  add({
    metricId: '2.6.2', metricName: 'Pass Percentage of Students',
    description: 'Pass percentage of students (excluding backlog students) for latest completed academic year',
    criterion: 'Criterion 2 – Teaching-Learning and Evaluation', criterionNumber: 2,
    keyIndicator: '2.6 Student Performance and Learning Outcomes', maxScore: 15,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=90', '80-90', '70-80', '60-70', '<60'),
    computedField: null,
    improvementHint: 'Achieve ≥90% pass rate. Strengthen remedial classes, mentoring and continuous assessment.',
  });

  return metrics;
}

function buildCriterion3Metrics() {
  const metrics = [];
  const add = m => metrics.push(m);

  // ── CRITERION 3: Research, Innovations and Extension ───────────────────────

  add({
    metricId: '3.1.2', metricName: 'Seed Money to Teachers (INR Lakhs/year)',
    description: 'Institution provides seed money to teachers for research (average per year, INR in Lakhs)',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.1 Promotions of Research and Facilities', maxScore: 3,
    metricType: 'quantitative', unit: 'amount_lakhs',
    bands: buildBands('>=50', '40-50', '30-40', '20-30', '<20'),
    computedField: null,
    improvementHint: 'Allocate ≥₹50 Lakhs per year as seed money for faculty research. Set up a dedicated research fund.',
  });

  add({
    metricId: '3.1.3', metricName: 'Teachers with Fellowship/Financial Support (%)',
    description: 'Percentage of teachers receiving national/international fellowship/financial support for advanced studies/research during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.1 Promotions of Research and Facilities', maxScore: 5,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=20', '15-20', '10-15', '5-10', '<5'),
    computedField: null,
    improvementHint: 'Support ≥20% of teachers to receive national/international fellowships. Publicise available funding schemes.',
  });

  add({
    metricId: '3.1.4', metricName: 'JRF/SRF Among Enrolled PhD Scholars (%)',
    description: 'Percentage of JRFs/SRFs among enrolled PhD scholars during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.1 Promotions of Research and Facilities', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=70', '60-70', '50-60', '40-50', '<40'),
    computedField: null,
    improvementHint: 'Ensure ≥70% of enrolled PhD scholars hold JRF/SRF. Guide scholars towards national fellowship examinations.',
  });

  add({
    metricId: '3.2.1', metricName: 'Research Funding (INR in Lakhs)',
    description: 'Research funding received through Government and non-government sources during last five years (INR in Lakhs)',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.2 Resource Mobilization for Research', maxScore: 25,
    metricType: 'quantitative', unit: 'amount_lakhs',
    bands: buildBands('>=2000', '1500-2000', '1000-1500', '500-1000', '<500'),
    computedField: '3.2.1',
    improvementHint: 'Target ≥₹2000 Lakhs in total research funding over five years. Apply to DST, DBT, SERB, ICMR, and industry sponsors.',
  });

  add({
    metricId: '3.2.2', metricName: 'Research Projects per Teacher',
    description: 'Number of research projects per teacher funded by government/non-government/industry/international bodies during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.2 Resource Mobilization for Research', maxScore: 15,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('>=2', '1.5-2', '1-1.5', '0.5-1', '<0.5'),
    computedField: '3.2.2',
    improvementHint: 'Target ≥2 funded projects per teacher over five years. Create a research project mentoring system.',
  });

  add({
    metricId: '3.3.2', metricName: 'Awards for Research/Innovations',
    description: 'Number of awards received for research/innovations by institution/teachers/research scholars/students during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.3 Innovation Ecosystem', maxScore: 5,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=30', '20-30', '10-20', '5-10', '<5'),
    computedField: null,
    improvementHint: 'Target ≥30 awards in five years. Nominate faculty and students for national/international research awards.',
  });

  add({
    metricId: '3.4.2', metricName: 'Patents Awarded',
    description: 'Number of Patents awarded during the last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 15,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=7', '5-7', '3-5', '1-3', '<1'),
    computedField: '3.4.5',
    improvementHint: 'File and secure ≥7 patents over five years. Establish an IPR cell and provide patent filing financial support.',
  });

  add({
    metricId: '3.4.3', metricName: 'PhDs Awarded per Recognised Guide',
    description: 'Number of Ph.Ds awarded per recognized guide during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 15,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('>=5', '4-5', '2-4', '1-2', '<1'),
    computedField: null,
    improvementHint: 'Achieve ≥5 PhDs awarded per recognised guide. Increase PhD intake and improve thesis completion rates.',
  });

  add({
    metricId: '3.4.4', metricName: 'Research Papers per Teacher (UGC Journals)',
    description: 'Number of research papers published per teacher in Journals as notified on UGC website during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 20,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('>=10', '7-10', '4-7', '1-4', '<1'),
    computedField: '3.4.4',
    improvementHint: 'Target ≥10 publications per teacher in five years. Provide writing workshops and publication incentives.',
  });

  add({
    metricId: '3.4.5_books', metricName: 'Books/Chapters per Teacher',
    description: 'Number of books and chapters in edited volumes published per teacher during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 10,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('>=10', '7-10', '4-7', '1-4', '<1'),
    computedField: null,
    improvementHint: 'Target ≥10 books/chapters per teacher in five years. Encourage faculty to author and edit textbooks.',
  });

  add({
    metricId: '3.4.7', metricName: 'Average Citation Index',
    description: 'Bibliometrics of publications during last five years: average Citation Index in Scopus/Web of Science/PubMed',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 20,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('>=10', '5-10', '2-5', '0.5-2', '<0.5'),
    computedField: null,
    improvementHint: 'Target average citation index ≥10. Focus publications in high-impact, well-cited journals.',
  });

  add({
    metricId: '3.4.8', metricName: 'h-Index of University',
    description: 'Bibliometrics based on Scopus/Web of Science h-Index of the University during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.4 Research Publications and Awards', maxScore: 20,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=35', '25-35', '15-25', '5-15', '<5'),
    computedField: null,
    improvementHint: 'Target h-Index ≥35. Improve citation quality by publishing in Scopus/WoS-indexed journals.',
  });

  add({
    metricId: '3.5.1', metricName: 'Consultancy Revenue (INR Lakhs)',
    description: 'Revenue generated from consultancy and corporate training during last five years (INR in Lakhs)',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.5 Consultancy', maxScore: 20,
    metricType: 'quantitative', unit: 'amount_lakhs',
    bands: buildBands('>=200', '150-200', '100-150', '50-100', '<50'),
    computedField: null,
    improvementHint: 'Generate ≥₹200 Lakhs in consultancy revenue over five years. Establish a consultancy cell and industry partnerships.',
  });

  add({
    metricId: '3.6.2', metricName: 'Extension and Outreach Programs',
    description: 'Number of extension and outreach programs conducted by institution during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.6 Extension Activities', maxScore: 10,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=100', '80-100', '60-80', '40-60', '<40'),
    computedField: null,
    improvementHint: 'Conduct ≥100 extension/outreach programmes in five years. Coordinate NSS/NCC and community engagement activities.',
  });

  add({
    metricId: '3.7.1', metricName: 'Functional MoUs with Institutions/Industries',
    description: 'Number of functional MoUs/linkages with institutions/industries in India and abroad for internship/OJT/project/exchange/research during last five years',
    criterion: 'Criterion 3 – Research, Innovations and Extension', criterionNumber: 3,
    keyIndicator: '3.7 Collaboration', maxScore: 10,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=40', '30-40', '10-30', '5-10', '<5'),
    computedField: null,
    improvementHint: 'Establish ≥40 functional MoUs in five years. Identify industry partners for each department.',
  });

  return metrics;
}

function buildCriteria4to7Metrics() {
  const metrics = [];
  const add = m => metrics.push(m);

  // ── CRITERION 4: Infrastructure and Learning Resources ────────────────────

  add({
    metricId: '4.1.2', metricName: 'Infrastructure Expenditure (%)',
    description: 'Percentage of expenditure excluding salary for infrastructure development and augmentation during last five years (INR in Lakhs)',
    criterion: 'Criterion 4 – Infrastructure and Learning Resources', criterionNumber: 4,
    keyIndicator: '4.1 Physical Facilities', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=40', '30-40', '20-30', '10-20', '<10'),
    computedField: null,
    improvementHint: 'Spend ≥40% of non-salary budget on infrastructure augmentation. Modernise labs and classrooms.',
  });

  add({
    metricId: '4.2.2', metricName: 'Library Expenditure on Books/Journals (%)',
    description: 'Percentage expenditure for purchase of books/e-books and subscription to journals/e-journals during last five years (INR in Lakhs)',
    criterion: 'Criterion 4 – Infrastructure and Learning Resources', criterionNumber: 4,
    keyIndicator: '4.2 Library as a Learning Resource', maxScore: 5,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=10', '8-10', '6-8', '2-6', '<2'),
    computedField: null,
    improvementHint: 'Spend ≥10% of library budget on books/journals. Subscribe to Scopus, WoS, and JSTOR.',
  });

  add({
    metricId: '4.3.2', metricName: 'Student-Computer Ratio',
    description: 'Student-Computer ratio for latest completed academic year',
    criterion: 'Criterion 4 – Infrastructure and Learning Resources', criterionNumber: 4,
    keyIndicator: '4.3 IT Infrastructure', maxScore: 10,
    metricType: 'quantitative', unit: 'ratio',
    bands: buildBands('<=5:1', '5:1-10:1', '10:1-15:1', '15:1-25:1', '>25:1'),
    computedField: null,
    improvementHint: 'Maintain student-computer ratio ≤5:1. Procure additional computers for labs.',
  });

  add({
    metricId: '4.4.1', metricName: 'Maintenance Expenditure on Physical Facilities (%)',
    description: 'Percentage expenditure incurred on maintenance of physical facilities and academic support facilities excluding salary component during last five years',
    criterion: 'Criterion 4 – Infrastructure and Learning Resources', criterionNumber: 4,
    keyIndicator: '4.4 Maintenance of Campus Infrastructure', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=30', '20-30', '10-20', '5-10', '<5'),
    computedField: null,
    improvementHint: 'Allocate ≥30% of non-salary budget to facility maintenance. Implement preventive maintenance schedules.',
  });

  // ── CRITERION 5: Student Support and Progression ──────────────────────────

  add({
    metricId: '5.1.1', metricName: 'Students Benefited by Scholarships (%)',
    description: 'Percentage of students benefited by scholarships and freeships provided by institution/government/non-government during last five years',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.1 Student Support', maxScore: 15,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=60', '50-60', '40-50', '20-40', '<20'),
    computedField: null,
    improvementHint: 'Ensure ≥60% of students receive some form of scholarship/freeship. Map all available government scholarship schemes.',
  });

  add({
    metricId: '5.2.1', metricName: 'Placement of Outgoing Students (%)',
    description: 'Percentage of placement of outgoing students during last five years',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.2 Student Progression', maxScore: 15,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=70', '60-70', '50-60', '40-50', '<40'),
    computedField: null,
    improvementHint: 'Target ≥70% placement rate. Establish a strong Training and Placement Cell with industry partners.',
  });

  add({
    metricId: '5.2.2', metricName: 'Students Progressed to Higher Education (%)',
    description: 'Percentage of graduated students who have progressed to higher education year-wise during last five years',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.2 Student Progression', maxScore: 15,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=40', '30-40', '20-30', '5-20', '<5'),
    computedField: null,
    improvementHint: 'Ensure ≥40% of graduates progress to higher education. Provide guidance for competitive entrance exams.',
  });

  add({
    metricId: '5.2.3', metricName: 'Students Qualifying in State/National Exams (%)',
    description: 'Percentage of students qualifying in state/National/International level Examinations (SLET, NET, UPSC etc.) during last five years',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.2 Student Progression', maxScore: 10,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=1.0', '0.8-1.0', '0.6-0.8', '0.4-0.6', '<0.4'),
    computedField: null,
    improvementHint: 'Achieve ≥1% of students qualifying in national exams. Set up NET/UPSC coaching cells.',
  });

  add({
    metricId: '5.3.1', metricName: 'Awards in Sports/Cultural Activities',
    description: 'Number of awards/medals won by students in sports/cultural activities at inter-university/state/national/international events during last five years',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.3 Student Participation and Activities', maxScore: 10,
    metricType: 'quantitative', unit: 'count',
    bands: buildBands('>=80', '50-80', '20-50', '10-20', '<10'),
    computedField: null,
    improvementHint: 'Target ≥80 sports/cultural awards in five years. Invest in sports infrastructure and cultural training.',
  });

  add({
    metricId: '5.4.1', metricName: 'Alumni Contribution (INR Lakhs)',
    description: 'Alumni contribution during last five years (INR in Lakhs) to university through registered Alumni Association',
    criterion: 'Criterion 5 – Student Support and Progression', criterionNumber: 5,
    keyIndicator: '5.4 Alumni Engagement', maxScore: 5,
    metricType: 'quantitative', unit: 'amount_lakhs',
    bands: buildBands('>=100', '50-100', '20-50', '5-20', '<5'),
    computedField: null,
    improvementHint: 'Target ≥₹100 Lakhs in alumni contributions. Activate alumni association and create structured giving campaigns.',
  });

  // ── CRITERION 6: Governance, Leadership and Management ───────────────────

  add({
    metricId: '6.3.2', metricName: 'Teachers with Financial Support for Conferences (%)',
    description: 'Percentage of teachers provided financial support to attend conferences/workshops and membership of professional bodies during last five years',
    criterion: 'Criterion 6 – Governance, Leadership and Management', criterionNumber: 6,
    keyIndicator: '6.3 Faculty Empowerment Strategies', maxScore: 15,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=60', '40-60', '25-40', '10-25', '<10'),
    computedField: null,
    improvementHint: 'Support ≥60% of teachers financially for conferences/workshops. Create a dedicated faculty development fund.',
  });

  add({
    metricId: '6.3.3', metricName: 'Teachers Completing FDP/MDP (%)',
    description: 'Percentage of teachers undergoing online/face-to-face FDP/MDP during last five years',
    criterion: 'Criterion 6 – Governance, Leadership and Management', criterionNumber: 6,
    keyIndicator: '6.3 Faculty Empowerment Strategies', maxScore: 6,
    metricType: 'quantitative', unit: 'percentage',
    bands: buildBands('>=60', '40-60', '25-40', '10-25', '<10'),
    computedField: null,
    improvementHint: 'Ensure ≥60% of faculty complete FDPs in five years. Organise in-house orientation and refresher courses.',
  });

  add({
    metricId: '6.4.2', metricName: 'Government Grants for Infrastructure (INR Lakhs)',
    description: 'Funds/Grants received from government/non-government bodies during last five years for infrastructure development (INR in Lakhs)',
    criterion: 'Criterion 6 – Governance, Leadership and Management', criterionNumber: 6,
    keyIndicator: '6.4 Financial Management and Resource Mobilization', maxScore: 12,
    metricType: 'quantitative', unit: 'amount_lakhs',
    bands: buildBands('>=100', '80-100', '60-80', '30-60', '<30'),
    computedField: null,
    improvementHint: 'Secure ≥₹100 Lakhs in government grants for infrastructure. Apply to RUSA, UGC development grants.',
  });

  // ── CRITERION 7: Institutional Values and Best Practices ─────────────────

  add({
    metricId: '7.1.2', metricName: 'Alternate Energy Sources',
    description: 'Institution has facilities for alternate sources of energy and energy conservation measures',
    criterion: 'Criterion 7 – Institutional Values and Best Practices', criterionNumber: 7,
    keyIndicator: '7.1 Institutional Values and Social Responsibilities', maxScore: 5,
    metricType: 'qualitative', unit: 'option',
    bands: optionBands(),
    computedField: null,
    improvementHint: 'Install ≥4 alternate energy measures (solar, biogas, LED, sensor-based) to achieve Level A.',
  });

  add({
    metricId: '7.1.4', metricName: 'Water Conservation Facilities',
    description: 'Water conservation facilities available in the institution',
    criterion: 'Criterion 7 – Institutional Values and Best Practices', criterionNumber: 7,
    keyIndicator: '7.1 Institutional Values and Social Responsibilities', maxScore: 5,
    metricType: 'qualitative', unit: 'option',
    bands: optionBands(),
    computedField: null,
    improvementHint: 'Implement ≥4 water conservation measures (rainwater harvesting, borewell recharge, recycling) for Level A.',
  });

  return metrics;
}

// ── Main seeder ───────────────────────────────────────────────────────────────

async function seed(dryRun = false) {
  const allMetrics = [
    ...buildAllMetrics(),
    ...buildCriterion2Metrics(),
    ...buildCriterion3Metrics(),
    ...buildCriteria4to7Metrics(),
  ];

  // Derive benchmarkValue from bands for quantitative metrics that don't have it set
  for (const m of allMetrics) {
    if (m.benchmarkValue === undefined || m.benchmarkValue === null) {
      m.benchmarkValue = benchmarkFromBands(m.bands);
    }
  }

  console.log(`\n📋 Benchmark metrics parsed: ${allMetrics.length}`);

  if (dryRun) {
    allMetrics.forEach(m =>
      console.log(`  [DRY] ${m.metricId.padEnd(16)} ${m.metricName}`)
    );
    console.log('\n✅ Dry run complete — nothing written to DB.');
    return;
  }

  let upserted = 0, errors = 0;
  for (const metric of allMetrics) {
    try {
      await BenchmarkMetric.updateOne(
        { metricId: metric.metricId },
        { $set: metric },
        { upsert: true }
      );
      upserted++;
    } catch (err) {
      console.error(`  ❌ Failed: ${metric.metricId} — ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Benchmark seeder complete: ${upserted} upserted, ${errors} errors.\n`);
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
