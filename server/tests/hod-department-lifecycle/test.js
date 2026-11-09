// Regression harness for the independent-HOD architecture:
//   - POST   /api/departments            (create department + HOD account)
//   - PUT    /api/departments/:id/hod    (reassign HOD)
//   - DELETE /api/departments/:id        (delete department, HOD when safe)
//   - GET    /api/departments/:name/faculty
//   - GET    /api/departments/:name/overview
//
// Uses the REAL route file with the REAL Mongoose models; only persistence is
// faked (no MongoDB needed, nothing is ever written to a database). Mirrors
// the style of tests/faculty-create-department/test.js.
const path = require('path');
const mongoose = require('mongoose');
const S = path.join(__dirname, '..', '..');
const User = require(path.join(S, 'auth/models/User.model'));
const Faculty = require(path.join(S, 'modules/faculty/models/Faculty'));
const Department = require(path.join(S, 'modules/faculty/models/Department'));

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

// Force the "standalone MongoDB" fallback path everywhere (no real
// connection is available in this harness anyway) so tests run fast and
// exercise the manual-rollback branch, matching the existing Kannur
// University deployment (no replica set).
mongoose.startSession = async () => { throw new Error('Transaction numbers are only allowed on a replica set member or mongos'); };

// ---- chainable fake query (supports .select/.sort/.populate/.session/.lean) ----
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

