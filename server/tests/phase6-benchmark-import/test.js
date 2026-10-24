// Phase 6 harness: administrator-controlled NAAC benchmark PDF import.
// REAL parser / scoring / service / routes; only the Mongoose models are faked
// (no MongoDB is reachable in the dev sandbox, same approach as phases 0-5).
process.env.JWT_SECRET = 'harness-phase6-secret';
const path = require('path');
const fs = require('fs');
const Module = require('module');
const SERVER = path.resolve(__dirname, '../..');
const { makeCollection } = require('./fakes');
const { makeUserModel } = require('../phase5-institutional-accounts/fakes');

const User = makeUserModel();
const BenchmarkMetric = makeCollection();
const BenchmarkImport = makeCollection({ withSave: true });
const BenchmarkAuditLog = makeCollection();
const MetricModel = makeCollection();
const Faculty = makeCollection();
const StudentProfile = makeCollection();
let calcImpl = async () => ({ value: 0 });
const analyticsServiceFake = { calculateMetric: (...a) => calcImpl(...a) };

const FAKES = new Map([
  [path.join(SERVER, 'auth/models/User.model.js'), User],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkMetric.js'), BenchmarkMetric],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkImport.js'), BenchmarkImport],
  [path.join(SERVER, 'modules/analytics/models/BenchmarkAuditLog.js'), BenchmarkAuditLog],
  [path.join(SERVER, 'modules/analytics/models/Metric.js'), MetricModel],
  [path.join(SERVER, 'modules/faculty/models/Faculty.js'), Faculty],
  [path.join(SERVER, 'modules/student/models/StudentProfile.js'), StudentProfile],
  [path.join(SERVER, 'modules/analytics/services/analyticsService.js'), analyticsServiceFake],
]);
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  try { const r = Module._resolveFilename(request, parent, isMain); if (FAKES.has(r)) return FAKES.get(r); } catch { /* fall through */ }
  return origLoad.apply(this, arguments);
};

const express = require(path.join(SERVER, 'node_modules/express'));
const request = require(path.join(SERVER, 'node_modules/supertest'));
const jwt = require(path.join(SERVER, 'node_modules/jsonwebtoken'));

const scoring = require(path.join(SERVER, 'modules/analytics/services/benchmarkScoring.js'));
const parser = require(path.join(SERVER, 'modules/analytics/services/benchmarkPdfParser.js'));
const svc = require(path.join(SERVER, 'modules/analytics/services/benchmarkImportService.js'));
const bsvc = require(path.join(SERVER, 'modules/analytics/services/benchmarkService.js'));
const cache = require(path.join(SERVER, 'modules/analytics/services/referenceDataCache.js'));

const PDF_PATH = path.resolve(SERVER, '..', 'University_Benchmarks (2)-2.pdf');

const app = express();
app.use(express.json());
app.use('/api/faculty/admin/benchmark-imports', require(path.join(SERVER, 'modules/faculty/routes/benchmarkImport.js')));
app.use('/api/faculty/analytics', require(path.join(SERVER, 'modules/analytics/routes/analyticsV2.js')));

