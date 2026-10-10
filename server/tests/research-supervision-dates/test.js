// Regression harness: Research Supervision milestone dates through the REAL faculty profile route.
// Uses the REAL route file (modules/faculty/routes/faculty.js) and REAL Mongoose model; only
// persistence is faked (no MongoDB needed, nothing is ever written to a database).
//
// Run from this folder:  node test.js
const path = require('path');
const S = path.join(__dirname, '..', '..');
const Faculty = require(path.join(S, 'modules/faculty/models/Faculty'));
const mongoose = require(path.join(S, 'node_modules/mongoose'));

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

const KEYS = ['dateOfAdmissionEnrolment', 'dateOfRegistration', 'dateOfThesisSubmission', 'dateOfVivaVoce', 'dateOfSyndicateApproval'];
const DATES = { dateOfAdmissionEnrolment: '2019-07-01', dateOfRegistration: '2019-12-15', dateOfThesisSubmission: '2023-03-20', dateOfVivaVoce: '2023-06-10', dateOfSyndicateApproval: '2023-09-05' };
const OTHER = { studentName: 'Asha Nair', topic: 'Graph Mining', fellowship: 'UGC-JRF', degree: 'Ph.D', status: 'Ongoing', scholarGender: 'Female', guidanceType: 'Supervisor', supervisionCategory: 'Regular' };

// ---- fake persistence: findOne returns a real Faculty document held in memory; save() is a no-op ----
let stored;           // the one "database" document
let saves = 0;
function newDoc(rg) {
  const d = new Faculty({ userId: new mongoose.Types.ObjectId(), username: 'fac1', researchGuidance: rg });
  d.save = async function () { saves++; const err = this.validateSync(); if (err) throw err; return this; };
  return d;
}
Faculty.findOne = async () => stored;

function fakeRes() { const r = {}; r.status = (c) => { r.statusCode = c; return r; }; r.json = (o) => { r.body = o; return r; }; return r; }
const router = require(path.join(S, 'modules/faculty/routes/faculty'));
const layerFor = (p, m) => router.stack.find(l => l.route && l.route.path === p && l.route.methods[m]);
const handlerFor = (p, m) => { const l = layerFor(p, m); return l.route.stack[l.route.stack.length - 1].handle; };
const req = (body) => ({ body, user: { _id: 'u1', username: 'fac1', role: 'faculty' } });
async function put(body) { const res = fakeRes(); await handlerFor('/', 'put')(req(body), res); return res; }
async function get() { const res = fakeRes(); await handlerFor('/', 'get')(req({}), res); return res; }
const json = (o) => JSON.parse(JSON.stringify(o));      // what travels over HTTP
const students = (res) => json(res.body).researchGuidance.studentDetails;

(async () => {
  // 1. Schema accepts all five dates
  for (const k of KEYS) check(`schema has studentDetails.${k}`, !!Faculty.schema.path('researchGuidance.studentDetails').schema.path(k));
  check('legacy `year` path kept in schema (old data is not dropped)', !!Faculty.schema.path('researchGuidance.studentDetails').schema.path('year'));

  // 2. PUT stores all five + every existing field; GET returns them
  stored = newDoc();
  let r = await put({ researchGuidance: { phdCompleted: '0', studentDetails: [{ ...OTHER, ...DATES }] } });
  check('PUT -> 200 (no error)', r.statusCode === undefined && r.body && !r.body.message, r.body && r.body.message);
  let st = students(r)[0];
  KEYS.forEach(k => check(`PUT response keeps ${k}`, st[k] === DATES[k], st[k]));
  Object.keys(OTHER).forEach(k => check(`PUT response keeps existing field ${k}`, st[k] === OTHER[k], st[k]));
  let g = await get();
  st = students(g)[0];
  check('GET returns all five dates', KEYS.every(k => st[k] === DATES[k]), st);
  check('GET returns all existing fields', Object.keys(OTHER).every(k => st[k] === OTHER[k]));

  // 3. Saving one changed date (frontend sends the whole record) does not clear the other four
  r = await put({ researchGuidance: { studentDetails: [{ ...OTHER, ...DATES, dateOfVivaVoce: '2023-07-11' }] } });
  st = students(r)[0];
  check('changed date saved', st.dateOfVivaVoce === '2023-07-11');
  check('other four dates untouched', KEYS.filter(k => k !== 'dateOfVivaVoce').every(k => st[k] === DATES[k]), st);

  // 4. Empty dates persist as '' and are returned
  r = await put({ researchGuidance: { studentDetails: [{ ...OTHER, dateOfRegistration: '' }] } });
  st = students(r)[0];
  check('empty / missing dates come back as empty strings', KEYS.every(k => st[k] === ''), st);

  // 5. Legacy record: year only, no dates -> loads, dates empty, year preserved
  stored = newDoc({ studentDetails: [{ ...OTHER, year: '2018' }] });
  g = await get();
  st = students(g)[0];
  check('legacy record loads (GET ok)', g.statusCode === undefined && !!st);
  check('legacy: dates are empty (nothing inferred from year)', KEYS.every(k => st[k] === ''), st);
  check('legacy: year still returned unchanged', st.year === '2018');
  r = await put({ researchGuidance: { studentDetails: [{ ...st, dateOfRegistration: '2018-08-08' }] } });
  st = students(r)[0];
  check('legacy: editing one date keeps year and all other fields', st.year === '2018' && st.dateOfRegistration === '2018-08-08' && Object.keys(OTHER).every(k => st[k] === OTHER[k]), st);
  check('legacy: untouched dates stay empty', KEYS.filter(k => k !== 'dateOfRegistration').every(k => st[k] === ''));

  // 6. Frontend-only helper props (id / isEditing) are still dropped by the strict schema, as before
  r = await put({ researchGuidance: { studentDetails: [{ id: 'student-x', isEditing: false, ...OTHER, ...DATES }] } });
  st = students(r)[0];
  check('id/isEditing not persisted (pre-existing behaviour)', !('id' in st) && !('isEditing' in st));

  // 7. Other researchGuidance fields and other sections are unaffected
  stored = newDoc({ phdCompleted: '3', mphilCompleted: '1', completedStudentsNames: 'A, B', studentDetails: [] });
  r = await put({ researchGuidance: { phdCompleted: '3', mphilCompleted: '1', completedStudentsNames: 'A, B', studentDetails: [{ ...OTHER, ...DATES }] } });
  const rg = json(r.body).researchGuidance;
  check('counters / names untouched', rg.phdCompleted === '3' && rg.mphilCompleted === '1' && rg.completedStudentsNames === 'A, B');

  // 8. Authorization unchanged: route is behind auth (router.use) and facultyOnly
  const put_ = layerFor('/', 'put');
  check('PUT / still has facultyOnly + handler (2 middlewares)', put_.route.stack.length === 2, put_.route.stack.length);
  check('router still applies auth to everything', router.stack[0] && router.stack[0].name === 'auth' || router.stack[0].handle.name === 'auth', router.stack[0].name);

  // 9. Invalid shape does not crash the handler path with dates present
  r = await put({ researchGuidance: { studentDetails: [] } });
  check('empty list accepted', r.statusCode === undefined);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