function fakeDoc(obj) {
  return { ...obj, toObject() { return { ...this }; }, save: async function () { return this; } };
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

let rec;
function reset() {
  rec = { userCreates: 0, deptCreates: 0, facultyCreates: 0, deletedUsers: [], deletedDepts: [], updatedUsers: [] };
}

(async () => {
  const departmentsRouter = require(path.join(S, 'modules/faculty/routes/departments'));

  // ───────────────────────────────────────────────────────────────────────
  // 1. POST / — create department + HOD, no Faculty profile, correct role
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    const origFacultyCreate = Faculty.create;
    Faculty.create = async (...args) => { rec.facultyCreates++; return origFacultyCreate.apply(Faculty, args); };

    Department.findOne = () => fakeQuery(null); // no existing department
    User.findOne = (q) => fakeQuery(null); // no existing email/username
    User.create = async (arr) => {
      rec.userCreates++;
      const doc = fakeDoc({ _id: 'hod-u1', ...arr[0] });
      rec.lastHodUser = doc;
      return [doc];
    };
    Department.create = async (arr) => {
      rec.deptCreates++;
      const doc = fakeDoc({ _id: 'dept-1', ...arr[0] });
      rec.lastDept = doc;
      return [doc];
    };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')(
      { body: { name: 'Computer Science', hodEmail: 'hod.cs@example.com', hodFullName: 'Dr. CS Head' }, user: { _id: 'admin1' } },
      res
    );

    check('create department -> 201', res.statusCode === 201, res.statusCode);
    check('exactly one User created, one Department created, zero Faculty created',
      rec.userCreates === 1 && rec.deptCreates === 1 && rec.facultyCreates === 0,
      { userCreates: rec.userCreates, deptCreates: rec.deptCreates, facultyCreates: rec.facultyCreates });
    check('HOD role is "hod"', rec.lastHodUser && rec.lastHodUser.role === 'hod', rec.lastHodUser && rec.lastHodUser.role);
    check('HOD user.department set to department name', rec.lastHodUser && rec.lastHodUser.department === 'Computer Science');
    check('Department.hod set to the new user id', rec.lastDept && rec.lastDept.hod === 'hod-u1');
    check('password is bcrypt-hashed, not plaintext', rec.lastHodUser && rec.lastHodUser.password && rec.lastHodUser.password.startsWith('$2'));
    check('response never echoes a fixed default password string', !JSON.stringify(res.body).includes('password123'));

    Faculty.create = origFacultyCreate;
  }

  // ───────────────────────────────────────────────────────────────────────
  // 2. POST / — production response omits the plaintext initial password
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Department.findOne = () => fakeQuery(null);
    User.findOne = () => fakeQuery(null);
    User.create = async (arr) => [fakeDoc({ _id: 'hod-u2', ...arr[0] })];
    Department.create = async (arr) => [fakeDoc({ _id: 'dept-2', ...arr[0] })];

    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')(
      { body: { name: 'Physics', hodEmail: 'hod.physics@example.com' }, user: { _id: 'admin1' } },
      res
    );
    process.env.NODE_ENV = prevEnv;

    check('production response -> 201 with no initialPassword field', res.statusCode === 201 && !('initialPassword' in res.body), res.body);
    check('production response explains secure delivery instead', typeof res.body.credentialsDelivery === 'string');
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3. POST / — failed department write rolls back / does not orphan the HOD user
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Department.findOne = () => fakeQuery(null);
    User.findOne = () => fakeQuery(null);
    User.create = async (arr) => { rec.userCreates++; return [fakeDoc({ _id: 'hod-u3', ...arr[0] })]; };
    Department.create = async () => { throw new Error('simulated department write failure'); };
    let deletedUserQuery = null;
    User.deleteOne = async (q) => { deletedUserQuery = q; return { deletedCount: 1 }; };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')(
      { body: { name: 'Chemistry', hodEmail: 'hod.chem@example.com' }, user: { _id: 'admin1' } },
      res
    );

    check('failed creation -> 500', res.statusCode === 500, res.statusCode);
    check('compensation deleted the orphaned HOD user by email+role', deletedUserQuery && deletedUserQuery.email === 'hod.chem@example.com' && deletedUserQuery.role === 'hod', deletedUserQuery);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4. POST / — validation
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    const res1 = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')({ body: { hodEmail: 'x@example.com' }, user: { _id: 'a' } }, res1);
    check('missing name -> 400', res1.statusCode === 400, res1.statusCode);

    const res2 = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')({ body: { name: 'Math', hodEmail: 'not-an-email' }, user: { _id: 'a' } }, res2);
    check('invalid email -> 400', res2.statusCode === 400, res2.statusCode);

    Department.findOne = () => fakeQuery({ _id: 'existing-dept' });
    const res3 = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')({ body: { name: 'Math', hodEmail: 'hod.math@example.com' }, user: { _id: 'a' } }, res3);
    check('duplicate department -> 409', res3.statusCode === 409, res3.statusCode);

    Department.findOne = () => fakeQuery(null);
    User.findOne = () => fakeQuery({ _id: 'already-exists' });
    const res4 = fakeRes();
    await handlerFor(departmentsRouter, '/', 'post')({ body: { name: 'Math', hodEmail: 'hod.math@example.com' }, user: { _id: 'a' } }, res4);
    check('duplicate HOD email -> 409', res4.statusCode === 409, res4.statusCode);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5. GET /:name/faculty — excludes HOD, only role 'faculty' appears
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Faculty.find = () => fakeQuery([
      { userId: 'fac-1', employmentDetails: { department: 'Computer Science' } },
    ]);
    User.find = (q) => {
      check('faculty listing queries role: "faculty" only (no hod)', q.role === 'faculty', q.role);
      const all = [
        { _id: 'fac-1', username: 'jdoe', role: 'faculty', toObject() { return this; } },
      ];
      return fakeQuery(all);
    };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:name/faculty', 'get')({ params: { name: 'Computer Science' } }, res);
    check('faculty listing -> 200 with only the faculty member', res.statusCode === undefined && Array.isArray(res.body) && res.body.length === 1 && res.body[0].username === 'jdoe', res.body);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 6. GET /:name/overview — HOD reported separately, excluded from faculty count
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Department.findOne = () => fakeQuery({
      name: 'Computer Science',
      hod: { _id: 'hod-u1', name: 'Dr. CS Head', username: 'hodcs', email: 'hod.cs@example.com' },
    });
    Faculty.find = () => fakeQuery([
      { userId: 'fac-1', personalInfo: { fullName: 'Jane Doe' }, employmentDetails: { designation: 'Professor' }, publications: [1], projects: [] },
    ]);
    User.find = (q) => {
      check('overview queries role: "faculty" only (no hod)', q.role === 'faculty', q.role);
      return fakeQuery([{ _id: 'fac-1', username: 'jdoe' }]);
    };
    Faculty.findOne = () => fakeQuery(null);
    const StudentProfile = require(path.join(S, 'modules/student/models/StudentProfile'));
    const origCount = StudentProfile.countDocuments;
    StudentProfile.countDocuments = () => fakeQuery(5);

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:name/overview', 'get')({ params: { name: 'Computer Science' } }, res);

    check('overview reports hodName separately', res.body.hodName === 'Dr. CS Head', res.body.hodName);
    check('overview reports a dedicated hod object', res.body.hod && res.body.hod.email === 'hod.cs@example.com', res.body.hod);
    check('overview facultyCount excludes HOD (only the 1 real faculty member)', res.body.stats.facultyCount === 1, res.body.stats);
    check('overview facultyMembers list contains no HOD entry', !res.body.facultyMembers.some(f => f.name === 'Dr. CS Head'));

    StudentProfile.countDocuments = origCount;
  }

  // ───────────────────────────────────────────────────────────────────────
  // 7. DELETE /:id — deletes the HOD account when safe, deletes the department
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Department.findById = () => fakeQuery(fakeDoc({ _id: 'dept-1', name: 'Botany', hod: 'hod-u1' }));
    Department.countDocuments = () => fakeQuery(0); // not referenced elsewhere
    Faculty.findOne = () => fakeQuery(null); // no legacy faculty profile
    Faculty.countDocuments = () => fakeQuery(0); // no faculty currently assigned to this department
    let deletedUserQuery = null, deletedDeptQuery = null;
    User.deleteOne = async (q) => { deletedUserQuery = q; return { deletedCount: 1 }; };
    Department.deleteOne = async (q) => { deletedDeptQuery = q; return { deletedCount: 1 }; };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id', 'delete')({ params: { id: 'dept-1' } }, res);

    check('delete -> 200, hodAccountDeleted: true', res.body.hodAccountDeleted === true, res.body);
    check('HOD user deleted by id + role', deletedUserQuery && deletedUserQuery._id === 'hod-u1' && deletedUserQuery.role === 'hod', deletedUserQuery);
    check('department deleted', deletedDeptQuery && deletedDeptQuery._id === 'dept-1', deletedDeptQuery);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 8. DELETE /:id — HOD referenced by another department is NOT deleted,
  //    and unrelated faculty accounts are never touched
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    Department.findById = () => fakeQuery(fakeDoc({ _id: 'dept-1', name: 'Botany', hod: 'hod-u1' }));
    Department.countDocuments = () => fakeQuery(1); // referenced by another department
    Faculty.findOne = () => fakeQuery(null);
    Faculty.countDocuments = () => fakeQuery(0);
    let userDeleteCalled = false;
    User.deleteOne = async () => { userDeleteCalled = true; return { deletedCount: 1 }; };
    Department.deleteOne = async () => ({ deletedCount: 1 });

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id', 'delete')({ params: { id: 'dept-1' } }, res);

    check('delete -> hodAccountDeleted: false when HOD still referenced elsewhere', res.body.hodAccountDeleted === false, res.body);
    check('HOD user.deleteOne never called in that case', userDeleteCalled === false);
  }
  reset();
  {
    // No faculty-deletion call exists anywhere in the DELETE handler — assert
    // Faculty.deleteOne/deleteMany are simply never invoked by this route.
    Department.findById = () => fakeQuery(fakeDoc({ _id: 'dept-1', name: 'Botany', hod: null }));
    Department.deleteOne = async () => ({ deletedCount: 1 });
    Faculty.countDocuments = () => fakeQuery(0);
    let facultyDeleteCalled = false;
    const origDeleteMany = Faculty.deleteMany;
    Faculty.deleteMany = async () => { facultyDeleteCalled = true; return {}; };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id', 'delete')({ params: { id: 'dept-1' } }, res);
    check('delete department with no HOD -> 200, no faculty touched', res.body.hodAccountDeleted === false && !facultyDeleteCalled, res.body);
    Faculty.deleteMany = origDeleteMany;
  }

  reset();
  {
    // Department still has faculty assigned to it (by departmentId or
    // legacy name) — deletion must be refused so no faculty profile is
    // left pointing at a department that no longer exists.
    Department.findById = () => fakeQuery(fakeDoc({ _id: 'dept-1', name: 'Botany', hod: null }));
    Faculty.countDocuments = () => fakeQuery(3);
    let deptDeleteCalled = false;
    Department.deleteOne = async () => { deptDeleteCalled = true; return { deletedCount: 1 }; };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id', 'delete')({ params: { id: 'dept-1' } }, res);
    check('delete blocked (409) while faculty are still assigned', res.statusCode === 409 && res.body.facultyInUse === 3, res.body);
    check('department not deleted when in use', deptDeleteCalled === false);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 9. PUT /:id/hod — reassignment preserves the department, creates/attaches
  //    the new HOD, and revokes (but does not delete) the old HOD's access
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    const deptDoc = fakeDoc({ _id: 'dept-1', name: 'Zoology', hod: 'old-hod' });
    Department.findById = () => fakeQuery(deptDoc);
    User.findOne = () => fakeQuery(null); // new email not in use
    User.create = async (arr) => { rec.userCreates++; return [fakeDoc({ _id: 'new-hod', ...arr[0] })]; };
    let revokeUpdateQuery = null, revokeUpdateSet = null;
    User.updateOne = async (q, set) => { revokeUpdateQuery = q; revokeUpdateSet = set; return { modifiedCount: 1 }; };
    let userDeleteCalled = false;
    User.deleteOne = async () => { userDeleteCalled = true; return { deletedCount: 1 }; };

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id/hod', 'put')(
      { params: { id: 'dept-1' }, body: { hodEmail: 'new.hod@example.com', hodFullName: 'New Head' }, user: { _id: 'admin1' } },
      res
    );

    check('reassignment -> 200', res.body.message === 'HOD reassigned successfully', res.body);
    check('department.hod updated to new user id', deptDoc.hod === 'new-hod', deptDoc.hod);
    check('department preserved (same id/name), not recreated', res.body.department._id === 'dept-1' && res.body.department.name === 'Zoology');
    check('new HOD account created with role "hod"', rec.userCreates === 1);
    check('old HOD account revoked (department cleared) via updateOne, not deleted', revokeUpdateQuery && revokeUpdateQuery._id === 'old-hod' && revokeUpdateSet.$set.department === null, { revokeUpdateQuery, revokeUpdateSet });
    check('old HOD account was never deleted', userDeleteCalled === false);
  }

  // ───────────────────────────────────────────────────────────────────────
  // 10. PUT /:id/hod — reassigning to an existing HOD account already
  //     assigned elsewhere is rejected, so that account is never silently
  //     stolen/deleted out from under its current department
  // ───────────────────────────────────────────────────────────────────────
  reset();
  {
    const deptDoc = fakeDoc({ _id: 'dept-1', name: 'Zoology', hod: 'old-hod' });
    Department.findById = () => fakeQuery(deptDoc);
    User.findOne = (q) => fakeQuery(q.role === 'hod' ? fakeDoc({ _id: 'busy-hod', role: 'hod' }) : null);
    Department.findOne = () => fakeQuery({ _id: 'other-dept' }); // already assigned elsewhere

    const res = fakeRes();
    await handlerFor(departmentsRouter, '/:id/hod', 'put')(
      { params: { id: 'dept-1' }, body: { hodUserId: 'busy-hod' }, user: { _id: 'admin1' } },
      res
    );
    check('reassign to an already-assigned HOD -> 409, department.hod unchanged', res.statusCode === 409 && deptDoc.hod === 'old-hod', { status: res.statusCode, hod: deptDoc.hod });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
