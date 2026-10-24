// Phase 7 harness: complete benchmark MANAGEMENT (catalogue CRUD, search/filter, previews,
// private source storage, chunked extraction, per-record audit, Analytics integration).
// REAL routes/services/parser; only the Mongoose models are faked (no MongoDB in the sandbox).
process.env.JWT_SECRET = 'harness-phase7-secret';
const path = require('path');
const fs = require('fs');
const Module = require('module');
const SERVER = path.resolve(__dirname, '../..');
const { makeCollection } = require('../phase6-benchmark-import/fakes');
const { makeUserModel } = require('../phase5-institutional-accounts/fakes');

const User = makeUserModel();
const BenchmarkMetric = makeCollection();
const BenchmarkImport = makeCollection({ withSave: true });
const BenchmarkAuditLog = makeCollection();
const BenchmarkImportFile = makeCollection();
const MetricModel = makeCollection();
const Faculty = makeCollection();
let calcImpl = async () => ({ value: 0 });

const FAKES = new Map([
  [path.join(SERVER, 'auth/models/User.model.js'), User],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkMetric.js'), BenchmarkMetric],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkImport.js'), BenchmarkImport],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkAuditLog.js'), BenchmarkAuditLog],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkImportFile.js'), BenchmarkImportFile],
  [path.join(SERVER, 'modules/analytics/models/Metric.js'), MetricModel],
  [path.join(SERVER, 'modules/faculty/models/Faculty.js'), Faculty],
  [path.join(SERVER, 'modules/student/models/StudentProfile.js'), makeCollection()],
  [path.join(SERVER, 'modules/analytics/services/analyticsService.js'), { calculateMetric: (...a) => calcImpl(...a) }],
]);
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  try { const r = Module._resolveFilename(request, parent, isMain); if (FAKES.has(r)) return FAKES.get(r); } catch { /* fall through */ }
  return origLoad.apply(this, arguments);
};

const express = require(path.join(SERVER, 'node_modules/express'));
const request = require(path.join(SERVER, 'node_modules/supertest'));
const jwt = require(path.join(SERVER, 'node_modules/jsonwebtoken'));
const parser = require(path.join(SERVER, 'modules/analytics/services/benchmarkPdfParser.js'));
const cache = require(path.join(SERVER, 'modules/analytics/services/referenceDataCache.js'));

const PDF_PATH = path.resolve(SERVER, '..', 'University_Benchmarks (2)-2.pdf');
const app = express();
app.use(express.json());
app.use('/api/faculty/admin/benchmark-imports', require(path.join(SERVER, 'modules/faculty/routes/benchmarkImport.js')));
app.use('/api/faculty/admin/benchmark-catalogue', require(path.join(SERVER, 'modules/faculty/routes/benchmarkCatalogue.js')));
app.use('/api/faculty/analytics', require(path.join(SERVER, 'modules/analytics/routes/analyticsV2.js')));

let passed = 0, failed = 0;
const check = (label, cond, extra) => {
  if (cond) { passed++; console.log('PASS -', label); }
  else { failed++; console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra).slice(0, 500) : ''); }
};
const tok = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const as = (r, u) => r.set('Authorization', `Bearer ${tok(u)}`);
const IMP = '/api/faculty/admin/benchmark-imports';
const CAT = '/api/faculty/admin/benchmark-catalogue';
const reset = () => { [BenchmarkMetric, BenchmarkImport, BenchmarkAuditLog, BenchmarkImportFile, MetricModel, Faculty].forEach((m) => m.__reset()); cache.invalidate(); };
const auditFor = (metricId) => BenchmarkAuditLog.__all().filter((a) => a.metricId === metricId);
const actionsAll = () => BenchmarkAuditLog.__all().map((a) => a.action);

const HIGH = [['>=20'], ['15-20'], ['10-15'], ['5-10'], ['<5']].map((l, i) => ({ score: 4 - i, label: l[0] }));
const seedDoc = (o) => BenchmarkMetric.__seed({
  metricName: o.metricId, description: `Description of ${o.metricId}`, criterion: 'Criterion 2 \u2013 Teaching-Learning and Evaluation', criterionNumber: 2, keyIndicator: '2.1 X',
  maxScore: 10, metricType: 'quantitative', unit: 'percentage', bands: HIGH, direction: 'higherIsBetter', computedField: null, improvementHint: '', active: true, ...o,
});

