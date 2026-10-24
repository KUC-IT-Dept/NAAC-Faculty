// Behavioural test for the Analytics -> Benchmark table (BenchmarkPage).
// Bundles the real component with esbuild, stubs only the network module, drives it in jsdom.
// jsdom is NOT a project dependency:  JSDOM_PATH=/path/to/node_modules/jsdom node tests/benchmark/run.mjs
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const req = createRequire(import.meta.url);
const { JSDOM } = req(process.env.JSDOM_PATH || 'jsdom');
const esbuild = req(path.join(root, 'node_modules/esbuild'));

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Event']) Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The page only imports getBenchmarks / getBenchmarkCatalogueStatus from the API module.
globalThis.__api = { rows: [], status: { hasCatalogue: true }, rejectRows: false };
const stub = `export const getBenchmarks = () => globalThis.__api.rejectRows ? Promise.reject(new Error('x')) : Promise.resolve(globalThis.__api.rows);
export const getBenchmarkCatalogueStatus = () => Promise.resolve(globalThis.__api.status);`;
const out = path.join(root, 'node_modules/.cache-benchmark-test.mjs');
await esbuild.build({
  stdin: { contents: `export { default as BenchmarkPage } from './src/pages/analytics/benchmark/BenchmarkPage';
                      export { createRoot } from 'react-dom/client'; export { createElement as h, act } from 'react';`, resolveDir: root, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, jsx: 'automatic', logLevel: 'error',
  plugins: [{ name: 'stub-api', setup(b) { b.onResolve({ filter: /lib\/analyticsV2Api$/ }, () => ({ path: 'stub-api', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: stub, loader: 'js' })); } }],
});
const { BenchmarkPage, createRoot, h, act } = await import(pathToFileURL(out).href);

let passed = 0, failed = 0;
const check = (l, c, x) => { if (c) { passed++; console.log('PASS -', l); } else { failed++; console.log('FAIL -', l, x ?? ''); } };
const container = document.getElementById('root');
const render = async () => { const r = createRoot(container); await act(async () => { r.render(h(BenchmarkPage, {})); }); await act(async () => { await new Promise((res) => setTimeout(res, 20)); }); return r; };
const text = () => container.textContent;
const base = { description: '', criterion: 'Criterion 2 \u2013 Teaching', keyIndicator: '2.4 X', recommendation: '', unit: 'percentage', insufficientData: false, insufficientReason: null, scoringType: 'numeric', catalog: { origin: 'seed', versionNo: null, documentVersion: null, sourceFilename: null, approvedBy: null, approvedAt: null, importedAt: null } };
const bands = (labels) => labels.map((label, i) => ({ score: 4 - i, label }));

globalThis.__api.rows = [
  { ...base, metricId: '2.4.2', metricName: 'PhD %', description: 'Percentage of full time teachers with Ph.D', currentValue: 72.5, benchmarkValue: 80, gap: 7.5, score: 3, status: 'above', statusLabel: 'Above', bands: bands(['>=80', '70-80', '60-70', '50-60', '<50']), bandLabel: '70-80', direction: 'higherIsBetter', period: 'last five years', catalog: { ...base.catalog, origin: 'import', versionNo: 3, documentVersion: 'GUM 2022', sourceFilename: 'University_Benchmarks.pdf', approvedBy: 'Admin One' } },
  { ...base, metricId: '2.5.1', metricName: 'Days to results', unit: 'days', currentValue: 15, benchmarkValue: 20, gap: -5, score: 4, status: 'above', bands: bands(['<20', '20-30', '30-40', '40-50', '>=50']), bandLabel: '<20', direction: 'lowerIsBetter' },
  { ...base, analyticsMapped: false, metricId: '1.1.1', metricName: 'Unmapped metric', unit: 'count', currentValue: null, benchmarkValue: 20, gap: null, score: null, status: 'unknown', insufficientData: true, insufficientReason: 'no_analytics_mapping', bands: bands(['>=20', '15-20', '10-15', '5-10', '<5']) },
  { ...base, metricId: '1.4.1', metricName: 'Feedback system', unit: 'option', scoringType: 'categorical', currentValue: null, benchmarkValue: null, gap: null, score: null, status: 'unknown', insufficientData: true, insufficientReason: 'qualitative_requires_assessment', bands: bands(['A', 'B', 'C', 'D', 'E']) },
];
let root_ = await render();
const rowsEl = [...container.querySelectorAll('tbody tr')];
check('one table row per approved definition', rowsEl.length === 4, rowsEl.length);
const cells = (i) => [...rowsEl[i].querySelectorAll('td')].map((c) => c.textContent);
check('table shows ID, description, criterion, current, bands, target, gap, score/status, source columns', [...container.querySelectorAll('th')].map((t) => t.textContent).join('|') === 'ID|Metric|Criterion|Current|Score bands (4\u21920)|Target|Gap|Score / Status|Source');
const r0 = cells(0);
check('row 1: ID and description shown', r0[0] === '2.4.2' && /Percentage of full time teachers/.test(r0[1]) && /last five years/.test(r0[1]), r0);
check('row 1: current 72.5% / target 80% / shortfall gap -7.5', /72\.5%/.test(r0[3]) && /80%/.test(r0[5]) && r0[6] === '\u22127.5', r0);
check('row 1: all five score bands listed', ['>=80', '70-80', '60-70', '50-60', '<50'].every((l) => r0[4].includes(l)), r0[4]);
check('row 1: score/status and source/version/approver', /Above/.test(r0[7]) && /3\/4/.test(r0[7]) && /v3/.test(r0[8]) && /University_Benchmarks\.pdf/.test(r0[8]) && /Approved by Admin One/.test(r0[8]), r0);
const r1 = cells(1);
check('lower-is-better: 15 days vs <20 shows ahead-of-target (+5) and "lower is better"', /15 days/.test(r1[3]) && r1[6] === '+5' && /lower is better/.test(r1[5]), r1);
check('seeded definitions are labelled as such', /Seeded catalogue/.test(r1[8]));
const r2 = cells(2);
check('missing data: "Insufficient data", NOT 0, gap is a dash', /Insufficient data/.test(r2[3]) && !/\b0\b/.test(r2[3]) && r2[6] === '\u2014' && /Insufficient data/.test(r2[7]), r2);
check('insufficient-data reason is available on hover', container.querySelector('[title*="No institutional data source"]') !== null);
const r3 = cells(3);
check('unmapped metric is clearly labelled in the table', /Unmapped metric/.test(cells(2)[3]), cells(2)[3]);
check('categorical metric: shows A-E bands, target "Grade A", no number invented', ['A', 'B', 'C', 'D', 'E'].every((l) => r3[4].includes(l)) && /Grade A/.test(r3[5]) && /Insufficient data/.test(r3[3]), r3);
await act(async () => root_.unmount());

globalThis.__api.rows = []; globalThis.__api.status = { hasCatalogue: false };
root_ = await render();
check('empty + no catalogue -> explains an administrator must import one', /No benchmark catalogue has been imported/.test(text()) && /Benchmark Management/.test(text()), text());
await act(async () => root_.unmount());
globalThis.__api.status = { hasCatalogue: true };
root_ = await render();
check('empty with a catalogue -> filters message, not the import message', /No benchmark metrics match/.test(text()) && !/imported/.test(text()), text());
await act(async () => root_.unmount());
globalThis.__api.rejectRows = true;
root_ = await render();
check('API failure -> clear error, not a blank table', /could not be loaded/.test(text()));
await act(async () => root_.unmount());

console.log(`\n${passed} passed, ${failed} failed`);
fs.unlinkSync(out);
process.exit(failed ? 1 : 0);
