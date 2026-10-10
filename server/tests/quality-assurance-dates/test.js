// Regression harness: Quality Assurance fromDate / toDate / dateOfAppointment through the REAL faculty profile route.
// REAL route file + REAL Mongoose model; only persistence is faked (no MongoDB, nothing written).
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
let stored;
function newDoc(qualityAssurance) {
  const d = new Faculty({ userId: new mongoose.Types.ObjectId(), username: 'fac1', qualityAssurance });
  d.save = async function () { const err = this.validateSync(); if (err) throw err; return this; };
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
const json = (o) => JSON.parse(JSON.stringify(o));
const qa = (res) => json(res.body).qualityAssurance;

const CHARGES = ['Director IQAC', 'Convener NAAC criteria', 'Preparing reports for accreditation NAAC', 'NAAC department coordinator', 'Preparing reports for NIRF ranking', 'NIRF Department coordinator', 'Coordinating student/teacher feedback and action plans', 'Other'];
const DATES = { fromDate: '2022-06-01', toDate: '2024-05-31', dateOfAppointment: '2022-05-15' };
const COMMON = { activityTitle: 'Audit', activityCategory: 'Meeting', objective: 'O', outcome: 'X', supportingDocuments: 'http://x/a.pdf', remarks: 'r' };

(async () => {
  const sp = Faculty.schema.path('qualityAssurance').schema;
  check('schema has fromDate, toDate, dateOfAppointment', ['fromDate', 'toDate', 'dateOfAppointment'].every(k => !!sp.path(k)));
  check('schema keeps legacy academicYear + activityDate', !!sp.path('academicYear') && !!sp.path('activityDate'));
  check('dates default to empty string', sp.path('fromDate').defaultValue === '' && sp.path('dateOfAppointment').defaultValue === '');

  // every charge: save + reload
  for (const charge of CHARGES) {
    stored = newDoc([]);
    let r = await put({ qualityAssurance: [{ administrativeCharge: charge, ...DATES, ...COMMON }] });
    check(`PUT ok [${charge}]`, r.statusCode === undefined, r.body);
    let c = qa(r)[0];
    check(`dates saved [${charge}]`, c.fromDate === DATES.fromDate && c.toDate === DATES.toDate && c.dateOfAppointment === DATES.dateOfAppointment, c);
    check(`other fields intact [${charge}]`, Object.keys(COMMON).every(k => c[k] === COMMON[k]) && c.administrativeCharge === charge);
    c = qa(await get())[0];
    check(`GET returns dates [${charge}]`, c.fromDate === DATES.fromDate && c.toDate === DATES.toDate && c.dateOfAppointment === DATES.dateOfAppointment);
  }

  // empty dates ok, independent
  stored = newDoc([]);
  let r = await put({ qualityAssurance: [{ administrativeCharge: 'Other', dateOfAppointment: '2021-01-04' }] });
  let c = qa(r)[0];
  check('only appointment date: from/to stay empty', c.fromDate === '' && c.toDate === '' && c.dateOfAppointment === '2021-01-04', c);

  // legacy record: loads, new dates empty, legacy kept, nothing inferred
  stored = newDoc([{ administrativeCharge: 'Director IQAC', academicYear: '2022-2023', activityDate: '2023-01-10', ...COMMON }]);
  c = qa(await get())[0];
  check('legacy loads', !!c && c.administrativeCharge === 'Director IQAC');
  check('legacy: new dates empty (not derived)', c.fromDate === '' && c.toDate === '' && c.dateOfAppointment === '', c);
  check('legacy: academicYear + activityDate retained', c.academicYear === '2022-2023' && c.activityDate === '2023-01-10');

  // updating legacy record with new dates keeps legacy values and other data
  r = await put({ qualityAssurance: [{ administrativeCharge: 'Director IQAC', academicYear: '2022-2023', activityDate: '2023-01-10', ...COMMON, ...DATES }] });
  c = qa(r)[0];
  check('legacy + new dates: all stored together', c.academicYear === '2022-2023' && c.activityDate === '2023-01-10' && c.fromDate === DATES.fromDate && c.dateOfAppointment === DATES.dateOfAppointment);
  check('legacy + new dates: docs/remarks intact', c.supportingDocuments === 'http://x/a.pdf' && c.remarks === 'r');

  // delete one of several
  r = await put({ qualityAssurance: [{ administrativeCharge: 'Other', ...DATES }] });
  check('delete (array replace) works', qa(r).length === 1);

  // unrelated update leaves QA alone
  stored = newDoc([{ administrativeCharge: 'Other', ...DATES }]);
  r = await put({ memberships: [] });
  check('PUT without qualityAssurance leaves dates untouched', qa(r)[0].fromDate === DATES.fromDate);

  // auth unchanged
  const put_ = layerFor('/', 'put');
  check('PUT / still has facultyOnly + handler (2 middlewares)', put_.route.stack.length === 2, put_.route.stack.length);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
