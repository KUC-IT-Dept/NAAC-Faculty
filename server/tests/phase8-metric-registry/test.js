// Run from server/: node tests/phase8-metric-registry/test.js  (no database needed)
'use strict';
const path = require('path');
const root = path.resolve(__dirname, '../../modules/analytics');
const { getMetricDefinitions } = require(`${root}/data/metricDefinitions`);
const { unitCompatibility, metricKind } = require(`${root}/services/metricUnits`);
const { normalizeCriterion } = require(`${root}/services/metricsCatalogService`);
const { parseAmount } = require(`${root}/services/analyticsService`);
const { exportToPdf } = require(`${root}/exporters/pdfExporter`);
const { exportToExcel } = require(`${root}/exporters/excelExporter`);
const XLSX = require('xlsx');

let pass = 0; let fail = 0;
const check = (name, ok, extra) => { if (ok) { pass += 1; console.log('PASS -', name); } else { fail += 1; console.log('FAIL -', name, extra || ''); } };

const defs = getMetricDefinitions();
const ids = new Set(defs.map((d) => d.metricId));
check('registry defines every metric once, more than four', defs.length === ids.size && defs.length > 50, defs.length);
check('V1 metrics are code-defined', ['3.4.4', '3.2.2', '3.4.5', '3.2.1'].every((i) => ids.has(i)));
check('every metric resolves to a NAAC criterion 1-7', defs.every((d) => normalizeCriterion(d) >= 1), defs.filter((d) => !normalizeCriterion(d)).map((d) => d.metricId));
check('ratio/percentage components exist in the registry', defs.filter((d) => d.numeratorMetric).every((d) => ids.has(d.numeratorMetric) && ids.has(d.denominatorMetric)));
check('never-matching project categories are flagged unsupported, not zero', ['proj.major', 'proj.minor', 'proj.international', 'proj.industry'].every((i) => { const d = defs.find((x) => x.metricId === i); return d.supported === false && d.missingFields.length; }));

const m = (id) => defs.find((d) => d.metricId === id);
check('rupee sum converts to lakhs', unitCompatibility(m('3.2.1'), 'amount_lakhs').factor === 1 / 100000);
check('count is not scored against percentage bands', !unitCompatibility(m('fdp.total'), 'percentage').ok);
check('count is not scored against per-teacher ratio bands', !unitCompatibility(m('phd.completed'), 'ratio').ok);
check('percentage metric fits percentage benchmark', unitCompatibility(m('pct.phdholders'), 'percentage').ok);
check('ratio metric fits ratio benchmark', unitCompatibility(m('ratio.pubsperfaculty'), 'ratio').ok && metricKind(m('emp.avgExperience')) === 'years');
check('qualitative benchmark takes no numeric metric', !unitCompatibility(m('3.4.4'), 'option').ok);

check('parseAmount reads typed amounts', parseAmount('5,00,000') === 500000 && parseAmount('₹ 2,50,000') === 250000 && parseAmount('Rs. 1.5') === 1.5);
check('parseAmount returns null, never NaN, for junk', parseAmount('n/a') === null && parseAmount('') === null && parseAmount(undefined) === null);

(async () => {
  const met = { metricId: 'x', metricName: 'N', unit: 'count', assessed: true, criterionLabel: 'Criterion 3', current: '2', benchmark: '3', gap: 1, achievementPercent: 66, score: 1, status: 'below', statusLabel: 'Below', recommendation: 'r', reasonText: '', action: '' };
  const miss = { ...met, metricId: 'y', assessed: false, current: null, score: null, status: 'unknown', statusLabel: 'Insufficient data', reasonText: 'No source', action: 'Map it' };
  const payload = { title: 'T', rows: [{ a: 1 }], assessment: { generatedAt: new Date().toISOString(), scope: 'Institution-wide', executiveSummary: ['s'], figures: [{ label: 'Faculty', value: 3 }], overall: { total: 2, assessed: 1, insufficient: 1, above: 0, meets: 0, below: 1, meanScore: 1 }, criteria: [{ number: 3, name: 'C', total: 2, assessed: 1, insufficient: 1, above: 0, meets: 0, below: 1, meanScore: 1, metrics: [met, miss] }], gaps: [met], missing: [miss], recommendations: [{ priority: 'High', metricId: 'x', metric: 'N', criterion: 'C', text: 'do', type: 'improvement' }], notes: ['n'] } };
  const pdf = await exportToPdf(payload.rows, 'T', payload);
  check('assessment PDF is a valid PDF', pdf.slice(0, 5).toString() === '%PDF-' && pdf.length > 2000);
  const wb = XLSX.read(exportToExcel(payload.rows, 'T', payload));
  check('assessment workbook has the six sheets', wb.SheetNames.join() === 'Summary,Criterion Summary,Metrics,Gaps,Missing Data,Recommendations', wb.SheetNames);
  const flat = XLSX.read(exportToExcel([{ a: 1 }], 'T'));
  check('flat reports still export as one sheet', flat.SheetNames.length === 1);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
