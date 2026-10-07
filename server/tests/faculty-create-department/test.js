// Regression harness: POST /api/faculty/admin/faculty must persist `department`.
// Uses the REAL route file and REAL Mongoose models; only persistence is faked
// (no MongoDB needed, nothing is ever written to a database).
//
// Run from this folder:  node test.js
const path = require('path');
const S = path.join(__dirname, '..', '..');
const User = require(path.join(S, 'auth/models/User.model'));
const Faculty = require(path.join(S, 'modules/faculty/models/Faculty'));

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

// ---- fake persistence (real models are built from the args, nothing saved) ----
let rec;
let existingEmails;
function reset() { rec = { userArgs: null, facultyArgs: null, userDoc: null, facultyDoc: null, creates: 0 }; existingEmails = new Set(); }
User.findOne = async (q) => (q && q.email && existingEmails.has(q.email) ? { _id: 'x' } : null);
User.create = async (d) => { rec.creates++; rec.userArgs = d; const u = new User(d); rec.userDoc = u.toObject(); return u; };
Faculty.create = async (d) => { rec.creates++; rec.facultyArgs = d; const f = new Faculty(d); rec.facultyDoc = f.toObject(); return f; };

function fakeRes() {
  const res = {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.body = o; return res; };
  return res;
}
function handlerFor(router, p, method) {
  const layer = router.stack.find(l => l.route && l.route.path === p && l.route.methods[method]);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}
async function post(body) {
  const adminRouter = require(path.join(S, 'modules/faculty/routes/admin'));
  const res = fakeRes();
  await handlerFor(adminRouter, '/faculty', 'post')({ body }, res);
  return res;
}

(async () => {
  const BODY = { email: 'analytics.dept.test@example.com', fullName: 'Analytics Department Test', department: 'Computer Science' };

  // 1. Spec scenario
  reset();
  let r = await post({ ...BODY });
  check('spec payload -> 201', r.statusCode === 201, r.statusCode);
  check('User.department = "Computer Science"', rec.userDoc && rec.userDoc.department === 'Computer Science', rec.userDoc && rec.userDoc.department);
  const fd = rec.facultyDoc || {};
  check('Faculty.employmentDetails.department = "Computer Science"', fd.employmentDetails && fd.employmentDetails.department === 'Computer Science', fd.employmentDetails && fd.employmentDetails.department);
  check('consistency: User.department == Faculty.employmentDetails.department',
    rec.userDoc && fd.employmentDetails && rec.userDoc.department === fd.employmentDetails.department && rec.userDoc.department === 'Computer Science');
  // Informational: personalInfo.department is not a Faculty schema path (strict mode drops it on create AND edit).
  console.log('INFO - Faculty schema has personalInfo.department:', !!Faculty.schema.path('personalInfo.department'));
  check('existing behavior kept: temp-- fullName prefix', fd.personalInfo && fd.personalInfo.fullName === 'temp--Analytics Department Test', fd.personalInfo && fd.personalInfo.fullName);
  check('existing behavior kept: role=faculty, defaultPassword in response', rec.userDoc && rec.userDoc.role === 'faculty' && r.body && r.body.defaultPassword === 'password123');
  check('no departmentId introduced', !('departmentId' in (rec.userArgs || {})) && !('departmentId' in (rec.facultyArgs || {})));

  // 2. Trimming
  reset();
  r = await post({ ...BODY, department: '   Computer Science  ' });
  check('padded department is trimmed in User and Faculty.employmentDetails',
    r.statusCode === 201 && rec.userDoc.department === 'Computer Science' &&
    rec.facultyDoc.employmentDetails.department === 'Computer Science');

  // 3. Invalid department -> 400, nothing created
  for (const [label, dept] of [['missing', undefined], ['empty string', ''], ['whitespace only', '   '], ['number', 123], ['array', ['CS']], ['object', { a: 1 }], ['null', null]]) {
    reset();
    const body = { ...BODY }; if (dept === undefined) delete body.department; else body.department = dept;
    r = await post(body);
    check(`department ${label} -> 400 and nothing created`, r.statusCode === 400 && rec.creates === 0, { code: r.statusCode, creates: rec.creates });
  }

  // 4. Pre-existing validations unchanged
  reset();
  r = await post({ fullName: 'x', department: 'Computer Science' });
  check('missing email still -> 400 "Email is required"', r.statusCode === 400 && r.body.message === 'Email is required', r.body);
  reset(); existingEmails.add(BODY.email);
  r = await post({ ...BODY });
  check('duplicate email still -> 409', r.statusCode === 409 && rec.creates === 0, r.statusCode);

  // 5. HOD create route is untouched and still persists employmentDetails.department
  reset();
  const hodRouter = require(path.join(S, 'modules/faculty/routes/hod'));
  const origFindOne = Faculty.findOne;
  Faculty.findOne = async () => ({ employmentDetails: { department: 'Physics' } });
  const hres = fakeRes();
  await handlerFor(hodRouter, '/faculty', 'post')({ body: { email: 'h.test@example.com', fullName: 'H Test' }, user: { _id: 'hod1' } }, hres);
  Faculty.findOne = origFindOne;
  check('HOD create still -> 201 with employmentDetails.department from HOD', hres.statusCode === 201 && rec.facultyDoc && rec.facultyDoc.employmentDetails.department === 'Physics', { code: hres.statusCode, d: rec.facultyDoc && rec.facultyDoc.employmentDetails });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
