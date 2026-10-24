// Behavioural test for the admin Benchmark Catalogue UI (search, filters, add, edit,
// deactivate/reactivate, inspect, pagination, delete button state). Real component bundled with esbuild; only the
// network module is stubbed; driven in jsdom. jsdom is NOT a project dependency:
//   JSDOM_PATH=/path/to/node_modules/jsdom node tests/benchmark-catalogue/run.mjs
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
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Event', 'MouseEvent', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement'])
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.confirm = () => true;
dom.window.prompt = () => 'No longer used';

const calls = { list: [], create: [], update: [], deactivate: [], reactivate: [], detail: [] };
globalThis.__s = { total: 2, failCreate: false };
const item = (id, o = {}) => ({ metricId: id, metricName: id, description: `Description ${id}`, criterion: 'Criterion 1', criterionNumber: 1, keyIndicator: '1.1 K', maxScore: 10, unit: 'percentage', period: null,
  scoringType: 'numeric', direction: 'higherIsBetter', bands: ['>=20', '15-20', '10-15', '5-10', '<5'].map((label, i) => ({ score: 4 - i, label })), options: [], active: true, computedField: 'pct.x', mapped: true,
  mappingStatus: 'mapped', formula: '', notes: '', improvementHint: '', source: { origin: 'import', versionNo: 3, filename: 'f.pdf', documentVersion: null, approvedBy: 'A', revision: 0, editedBy: null, editedAt: null, page: 2 }, lifecycle: null, ...o });
globalThis.__api = {
  listCatalogue: async (f) => { calls.list.push(f); return { items: [item('1.1.1'), item('1.1.2', { active: false, mapped: false, mappingStatus: 'unmapped', computedField: null, source: { origin: 'manual', revision: 2 } })], total: globalThis.__s.total, page: f.page, limit: f.limit,
    facets: { versions: ['3', 'manual', 'seed'], criteria: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ number: n, count: n })), totals: { all: 2, active: 1, inactive: 1, unmapped: 1 } } }; },
  getCatalogueItem: async (id) => { calls.detail.push(id); return { ...item(id), benchmarkValue: 20, analyticsMetric: { metricId: 'pct.x', metricName: 'Pct X', formulaType: 'percentage', supported: true, criterion: 'c' },
    bandsDetail: [{ score: 4, label: '>=20', min: 20, max: null, minInclusive: true, maxInclusive: true }, { score: 3, label: '15-20', min: 15, max: 20, minInclusive: true, maxInclusive: false }, { score: 0, label: '<5', min: null, max: 5, minInclusive: true, maxInclusive: false }] }; },
  getCatalogueHistory: async () => [{ _id: 'h1', action: 'record_update', actor: { name: 'Admin One' }, at: new Date().toISOString(), details: {} }],
  getMetricOptions: async () => [{ metricId: 'pct.x', metricName: 'Pct X' }, { metricId: 'pct.y', metricName: 'Pct Y' }],
  createCatalogueItem: async (p) => { calls.create.push(p); if (globalThis.__s.failCreate) { const e = new Error('x'); e.response = { status: 400, data: { message: 'Bad band', flags: [{ severity: 'error', message: 'Band 1 (20-10) is unreadable.' }] } }; throw e; } return { record: item(p.metricId), flags: [] }; },
  updateCatalogueItem: async (id, p) => { calls.update.push([id, p]); return { record: item(id), flags: [] }; },
  deactivateCatalogueItem: async (id, reason) => { calls.deactivate.push([id, reason]); return item(id, { active: false }); },
  reactivateCatalogueItem: async (id) => { calls.reactivate.push(id); return item(id); },
  deleteCatalogueItem: async (id) => ({ deleted: true, metricId: id }),
};
const stub = `const a = () => globalThis.__api;
export const listCatalogue = (...x) => a().listCatalogue(...x); export const getCatalogueItem = (...x) => a().getCatalogueItem(...x);
export const getCatalogueHistory = (...x) => a().getCatalogueHistory(...x); export const getMetricOptions = (...x) => a().getMetricOptions(...x);
export const createCatalogueItem = (...x) => a().createCatalogueItem(...x); export const updateCatalogueItem = (...x) => a().updateCatalogueItem(...x);
export const deactivateCatalogueItem = (...x) => a().deactivateCatalogueItem(...x); export const reactivateCatalogueItem = (...x) => a().reactivateCatalogueItem(...x);
export const deleteCatalogueItem = (...x) => a().deleteCatalogueItem(...x);`;
const out = path.join(root, 'node_modules/.cache-catalogue-test.mjs');
await esbuild.build({
  stdin: { contents: `export { default as BenchmarkCatalogue } from './src/pages/admin/BenchmarkCatalogue';
                      export { createRoot } from 'react-dom/client'; export { createElement as h, act } from 'react';`, resolveDir: root, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, jsx: 'automatic', logLevel: 'error',
  plugins: [{ name: 'stub-api', setup(b) { b.onResolve({ filter: /lib\/benchmarkImportApi$/ }, () => ({ path: 'stub-api', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: stub, loader: 'js' })); } }],
});
const { BenchmarkCatalogue, createRoot, h, act } = await import(pathToFileURL(out).href);

let passed = 0, failed = 0;
const check = (l, c, x) => { if (c) { passed++; console.log('PASS -', l); } else { failed++; console.log('FAIL -', l, x ?? ''); } };
const container = document.getElementById('root');
const wait = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await wait(); };
const setVal = async (el, v) => { await act(async () => {
  const proto = el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new dom.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); await wait(); };
const byLabel = (l) => container.querySelector(`[aria-label="${l}"]`);
const btn = (t, scope = container) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) || b.title === t);
const last = (a) => a[a.length - 1];