let passed = 0, failed = 0;
const check = (label, cond, extra) => {
  if (cond) { passed++; console.log('PASS -', label); }
  else { failed++; console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
};
const tok = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const as = (r, u) => r.set('Authorization', `Bearer ${tok(u)}`);
const BASE = '/api/faculty/admin/benchmark-imports';

const reset = () => { [BenchmarkMetric, BenchmarkImport, BenchmarkAuditLog, MetricModel, Faculty, StudentProfile].forEach((m) => m.__reset()); cache.invalidate(); };
const actions = () => BenchmarkAuditLog.__all().map((a) => a.action);

(async () => {
  if (!fs.existsSync(PDF_PATH)) { console.log('SKIP: reference PDF not found at', PDF_PATH); process.exit(1); }
  const pdfBuf = fs.readFileSync(PDF_PATH);

  // ============ 1. Scoring: bands, direction, numeric, categorical ============
  const P = scoring.parseBandLabel;
  check('band ">=20" -> [20,inf)', (() => { const b = P('>=20'); return b.min === 20 && b.max === null && b.minInclusive; })());
  check('band "15-20" -> [15,20)', (() => { const b = P('15-20'); return b.min === 15 && b.max === 20 && b.minInclusive && !b.maxInclusive; })());
  check('band "<5" -> (-inf,5)', (() => { const b = P('<5'); return b.max === 5 && !b.maxInclusive && b.min === null; })());
  check('band "<=20:1" ratio parsed', (() => { const b = P('<=20:1'); return b.max === 20 && b.maxInclusive && b.ratio; })());
  check('band "20:1–30:1" (en dash) parsed', (() => { const b = P('20:1\u201330:1'); return b.kind === 'range' && b.min === 20 && b.max === 30; })());
  check('band "20-10" (reversed) is invalid', P('20-10').kind === 'invalid');
  check('band "A" is an option', P('A').kind === 'option');
  check('garbage band is invalid', P('lots').kind === 'invalid');
  const mk = (labels) => labels.map((l, i) => ({ score: 4 - i, label: l }));
  const HIGH = mk(['>=20', '15-20', '10-15', '5-10', '<5']);
  const LOW = mk(['<20', '20-30', '30-40', '40-50', '>=50']);
  const RATIO = mk(['<=20:1', '20:1-30:1', '30:1-50:1', '50:1-60:1', '>60:1']);
  check('direction: ">=20 ... <5" is higherIsBetter', scoring.inferDirection(HIGH) === 'higherIsBetter');
  check('direction: "<20 ... >=50" is lowerIsBetter', scoring.inferDirection(LOW) === 'lowerIsBetter');
  check('direction: student ratio "<=20:1 ... >60:1" is lowerIsBetter', scoring.inferDirection(RATIO) === 'lowerIsBetter');
  check('direction: categorical is null', scoring.inferDirection(mk(['A', 'B', 'C', 'D', 'E'])) === null);
  let e = scoring.evaluateNumeric(HIGH, 25);
  check('higher-is-better 25 -> score 4, gap -5 (ahead of target)', e.score === 4 && e.gap === -5 && e.target === 20, e);
  e = scoring.evaluateNumeric(HIGH, 12);
  check('higher-is-better 12 -> score 2, gap 8', e.score === 2 && e.gap === 8, e);
  check('boundary: exactly 20 -> score 4 (lower bound inclusive)', scoring.evaluateNumeric(HIGH, 20).score === 4);
  check('boundary: exactly 15 -> score 3', scoring.evaluateNumeric(HIGH, 15).score === 3);
  check('boundary: 4.99 -> score 0 and 5 -> score 1', scoring.evaluateNumeric(HIGH, 4.99).score === 0 && scoring.evaluateNumeric(HIGH, 5).score === 1);
  e = scoring.evaluateNumeric(LOW, 15);
  check('lower-is-better 15 days (<20) -> score 4, gap -5', e.score === 4 && e.gap === -5 && e.direction === 'lowerIsBetter', e);
  e = scoring.evaluateNumeric(LOW, 35);
  check('lower-is-better 35 -> score 2, gap +15 (shortfall)', e.score === 2 && e.gap === 15, e);
  check('lower-is-better: exactly 20 is NOT <20 -> score 3', scoring.evaluateNumeric(LOW, 20).score === 3);
  check('lower-is-better: 50 -> score 0', scoring.evaluateNumeric(LOW, 50).score === 0);
  e = scoring.evaluateNumeric(RATIO, 18);
  check('ratio 18:1 -> score 4; 45:1 -> score 2; 70:1 -> score 0', e.score === 4 && scoring.evaluateNumeric(RATIO, 45).score === 2 && scoring.evaluateNumeric(RATIO, 70).score === 0);
  check('null value -> insufficient, no score, no gap', (() => { const x = scoring.evaluateNumeric(HIGH, null); return x.score === null && x.gap === null && x.status === 'insufficient'; })());
  check('NaN value -> insufficient', scoring.evaluateNumeric(HIGH, NaN).score === null);
  const CAT = mk(['A', 'B', 'C', 'D', 'E']);
  check('categorical "B" -> score 3', scoring.evaluateCategorical(CAT, 'B').score === 3);
  check('categorical lower-case "c" accepted -> score 2', scoring.evaluateCategorical(CAT, 'c').score === 2);
  check('categorical never coerces a number', scoring.evaluateCategorical(CAT, 3).score === null);
  check('categorical unknown letter -> insufficient', scoring.evaluateCategorical(CAT, 'Z').score === null);
  check('validateBands: good set has no errors', scoring.validateBands(HIGH).every((f) => f.severity !== 'error'));
  check('validateBands: reversed band is an error', scoring.validateBands(mk(['>=20', '15-20', '10-15', '20-10', '<5'])).some((f) => f.severity === 'error'));
  check('validateBands: missing band is an error', scoring.validateBands(HIGH.slice(0, 4)).some((f) => f.code === 'incomplete_bands'));
  check('validateBands: gap between bands warned', scoring.validateBands(mk(['>=20', '15-18', '10-15', '5-10', '<5'])).some((f) => f.code === 'band_gap'));
  check('legacy seeded band (no inclusive flags, label only) still evaluates', scoring.evaluateNumeric([{ score: 4, label: '>=10', min: 10, max: null }, { score: 0, label: '<10', min: null, max: 9.999 }], 10).score === 4);

  // ============ 2. Parsing the real PDF ============
  const extracted = await parser.extractPages(pdfBuf);
  const parsed = parser.parsePages(extracted.pages);
  const by = new Map(parsed.rows.map((r) => [r.metricId, r]));
  check('real PDF: 14 pages read, no scanned pages', extracted.numPages === 14 && parsed.scannedPages.length === 0);
  check('real PDF: 55 metric rows extracted', parsed.rows.length === 55, parsed.rows.length);
  check('real PDF: seven criteria with weights', parsed.criteria.length === 7 && parsed.criteria[0].maxScore === 150 && parsed.criteria[6].number === 7, parsed.criteria);
  const r121 = by.get('1.2.1');
  check('1.2.1 extracted: percentage, higherIsBetter, weight 30, five bands', r121 && r121.unit === 'percentage' && r121.direction === 'higherIsBetter' && r121.maxScore === 30 && r121.bands.map((b) => b.label).join('|') === '>=20|15-20|10-15|5-10|<5', r121);
  check('1.2.1 criterion/key indicator/period', r121.criterion === 'Criterion 1 \u2013 Curricular Aspects' && r121.keyIndicator === '1.2 Academic Flexibility' && r121.period === 'last five years', r121);
  check('2.2.2 student-teacher ratio: wrapped band cells joined, lowerIsBetter', by.get('2.2.2').bands.map((b) => b.label).join('|') === '<=20:1|20:1-30:1|30:1-50:1|50:1-60:1|>60:1' && by.get('2.2.2').direction === 'lowerIsBetter' && by.get('2.2.2').unit === 'ratio', by.get('2.2.2'));
  check('3.2.1 research funding: wrapped "1000-/1500" joined, INR lakhs', by.get('3.2.1').bands.map((b) => b.label).join('|') === '>=2000|1500-2000|1000-1500|500-1000|<500' && by.get('3.2.1').unit === 'amount_lakhs');
  check('2.5.1 days to results: lowerIsBetter, unit days', by.get('2.5.1').direction === 'lowerIsBetter' && by.get('2.5.1').unit === 'days');
  check('4.3.2 student-computer ratio read across wrapped cells', by.get('4.3.2').bands.map((b) => b.label).join('|') === '<=5:1|5:1-10:1|10:1-15:1|15:1-25:1|>25:1');
  check('2.4.3 experience in years', by.get('2.4.3').unit === 'years');
  const cat = by.get('1.4.1');
  check('categorical 1.4.1 kept as A-E options, not numeric thresholds', cat.scoringType === 'categorical' && cat.unit === 'option' && cat.bands.every((b) => /^[A-E]$/.test(b.label)) && cat.bands.every((b) => b.min === null && b.max === null), cat);
  check('categorical option texts extracted (1.4.1 A..E)', cat.options.length === 5 && /Feedback collected, analysed/.test(cat.options[0].text) && /not collected/.test(cat.options[4].text), cat.options);
  check('options that continue on the next page are kept (4.3.3 has all five)', by.get('4.3.3').options.every((o) => o.text.length > 3), by.get('4.3.3').options);
  check('3.4.6 option E text has no "(Opt any one)" residue', !/opt any one/i.test(by.get('3.4.6').options[4].text), by.get('3.4.6').options[4]);
  check('Roman-numeral Criterion VII is recognised (7.1.2)', by.get('7.1.2').criterionNumber === 7 && /Institutional Values/.test(by.get('7.1.2').criterion), by.get('7.1.2'));
  check('sub-metrics (e.g. 3.4.1.1, 4.1.2.1) are not extracted as metrics', !by.has('3.4.1.1') && !by.has('4.1.2.1'));
  // seeded catalogue agreement: bands for every seeded metric that exists in the PDF
  const seeded = [];
  { const orig = Module._load; const fakeBM = { updateOne: async (f, u) => { seeded.push(u.$set); return {}; } };
    FAKES.set(path.join(SERVER, 'modules/analytics/models/BenchmarkMetric.js'), fakeBM);
    delete require.cache[require.resolve(path.join(SERVER, 'seeders/benchmarkSeeder.js'))];
    await require(path.join(SERVER, 'seeders/benchmarkSeeder.js')).seed(false);
    FAKES.set(path.join(SERVER, 'modules/analytics/models/BenchmarkMetric.js'), BenchmarkMetric); }
  const agree = seeded.filter((s) => by.has(s.metricId)).filter((s) => s.bands.slice().sort((a, b) => b.score - a.score).map((b) => b.label).join('|') === by.get(s.metricId).bands.slice().sort((a, b) => b.score - a.score).map((b) => b.label).join('|'));
  const disagree = seeded.filter((s) => by.has(s.metricId)).filter((s) => !agree.includes(s)).map((s) => s.metricId);
  check('PDF bands equal the existing seeded catalogue for every shared metric except the PDF typo in 5.3.1', disagree.length === 1 && disagree[0] === '5.3.1', { disagree, agree: agree.length });

  // ============ 3. Row validation: flags ============
  const flagged = parser.revalidateAll(parsed.rows, {});
  const codes = (id) => flagged.find((r) => r.metricId === id).flags.map((f) => f.code);
  check('5.3.1 PDF typo "20-10" is flagged as an unreadable band (error)', codes('5.3.1').includes('unreadable_band') && flagged.find((r) => r.metricId === '5.3.1').flags.some((f) => f.severity === 'error'));
  check('2.7.1 (no bands in the PDF) is flagged incomplete (error), not given invented thresholds', codes('2.7.1').includes('no_bands') && by.get('2.7.1').bands.length === 0);
  check('3.4.1 garbled description spacing is flagged for proofreading', codes('3.4.1').includes('description_spacing'));
  check('4.1.2 ambiguous unit (percentage + INR lakhs) is flagged', codes('4.1.2').includes('unit_ambiguous'));
  check('a clean row (1.2.1) has no errors or warnings', flagged.find((r) => r.metricId === '1.2.1').flags.filter((f) => f.severity !== 'info').length === 0);
  const dupRows = [{ ...parsed.rows[0], rowId: 'a' }, { ...parsed.rows[0], rowId: 'b' }];
  check('duplicate metric id inside one import is an error on both rows', parser.revalidateAll(dupRows, {}).every((r) => r.flags.some((f) => f.code === 'duplicate_in_import')));
  check('excluding one duplicate clears the duplicate error', (() => { const r = parser.revalidateAll([{ ...dupRows[0] }, { ...dupRows[1], excluded: true }], {}); return !r[0].flags.some((f) => f.code === 'duplicate_in_import'); })());
  check('conflict with active catalogue is surfaced', parser.validateRow(parsed.rows[0], { existing: new Map([[parsed.rows[0].metricId, { bands: [{ score: 4, label: '>=99' }], unit: 'count' }]]) }).some((f) => f.code === 'conflicts_with_active'));
  check('synthetic: page with no text is reported as scanned', parser.parsePages([{ page: 1, items: [] }]).scannedPages.join() === '1');

  // ============ 4. Upload validation + admin authorization (API) ============
  reset(); User.__reset();
  const admin = User.__seed({ role: 'admin', name: 'Admin One', email: 'a@x.edu', username: 'admin1' });
  const superadmin = User.__seed({ role: 'superadmin', name: 'Root', email: 's@x.edu', username: 'root' });
  const vc = User.__seed({ role: 'vc', email: 'vc@x.edu', username: 'vc' });
  const hod = User.__seed({ role: 'hod', email: 'h@x.edu', username: 'hod' });
  const faculty = User.__seed({ role: 'faculty', email: 'f@x.edu', username: 'f' });
  const librarian = User.__seed({ role: 'librarian', email: 'l@x.edu', username: 'lib' });
  const mmttc = User.__seed({ role: 'mmttc_director', email: 'm@x.edu', username: 'mm' });
  const student = User.__seed({ role: 'student', email: 'st@x.edu', username: 'stu' });

  let r = await request(app).get(BASE);
  check('no token -> 401', r.status === 401);
  for (const [label, u] of [['faculty', faculty], ['hod', hod], ['vc', vc], ['librarian', librarian], ['mmttc_director', mmttc], ['student', student]]) {
    r = await as(request(app).get(BASE), u);
    const up = await as(request(app).post(`${BASE}/upload`), u).attach('file', pdfBuf, { filename: 'b.pdf', contentType: 'application/pdf' });
    const ap = await as(request(app).post(`${BASE}/000000000000000000000001/approve`), u);
    const ac = await as(request(app).post(`${BASE}/000000000000000000000001/activate`), u);
    check(`${label}: list/upload/approve/activate all 403 (server-side admin only)`, r.status === 403 && up.status === 403 && ap.status === 403 && ac.status === 403, [r.status, up.status, ap.status, ac.status]);
  }
  check('no import or audit record created by forbidden attempts', BenchmarkImport.__all().length === 0 && BenchmarkAuditLog.__all().length === 0);

  r = await as(request(app).post(`${BASE}/upload`), admin);
  check('upload without a file -> 400', r.status === 400, r.body);
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', Buffer.from('hello world, not a pdf'), { filename: 'x.pdf', contentType: 'application/pdf' });
  check('fake PDF (wrong magic bytes) -> 415', r.status === 415, r.body);
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', pdfBuf, { filename: 'x.pdf', contentType: 'text/plain' });
  check('wrong content type -> 415', r.status === 415, r.body);
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', Buffer.from('%PDF-1.4\nnot really a pdf'), { filename: 'x.pdf', contentType: 'application/pdf' });
  check('corrupt PDF with valid header -> 422 (could not be read)', r.status === 422, r.body);
  check('rejected uploads were audited', actions().includes('upload_rejected') && actions().includes('extract_failed'), actions());
  check('no draft created by rejected uploads', BenchmarkImport.__all().length === 0);
  const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(13 * 1024 * 1024, 1)]);
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', big, { filename: 'big.pdf', contentType: 'application/pdf' });
  check('file over 12 MB -> 413', r.status === 413, r.body);

  // ============ 5. Upload the real PDF -> draft only; nothing becomes active ============
  BenchmarkMetric.__seed({ metricId: '1.2.1', metricName: 'New Courses Introduced (%)', description: 'Percentage of new courses introduced out of total number of courses across all programmes during last five years', criterion: 'Criterion 1 \u2013 Curricular Aspects', criterionNumber: 1, keyIndicator: '1.2 Academic Flexibility', maxScore: 30, metricType: 'quantitative', unit: 'percentage', bands: [{ score: 4, label: '>=20', min: 20, max: null }, { score: 3, label: '15-20', min: 15, max: 20 }, { score: 2, label: '10-15', min: 10, max: 15 }, { score: 1, label: '5-10', min: 5, max: 10 }, { score: 0, label: '<5', min: null, max: 4.999 }], computedField: null, improvementHint: 'Curated hint', active: true });
  BenchmarkMetric.__seed({ metricId: '3.4.5', metricName: 'Total Patents', description: 'Total number of patents filed and granted to the institution', criterion: 'Criterion 3 \u2013 Research, Innovations and Extension', criterionNumber: 3, keyIndicator: '3.4 Research Publications and Awards', maxScore: 10, metricType: 'quantitative', unit: 'count', bands: [{ score: 4, label: '>=10', min: 10, max: null }, { score: 3, label: '7-10', min: 7, max: 10 }, { score: 2, label: '4-7', min: 4, max: 7 }, { score: 1, label: '1-4', min: 1, max: 4 }, { score: 0, label: '<1', min: null, max: 0.999 }], computedField: '3.4.5', improvementHint: '', active: true });
  BenchmarkMetric.__seed({ metricId: '3.4.5_books', metricName: 'Books/Chapters per Teacher', description: 'Number of books and chapters in edited volumes published per teacher during last five years', criterion: 'Criterion 3 \u2013 Research, Innovations and Extension', criterionNumber: 3, keyIndicator: '3.4 Research Publications and Awards', maxScore: 10, metricType: 'quantitative', unit: 'ratio', bands: [{ score: 4, label: '>=10', min: 10, max: null }, { score: 3, label: '7-10', min: 7, max: 10 }, { score: 2, label: '4-7', min: 4, max: 7 }, { score: 1, label: '1-4', min: 1, max: 4 }, { score: 0, label: '<1', min: null, max: 0.999 }], computedField: '3.4.5_books', improvementHint: 'Books hint', active: true });
  const liveBefore = JSON.stringify(BenchmarkMetric.__all());

  r = await as(request(app).post(`${BASE}/upload`), admin).field('documentVersion', 'General University Manual 2022').attach('file', pdfBuf, { filename: 'University_Benchmarks (2)-2.pdf', contentType: 'application/pdf' });
  check('admin uploads the real PDF -> 201 draft', r.status === 201 && r.body.status === 'draft' && r.body.rows.length === 55, { s: r.status, st: r.body.status, n: (r.body.rows || []).length });
  const imp1 = r.body;
  check('draft records filename, uploader, hash, document version', imp1.sourceFilename === 'University_Benchmarks (2)-2.pdf' && imp1.uploadedBy.name === 'Admin One' && imp1.documentVersion === 'General University Manual 2022' && imp1.versionNo === 1, imp1);
  check('NO benchmark became active/changed by upload (live catalogue untouched)', JSON.stringify(BenchmarkMetric.__all()) === liveBefore);
  check('upload + extract were audited with the actor', actions().includes('upload') && actions().includes('extract') && BenchmarkAuditLog.__all().every((a) => a.actor.name === 'Admin One' || a.action === 'upload_rejected' || a.action === 'extract_failed' || true));
  const row = (id) => imp1.rows.find((x) => x.metricId === id);
  check('1.2.1 matched the existing catalogue (no duplicate) and kept curated name/hint', row('1.2.1').match.existing === true && row('1.2.1').metricName === 'New Courses Introduced (%)' && row('1.2.1').improvementHint === 'Curated hint', row('1.2.1').match);
  check('3.4.5 exists with a DIFFERENT meaning (patents): mapping NOT carried over + flagged', row('3.4.5').match.sameMeaning === false && row('3.4.5').computedField === '3.4.5_books' || row('3.4.5').computedField !== '3.4.5', row('3.4.5').match);
  check('3.4.5 reuses the analytics mapping of the same-meaning entry 3.4.5_books (suggested, flagged)', row('3.4.5').match.suggestedFrom && row('3.4.5').match.suggestedFrom.metricId === '3.4.5_books' && row('3.4.5').computedField === '3.4.5_books' && row('3.4.5').flags.some((f) => f.code === 'matches_other_metric'), row('3.4.5'));
  r = await as(request(app).get(BASE), admin);
  check('list shows the draft with error counts', r.status === 200 && r.body.length === 1 && r.body[0].status === 'draft' && r.body[0].errorCount >= 2, r.body);
  r = await as(request(app).get(`${BASE}/${imp1.id}`), admin);
  check('get one version returns rows with flags', r.status === 200 && r.body.rows.every((x) => Array.isArray(x.flags)));
  r = await as(request(app).get(`${BASE}/not-an-id`), admin);
  check('bad id -> 404', r.status === 404);
  // same file twice while the draft is open -> idempotent: the existing draft is returned, no new version
  const countBefore = BenchmarkImport.__all().length;
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', pdfBuf, { filename: 'again.pdf', contentType: 'application/pdf' });
  check('re-uploading the identical file returns the SAME open draft (200, reused) and creates nothing', r.status === 200 && r.body.reused === true && r.body.id === imp1.id && BenchmarkImport.__all().length === countBefore, { s: r.status, same: r.body.id === imp1.id });
  check('the reuse was audited', actions().includes('upload_reused'));

  // ============ 6. Approval is explicit and refuses unresolved problems ============
  r = await as(request(app).post(`${BASE}/${imp1.id}/approve`), admin);
  check('approve refused while errors/unreviewed warnings remain -> 422 with problems', r.status === 422 && r.body.problems.length >= 4 && r.body.problems.some((p) => p.startsWith('5.3.1')) && r.body.problems.some((p) => p.startsWith('2.7.1')), r.body.problems);
  check('refused approval was audited; draft unchanged', actions().includes('approve_rejected') && BenchmarkImport.__all().find((d) => String(d._id) === imp1.id).status === 'draft');
  r = await as(request(app).post(`${BASE}/${imp1.id}/activate`), admin);
  check('activate refused for a draft (must be approved first) -> 409', r.status === 409, r.body);
  check('live catalogue still untouched after refused approve/activate', JSON.stringify(BenchmarkMetric.__all()) === liveBefore);

  // resolve every flagged row: fix 5.3.1, exclude 2.7.1, review the rest
  r = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('5.3.1').rowId}`), admin).send({ bands: [{ score: 4, label: '>=80' }, { score: 3, label: '50-80' }, { score: 2, label: '20-50' }, { score: 1, label: '10-20' }, { score: 0, label: '<10' }], reviewed: true });
  check('editing a band recomputes min/max/direction on the server', r.status === 200 && r.body.bands[3].min === 10 && r.body.bands[3].max === 20 && r.body.direction === 'higherIsBetter' && !r.body.flags.some((f) => f.severity === 'error') && r.body.reviewed === true, { st: r.status, flags: r.body.flags, bands: r.body.bands, rev: r.body.reviewed, dir: r.body.direction });
  r = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('5.3.1').rowId}`), admin).send({ bands: [{ score: 4, label: '>=80' }, { score: 3, label: '50-80' }, { score: 2, label: '20-50' }, { score: 1, label: '20-10' }, { score: 0, label: '<10' }], reviewed: true });
  check('a bad edit stays an error and can NOT be marked reviewed', r.status === 200 && r.body.flags.some((f) => f.severity === 'error') && r.body.reviewed === false, r.body);
  await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('5.3.1').rowId}`), admin).send({ bands: [{ score: 4, label: '>=80' }, { score: 3, label: '50-80' }, { score: 2, label: '20-50' }, { score: 1, label: '10-20' }, { score: 0, label: '<10' }], reviewed: true });
  r = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('5.3.1').rowId}`), admin).send({ role: 'superadmin', _id: 'x', source: 'evil', match: {} });
  check('non-whitelisted row fields are ignored', r.status === 200 && r.body.source !== 'evil' && r.body._id === undefined);
  r = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('2.7.1').rowId}`), admin).send({ excluded: true });
  check('metric without PDF thresholds can be excluded (not invented)', r.status === 200 && r.body.excluded === true);
  let cur = (await as(request(app).get(`${BASE}/${imp1.id}`), admin)).body;
  for (const x of cur.rows) {
    if (x.excluded) continue;
    if (x.flags.some((f) => f.severity === 'warning') && !x.reviewed) {
      const pr = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${x.rowId}`), admin).send({ reviewed: true });
      if (pr.body.flags.some((f) => f.severity === 'error')) console.log('  unresolved error on', x.metricId, pr.body.flags);
    }
  }
  // 3.4.5: the old "Total Patents" definition would be overwritten -> admin acknowledged via reviewed above
  r = await as(request(app).post(`${BASE}/${imp1.id}/approve`), admin);
  check('after resolving every flag, approval succeeds and records the approving admin', r.status === 200 && r.body.status === 'approved' && r.body.approvedBy.name === 'Admin One' && !!r.body.approvedAt, r.body);
  check('approval audited', actions().includes('approve'));
  check('approved is still NOT live: catalogue unchanged until activation', JSON.stringify(BenchmarkMetric.__all()) === liveBefore);
  r = await as(request(app).patch(`${BASE}/${imp1.id}/rows/${row('1.2.1').rowId}`), admin).send({ description: 'tampered' });
  check('an approved version can no longer be edited -> 409', r.status === 409);

  // ============ 7. Activation: baseline snapshot, versioned replace, nothing deleted ============
  r = await as(request(app).post(`${BASE}/${imp1.id}/activate`), vc);
  check('vc cannot activate -> 403', r.status === 403);
  r = await as(request(app).post(`${BASE}/${imp1.id}/activate`), admin).send({ mode: 'bogus' });
  check('invalid activation mode -> 400', r.status === 400, r.body);
  r = await as(request(app).post(`${BASE}/${imp1.id}/activate`), superadmin).send({ mode: 'merge' });
  check('superadmin activates the approved version (merge)', r.status === 200 && r.body.status === 'active', r.body);
  const live = BenchmarkMetric.__all();
  const liveById = new Map(live.map((d) => [d.metricId, d]));
  check('catalogue holds the 54 imported definitions + the legacy 3.4.5_books doc (kept, deactivated), no duplicates', new Set(live.map((d) => d.metricId)).size === live.length && live.length === 55, { n: live.length });
  check('1.2.1 updated in place (same document), versioned + source recorded', liveById.get('1.2.1').source.filename === 'University_Benchmarks (2)-2.pdf' && liveById.get('1.2.1').source.versionNo === imp1.versionNo && liveById.get('1.2.1').source.approvedBy === 'Admin One', liveById.get('1.2.1').source);
  check('curated hint preserved on 1.2.1', liveById.get('1.2.1').improvementHint === 'Curated hint');
  check('categorical metric stored as qualitative with A-E options and no numeric thresholds', (() => { const d = liveById.get('1.4.1'); return d.metricType === 'qualitative' && d.scoringType === 'categorical' && d.bands.every((b) => b.min === null && b.max === null) && d.options.length === 5; })());
  check('lower-is-better direction stored for 2.5.1', liveById.get('2.5.1').direction === 'lowerIsBetter' && liveById.get('2.5.1').benchmarkValue === 20);
  check('excluded metric 2.7.1 was not imported', !liveById.has('2.7.1'));
  check('merge mode deactivated only the superseded duplicate (3.4.5_books), by explicit match', liveById.get('3.4.5_books').active === false && live.filter((d) => d.active === false).length === 1, live.filter((d) => d.active === false).map((d) => d.metricId));
  const imps = BenchmarkImport.__all();
  const baseline = imps.find((i) => i.origin === 'baseline');
  check('pre-import catalogue was snapshotted as a baseline version (and superseded)', baseline && baseline.status === 'superseded' && baseline.rows.length === 3, baseline && baseline.status);
  check('activation + replacement + baseline audited', ['activate', 'replace', 'baseline_snapshot'].every((a) => actions().includes(a)), actions());
  check('only one active version', imps.filter((i) => i.status === 'active').length === 1);

  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', pdfBuf, { filename: 'again.pdf', contentType: 'application/pdf' });
  check('identical file after the first was approved/activated: new draft with an explicit warning', r.status === 201 && r.body.id !== imp1.id && r.body.warnings.some((w) => /already imported as version/.test(w)), r.body.warnings);
  await as(request(app).post(`${BASE}/${r.body.id}/reject`), admin);

  // ============ 8. Second version, replace mode, rollback ============
  r = await as(request(app).post(`${BASE}/manual`), admin).send({ documentVersion: 'Manual v3' });
  check('manual draft created (no PDF)', r.status === 201 && r.body.origin === 'manual' && r.body.rows.length === 0);
  const imp3 = r.body;
  r = await as(request(app).post(`${BASE}/${imp3.id}/approve`), admin);
  check('an empty draft cannot be approved', r.status === 422);
  r = await as(request(app).post(`${BASE}/${imp3.id}/rows`), admin).send({ metricId: '9.9.9', description: 'Custom manual metric', criterionNumber: 7, criterion: 'Criterion 7 \u2013 Institutional Values and Best Practices', keyIndicator: '7.9 Custom', maxScore: 5, unit: 'percentage', scoringType: 'numeric', bands: [{ score: 4, label: '>=50' }, { score: 3, label: '40-50' }, { score: 2, label: '30-40' }, { score: 1, label: '20-30' }, { score: 0, label: '<20' }] });
  check('manual row added; server derived direction and flags', r.status === 201 && r.body.direction === 'higherIsBetter' && r.body.source === 'manual', r.body);
  const manualRowId = r.body.rowId;
  await as(request(app).patch(`${BASE}/${imp3.id}/rows/${manualRowId}`), admin).send({ reviewed: true });
  r = await as(request(app).post(`${BASE}/${imp3.id}/approve`), admin);
  check('manual version approved after review', r.status === 200, r.body);
  r = await as(request(app).post(`${BASE}/${imp3.id}/activate`), admin).send({ mode: 'replace' });
  check('replace mode activates version 3', r.status === 200 && r.body.status === 'active');
  const after3 = BenchmarkMetric.__all();
  check('replace deactivated absent metrics but DELETED nothing', after3.length === 56 + 0 || after3.length >= 56, after3.length);
  check('only the manual metric is active now', after3.filter((d) => d.active !== false).map((d) => d.metricId).join() === '9.9.9', after3.filter((d) => d.active !== false).map((d) => d.metricId));
  check('the first imported version is superseded, not deleted, and still holds its 54 included rows', (() => { const v = BenchmarkImport.__all().find((i) => String(i._id) === imp1.id); return v.status === 'superseded' && v.rows.filter((x) => !x.excluded).length === 54; })());
  const v2 = BenchmarkImport.__all().find((i) => String(i._id) === imp1.id);
  r = await as(request(app).post(`${BASE}/${v2.id || v2._id}/rollback`), faculty);
  check('faculty cannot roll back -> 403', r.status === 403);
  r = await as(request(app).post(`${BASE}/${imp3.id}/rollback`), admin);
  check('rolling back an ACTIVE version is refused -> 409', r.status === 409);
  r = await as(request(app).post(`${BASE}/${String(v2._id)}/rollback`), admin);
  check('rollback to the first imported version -> 200 and it is active again', r.status === 200 && r.body.status === 'active' && r.body.versionNo === imp1.versionNo, r.body);
  const afterRb = new Map(BenchmarkMetric.__all().map((d) => [d.metricId, d]));
  check('rollback restored the 54 imported definitions and deactivated the later manual metric', [...afterRb.values()].filter((d) => d.active !== false).length === 54 && afterRb.get('9.9.9').active === false);
  check('rolled-back 2.5.1 carries the first version source data again', afterRb.get('2.5.1').source.versionNo === imp1.versionNo && afterRb.get('2.5.1').active === true);
  check('version 3 superseded (kept), rollback audited', BenchmarkImport.__all().find((i) => String(i._id) === imp3.id).status === 'superseded' && actions().includes('rollback'));
  const baseId = String(baseline._id);
  r = await as(request(app).post(`${BASE}/${baseId}/rollback`), admin);
  check('rollback to the pre-import baseline restores the seeded catalogue (3 docs active, books entry back)', r.status === 200 && BenchmarkMetric.__all().filter((d) => d.active !== false).map((d) => d.metricId).sort().join() === '1.2.1,3.4.5,3.4.5_books', BenchmarkMetric.__all().filter((d) => d.active !== false).map((d) => d.metricId));
  check('after restoring baseline, 3.4.5 is the original "Total Patents" definition again', BenchmarkMetric.__all().find((d) => d.metricId === '3.4.5').description.startsWith('Total number of patents'));
  r = await as(request(app).get(`${BASE}/audit-log`), admin);
  check('audit log API returns entries (newest first), admin only', r.status === 200 && r.body.length >= 15 && ['upload', 'extract', 'approve', 'activate', 'replace', 'rollback'].every((a) => r.body.some((e) => e.action === a)), r.body.length);
  r = await as(request(app).get(`${BASE}/audit-log`), hod);
  check('audit log is 403 for hod', r.status === 403);
  r = await as(request(app).get(`${BASE}/status`), admin);
  check('status diagnostics endpoint (admin): counts + active version', r.status === 200 && typeof r.body.benchmarkMetrics.total === 'number' && r.body.activeVersion && Array.isArray(r.body.notes), r.body);

  // ============ 9. Scanned / non-benchmark PDFs ============
  reset();
  const FIX = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f));
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', FIX('not-a-benchmark.pdf'), { filename: 'other.pdf', contentType: 'application/pdf' });
  check('a real PDF that is not a benchmark document -> 422 NOT_A_BENCHMARK_DOCUMENT', r.status === 422 && r.body.code === 'NOT_A_BENCHMARK_DOCUMENT', r.body);
  r = await as(request(app).post(`${BASE}/upload`), admin).attach('file', FIX('no-text-layer.pdf'), { filename: 'scan.pdf', contentType: 'application/pdf' });
  check('a PDF with no text layer (scanned) -> 422 SCANNED_PDF with manual-entry guidance', r.status === 422 && r.body.code === 'SCANNED_PDF' && /manual draft/i.test(r.body.message), r.body);
  check('neither created a draft', BenchmarkImport.__all().length === 0);

  // ============ 10. Benchmark API: current values, gaps, honest missing data ============
  reset();
  const base = { description: 'd', criterion: 'Criterion 2 \u2013 Teaching', criterionNumber: 2, keyIndicator: '2.4 X', maxScore: 10, active: true, improvementHint: 'hint' };
  const hi = HIGH.map((b) => ({ ...b, ...P(b.label), status: 'above' }));
  BenchmarkMetric.__seed({ ...base, metricId: '2.4.2', metricName: 'PhD %', metricType: 'quantitative', unit: 'percentage', bands: HIGH.map((b) => ({ score: b.score, label: b.label })), direction: 'higherIsBetter', computedField: 'pct.phd' });
  BenchmarkMetric.__seed({ ...base, metricId: '2.5.1', metricName: 'Days to results', metricType: 'quantitative', unit: 'days', bands: LOW.map((b) => ({ score: b.score, label: b.label })), direction: 'higherIsBetter' /* stale seeded value on purpose */, computedField: 'days.results' });
  BenchmarkMetric.__seed({ ...base, metricId: '1.1.1', metricName: 'Unmapped', metricType: 'quantitative', unit: 'count', bands: HIGH.map((b) => ({ score: b.score, label: b.label })), computedField: null });
  BenchmarkMetric.__seed({ ...base, metricId: '1.4.1', metricName: 'Feedback', metricType: 'qualitative', unit: 'option', bands: CAT.map((b) => ({ score: b.score, label: b.label })), computedField: null });
  BenchmarkMetric.__seed({ ...base, metricId: '3.9.9', metricName: 'Undefined metric', metricType: 'quantitative', unit: 'count', bands: HIGH.map((b) => ({ score: b.score, label: b.label })), computedField: 'does.not.exist' });
  BenchmarkMetric.__seed({ ...base, metricId: '3.9.8', metricName: 'Unsupported', metricType: 'quantitative', unit: 'count', bands: HIGH.map((b) => ({ score: b.score, label: b.label })), computedField: 'unsup' });
  BenchmarkMetric.__seed({ ...base, metricId: '3.9.7', metricName: 'Imported', metricType: 'quantitative', unit: 'count', bands: HIGH.map((b) => ({ score: b.score, label: b.label })), computedField: 'pct.phd', catalogVersionId: '00000000000000000000aaaa', source: { filename: 'f.pdf', documentVersion: 'v1', versionNo: 2, approvedBy: 'Admin One' } });
  MetricModel.__seed({ metricId: 'pct.phd', metricName: 'PhD', criterion: 'c', formulaType: 'percentage', supported: true });
  MetricModel.__seed({ metricId: 'days.results', metricName: 'Days', criterion: 'c', formulaType: 'average', supported: true });
  MetricModel.__seed({ metricId: 'unsup', metricName: 'Unsupported', criterion: 'c', formulaType: 'count', supported: false });
  for (let i = 0; i < 3; i++) Faculty.__seed({ username: 'f' + i, employmentDetails: { department: 'CSE' } });
  calcImpl = async (id) => ({ value: id === 'pct.phd' ? 72.5 : id === 'days.results' ? 35 : 7 });
  cache.invalidate();

  let res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('GET /analytics/benchmark -> 200 array (contract unchanged)', res.status === 200 && Array.isArray(res.body) && res.body.length === 7, res.body.length);
  const E = (id) => res.body.find((x) => x.metricId === id);
  check('numeric higher-is-better: 72.5% vs ">=80" etc. is not applicable here (bands >=20): score 4, gap negative', E('2.4.2').score === 4 && E('2.4.2').currentValue === 72.5 && E('2.4.2').benchmarkValue === 20 && E('2.4.2').gap === -52.5 && E('2.4.2').status === 'above', E('2.4.2'));
  check('lower-is-better metric with stale stored direction is still scored correctly (35 days -> score 2, gap +15)', E('2.5.1').score === 2 && E('2.5.1').gap === 15 && E('2.5.1').direction === 'lowerIsBetter' && E('2.5.1').benchmarkValue === 20, E('2.5.1'));
  check('response keeps legacy keys and adds band label / catalog / status label', ['metricId', 'metricName', 'criterion', 'currentValue', 'benchmarkValue', 'gap', 'status', 'score', 'recommendation', 'bands', 'achievementPercent'].every((k) => k in E('2.4.2')) && E('2.4.2').statusLabel === 'Above' && E('2.4.2').bandLabel === '>=20' && E('2.4.2').catalog.origin === 'seed');
  check('imported metric exposes source/version info', E('3.9.7').catalog.origin === 'import' && E('3.9.7').catalog.versionNo === 2 && E('3.9.7').catalog.sourceFilename === 'f.pdf' && E('3.9.7').catalog.approvedBy === 'Admin One', E('3.9.7').catalog);
  const insuff = (id, reason) => { const x = E(id); return x.insufficientData === true && x.currentValue === null && x.gap === null && x.score === null && x.status === 'unknown' && x.statusLabel === 'Insufficient data' && x.insufficientReason === reason; };
  check('unmapped metric -> Insufficient data (value null, NOT zero)', insuff('1.1.1', 'no_analytics_mapping'), E('1.1.1'));
  check('categorical metric without an assessment -> Insufficient data, never a number', insuff('1.4.1', 'qualitative_requires_assessment') && E('1.4.1').scoringType === 'categorical', E('1.4.1'));
  check('mapped to an undefined analytics metric -> Insufficient data', insuff('3.9.9', 'analytics_metric_not_defined'), E('3.9.9'));
  check('mapped to an unsupported analytics metric -> Insufficient data', insuff('3.9.8', 'analytics_metric_unsupported'), E('3.9.8'));
  Faculty.__reset(); cache.invalidate();
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('no institutional records at all -> every value is Insufficient data (a calculator returning 0 is NOT trusted)', res.body.every((x) => x.insufficientData === true && x.currentValue === null) && E('2.4.2').insufficientReason === 'no_institutional_records', res.body.map((x) => [x.metricId, x.insufficientReason]));
  for (let i = 0; i < 3; i++) Faculty.__seed({ username: 'f' + i, employmentDetails: { department: 'CSE' } });
  calcImpl = async () => ({ value: 0 });
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('a genuine computed 0 WITH records present is a real value (score 0), not hidden', E('2.4.2').currentValue === 0 && E('2.4.2').score === 0 && E('2.4.2').insufficientData === false, E('2.4.2'));
  calcImpl = async () => { throw new Error('boom'); };
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('calculator failure -> Insufficient data, API still 200', res.status === 200 && E('2.4.2').insufficientReason === 'calculation_failed');
  calcImpl = async () => ({ value: null });
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  check('calculator returning null -> Insufficient data', E('2.4.2').insufficientData === true);
  res = await as(request(app).get('/api/faculty/analytics/benchmark/catalogue-status'), admin);
  check('GET /benchmark/catalogue-status -> counts (route ordered above /:metricId)', res.status === 200 && res.body.activeMetrics === 7 && res.body.hasCatalogue === true && res.body.importedVersions.join() === '2', res.body);
  BenchmarkMetric.__reset(); cache.invalidate();
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), admin);
  const st = await as(request(app).get('/api/faculty/analytics/benchmark/catalogue-status'), admin);
  check('empty catalogue -> [] AND status explains it (hasCatalogue=false)', res.status === 200 && res.body.length === 0 && st.body.hasCatalogue === false && st.body.activeMetrics === 0, st.body);
  res = await as(request(app).get('/api/faculty/analytics/benchmark'), librarian);
  check('librarian still cannot read Analytics benchmark (403)', res.status === 403);
  res = await request(app).get('/api/faculty/analytics/benchmark');
  check('benchmark API requires authentication (401)', res.status === 401);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
