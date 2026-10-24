// Behavioural test for benchmark DELETION in the admin UI: confirmation dialog (identifies the target,
// requires typed confirmation, Cancel does nothing), single request while in flight, refresh after success,
// failure message with the dialog kept open, restriction for active/baseline versions.
// Real components bundled with esbuild; only the network module and the page chrome are stubbed;
// driven in jsdom (not a project dependency):
//   JSDOM_PATH=/path/to/node_modules/jsdom node tests/benchmark-delete/run.mjs
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
let nativeConfirms = 0;
dom.window.confirm = () => { nativeConfirms++; return true; };

const calls = { delImport: [], delRecord: [], listImports: 0, listCat: 0 };
const s = globalThis.__s = { imports: null, failDelete: null, gate: null };
const cItem = (id, active) => ({ metricId: id, metricName: id, description: `Description ${id}`, criterion: 'Criterion 1', criterionNumber: 1, keyIndicator: '1.1 K', maxScore: 10, unit: 'percentage', period: null,
  scoringType: 'numeric', direction: 'higherIsBetter', bands: [{ score: 4, label: '>=20' }], options: [], active, computedField: null, mapped: false, mappingStatus: 'unmapped', formula: '', notes: '', improvementHint: '',
  source: { origin: 'import', versionNo: 3, filename: 'f.pdf', documentVersion: null, approvedBy: 'A', revision: 0, editedBy: null, editedAt: null, page: 2 }, lifecycle: null });
const imp = (id, versionNo, status, o = {}) => ({ id, versionNo, documentVersion: `Manual ${versionNo}`, sourceFilename: `m${versionNo}.pdf`, origin: 'pdf', status, uploadedBy: { name: 'Uploader' }, reviewedBy: {}, approvedBy: status === 'draft' ? {} : { name: 'Approver' }, rowCount: 5, includedCount: 5, errorCount: 0, ...o });
const resetState = () => {
  s.imports = [imp('a'.repeat(24), 4, 'active'), imp('b'.repeat(24), 3, 'superseded'), imp('c'.repeat(24), 2, 'draft'), imp('d'.repeat(24), 1, 'superseded', { origin: 'baseline', sourceFilename: 'seeded catalogue' })];
  s.cat = [cItem('1.1.1', true), cItem('1.1.2', false)];
};
resetState();
const httpErr = (status, message) => { const e = new Error(message); e.response = { status, data: { message } }; return e; };
globalThis.__api = {
  getImportStatus: async () => ({ database: 'db', nodeEnv: 'test', benchmarkMetrics: { total: 2, active: 1, withAnalyticsMapping: 0 }, analyticsMetricDefinitions: 1, activeVersion: null, pendingDrafts: 0, notes: [] }),
  listImports: async () => { calls.listImports++; return s.imports.map((x) => ({ ...x })); },
  getImport: async (id) => ({ ...s.imports.find((x) => x.id === id), rows: [], warnings: [], criteria: [], scannedPages: [], pageCount: 1 }),
  getAuditLog: async () => [],
  previewActivation: async () => null,
  deleteImport: async (id) => {
    calls.delImport.push(id);
    if (s.gate) await s.gate;
    if (s.failDelete) throw httpErr(409, s.failDelete);
    s.imports = s.imports.filter((x) => x.id !== id); return { deleted: true, id };
  },
  listCatalogue: async (f) => { calls.listCat++; return { items: s.cat.map((x) => ({ ...x })), total: s.cat.length, page: f.page, limit: f.limit,
    facets: { versions: ['3'], criteria: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ number: n, count: 1 })), totals: { all: s.cat.length, active: 1, inactive: 1, unmapped: 2 } } }; },
  getCatalogueItem: async (id) => ({ ...cItem(id, true), benchmarkValue: null, analyticsMetric: null, bandsDetail: [] }),
  getCatalogueHistory: async () => [], getMetricOptions: async () => [],
  deleteCatalogueItem: async (id) => {
    calls.delRecord.push(id);
    if (s.gate) await s.gate;
    if (s.failDelete) throw httpErr(409, s.failDelete);
    s.cat = s.cat.filter((x) => x.metricId !== id); return { deleted: true, metricId: id };
  },
};
const names = ['getImportStatus', 'listImports', 'getImport', 'uploadBenchmarkPdf', 'createManualDraft', 'updateImportRow', 'addImportRow', 'approveImport', 'activateImport', 'rollbackImport', 'rejectImport', 'deleteImport', 'getAuditLog', 'previewActivation', 'fetchSourcePdfUrl',
  'listCatalogue', 'getCatalogueItem', 'createCatalogueItem', 'updateCatalogueItem', 'deactivateCatalogueItem', 'reactivateCatalogueItem', 'deleteCatalogueItem', 'getCatalogueHistory', 'getMetricOptions'];