const r = createRoot(container);
await act(async () => { r.render(h(BenchmarkCatalogue, {})); });
await wait(60);
check('initial load requests page 1 with no filters', calls.list.length >= 1 && last(calls.list).page === 1 && last(calls.list).q === '' && last(calls.list).limit === 25, last(calls.list));
const rows = () => [...container.querySelectorAll('tbody tr')];
check('definitions listed with ID, description, bands and status', rows().length === 2 && /1\.1\.1/.test(rows()[0].textContent) && /4: >=20/.test(rows()[0].textContent) && /Inactive/.test(rows()[1].textContent));
check('mapping status shown; unmapped metric clearly identified', /Mapped/.test(rows()[0].textContent) && /Unmapped/.test(rows()[1].textContent));
check('source labels: import version / manual with revision', /v3/.test(rows()[0].textContent) && /Manual · r2/.test(rows()[1].textContent));
check('summary counts and criterion facet counts shown', /2 shown · 1 active · 1 inactive · 1 unmapped/.test(container.textContent) && /Criterion 3 \(3\)/.test(container.textContent));
check('version filter offers import versions, manual and seed', [...byLabel('Filter version').options].map((o) => o.textContent).join('|') === 'Any import version|Import v3|Added manually|Seeded catalogue');

await setVal(byLabel('Search'), 'phd');
await wait(400);
check('typing in search (debounced) queries by text and resets to page 1', last(calls.list).q === 'phd' && last(calls.list).page === 1, last(calls.list));
await setVal(byLabel('Search'), '');
await setVal(byLabel('Filter criterion'), '3');
check('criterion filter applies immediately', last(calls.list).criterion === '3', last(calls.list));
await setVal(byLabel('Filter status'), 'inactive');
await setVal(byLabel('Filter version'), 'manual');
await setVal(byLabel('Filter mapping'), 'unmapped');
check('status, version and mapping filters are sent together', (() => { const f = last(calls.list); return f.criterion === '3' && f.status === 'inactive' && f.version === 'manual' && f.mapping === 'unmapped'; })(), last(calls.list));
for (const [l, v] of [['Filter criterion', ''], ['Filter status', ''], ['Filter version', ''], ['Filter mapping', '']]) await setVal(byLabel(l), v);

// pagination
globalThis.__s.total = 60;
await setVal(byLabel('Filter status'), 'active'); await setVal(byLabel('Filter status'), '');
check('pagination controls appear for 60 results (25 per page)', /Page 1 of 3/.test(container.textContent));
await click(btn('Next'));
check('Next requests page 2', last(calls.list).page === 2 && /Page 2 of 3/.test(container.textContent), last(calls.list));
await click(btn('Previous'));
globalThis.__s.total = 2;
await setVal(byLabel('Filter status'), 'active'); await setVal(byLabel('Filter status'), '');

// inspect
await click(rows()[0].querySelector('button[title="Inspect"]'));
check('inspect fetches the definition + history and shows intervals with inclusivity', calls.detail.includes('1.1.1') && /\[15, 20\)/.test(container.textContent) && /\[20, \+\u221e\)/.test(container.textContent) && /\(\u2212\u221e, 5\)/.test(container.textContent) && /pct\.x — Pct X/.test(container.textContent) && /record_update/.test(container.textContent));
await click(btn('Close'));

