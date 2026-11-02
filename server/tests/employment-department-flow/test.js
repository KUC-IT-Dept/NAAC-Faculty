// Regression harness for:
//   - PUT /api/faculty/me accepting a missing/empty Employee ID / Staff Code
//   - PUT /api/faculty/me resolving employmentDetails.department from a
//     stable departmentId at save time (so a department rename shows up on
//     profiles that already selected it, without the faculty member having
//     to reselect anything)
//   - GET /api/faculty/departments/:id (DELETE guard) refusing to orphan
//     faculty is covered in tests/hod-department-lifecycle/test.js; this
//     file focuses on the faculty-profile save path.
//
// Uses the REAL route file and the REAL Mongoose Faculty model; only
// persistence is faked (Faculty.prototype.save is stubbed so no MongoDB
// connection is needed — mirrors tests/faculty-create-department/test.js).
const path = require('path');
const S = path.join(__dirname, '..', '..');
const Faculty = require(path.join(S, 'modules/faculty/models/Faculty'));
const Department = require(path.join(S, 'modules/faculty/models/Department'));

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

function fakeQuery(value) {
  const q = {
    select: () => q,
    sort: () => q,
    populate: () => q,
    session: () => q,
    lean: () => q,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    catch: (reject) => Promise.resolve(value).catch(reject),
  };
  return q;
}

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

(async () => {
  const facultyRouter = require(path.join(S, 'modules/faculty/routes/faculty'));

  // No real DB — stub out persistence on the real Mongoose model/document so
  // the route's own validation and field-resolution logic still runs for real.
  let savedDoc = null;
  Faculty.prototype.save = async function () { savedDoc = this; return this; };

  const putMe = handlerFor(facultyRouter, '/', 'put');
  const fakeUser = { _id: 'u1', username: 'jdoe' };

  // ───────────────────────────────────────────────────────────────────────
  // 1. Employee ID is optional — missing/empty is accepted, profile saves
  // ───────────────────────────────────────────────────────────────────────
  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null); // no existing profile yet
    const res = fakeRes();
    await putMe({ user: fakeUser, body: { employmentDetails: { employeeId: '', designation: 'Assistant Professor', department: 'Physics' } } }, res);

    check('PUT /me with empty employeeId -> 200 (not rejected)', res.statusCode === undefined && savedDoc, res.statusCode);
    check('saved employmentDetails.employeeId is empty string, not required', savedDoc && savedDoc.employmentDetails.employeeId === '');
  }

  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null);
    const res = fakeRes();
    await putMe({ user: fakeUser, body: { employmentDetails: { designation: 'Assistant Professor', department: 'Physics' } } }, res);
    // Omitted entirely -> Mongoose leaves the subdocument path unset (undefined)
    // rather than forcing the schema default; either way it's accepted, not rejected.
    check('PUT /me with employeeId key omitted entirely -> still saves, not rejected',
      savedDoc && res.statusCode === undefined && !savedDoc.employmentDetails.employeeId,
      { statusCode: res.statusCode, employeeId: savedDoc && savedDoc.employmentDetails.employeeId });
  }

  // ───────────────────────────────────────────────────────────────────────
  // 2. Other mandatory employment validation is untouched (frontend-only,
  //    but confirm the backend itself never enforced employeeId — i.e.
  //    there was nothing to break by making it optional)
  // ───────────────────────────────────────────────────────────────────────
  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null);
    const res = fakeRes();
    await putMe({ user: fakeUser, body: { employmentDetails: { employeeId: 'EMP-123', designation: 'Professor', department: 'Physics' } } }, res);
    check('employeeId still saved correctly when provided', savedDoc && savedDoc.employmentDetails.employeeId === 'EMP-123');
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3. departmentId resolves employmentDetails.department to the LIVE name
  //    (department-rename sync)
  // ───────────────────────────────────────────────────────────────────────
  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null);
    const validDeptId = '507f1f77bcf86cd799439011'; // valid 24-char ObjectId hex
    let lookedUpId = null;
    Department.findById = (id) => { lookedUpId = String(id); return fakeQuery({ _id: id, name: 'Computer Applications (renamed)' }); };

    const res = fakeRes();
    await putMe(
      { user: fakeUser, body: { employmentDetails: { designation: 'Professor', department: 'Computer Science (stale)', departmentId: validDeptId } } },
      res
    );

    check('Department.findById looked up by the submitted departmentId', lookedUpId === validDeptId, lookedUpId);
    check('saved department name resolved to the department\'s CURRENT name, not the stale submitted one',
      savedDoc && savedDoc.employmentDetails.department === 'Computer Applications (renamed)', savedDoc && savedDoc.employmentDetails.department);
    check('departmentId itself is preserved for future resolution', savedDoc && String(savedDoc.employmentDetails.departmentId) === validDeptId);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4. Stale/invalid departmentId (e.g. department no longer exists) — save
  //    still succeeds, submitted name string is kept, dangling id is cleared
  // ───────────────────────────────────────────────────────────────────────
  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null);
    Department.findById = () => fakeQuery(null); // not found
    const ghostDeptId = '507f1f77bcf86cd799439099'; // valid shape, doesn't resolve

    const res = fakeRes();
    await putMe(
      { user: fakeUser, body: { employmentDetails: { designation: 'Professor', department: 'Old Department Name', departmentId: ghostDeptId } } },
      res
    );

    check('save still succeeds with a stale departmentId', savedDoc, res.statusCode);
    check('submitted department name string is kept as-is when id does not resolve',
      savedDoc && savedDoc.employmentDetails.department === 'Old Department Name');
    check('dangling departmentId is cleared rather than trusted', savedDoc && !savedDoc.employmentDetails.departmentId);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5. Legacy payload with no departmentId key at all — untouched, no
  //    Department lookup performed (backward compatibility)
  // ───────────────────────────────────────────────────────────────────────
  {
    savedDoc = null;
    Faculty.findOne = () => fakeQuery(null);
    let lookupCalled = false;
    Department.findById = () => { lookupCalled = true; return fakeQuery(null); };

    const res = fakeRes();
    await putMe(
      { user: fakeUser, body: { employmentDetails: { designation: 'Professor', department: 'Legacy Dept String' } } },
      res
    );

    check('no Department.findById call for a legacy payload with no departmentId key', lookupCalled === false);
    check('legacy department string saved unchanged', savedDoc && savedDoc.employmentDetails.department === 'Legacy Dept String');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