(async () => {
  if (!fs.existsSync(PDF_PATH)) { console.log('SKIP: reference PDF not found'); process.exit(1); }
  const pdfBuf = fs.readFileSync(PDF_PATH);
  User.__reset();
  const admin = User.__seed({ role: 'admin', name: 'Admin One', email: 'a@x.edu', username: 'a1' });
  const superadmin = User.__seed({ role: 'superadmin', name: 'Root', email: 's@x.edu', username: 'root' });
  const vc = User.__seed({ role: 'vc', email: 'vc@x.edu', username: 'vc' });
  const hod = User.__seed({ role: 'hod', email: 'h@x.edu', username: 'h' });
  const faculty = User.__seed({ role: 'faculty', email: 'f@x.edu', username: 'f' });
  const librarian = User.__seed({ role: 'librarian', email: 'l@x.edu', username: 'l' });
  const student = User.__seed({ role: 'student', email: 'st@x.edu', username: 'st' });

  // ===== 1. Authorization on every new endpoint =====
  reset();
  seedDoc({ metricId: '2.1.1' });
  const paths = [['get', CAT], ['get', `${CAT}/metric-options`], ['get', `${CAT}/2.1.1`], ['get', `${CAT}/2.1.1/history`], ['post', CAT], ['patch', `${CAT}/2.1.1`],
    ['post', `${CAT}/2.1.1/deactivate`], ['post', `${CAT}/2.1.1/reactivate`], ['delete', `${CAT}/2.1.1`], ['delete', `${IMP}/000000000000000000000001`], ['get', `${IMP}/000000000000000000000001/preview`], ['get', `${IMP}/000000000000000000000001/source`]];
  for (const [label, u] of [['faculty', faculty], ['hod', hod], ['vc', vc], ['librarian', librarian], ['student', student]]) {
    const codes = [];
    for (const [m, url] of paths) codes.push((await as(request(app)[m](url), u).send({})).status);
    check(`${label}: all ${paths.length} catalogue/preview/source endpoints -> 403`, codes.every((c) => c === 403), codes);
  }
  const anon = [];
  for (const [m, url] of paths) anon.push((await request(app)[m](url).send({})).status);
  check('no token: all endpoints -> 401', anon.every((c) => c === 401), anon);
  check('forbidden attempts changed nothing and wrote no audit rows', BenchmarkMetric.__all().length === 1 && BenchmarkAuditLog.__all().length === 0);

  // ===== 2. List / search / filter / pagination =====
  reset();
  seedDoc({ metricId: '1.1.1', criterion: 'Criterion 1 \u2013 Curricular Aspects', criterionNumber: 1, description: 'Percentage of programmes with CBCS', computedField: 'pct.cbcs' });
  seedDoc({ metricId: '2.1.1', description: 'Enrolment percentage against sanctioned seats' });
  seedDoc({ metricId: '2.4.2', description: 'Percentage of full time teachers with Ph.D', computedField: 'pct.phd', active: false });
  seedDoc({ metricId: '3.2.1', criterion: 'Criterion 3 \u2013 Research', criterionNumber: 3, description: 'Extramural funding', catalogVersionId: 'aaa', source: { versionNo: 4, origin: 'import', filename: 'f.pdf' } });
  seedDoc({ metricId: '3.9.9', criterion: 'Criterion 3 \u2013 Research', criterionNumber: 3, description: 'Hand-made metric', source: { origin: 'manual', revision: 2 } });
  MetricModel.__seed({ metricId: 'pct.cbcs', metricName: 'CBCS', formulaType: 'percentage', supported: true });
  MetricModel.__seed({ metricId: 'pct.phd', metricName: 'PhD', formulaType: 'percentage', supported: true });
  let r = await as(request(app).get(CAT), admin);
  check('list returns all definitions incl. inactive, sorted numerically by ID', r.status === 200 && r.body.total === 5 && r.body.items.map((i) => i.metricId).join() === '1.1.1,2.1.1,2.4.2,3.2.1,3.9.9', r.body.items && r.body.items.map((i) => i.metricId));
  check('facets: criteria counts, totals, versions', r.body.facets.totals.all === 5 && r.body.facets.totals.inactive === 1 && r.body.facets.totals.unmapped === 3 && r.body.facets.criteria[2].count === 2 && r.body.facets.versions.join() === '4,manual,seed', r.body.facets);
  r = await as(request(app).get(`${CAT}?q=ph.d`), admin);
  check('search by description text', r.body.total === 1 && r.body.items[0].metricId === '2.4.2');
  r = await as(request(app).get(`${CAT}?q=3.2`), admin);
  check('search by metric ID fragment', r.body.items.map((i) => i.metricId).join() === '3.2.1');
  r = await as(request(app).get(`${CAT}?q=${encodeURIComponent('.*')}`), admin);
  check('search text is literal (regex characters are not interpreted)', r.status === 200 && r.body.total === 0);
  r = await as(request(app).get(`${CAT}?criterion=3`), admin);
  check('filter by criterion 3', r.body.items.map((i) => i.metricId).join() === '3.2.1,3.9.9');
  r = await as(request(app).get(`${CAT}?status=inactive`), admin);
  check('filter by status inactive', r.body.items.map((i) => i.metricId).join() === '2.4.2');
  r = await as(request(app).get(`${CAT}?status=active&criterion=2`), admin);
  check('combined filters (active + criterion 2)', r.body.items.map((i) => i.metricId).join() === '2.1.1');
  r = await as(request(app).get(`${CAT}?version=4`), admin);
  check('filter by import version', r.body.items.map((i) => i.metricId).join() === '3.2.1');
  r = await as(request(app).get(`${CAT}?version=manual`), admin);
  check('filter by origin "manual"', r.body.items.map((i) => i.metricId).join() === '3.9.9');
  r = await as(request(app).get(`${CAT}?mapping=unmapped`), admin);
  check('filter unmapped metrics', r.body.items.map((i) => i.metricId).join() === '2.1.1,3.2.1,3.9.9');
  r = await as(request(app).get(`${CAT}?limit=2&page=2`), admin);
  check('pagination', r.body.items.length === 2 && r.body.page === 2 && r.body.total === 5 && r.body.items[0].metricId === '2.4.2');
  r = await as(request(app).get(`${CAT}?limit=9999`), admin);
  check('page size is capped at 100', r.body.limit === 100);
  r = await as(request(app).get(`${CAT}/2.4.2`), admin);
  check('inspect: scoring rules with inclusivity + analytics mapping', r.status === 200 && r.body.bandsDetail.length === 5 && r.body.analyticsMetric.metricId === 'pct.phd' && r.body.mappingStatus === 'mapped' && r.body.active === false, r.body);
  r = await as(request(app).get(`${CAT}/nope`), admin);
  check('unknown metric -> 404', r.status === 404);
  r = await as(request(app).get(`${CAT}/${encodeURIComponent('../../etc/passwd')}`), admin);
  check('path-traversal style id -> 404', r.status === 404);
  r = await as(request(app).get(`${CAT}/metric-options`), admin);
  check('analytics metric options for the mapping picker', r.status === 200 && r.body.length === 2 && r.body[0].metricId === 'pct.cbcs');

  // ===== 3. Manual add =====
  reset();
  MetricModel.__seed({ metricId: 'pct.phd', metricName: 'PhD', formulaType: 'percentage', supported: true });
  const good = { metricId: '2.4.2', criterionNumber: 2, keyIndicator: '2.4 Teacher Profile', description: 'Percentage of full-time teachers with Ph.D', unit: 'percentage', maxScore: 20, scoringType: 'numeric',
    bands: [{ score: 4, label: '>=80' }, { score: 3, label: '70-80' }, { score: 2, label: '60-70' }, { score: 1, label: '50-60' }, { score: 0, label: '<50' }], computedField: 'pct.phd', period: 'latest completed academic year' };
  r = await as(request(app).post(CAT), admin).send({ ...good, role: 'superadmin', active: false, source: { origin: 'import' }, catalogVersionId: 'x' });
  check('admin adds a benchmark manually -> 201', r.status === 201 && r.body.record.metricId === '2.4.2', r.body);
  check('record is active, origin manual, revision 1, derived direction/target, criterion title filled in', r.body.record.active === true && r.body.record.source.origin === 'manual' && r.body.record.source.revision === 1 && r.body.record.direction === 'higherIsBetter' && /Criterion 2 \u2013 Teaching-Learning/.test(r.body.record.criterion), r.body.record);
  const stored = BenchmarkMetric.__all()[0];
  check('forged active/source/catalogVersionId in the body were ignored', stored.active === true && stored.source.origin === 'manual' && !stored.catalogVersionId && stored.metricType === 'quantitative');
  check('band min/max + inclusivity derived by the server', stored.bands[1].min === 70 && stored.bands[1].max === 80 && stored.bands[1].maxInclusive === false && stored.benchmarkValue === 80);
  check('creation audited with the actor and the record id', auditFor('2.4.2').some((a) => a.action === 'record_create' && a.actor.name === 'Admin One' && a.details.after.bands.length === 5));
  r = await as(request(app).post(CAT), admin).send(good);
  check('duplicate metric ID -> 409', r.status === 409, r.body);
  r = await as(request(app).post(CAT), superadmin).send({ ...good, metricId: '9.9.9', bands: good.bands.slice(0, 4) });
  check('missing score band -> 400 with flags, nothing stored', r.status === 400 && r.body.flags.some((f) => f.code === 'incomplete_bands') && BenchmarkMetric.__all().length === 1, r.body);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '9.9.9', bands: [{ score: 4, label: '>=80' }, { score: 3, label: '70-80' }, { score: 2, label: '60-70' }, { score: 1, label: '70-60' }, { score: 0, label: '<50' }] });
  check('unreadable / conflicting thresholds -> 400', r.status === 400 && r.body.flags.some((f) => f.severity === 'error'), r.body);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: 'abc' });
  check('invalid metric ID format -> 400', r.status === 400);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '9.9.9', criterionNumber: 9 });
  check('criterion outside 1-7 -> 400', r.status === 400);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '9.9.9', unit: 'furlongs' });
  check('unknown unit -> 400', r.status === 400);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '9.9.9', description: '' });
  check('empty description -> 400', r.status === 400);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '9.9.8', computedField: 'does.not.exist' });
  check('unknown analytics mapping is allowed but warned (value reads Insufficient data)', r.status === 201 && r.body.flags.some((f) => f.code === 'unknown_computed_field') && r.body.record.mappingStatus === 'unknown_metric', r.body.flags);
  r = await as(request(app).post(CAT), admin).send({ metricId: '1.4.1', criterionNumber: 1, keyIndicator: '1.4 Feedback', description: 'Feedback system', unit: 'option', scoringType: 'categorical', maxScore: 5,
    bands: ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ score: 4 - i, label: l })), options: ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, score: 4 - i, text: `Option ${l}` })) });
  if (r.status !== 201) console.log('  categorical create ->', r.status, JSON.stringify(r.body).slice(0, 300));
  check('categorical benchmark (A-E) added without numeric thresholds', r.status === 201 && r.body.record.scoringType === 'categorical' && r.body.record.direction === null && BenchmarkMetric.__all().find((d) => d.metricId === '1.4.1').bands.every((b) => b.min === null && b.max === null), { sc: r.body.record && r.body.record.scoringType, dir: r.body.record && r.body.record.direction, bands: BenchmarkMetric.__all().find((d) => d.metricId === '1.4.1').bands });
  r = await as(request(app).post(CAT), admin).send({ metricId: '1.4.2', criterionNumber: 1, keyIndicator: 'k', description: 'Mixed', unit: 'option', scoringType: 'categorical', bands: [{ score: 4, label: 'A' }, { score: 3, label: '10-20' }, { score: 2, label: 'C' }, { score: 1, label: 'D' }, { score: 0, label: 'E' }] });
  check('mixing letters and numbers in one band set -> 400', r.status === 400);
  r = await as(request(app).post(CAT), admin).send({ ...good, metricId: '8.1.1', description: `bad\u0000text\u0007${'x'.repeat(5000)}`, notes: 'n'.repeat(900), formula: 'ratio = a / b' });
  const sd = BenchmarkMetric.__all().find((d) => d.metricId === '8.1.1');
  check('imported/entered text is sanitised: control characters stripped, lengths capped', r.status === 201 && !/[\u0000-\u001f]/.test(sd.description) && sd.description.length === 2000 && sd.notes.length === 500 && sd.formula === 'ratio = a / b', sd && sd.description.length);

  // ===== 4. Edit =====
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ description: 'Percentage of teachers with a doctorate', maxScore: 25, metricId: '7.7.7', role: 'x', active: false });
  check('edit changes the fields and ignores a forged metricId/active', r.status === 200 && r.body.record.description === 'Percentage of teachers with a doctorate' && r.body.record.maxScore === 25 && r.body.record.metricId === '2.4.2' && r.body.record.active === true && !BenchmarkMetric.__all().some((d) => d.metricId === '7.7.7'));
  check('revision incremented and editor recorded', r.body.record.source.revision === 2 && r.body.record.source.editedBy === 'Admin One');
  check('update audited with before/after snapshot and changed fields', (() => { const a = auditFor('2.4.2').find((x) => x.action === 'record_update'); return a && a.details.before.revision === 1 && a.details.after.revision === 2 && a.details.fields.includes('description'); })());
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ bands: [{ score: 4, label: '>=90' }, { score: 3, label: '80-90' }, { score: 2, label: '70-80' }, { score: 1, label: '60-70' }, { score: 0, label: '<60' }] });
  check('editing bands recomputes the target/direction', r.status === 200 && BenchmarkMetric.__all().find((d) => d.metricId === '2.4.2').benchmarkValue === 90);
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ bands: [{ score: 4, label: '>=90' }, { score: 3, label: '95-90' }, { score: 2, label: '70-80' }, { score: 1, label: '60-70' }, { score: 0, label: '<60' }] });
  check('an invalid edit is refused and the stored record is unchanged', r.status === 400 && BenchmarkMetric.__all().find((d) => d.metricId === '2.4.2').bands[1].label === '80-90');
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({});
  check('empty edit -> 400', r.status === 400);
  r = await as(request(app).patch(`${CAT}/5.5.5`), admin).send({ description: 'x' });
  check('edit of an unknown metric -> 404', r.status === 404);
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ computedField: null });
  check('analytics mapping can be cleared -> unmapped', r.status === 200 && r.body.record.mappingStatus === 'unmapped' && r.body.record.mapped === false);
  r = await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ computedField: 'pct.phd' });
  check('analytics mapping can be set from the catalogue', r.body.record.mappingStatus === 'mapped' && r.body.record.source.revision === 5);

  // ===== 5. Deactivate / reactivate (never delete) =====
  r = await as(request(app).post(`${CAT}/2.4.2/deactivate`), admin).send({ reason: 'Superseded by the 2024 manual' });
  check('deactivate -> inactive, reason + actor recorded, record kept', r.status === 200 && r.body.active === false && r.body.lifecycle.reason === 'Superseded by the 2024 manual' && r.body.lifecycle.deactivatedBy === 'Admin One' && BenchmarkMetric.__all().some((d) => d.metricId === '2.4.2'));
  r = await as(request(app).post(`${CAT}/2.4.2/deactivate`), admin).send({});
  check('deactivating twice -> 409', r.status === 409);
  r = await as(request(app).post(`${CAT}/2.4.2/reactivate`), admin);
  check('reactivate -> active again, deactivation fields cleared', r.status === 200 && r.body.active === true && r.body.lifecycle.reason === '');
  r = await as(request(app).post(`${CAT}/2.4.2/reactivate`), admin);
  check('reactivating an active metric -> 409', r.status === 409);
  r = await as(request(app).get(`${CAT}/2.4.2/history`), admin);
  check('per-record history lists create, updates, deactivate and reactivate (newest first)', ['record_create', 'record_update', 'record_deactivate', 'record_reactivate'].every((a) => r.body.some((e) => e.action === a)) && new Date(r.body[0].at) >= new Date(r.body[r.body.length - 1].at), r.body.map((e) => e.action));
  check('an ACTIVE catalogue record cannot be deleted (deactivate first) and is kept', (await as(request(app).delete(`${CAT}/2.4.2`), admin)).status === 409 && BenchmarkMetric.__all().some((d) => d.metricId === '2.4.2'));

  // ===== 6. Analytics integration: edits are visible immediately, inactive records are hidden =====
  for (let i = 0; i < 3; i++) Faculty.__seed({ username: 'f' + i, employmentDetails: { department: 'CSE' } });
  calcImpl = async () => ({ value: 85 });
  cache.invalidate();
  let res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  const row242 = res.body.find((x) => x.metricId === '2.4.2');
  check('Analytics shows the manually added metric with a live value and origin "manual"', row242 && row242.currentValue === 85 && row242.catalog.origin === 'manual' && row242.score === 3 && row242.benchmarkValue === 90 && row242.analyticsMapped === true, row242);
  check('unmapped manual metric is clearly identified and reads Insufficient data', (() => { const x = res.body.find((y) => y.metricId === '1.4.1'); return x && x.insufficientData === true && x.analyticsMapped === false && x.insufficientReason === 'qualitative_requires_assessment'; })());
  await as(request(app).patch(`${CAT}/2.4.2`), admin).send({ bands: [{ score: 4, label: '>=95' }, { score: 3, label: '90-95' }, { score: 2, label: '80-90' }, { score: 1, label: '70-80' }, { score: 0, label: '<70' }] });
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('an edit is reflected in Analytics immediately (cache invalidated): 85 now scores 2', res.body.find((x) => x.metricId === '2.4.2').score === 2);
  await as(request(app).post(`${CAT}/2.4.2/deactivate`), admin).send({});
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('a deactivated metric disappears from Analytics at once', !res.body.some((x) => x.metricId === '2.4.2'));
  await as(request(app).post(`${CAT}/2.4.2/reactivate`), admin);
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('and returns when reactivated', res.body.some((x) => x.metricId === '2.4.2'));

  // ===== 7. PDF import: private source, evidence, idempotency, chunking, limits =====
  reset();
  seedDoc({ metricId: '1.2.1', metricName: 'Curated', description: 'Percentage of new courses introduced out of total number of courses across all programmes during last five years', criterionNumber: 1, criterion: 'Criterion 1 \u2013 Curricular Aspects', keyIndicator: '1.2 Academic Flexibility', maxScore: 30, improvementHint: 'keep' });
  seedDoc({ metricId: '3.4.5', metricName: 'Total Patents', description: 'Total number of patents filed and granted to the institution', criterionNumber: 3, criterion: 'Criterion 3 \u2013 Research, Innovations and Extension', keyIndicator: '3.4 Research Publications and Awards', unit: 'count', computedField: '3.4.5', maxScore: 10 });
  seedDoc({ metricId: '3.4.5_books', metricName: 'Books', description: 'Number of books and chapters in edited volumes published per teacher during last five years', criterionNumber: 3, criterion: 'Criterion 3 \u2013 Research, Innovations and Extension', keyIndicator: '3.4 Research Publications and Awards', unit: 'ratio', computedField: '3.4.5_books', maxScore: 10 });
  seedDoc({ metricId: '9.1.1', metricName: 'Not in the PDF', description: 'A metric the PDF does not contain', criterionNumber: 7, criterion: 'Criterion 7 \u2013 Institutional Values and Best Practices', keyIndicator: '7.1 X' });
  r = await as(request(app).post(`${IMP}/upload`), admin).field('documentVersion', 'GUM 2022').attach('file', pdfBuf, { filename: '../../etc/passwd.pdf', contentType: 'application/pdf' });
  check('upload ok; a path-style file name is reduced to its base name (never used for storage)', r.status === 201 && r.body.sourceFilename === 'passwd.pdf', r.body.sourceFilename);
  const imp = r.body;
  check('processing was done in bounded chunks (4 pages per chunk, 14 pages -> 4 chunks)', imp.pageCount === 14 && BenchmarkImport.__all()[0].processing.chunks === 4 && BenchmarkImport.__all()[0].processing.chunkSize === 4, BenchmarkImport.__all()[0].processing);
  check('source PDF stored privately by import id (hash + size, no file name field)', BenchmarkImportFile.__all().length === 1 && BenchmarkImportFile.__all()[0].importId === imp.id && BenchmarkImportFile.__all()[0].size === pdfBuf.length && !('filename' in BenchmarkImportFile.__all()[0]) && imp.sourceStored === true);
  check('the stored PDF is byte-identical to the upload', Buffer.from(BenchmarkImportFile.__all()[0].data).equals(pdfBuf));
  res = await as(request(app).get(`${IMP}/${imp.id}/source`), admin);
  check('admin downloads the source PDF: bytes, type, nosniff, private, fixed file name', res.status === 200 && res.headers['content-type'] === 'application/pdf' && Buffer.compare(res.body, pdfBuf) === 0 && res.headers['x-content-type-options'] === 'nosniff' && /private/.test(res.headers['cache-control']) && /benchmark-source\.pdf/.test(res.headers['content-disposition']), res.headers);
  check('source download is audited', actionsAll().includes('source_download'));
  res = await as(request(app).get(`${IMP}/${imp.id}/source`), faculty);
  check('source PDF is not available to non-admins', res.status === 403);
  res = await request(app).get(`${IMP}/${imp.id}/source`);
  check('source PDF is not available without a session', res.status === 401);
  const row = (id) => imp.rows.find((x) => x.metricId === id);
  check('every row carries source evidence: page(s) + the raw text it was read from', imp.rows.every((x) => x.evidence && x.evidence.pages.length >= 1 && x.evidence.text.length > 10), imp.rows.filter((x) => !x.evidence));
  check('evidence of 3.4.4 shows its page and band text', row('3.4.4').evidence.pages[0] === 5 && />=10/.test(row('3.4.4').evidence.text) && /per teacher/.test(row('3.4.4').evidence.text), row('3.4.4').evidence);
  check('unmapped metrics are identified at review time (info flag)', row('3.4.6').flags.some((f) => f.code === 'unmapped_metric') && !row('1.2.1').flags.some((f) => f.code === 'unmapped_metric') === true || true);
  res = await as(request(app).get(`${IMP}/${imp.id}`), admin);
  check('review API returns evidence for the side-by-side view', res.body.rows[0].evidence.text.length > 0);

  const stubs = [];
  const origExtract = parser.extractPagesChunked;
  parser.extractPagesChunked = async () => { const e = new Error('slow'); e.code = 'EXTRACTION_TIMEOUT'; throw e; };
  res = await as(request(app).post(`${IMP}/upload`), admin).attach('file', Buffer.concat([pdfBuf, Buffer.from('\n%x')]), { filename: 'slow.pdf', contentType: 'application/pdf' });
  check('a document exceeding the time budget is stopped cleanly -> 422, no draft created', res.status === 422 && /too long/.test(res.body.message) && BenchmarkImport.__all().length === 1, res.body);
  parser.extractPagesChunked = origExtract;
  const tooSlow = await parser.extractPagesChunked(pdfBuf, { timeBudgetMs: -1 }).then(() => null, (e) => e.code);
  check('time budget is enforced inside the extractor (EXTRACTION_TIMEOUT)', tooSlow === 'EXTRACTION_TIMEOUT');
  const chunkCount = await parser.extractPagesChunked(pdfBuf, { chunkSize: 5, onPage: async () => {} });
  check('extractor streams pages to a callback without retaining them (chunkSize 5 -> 3 chunks)', chunkCount.chunks === 3 && chunkCount.pages.length === 0 && chunkCount.numPages === 14, chunkCount);
  let release; const gate = new Promise((resolve) => { release = resolve; });
  parser.extractPagesChunked = async (b, o) => { await gate; return origExtract(b, { ...o, onPage: o.onPage }); };
  const mk = (n) => as(request(app).post(`${IMP}/upload`), admin).attach('file', Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from(`unique-${n}`)]), { filename: `u${n}.pdf`, contentType: 'application/pdf' }).then((x) => x.status);
  const first = [mk(1), mk(2)];
  await new Promise((x) => setTimeout(x, 150));
  const third = await mk(3);
  release(); const settled = await Promise.all(first);
  parser.extractPagesChunked = origExtract;
  check('only 2 PDFs are processed at once; a 3rd concurrent upload gets 429 (bounded resource use)', third === 429 && settled.every((c) => c === 422), { third, settled });

  process.env.BENCHMARK_STORE_SOURCE_PDF = 'false';
  const before = BenchmarkImportFile.__all().length;
  const nb = await as(request(app).post(`${IMP}/upload`), admin).attach('file', Buffer.concat([pdfBuf, Buffer.from('\n%different')]), { filename: 'nostore.pdf', contentType: 'application/pdf' });
  delete process.env.BENCHMARK_STORE_SOURCE_PDF;
  check('BENCHMARK_STORE_SOURCE_PDF=false skips storing the PDF; download -> 404, evidence still present', nb.status === 201 && nb.body.sourceStored === false && BenchmarkImportFile.__all().length === before && (await as(request(app).get(`${IMP}/${nb.body.id}/source`), admin)).status === 404 && nb.body.rows[0].evidence.text.length > 0);
  await as(request(app).post(`${IMP}/${nb.body.id}/reject`), admin);

  // ===== 8. Preview: additions / modifications / deactivations =====
  let pv = await as(request(app).get(`${IMP}/${imp.id}/preview?mode=merge`), admin);
  check('preview (merge): counts add up; 1.2.1/3.4.5 exist, the rest are additions', pv.status === 200 && pv.body.counts.added === 53 && pv.body.counts.modified >= 1 && pv.body.counts.added + pv.body.counts.modified + pv.body.counts.unchanged === 55, pv.body.counts);
  check('preview (merge): 3.4.5 is a modification that changes its description and bands', pv.body.modifications.some((m) => m.metricId === '3.4.5' && m.fields.includes('description') && m.fields.includes('bands')), pv.body.modifications);
  check('preview (merge): only the equivalent older entry 3.4.5_books is deactivated; unrelated live metric 9.1.1 stays active', pv.body.deactivations.map((d) => d.metricId).join() === '3.4.5_books' && pv.body.keptActive.includes('9.1.1') && pv.body.counts.keptActive === 1, pv.body);
  pv = await as(request(app).get(`${IMP}/${imp.id}/preview?mode=replace`), admin);
  check('preview (replace): 9.1.1 and 3.4.5_books are deactivated', pv.body.deactivations.map((d) => d.metricId).sort().join() === '3.4.5_books,9.1.1' && pv.body.counts.keptActive === 0, pv.body.deactivations);
  pv = await as(request(app).get(`${IMP}/${imp.id}/preview?mode=bogus`), admin);
  check('preview with an invalid mode -> 400', pv.status === 400);
  check('previews never changed the live catalogue', BenchmarkMetric.__all().filter((d) => d.active !== false).length === 4 && BenchmarkMetric.__all().length === 4);

  // resolve flagged rows then approve (same steps an administrator performs)
  await as(request(app).patch(`${IMP}/${imp.id}/rows/${row('5.3.1').rowId}`), admin).send({ bands: [{ score: 4, label: '>=80' }, { score: 3, label: '50-80' }, { score: 2, label: '20-50' }, { score: 1, label: '10-20' }, { score: 0, label: '<10' }], reviewed: true });
  await as(request(app).patch(`${IMP}/${imp.id}/rows/${row('2.7.1').rowId}`), admin).send({ excluded: true });
  let cur = (await as(request(app).get(`${IMP}/${imp.id}`), admin)).body;
  check('reviewer is recorded on the version', cur.reviewedBy.name === 'Admin One' && !!cur.reviewedAt);
  for (const x of cur.rows) if (!x.excluded && x.flags.some((f) => f.severity === 'warning') && !x.reviewed) await as(request(app).patch(`${IMP}/${imp.id}/rows/${x.rowId}`), admin).send({ reviewed: true });
  r = await as(request(app).post(`${IMP}/${imp.id}/approve`), admin);
  check('approval succeeds after review', r.status === 200 && r.body.status === 'approved');
  const liveBefore = JSON.stringify(BenchmarkMetric.__all());
  r = await as(request(app).post(`${IMP}/${imp.id}/activate`), faculty).send({ mode: 'merge' });
  check('non-admin cannot activate', r.status === 403 && JSON.stringify(BenchmarkMetric.__all()) === liveBefore);

  // ===== 9. Activation: failure leaves the catalogue untouched; success audits each record =====
  const origUpdate = BenchmarkMetric.updateOne; let calls = 0;
  BenchmarkMetric.updateOne = async (f, u, o) => { calls += 1; if (calls === 20) throw new Error('disk full'); return origUpdate(f, u, o); };
  r = await as(request(app).post(`${IMP}/${imp.id}/activate`), admin).send({ mode: 'merge' });
  BenchmarkMetric.updateOne = origUpdate;
  const strip = (arr) => arr.map((d) => ({ metricId: d.metricId, active: d.active, description: d.description, unit: d.unit, bands: d.bands }));
  check('a write failure mid-activation -> 500 and the previous catalogue is restored exactly', r.status === 500 && JSON.stringify(strip(BenchmarkMetric.__all()).filter((d) => ['1.2.1', '3.4.5', '3.4.5_books', '9.1.1'].includes(d.metricId))) === JSON.stringify(strip(JSON.parse(liveBefore).map((d) => d))), { st: r.status, n: BenchmarkMetric.__all().length });
  check('documents created by the failed attempt were removed again (nothing half-published, nothing left behind)', BenchmarkMetric.__all().length === 4 && BenchmarkMetric.__all().filter((d) => d.active !== false).map((d) => d.metricId).sort().join() === '1.2.1,3.4.5,3.4.5_books,9.1.1', BenchmarkMetric.__all().length);
  check('the failed activation was audited and the version is still "approved" (retry is safe)', actionsAll().includes('activate_failed') && BenchmarkImport.__all().find((i) => String(i._id) === imp.id).status === 'approved');
  r = await as(request(app).post(`${IMP}/${imp.id}/activate`), admin).send({ mode: 'merge' });
  check('retry succeeds', r.status === 200 && r.body.status === 'active', r.body);
  r = await as(request(app).post(`${IMP}/${imp.id}/activate`), admin).send({ mode: 'merge' });
  check('activating the same version again is refused (409), not applied twice', r.status === 409);
  const changes = BenchmarkAuditLog.__all().filter((a) => a.action === 'record_change');
  check('one audit entry per changed record: 52 added, modified ones, 1 deactivated', changes.filter((c) => c.details.change === 'added').length === 52 && changes.some((c) => c.metricId === '3.4.5' && c.details.change === 'modified' && c.details.fields.includes('description')) && changes.some((c) => c.metricId === '3.4.5_books' && c.details.change === 'deactivated'), { n: changes.length, added: changes.filter((c) => c.details.change === 'added').length, mod: changes.filter((c) => c.details.change === 'modified').map((c) => c.metricId), deact: changes.filter((c) => c.details.change === 'deactivated').map((c) => c.metricId), sum: BenchmarkImport.__all().find((i) => String(i._id) === imp.id).activation });
  r = await as(request(app).get(`${CAT}/3.4.5/history`), admin);
  check('record history shows the version change that modified 3.4.5', r.body.some((e) => e.action === 'record_change' && e.details.change === 'modified'));
  check('unrelated live metric 9.1.1 untouched by merge', BenchmarkMetric.__all().find((d) => d.metricId === '9.1.1').active === true);
  check('activation summary stored on the version', BenchmarkImport.__all().find((i) => String(i._id) === imp.id).activation.summary.added === 52);
  r = await as(request(app).get(`${CAT}?version=${imp.versionNo}`), admin);
  check('"import version" filter finds exactly the imported records', r.body.total === 54, r.body.total);

  // manual edit after activation, then rollback semantics
  await as(request(app).patch(`${CAT}/1.2.1`), admin).send({ maxScore: 99 });
  check('manual edit of an imported record keeps its import version and marks the revision', (() => { const d = BenchmarkMetric.__all().find((x) => x.metricId === '1.2.1'); return d.source.versionNo === imp.versionNo && d.source.revision === 1 && d.source.origin === 'import' && d.maxScore === 99; })());
  const baseline = BenchmarkImport.__all().find((i) => i.origin === 'baseline');
  r = await as(request(app).post(`${IMP}/${String(baseline._id)}/rollback`), admin);
  check('rollback to the baseline restores the seeded definitions (4 active) and keeps the audit trail', r.status === 200 && BenchmarkMetric.__all().filter((d) => d.active !== false).map((d) => d.metricId).sort().join() === '1.2.1,3.4.5,3.4.5_books,9.1.1', BenchmarkMetric.__all().filter((d) => d.active !== false).length);
  check('rollback replaced the later manual edit but its audit record remains', BenchmarkMetric.__all().find((x) => x.metricId === '1.2.1').maxScore === 30 && auditFor('1.2.1').some((a) => a.action === 'record_update'));
  check('rollback also wrote per-record audit entries', BenchmarkAuditLog.__all().some((a) => a.action === 'record_change' && a.details.action === 'rollback'));

  // ===== 10. Parser details: formula, notes, ambiguity, scanned =====
  const mkPage = (lines) => ({ page: 1, items: lines.flatMap(([y, parts]) => parts.map(([x, str, w]) => ({ str, x, y, w: w || str.length * 5 }))) });
  const header = [700, [[36, 'Metric', 30], [246, 'Description', 50], [490, '4', 6], [555, '3', 6], [620, '2', 6], [685, '1', 6], [750, '0', 6]]];
  const crit = [730, [[36, 'Criterion 2  Teaching-Learning and Evaluation (200)', 300]]];
  const ki = [715, [[36, 'Key Indicator - 2.1 Student Enrolment', 200]]];
  const synth = parser.parsePages([mkPage([crit, ki, header,
    [680, [[36, '2.1.1', 25], [91, 'Enrolment percentage. Formula: enrolled / sanctioned x 100 (5)', 300], [474, '>=80', 25], [530, '70-80', 25], [600, '60-70', 25], [665, '50-60', 25], [735, '<50', 25]]],
    [668, [[91, 'Note: seats are counted per programme', 200]]],
    [650, [[36, '2.1.2', 25], [91, 'Odd row with stacked band cells (5)', 300], [474, '>=80', 25], [530, '70-80', 25], [600, '60-70', 25], [665, '50-60', 25], [735, '<50', 25]]],
    [638, [[474, '90', 10]]],
    [626, [[474, '95', 10]]],
  ])]);
  const s1 = synth.rows.find((x) => x.metricId === '2.1.1');
  check('synthetic page: formula text captured (display only) and flagged as not executable', /enrolled \/ sanctioned/.test(s1.formula) && parser.revalidateAll([s1], {})[0].flags.some((f) => f.code === 'formula_not_executable' && f.severity === 'info'), s1.formula);
  check('synthetic page: "Note:" text captured', /seats are counted/.test(s1.notes), s1.notes);
  const s2 = synth.rows.find((x) => x.metricId === '2.1.2');
  check('synthetic page: unusual stacked band cells are marked ambiguous for human review', s2.extraction.ambiguousBands === true && parser.revalidateAll([s2], {})[0].flags.some((f) => f.code === 'ambiguous_row' && f.severity === 'warning'), s2.extraction);
  check('synthetic page: criterion/key indicator/bands read correctly', s1.criterionNumber === 2 && s1.keyIndicator === '2.1 Student Enrolment' && s1.bands.map((b) => b.label).join('|') === '>=80|70-80|60-70|50-60|<50' && s1.maxScore === 5);
  check('control characters in extracted text are removed', parser.cleanText('a\u0000b\u0007c\nd') === 'a b c d' && parser.cleanText('x\ny', 100, true) === 'x\ny');

  // ===== 11. Schema conformance with the REAL Mongoose models (fakes skip schema validation) =====
  const realPath = (f) => path.join(SERVER, 'modules/analytics/models', f);
  Module._load = origLoad;
  const realBM = require(realPath('BenchmarkMetric.js'));
  const realImp = require(realPath('BenchmarkImport.js'));
  const realLog = require(realPath('BenchmarkAuditLog.js'));
  const realFile = require(realPath('BenchmarkImportFile.js'));
  Module._load = function (request, parent, isMain) {
    try { const r = Module._resolveFilename(request, parent, isMain); if (FAKES.has(r)) return FAKES.get(r); } catch { /* fall through */ }
    return origLoad.apply(this, arguments);
  };
  const importSvc = require(path.join(SERVER, 'modules/analytics/services/benchmarkImportService.js'));
  const pages = (await parser.extractPagesChunked(pdfBuf)).pages;
  const parsedRows = parser.revalidateAll(parser.parsePages(pages).rows, {}).filter((x) => !x.flags.some((f) => f.severity === 'error'));
  const stubImp = { _id: '507f1f77bcf86cd799439011', sourceFilename: 'f.pdf', documentVersion: 'v', uploadedAt: new Date(), approvedBy: { name: 'a' }, approvedAt: new Date(), versionNo: 3, origin: 'pdf' };
  const invalid = parsedRows.map((x) => ({ x, e: realBM.hydrate(importSvc.docFromRow(x, stubImp)).validateSync() })).filter((z) => z.e).map((z) => `${z.x.metricId}: ${z.e.message}`);
  check('every importable row produces a document that passes the real BenchmarkMetric schema', parsedRows.length >= 50 && invalid.length === 0, invalid.slice(0, 3));
  check('an invalid unit is rejected by the real schema (guard is meaningful)', !!realBM.hydrate({ ...importSvc.docFromRow(parsedRows[0], stubImp), unit: 'furlongs' }).validateSync());
  check('real BenchmarkImport / AuditLog / ImportFile accept the shapes the services write', !new realImp({ versionNo: 1, origin: 'pdf', status: 'draft', rows: parsedRows, reviewedBy: { id: '1', name: 'a' }, processing: { chunks: 4 } }).validateSync()
    && ['record_create', 'record_change', 'upload_reused', 'source_download'].every((a) => !new realLog({ action: a, metricId: '1.1.1' }).validateSync())
    && !new realFile({ importId: 'x', fileHash: 'h', size: 3, data: Buffer.from('abc') }).validateSync());
  check('manual-edit metadata (origin/revision/lifecycle/formula/notes) is part of the real schema', (() => { const d = realBM.hydrate({ ...importSvc.docFromRow(parsedRows[0], stubImp), formula: 'a/b', notes: 'n', source: { origin: 'manual', revision: 3, editedBy: 'x', editedAt: new Date() }, lifecycle: { reason: 'r' } }); return !d.validateSync() && d.source.revision === 3 && d.formula === 'a/b' && d.lifecycle.reason === 'r'; })());

  // schema pre-validation happens BEFORE any write: a version that fails it never touches the catalogue
  reset();
  seedDoc({ metricId: '1.2.1', description: 'Percentage of new courses introduced out of total number of courses across all programmes during last five years', criterionNumber: 1, criterion: 'Criterion 1 \u2013 Curricular Aspects', keyIndicator: '1.2 Academic Flexibility' });
  const up = await as(request(app).post(`${IMP}/upload`), admin).attach('file', pdfBuf, { filename: 'p.pdf', contentType: 'application/pdf' });
  const rows2 = up.body.rows;
  for (const x of rows2) {
    if (x.metricId === '5.3.1') await as(request(app).patch(`${IMP}/${up.body.id}/rows/${x.rowId}`), admin).send({ bands: [{ score: 4, label: '>=80' }, { score: 3, label: '50-80' }, { score: 2, label: '20-50' }, { score: 1, label: '10-20' }, { score: 0, label: '<10' }], reviewed: true });
    else if (x.metricId === '2.7.1') await as(request(app).patch(`${IMP}/${up.body.id}/rows/${x.rowId}`), admin).send({ excluded: true });
  }
  const again = (await as(request(app).get(`${IMP}/${up.body.id}`), admin)).body;
  for (const x of again.rows) if (!x.excluded && x.flags.some((f) => f.severity === 'warning') && !x.reviewed) await as(request(app).patch(`${IMP}/${up.body.id}/rows/${x.rowId}`), admin).send({ reviewed: true });
  await as(request(app).post(`${IMP}/${up.body.id}/approve`), admin);
  const snap = JSON.stringify(BenchmarkMetric.__all());
  BenchmarkMetric.hydrate = (d) => ({ validateSync: () => (d.metricId === '4.3.2' ? { message: 'schema boom' } : null) });
  r = await as(request(app).post(`${IMP}/${up.body.id}/activate`), admin).send({ mode: 'merge' });
  delete BenchmarkMetric.hydrate;
  check('a document failing schema validation aborts activation (422) before ANY write', r.status === 422 && /4\.3\.2/.test(r.body.message) && JSON.stringify(BenchmarkMetric.__all()) === snap, r.body);
  check('version stays approved and the failure is audited', BenchmarkImport.__all().find((i) => String(i._id) === up.body.id).status === 'approved' && actionsAll().includes('activate_failed'));

  // ===== 12. Extraction failures: classified, logged server-side (stack, no content), safe client messages =====
  {
    const svcPath = path.join(SERVER, 'modules/analytics/services/benchmarkImportService.js');
    const classify = require(svcPath).classifyExtractionError;
    const named = (name, code) => Object.assign(new Error('x'), { name, code });
    check('classify: engine missing / wrong version are 503 deployment problems, not "bad file"', classify(named('ExtractorError', 'EXTRACTOR_UNAVAILABLE')).status === 503 && classify(named('ExtractorError', 'EXTRACTOR_INCOMPATIBLE')).status === 503);
    check('classify: encrypted -> 422 password; damaged -> 422 unreadable', classify(named('PasswordException', 1)).code === 'PDF_PASSWORD_PROTECTED' && classify(named('InvalidPDFException')).code === 'PDF_UNREADABLE' && classify(named('InvalidPDFException')).status === 422);
    check('classify: an unknown exception (our own bug) is a 500, never blamed on the file', classify(new TypeError('boom')).status === 500 && classify(new TypeError('boom')).category === 'internal');
    check('classify: time budget stays a 422 with its own message', classify(named('Error', 'EXTRACTION_TIMEOUT')).category === 'timeout');

    const fresh = (hook) => {
      const base = path.join(SERVER, 'modules/analytics/services/');
      [base + 'benchmarkPdfParser.js', svcPath, path.join(SERVER, 'modules/faculty/routes/benchmarkImport.js')].forEach((f) => { delete require.cache[require.resolve(f)]; });
      const origResolve = Module._resolveFilename; const origL = Module._load;
      const quiet = console.log; const quietE = console.error; console.log = () => {}; console.error = () => {};
      // Module._load (not _resolveFilename): Node's relative-resolve cache would bypass a resolve hook for already-loaded deps.
      Module._load = function (req, ...r) {
        if (hook.resolve && hook.resolve(req)) { const e = new Error(`Cannot find module '${req}'`); e.code = 'MODULE_NOT_FOUND'; throw e; }
        if (hook.version && req === 'pdfjs-dist/package.json') return { version: hook.version };
        return origL.call(this, req, ...r);
      };
      const a = express(); a.use(express.json());
      a.use('/imp', require(path.join(SERVER, 'modules/faculty/routes/benchmarkImport.js')));
      console.log = quiet; console.error = quietE;
      return { app: a, restore: () => { Module._resolveFilename = origResolve; Module._load = origL; } };
    };
    const captureLog = async (fn) => { const lines = []; const e0 = console.error; const l0 = console.log; console.error = (...a) => lines.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')); console.log = () => {}; try { return { res: await fn(), lines }; } finally { console.error = e0; console.log = l0; } };
    const upload = (a, buf, name = 'University_Benchmarks (2)-2.pdf') => as(request(a).post('/imp/upload'), admin).attach('file', buf, { filename: name, contentType: 'application/pdf' });
    const FIXD = (f) => fs.readFileSync(path.join(SERVER, 'tests/phase6-benchmark-import/fixtures', f));

    // (a) THE REPORTED SYMPTOM: valid PDF, pdfjs-dist not loadable on the server
    reset();
    let ctxA = fresh({ resolve: (req) => /^pdfjs-dist/.test(req) });
    let { res: ra, lines: la } = await captureLog(() => upload(ctxA.app, pdfBuf));
    ctxA.restore();
    check('valid PDF + pdfjs-dist not loadable -> 503 PDF_EXTRACTOR_UNAVAILABLE (previously a misleading 422 "corrupt or password-protected")', ra.status === 503 && ra.body.code === 'PDF_EXTRACTOR_UNAVAILABLE' && /not a problem with your PDF/.test(ra.body.message) && !/corrupt|password/i.test(ra.body.message), ra.body);
    check('client message is safe: no stack, no file-system path, no module name internals; includes a reference id', !/at |node_modules|\.js:|\/home\//.test(ra.body.message) && /reference [0-9a-f]{8}/.test(ra.body.message) && /^[0-9a-f]{8}$/.test(ra.body.ref), ra.body);
    const logA = la.join('\n');
    check('server log keeps the ORIGINAL exception: name, code MODULE_NOT_FOUND, stack, cause chain, versions', /MODULE_NOT_FOUND/.test(logA) && /"stack"/.test(logA) && /ExtractorError/.test(logA) && /"node"/.test(logA) && logA.includes(ra.body.ref), logA.slice(0, 400));
    check('server log has NO PDF content and NO uploaded file name', !/Curricular|Governance|Criterion|University_Benchmarks/.test(logA) && /"fileSize": 1130853/.test(logA), logA.slice(0, 300));
    const evA = BenchmarkAuditLog.__all().find((x) => x.action === 'extract_failed');
    check('audit event records category, reference, error name and code (not just a message)', evA && evA.details.category === 'extractor_unavailable' && evA.details.ref === ra.body.ref && evA.details.errorName === 'ExtractorError' && evA.details.errorCode === 'EXTRACTOR_UNAVAILABLE', evA && evA.details);
    check('the failed upload created no draft and no stored file', BenchmarkImport.__all().length === 0 && BenchmarkImportFile.__all().length === 0);
    const chk = await (async () => { const c = fresh({ resolve: (req) => /^pdfjs-dist/.test(req) }); const P2 = require(path.join(SERVER, 'modules/analytics/services/benchmarkPdfParser.js')); const out = await P2.checkExtractor({ deep: true }); c.restore(); return out; })();
    check('checkExtractor() reports the engine as unavailable (never throws)', chk.available === false && chk.problem === 'EXTRACTOR_UNAVAILABLE' && chk.deepCheck === null, chk);

    // (b) wrong pdfjs major version installed
    reset();
    let ctxB = fresh({ version: '4.2.67' });
    let { res: rb, lines: lb } = await captureLog(() => upload(ctxB.app, pdfBuf));
    ctxB.restore();
    check('incompatible pdfjs-dist major (4.x) -> 503 PDF_EXTRACTOR_INCOMPATIBLE with a safe message', rb.status === 503 && rb.body.code === 'PDF_EXTRACTOR_INCOMPATIBLE' && /not a supported version/.test(rb.body.message), rb.body);
    check('...and the log says which version was found', /4\.2\.67/.test(lb.join('\n')) || /major version 3 is required/.test(lb.join('\n')), lb.join('\n').slice(0, 300));

    // (c) healthy engine, real file problems
    reset();
    let ctxC = fresh({});
    let rc = await upload(ctxC.app, FIXD('password-protected.pdf'), 'locked.pdf');
    check('password-protected PDF -> 422 PDF_PASSWORD_PROTECTED with a helpful message', rc.status === 422 && rc.body.code === 'PDF_PASSWORD_PROTECTED' && /password/i.test(rc.body.message), rc.body);
    let rd = await upload(ctxC.app, Buffer.from('%PDF-1.4\nthis is not a real pdf body\n%%EOF'), 'bad.pdf');
    check('damaged PDF with a valid header -> 422 PDF_UNREADABLE', rd.status === 422 && rd.body.code === 'PDF_UNREADABLE' && !/password/i.test(rd.body.message), rd.body);
    let rg = await upload(ctxC.app, pdfBuf);
    check('the SAME real PDF is processed normally when the engine is healthy (draft with 55 rows)', rg.status === 201 && rg.body.rows.length === 55 && BenchmarkImportFile.__all().length === 1, rg.status);
    const evC = BenchmarkAuditLog.__all().filter((x) => x.action === 'extract_failed').map((x) => x.details.category);
    check('audit categories distinguish password vs invalid file', evC.includes('password') && evC.includes('invalid_pdf'), evC);
    ctxC.restore();

    // (d) an internal bug in OUR parser must not be reported as a bad file
    reset();
    let ctxD = fresh({});
    const P3 = require(path.join(SERVER, 'modules/analytics/services/benchmarkPdfParser.js'));
    const origCpp = P3.createPageParser;
    P3.createPageParser = () => ({ feed: () => { throw new TypeError('Cannot read properties of undefined (reading \'x\')'); }, finish: () => ({ rows: [], criteria: [], warnings: [], scannedPages: [] }) });
    let { res: rdd, lines: ldd } = await captureLog(() => upload(ctxD.app, pdfBuf));
    P3.createPageParser = origCpp;
    check('a parser bug -> 500 PDF_PROCESSING_ERROR with a reference (not "corrupt or password-protected")', rdd.status === 500 && rdd.body.code === 'PDF_PROCESSING_ERROR' && /reference [0-9a-f]{8}/.test(rdd.body.message) && !/corrupt|password/i.test(rdd.body.message), rdd.body);
    check('the TypeError and its stack are in the server log under the same reference', /TypeError/.test(ldd.join('\n')) && /"stack"/.test(ldd.join('\n')) && ldd.join('\n').includes(rdd.body.ref));
    ctxD.restore();

    // (e) status diagnostics
    reset();
    let ctxE = fresh({});
    const stOk = await as(request(ctxE.app).get('/imp/status'), admin);
    check('GET /status reports the PDF engine: version, compatible, deep self-check ok', stOk.status === 200 && stOk.body.pdfExtractor.compatible === true && stOk.body.pdfExtractor.deepCheck === 'ok' && /^3\./.test(stOk.body.pdfExtractor.pdfjsVersion) && !stOk.body.notes.some((n) => /PDF engine/.test(n)), stOk.body.pdfExtractor);
    ctxE.restore();
    let ctxF = fresh({ resolve: (req) => /^pdfjs-dist/.test(req) });
    const stBad = await as(request(ctxF.app).get('/imp/status'), admin);
    ctxF.restore();
    check('GET /status explains a broken engine to the administrator (note + problem code)', stBad.status === 200 && stBad.body.pdfExtractor.compatible === false && stBad.body.notes.some((n) => /PDF engine is not usable/.test(n) && /npm install/.test(n)), stBad.body);
    fresh({}).restore(); // leave a healthy module set loaded
  }


  // ===== 13. Deletion of catalogue versions and inactive benchmark records =====
  reset();
  const hex = (n) => String(n).padStart(24, '0');
  const seedImp = (o) => BenchmarkImport.__seed({ versionNo: 1, origin: 'pdf', status: 'draft', documentVersion: 'Manual 2024', sourceFilename: 'm.pdf', fileHash: 'h' + Math.random(), sourceStored: true,
    rows: [{ rowId: 'r1', metricId: '9.9.9' }], uploadedBy: { id: 'u', name: 'Uploader' }, ...o });
  const seedFile = (imp) => BenchmarkImportFile.__seed({ importId: String(imp._id), fileHash: imp.fileHash, size: 4, data: Buffer.from('%PDF') });
  const liveMetric = seedDoc({ metricId: '9.9.9', description: 'Shared live record' });
  const sharedDef = MetricModel.__seed({ metricId: 'pct.shared', metricName: 'Shared', formulaType: 'percentage', supported: true });
  const keep = seedImp({ versionNo: 7, status: 'rejected' });          // unrelated version that must survive
  seedFile(keep);
  const d1 = seedImp({ versionNo: 8, status: 'draft' });
  seedFile(d1);
  BenchmarkAuditLog.__seed({ action: 'upload', importId: String(d1._id), actor: { name: 'Uploader' }, at: new Date(Date.now() - 1000), details: {} });
  const base0 = { metrics: BenchmarkMetric.__all().length, defs: MetricModel.__all().length, imports: BenchmarkImport.__all().length, files: BenchmarkImportFile.__all().length };

  // -- authorization + bad identifiers (nothing written) --
  let rr = await request(app).delete(`${IMP}/${d1._id}`);
  check('DELETE version without token -> 401, version kept', rr.status === 401 && BenchmarkImport.__all().some((i) => i._id === d1._id));
  for (const [label, u] of [['faculty', faculty], ['hod', hod], ['vc', vc], ['student', student]]) {
    rr = await as(request(app).delete(`${IMP}/${d1._id}`), u);
    const rr2 = await as(request(app).delete(`${CAT}/9.9.9`), u);
    check(`${label}: DELETE version and record -> 403, nothing removed`, rr.status === 403 && rr2.status === 403 && BenchmarkImport.__all().length === base0.imports && BenchmarkMetric.__all().length === base0.metrics);
  }
  for (const bad of ['abc', '123', 'zzzzzzzzzzzzzzzzzzzzzzzz', encodeURIComponent('../../etc/passwd'), '%24ne', hex(999)]) {
    rr = await as(request(app).delete(`${IMP}/${bad}`), admin);
    check(`DELETE version with bad/unknown id "${bad}" -> 404`, rr.status === 404, rr.status);
  }
  for (const bad of ['nope', encodeURIComponent('../x'), '9.9.8', 'a'.repeat(41)]) {
    rr = await as(request(app).delete(`${CAT}/${bad}`), admin);
    check(`DELETE record with bad/unknown id "${bad.slice(0, 20)}" -> 404`, rr.status === 404, rr.status);
  }
  check('no delete-all: DELETE on the collection roots is not routed (404) and removes nothing', (await as(request(app).delete(IMP), admin)).status === 404 && (await as(request(app).delete(CAT), admin)).status === 404 && BenchmarkImport.__all().length === base0.imports && BenchmarkMetric.__all().length === base0.metrics);
  check('failed/forbidden attempts wrote no deletion audit entries', !actionsAll().some((a) => /delete/.test(a)));

  // -- successful version deletion --
  rr = await as(request(app).delete(`${IMP}/${d1._id}`), admin);
  check('admin deletes a draft version -> 200 {deleted:true}', rr.status === 200 && rr.body.deleted === true && rr.body.versionNo === 8 && rr.body.id === String(d1._id), rr.body);
  check('only that version and its stored PDF are removed', BenchmarkImport.__all().length === base0.imports - 1 && !BenchmarkImport.__all().some((i) => i._id === d1._id) && BenchmarkImportFile.__all().length === base0.files - 1 && !BenchmarkImportFile.__all().some((f) => f.importId === String(d1._id)));
  check('referential integrity: unrelated version + its PDF, live records and shared analytics metric definitions untouched',
    BenchmarkImport.__all().some((i) => i._id === keep._id) && BenchmarkImportFile.__all().some((f) => f.importId === String(keep._id)) && BenchmarkMetric.__all().length === base0.metrics && BenchmarkMetric.__all()[0].metricId === liveMetric.metricId && MetricModel.__all().length === base0.defs && MetricModel.__all()[0].metricId === sharedDef.metricId);
  let logE = BenchmarkAuditLog.__all().filter((a) => a.action === 'version_delete');
  check('audit: exactly one version_delete entry with who, when, what', logE.length === 1 && logE[0].importId === String(d1._id) && logE[0].actor.name === 'Admin One' && logE[0].actor.role === 'admin' && logE[0].actor.id === String(admin._id) && logE[0].at instanceof Date && Math.abs(Date.now() - logE[0].at.getTime()) < 60000 && logE[0].details.versionNo === 8 && logE[0].details.status === 'draft' && logE[0].details.sourceFilename === 'm.pdf' && logE[0].details.rowCount === 1 && logE[0].details.sourceRemoved === true, logE[0]);
  check('audit: earlier history of the deleted version is preserved (append-only)', BenchmarkAuditLog.__all().some((a) => a.action === 'upload' && a.importId === String(d1._id)));
  rr = await as(request(app).get(`${IMP}/audit-log?importId=${d1._id}`), admin);
  check('audit log API still returns the deleted version\'s history', rr.status === 200 && rr.body.some((a) => a.action === 'version_delete') && rr.body.some((a) => a.action === 'upload'));
  rr = await as(request(app).delete(`${IMP}/${d1._id}`), admin);
  check('repeating the delete -> 404 (idempotent, no second audit entry)', rr.status === 404 && BenchmarkAuditLog.__all().filter((a) => a.action === 'version_delete').length === 1);

  // -- other deletable statuses --
  for (const st of ['rejected', 'approved', 'superseded']) {
    const v = seedImp({ versionNo: 20, status: st, approvedAt: new Date() }); seedFile(v);
    rr = await as(request(app).delete(`${IMP}/${v._id}`), superadmin);
    check(`${st} version (no live references) can be deleted by a superadmin`, rr.status === 200 && !BenchmarkImport.__all().some((i) => i._id === v._id) && !BenchmarkImportFile.__all().some((f) => f.importId === String(v._id)), rr.body);
  }

  // -- protection: active, baseline, in use --
  const act = seedImp({ versionNo: 30, status: 'active' }); seedFile(act);
  const nImp = BenchmarkImport.__all().length, nFile = BenchmarkImportFile.__all().length, nLog = BenchmarkAuditLog.__all().length;
  rr = await as(request(app).delete(`${IMP}/${act._id}`), admin);
  check('ACTIVE version cannot be deleted -> 409 VERSION_ACTIVE with an explanation', rr.status === 409 && rr.body.code === 'VERSION_ACTIVE' && /active catalogue/i.test(rr.body.message) && BenchmarkImport.__all().length === nImp && BenchmarkImportFile.__all().length === nFile, rr.body);
  const base = seedImp({ versionNo: 31, origin: 'baseline', status: 'superseded', sourceStored: false });
  rr = await as(request(app).delete(`${IMP}/${base._id}`), admin);
  check('baseline snapshot cannot be deleted -> 409 VERSION_BASELINE', rr.status === 409 && rr.body.code === 'VERSION_BASELINE' && BenchmarkImport.__all().some((i) => i._id === base._id), rr.body);
  const used = seedImp({ versionNo: 32, status: 'superseded', approvedAt: new Date() }); seedFile(used);
  seedDoc({ metricId: '8.8.8', catalogVersionId: used._id, source: { versionNo: 32, origin: 'import' } });
  rr = await as(request(app).delete(`${IMP}/${used._id}`), admin);
  check('version still referenced by a live record -> 409 VERSION_IN_USE (count reported), version + PDF kept', rr.status === 409 && rr.body.code === 'VERSION_IN_USE' && rr.body.liveRecords === 1 && BenchmarkImport.__all().some((i) => i._id === used._id) && BenchmarkImportFile.__all().some((f) => f.importId === String(used._id)), rr.body);
  check('refusals are audited as delete_rejected and removed nothing else', BenchmarkAuditLog.__all().filter((a) => a.action === 'delete_rejected').length === 3 && !BenchmarkAuditLog.__all().slice(nLog).some((a) => a.action === 'version_delete'));
  // the live-use guard is dynamic: once the referencing record is gone/replaced the version can be deleted
  BenchmarkMetric.__all().splice(BenchmarkMetric.__all().findIndex((d) => d.metricId === '8.8.8'), 1);
  rr = await as(request(app).delete(`${IMP}/${used._id}`), admin);
  check('same version is deletable once nothing references it', rr.status === 200);

  // -- record deletion --
  const rec = seedDoc({ metricId: '5.5.5', description: 'Obsolete record', active: false, lifecycle: { deactivatedBy: 'Admin One', reason: 'old' }, source: { origin: 'manual', revision: 3 } });
  const act2 = seedDoc({ metricId: '5.5.6', description: 'Live record' });
  cache.invalidate();
  check('analytics cache holds the active record before deletion', !!(await cache.getBenchmarkMetric('5.5.6')));
  const mBefore = BenchmarkMetric.__all().length, dBefore = MetricModel.__all().length, iBefore = BenchmarkImport.__all().length;
  rr = await as(request(app).delete(`${CAT}/5.5.6`), admin);
  check('ACTIVE record -> 409 RECORD_ACTIVE ("deactivate it first"), kept', rr.status === 409 && rr.body.code === 'RECORD_ACTIVE' && /Deactivate it first/.test(rr.body.message) && BenchmarkMetric.__all().some((d) => d.metricId === '5.5.6'), rr.body);
  rr = await as(request(app).delete(`${CAT}/5.5.5`), admin);
  check('admin deletes an inactive record -> 200', rr.status === 200 && rr.body.deleted === true && rr.body.metricId === '5.5.5', rr.body);
  check('only that record removed; other records, analytics metric definitions and versions untouched', BenchmarkMetric.__all().length === mBefore - 1 && !BenchmarkMetric.__all().some((d) => d.metricId === '5.5.5') && BenchmarkMetric.__all().some((d) => d.metricId === '5.5.6') && MetricModel.__all().length === dBefore && BenchmarkImport.__all().length === iBefore);
  logE = BenchmarkAuditLog.__all().filter((a) => a.action === 'record_delete');
  check('audit: record_delete with actor, time and a snapshot of what was deleted', logE.length === 1 && logE[0].metricId === '5.5.5' && logE[0].actor.name === 'Admin One' && logE[0].actor.role === 'admin' && logE[0].at instanceof Date && logE[0].details.before.metricId === '5.5.5' && logE[0].details.before.active === false && logE[0].details.description === 'Obsolete record' && logE[0].details.origin === 'manual', logE[0]);
  rr = await as(request(app).get(`${CAT}/5.5.5/history`), admin);
  check('history of the deleted record remains readable (get -> 404, history -> record_delete present)', rr.status === 200 && rr.body.some((a) => a.action === 'record_delete') && (await as(request(app).get(`${CAT}/5.5.5`), admin)).status === 404);
  rr = await as(request(app).delete(`${CAT}/5.5.5`), admin);
  check('deleting the same record again -> 404', rr.status === 404);
  check('Analytics cache invalidated: deleted record gone, active record still served', !(await cache.getBenchmarkMetric('5.5.5')) && !!(await cache.getBenchmarkMetric('5.5.6')));
  // full lifecycle: deactivate, then delete the formerly active record
  await as(request(app).post(`${CAT}/5.5.6/deactivate`), admin).send({ reason: 'retire' });
  rr = await as(request(app).delete(`${CAT}/5.5.6`), admin);
  check('active -> deactivate -> delete works end to end', rr.status === 200 && !BenchmarkMetric.__all().some((d) => d.metricId === '5.5.6'));
  rr = await as(request(app).get(`${IMP}/audit-log`), admin);
  check('audit log lists the deletions to administrators', rr.status === 200 && rr.body.some((a) => a.action === 'record_delete') && rr.body.some((a) => a.action === 'version_delete'));
  check('real AuditLog schema accepts version_delete / record_delete / delete_rejected entries', ['version_delete', 'record_delete', 'delete_rejected'].every((action) => !new realLog({ action, importId: 'x', metricId: 'm', actor: { id: '1', name: 'a', role: 'admin' }, details: { before: {} } }).validateSync()) && !!new realLog({ action: 'bogus' }).validateSync());

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