const stub = `const a = () => globalThis.__api;\n${names.map((n) => `export const ${n} = (...x) => a().${n}(...x);`).join('\n')}`;
const out = path.join(root, 'node_modules/.cache-delete-test.mjs');
await esbuild.build({
  stdin: { contents: `export { default as BenchmarkImport } from './src/pages/admin/BenchmarkImport';
                      export { createRoot } from 'react-dom/client'; export { createElement as h, act } from 'react';`, resolveDir: root, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, jsx: 'automatic', logLevel: 'error',
  plugins: [{ name: 'stubs', setup(b) {
    b.onResolve({ filter: /lib\/benchmarkImportApi$/ }, () => ({ path: 'stub-api', namespace: 'stub' }));
    b.onResolve({ filter: /components\/AppLayout$/ }, () => ({ path: 'stub-layout', namespace: 'stub' }));
    b.onLoad({ filter: /^stub-api$/, namespace: 'stub' }, () => ({ contents: stub, loader: 'js' }));
    b.onLoad({ filter: /^stub-layout$/, namespace: 'stub' }, () => ({ contents: 'export default function L(p){ return p.children; }', loader: 'js' }));
  } }],
});
const { BenchmarkImport, createRoot, h, act } = await import(pathToFileURL(out).href);

let passed = 0, failed = 0;
const check = (l, c, x) => { if (c) { passed++; console.log('PASS -', l); } else { failed++; console.log('FAIL -', l, x ?? ''); } };
const container = document.getElementById('root');
const wait = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await wait(); };
const setVal = async (el, v) => { await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }); await wait(); };
const byLabel = (l) => container.querySelector(`[aria-label="${l}"]`);
const dialog = () => container.querySelector('[role="alertdialog"]');
const confirmBtn = () => [...dialog().querySelectorAll('button')].find((b) => /Delete permanently|Deleting/.test(b.textContent));
const cancelBtn = () => [...dialog().querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cancel');
const tab = async (name) => click([...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim() === name));

const r = createRoot(container);
await act(async () => { r.render(h(BenchmarkImport, {})); });
await wait(80);

// ───────── Versions ─────────
await tab('PDF import & versions');
check('every version row offers a Delete action', ['4', '3', '2', '1'].every((n) => !!byLabel(`Delete version ${n}`)));
check('ACTIVE version (v4): Delete disabled, tooltip explains why', byLabel('Delete version 4').disabled && /active version cannot be deleted/i.test(byLabel('Delete version 4').title));
check('BASELINE snapshot (v1): Delete disabled, tooltip explains why', byLabel('Delete version 1').disabled && /baseline snapshot is kept/i.test(byLabel('Delete version 1').title));
check('superseded (v3) and draft (v2) can be deleted', !byLabel('Delete version 3').disabled && !byLabel('Delete version 2').disabled);

await click(byLabel('Delete version 2'));
check('confirmation dialog identifies the selected version (number, file, status, metrics, uploader)', !!dialog() && /Delete version 2\?/.test(dialog().textContent) && /m2\.pdf/.test(dialog().textContent) && /status: draft/.test(dialog().textContent) && /5\/5 metrics/.test(dialog().textContent) && /Uploader/.test(dialog().textContent));
check('dialog states what is kept and that it is audited', /live benchmark records/i.test(dialog().textContent) && /audit log/i.test(dialog().textContent) && /cannot be undone/i.test(dialog().textContent));
check('nothing is deleted just by opening the dialog; native window.confirm is not used', calls.delImport.length === 0 && nativeConfirms === 0);
check('Delete button is disabled until the version is typed', confirmBtn().disabled);
await setVal(byLabel('Type to confirm deletion'), 'v3');
check('typing a DIFFERENT version keeps Delete disabled', confirmBtn().disabled);
await click(confirmBtn());
check('clicking a disabled Delete sends nothing', calls.delImport.length === 0);
await click(cancelBtn());
check('Cancel closes the dialog and sends nothing', !dialog() && calls.delImport.length === 0);

// failure keeps dialog open with the server's message
await click(byLabel('Delete version 3'));
check('superseded dialog warns that rollback will no longer be possible', /no longer be restored by rollback/i.test(dialog().textContent));
await setVal(byLabel('Type to confirm deletion'), 'V3');
s.failDelete = '2 live benchmark records still point to version 3, so it cannot be deleted.';
const listBefore = calls.listImports;
await click(confirmBtn());
check('server refusal -> dialog stays open and shows the explanation', !!dialog() && /2 live benchmark records still point to version 3/.test(dialog().querySelector('[data-testid="delete-error"]')?.textContent || ''), dialog()?.textContent);
check('failed deletion does not refresh or remove the row', calls.listImports === listBefore && !!byLabel('Delete version 3'));
s.failDelete = null;

// duplicate prevention: slow request, double click
let release; s.gate = new Promise((res) => { release = res; });
calls.delImport.length = 0;
await act(async () => { confirmBtn().dispatchEvent(new MouseEvent('click', { bubbles: true })); confirmBtn().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await wait();
check('while deletion is in progress the button shows "Deleting…" and is disabled', /Deleting/.test(confirmBtn().textContent) && confirmBtn().disabled && cancelBtn().disabled);
await click(confirmBtn());
check('double/triple click sends exactly ONE DELETE request', calls.delImport.length === 1 && calls.delImport[0] === 'b'.repeat(24), calls.delImport);
const listBefore2 = calls.listImports;
await act(async () => { release(); }); await wait(60);
check('success -> dialog closes, versions list is refreshed, row is gone', !dialog() && calls.listImports > listBefore2 && !byLabel('Delete version 3') && !!byLabel('Delete version 2'));
s.gate = null;

// deleting the version currently open in the review pane clears the pane
await click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Review'));
check('draft v2 is open in the review pane', /Review — version 2/.test(container.textContent));
await click(byLabel('Delete version 2'));
await setVal(byLabel('Type to confirm deletion'), 'v2');
await click(confirmBtn());
check('deleting the open version closes its review pane and refreshes', calls.delImport.length === 2 && !/Review — version 2/.test(container.textContent) && !byLabel('Delete version 2'));

// ───────── Catalogue ─────────
await tab('Catalogue');
await wait(60);
const dRec = (id) => byLabel(`Delete ${id}`);
check('catalogue: ACTIVE record cannot be deleted (disabled + hint), inactive can', dRec('1.1.1').disabled && /Deactivate it first/.test(dRec('1.1.1').title) && !dRec('1.1.2').disabled);
await click(dRec('1.1.2'));
check('record dialog identifies the benchmark (ID, description, status)', !!dialog() && /Delete benchmark 1\.1\.2\?/.test(dialog().textContent) && /Description 1\.1\.2/.test(dialog().textContent) && /currently inactive/.test(dialog().textContent));
check('record dialog: analytics definitions are kept, deletion is audited', /Analytics metric definitions/.test(dialog().textContent) && /audit log/i.test(dialog().textContent));
await setVal(byLabel('Type to confirm deletion'), '1.1.2');
s.failDelete = 'The metric changed state or was already deleted; reload and try again.';
await click(confirmBtn());
check('record deletion failure is shown in the dialog and the row stays', /already deleted/.test(dialog().querySelector('[data-testid="delete-error"]').textContent) && !!dRec('1.1.2'));
s.failDelete = null; calls.delRecord.length = 0;
const catBefore = calls.listCat;
await click(confirmBtn());
check('record deleted with the exact metric ID, once', calls.delRecord.length === 1 && calls.delRecord[0] === '1.1.2', calls.delRecord);
check('success -> dialog closes and the catalogue is reloaded without the record', !dialog() && calls.listCat > catBefore && !dRec('1.1.2') && !!dRec('1.1.1'));

await act(async () => r.unmount());
console.log(`\n${passed} passed, ${failed} failed`);
fs.unlinkSync(out);
process.exit(failed ? 1 : 0);
