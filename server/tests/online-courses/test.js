// Regression harness: Online Courses single `date` + `activityType` through the REAL faculty profile route.
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
function newDoc(onlineCourses) {
  const d = new Faculty({ userId: new mongoose.Types.ObjectId(), username: 'fac1', onlineCourses });
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
const courses = (res) => json(res.body).onlineCourses;

const OTHER = { courseName: 'Cloud Basics', platform: 'edX', certificateId: 'C-2', certificateUrl: '/u/d.pdf', score: 'A', courseLevel: 'Advanced' };

(async () => {
  const sp = Faculty.schema.path('onlineCourses').schema;
  check('schema has date + activityType', !!sp.path('date') && !!sp.path('activityType'));
  check('schema keeps legacy from/to/duration/completionYear', ['from', 'to', 'duration', 'completionYear'].every(k => !!sp.path(k)));

  // 1. new record persists and round-trips through PUT then GET
  stored = newDoc([]);
  let r = await put({ onlineCourses: [{ ...OTHER, activityType: 'Taught', date: '2024-05-02' }] });
  check('PUT ok', r.statusCode === undefined, r.body);
  let c = courses(r)[0];
  check('date + activityType saved', c.date === '2024-05-02' && c.activityType === 'Taught', c);
  check('other fields intact', Object.keys(OTHER).every(k => c[k] === OTHER[k]), c);
  c = courses(await get())[0];
  check('GET returns them', c.date === '2024-05-02' && c.activityType === 'Taught');

  // 2. each activity type value is stored as given
  for (const t of ['Conducted', 'Attended', 'Taught']) {
    stored = newDoc([]);
    r = await put({ onlineCourses: [{ ...OTHER, activityType: t, date: '2023-01-01' }] });
    check(`activityType ${t} saved`, courses(r)[0].activityType === t);
  }

  // 3. legacy record (from/to only) loads; new fields empty; nothing inferred
  stored = newDoc([{ ...OTHER, from: '2020-01-10', to: '2020-03-15' }]);
  c = courses(await get())[0];
  check('legacy loads', !!c && c.courseName === 'Cloud Basics');
  check('legacy: date and activityType empty (not derived from from/to)', c.date === '' && c.activityType === '', c);
  check('legacy: from/to preserved', c.from === '2020-01-10' && c.to === '2020-03-15');

  // 4. updating legacy record with date keeps from/to and certificate
  r = await put({ onlineCourses: [{ ...OTHER, from: '2020-01-10', to: '2020-03-15', date: '2020-02-01', activityType: 'Attended' }] });
  c = courses(r)[0];
  check('legacy + new date: from/to still stored', c.from === '2020-01-10' && c.to === '2020-03-15' && c.date === '2020-02-01');
  check('legacy + new date: certificate/score intact', c.certificateUrl === '/u/d.pdf' && c.score === 'A' && c.certificateId === 'C-2');

  // 5. partial update of another section does not touch onlineCourses
  stored = newDoc([{ ...OTHER, activityType: 'Taught', date: '2024-05-02' }]);
  r = await put({ memberships: [] });
  c = courses(r)[0];
  check('PUT without onlineCourses leaves them untouched', c.date === '2024-05-02' && c.activityType === 'Taught');

  // 6. empty list and auth unchanged
  r = await put({ onlineCourses: [] });
  check('empty list accepted', r.statusCode === undefined && courses(r).length === 0);
  const put_ = layerFor('/', 'put');
  check('PUT / still has facultyOnly + handler (2 middlewares)', put_.route.stack.length === 2, put_.route.stack.length);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