// add
await click(btn('Add benchmark'));
check('add form opens with an empty metric ID and the criterion selector', !!byLabel('Metric ID') && byLabel('Metric ID').value === '' && byLabel('Criterion').options.length === 7);
check('analytics mapping picker lists analytics metrics, default Unmapped', [...byLabel('Analytics mapping').options].map((o) => o.value).join('|') === '|pct.x|pct.y');
await setVal(byLabel('Metric ID'), '3.4.4'); await setVal(byLabel('Criterion'), '3'); await setVal(byLabel('Key indicator'), '3.4 Research');
await setVal(byLabel('Description'), 'Papers per teacher'); await setVal(byLabel('Unit'), 'ratio'); await setVal(byLabel('Weight'), '20'); await setVal(byLabel('Period'), 'last five years');
for (const [sc, v] of [[4, '>=10'], [3, '7-10'], [2, '4-7'], [1, '1-4'], [0, '<1']]) await setVal(byLabel(`Band ${sc}`), v);
await setVal(byLabel('Analytics mapping'), 'pct.y');
globalThis.__s.failCreate = true;
const modal = () => container.querySelector('.modal');
await click(btn('Add benchmark', modal()));
check('server validation errors are shown inside the form (form stays open)', /Band 1 \(20-10\) is unreadable/.test(modal().textContent) && !!byLabel('Metric ID'));
globalThis.__s.failCreate = false;
await click(btn('Add benchmark', modal()));
const created = last(calls.create);
check('create sends the typed values; role/active/source are never sent', created.metricId === '3.4.4' && created.criterionNumber === 3 && created.unit === 'ratio' && created.maxScore === 20 && created.period === 'last five years' && created.computedField === 'pct.y' && created.bands.map((b) => `${b.score}:${b.label}`).join() === '4:>=10,3:7-10,2:4-7,1:1-4,0:<1' && !('role' in created) && !('active' in created) && !('source' in created), created);
check('form closes and the list reloads after saving', !container.querySelector('.modal') && calls.list.length > 5);

// categorical add
await click(btn('Add benchmark'));
await setVal(byLabel('Metric ID'), '1.4.1'); await setVal(byLabel('Scoring type'), 'categorical');
check('categorical type: unit becomes "option", band inputs replaced by A-E option texts', byLabel('Unit').value === 'option' && !byLabel('Band 4') && !!byLabel('Option A') && !!byLabel('Option E'));
await setVal(byLabel('Option A'), 'All of the above');
await setVal(byLabel('Description'), 'Feedback'); await setVal(byLabel('Key indicator'), '1.4 F');
await click(btn('Add benchmark', modal()));
const cat = last(calls.create);
check('categorical payload: bands are letters A-E with option texts, no numeric thresholds', cat.scoringType === 'categorical' && cat.bands.map((b) => b.label).join('') === 'ABCDE' && cat.options[0].text === 'All of the above' && cat.options.length === 5, cat);

// edit
await click(rows()[0].querySelector('button[title="Edit"]'));
check('edit form is prefilled and the metric ID is locked', byLabel('Metric ID').value === '1.1.1' && byLabel('Metric ID').disabled && byLabel('Description').value === 'Description 1.1.1' && byLabel('Band 3').value === '15-20' && byLabel('Analytics mapping').value === 'pct.x');
await setVal(byLabel('Description'), 'Edited description');
await click(btn('Save changes', modal()));
const upd = last(calls.update);
check('update sends the id in the URL and no metricId in the body', upd[0] === '1.1.1' && upd[1].description === 'Edited description' && !('metricId' in upd[1]), upd);

// deactivate / reactivate
await click(rows()[0].querySelector('button[title="Deactivate"]'));
check('deactivate asks for confirmation, sends the reason, never deletes', last(calls.deactivate)[0] === '1.1.1' && last(calls.deactivate)[1] === 'No longer used');
await click(rows()[1].querySelector('button[title="Reactivate"]'));
check('reactivate calls the API for the inactive record', last(calls.reactivate) === '1.1.2');
check('delete is offered per row but disabled for the ACTIVE record and enabled for the inactive one (full flow: tests/benchmark-delete)', (() => { const d = [...container.querySelectorAll('button')].filter((b) => /^Delete /.test(b.getAttribute('aria-label') || '')); return d.length === 2 && d[0].disabled && !d[1].disabled; })());

await act(async () => r.unmount());
console.log(`\n${passed} passed, ${failed} failed`);
fs.unlinkSync(out);
process.exit(failed ? 1 : 0);
