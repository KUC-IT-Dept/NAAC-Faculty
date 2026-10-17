// Phase 5 harness: institutional accounts (librarian, mmttc_director).
// REAL routes/middleware/controllers; only Mongoose models are faked
// (no MongoDB is reachable in the dev sandbox - same approach as phases 0-4).
process.env.JWT_SECRET = 'harness-phase5-secret';
const path = require('path');
const Module = require('module');
const SERVER = path.resolve(__dirname, '../..');
const { makeUserModel, makeRecordModel, stub } = require('./fakes');

const User = makeUserModel();
const LibraryRecord = makeRecordModel();
const MMTTCRecord = makeRecordModel();
const FAKES = new Map([
  [path.join(SERVER, 'auth/models/User.model.js'), User],
  [path.join(SERVER, 'modules/library/models/LibraryRecord.js'), LibraryRecord],
  [path.join(SERVER, 'modules/mmttc/models/MMTTCRecord.js'), MMTTCRecord],
  [path.join(SERVER, 'modules/faculty/models/Faculty.js'), stub],
  [path.join(SERVER, 'modules/faculty/models/DropdownConfig.js'), stub],
  [path.join(SERVER, 'modules/faculty/models/OptionRequest.js'), stub],
  [path.join(SERVER, 'modules/faculty/models/Department.js'), stub],
  [path.join(SERVER, 'modules/student/models/StudentProfile.js'), stub],
]);
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  try {
    const resolved = Module._resolveFilename(request, parent, isMain);
    if (FAKES.has(resolved)) return FAKES.get(resolved);
  } catch { /* fall through */ }
  return origLoad.apply(this, arguments);
};

const express = require(path.join(SERVER, 'node_modules/express'));
const request = require(path.join(SERVER, 'node_modules/supertest'));
const jwt = require(path.join(SERVER, 'node_modules/jsonwebtoken'));
const bcrypt = require(path.join(SERVER, 'node_modules/bcryptjs'));

const app = express();
app.use(express.json());
app.use('/api/faculty/auth', require(path.join(SERVER, 'modules/faculty/routes/auth.js')));
app.use('/api/faculty/admin', require(path.join(SERVER, 'modules/faculty/routes/admin.js')));
app.use('/api/faculty/directory', require(path.join(SERVER, 'modules/faculty/routes/directory.js')));
app.use('/api/faculty/departments', require(path.join(SERVER, 'modules/faculty/routes/departments.js')));
app.use('/api/library', require(path.join(SERVER, 'modules/library/routes/library.routes.js')));
app.use('/api/mmttc', require(path.join(SERVER, 'modules/mmttc/routes/mmttc.routes.js')));

let passed = 0, failed = 0;
const check = (label, cond, extra) => {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
};
const tok = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const A = '/api/faculty/admin/institutional-accounts';
const as = (r, u) => r.set('Authorization', `Bearer ${tok(u)}`);

(async () => {
  User.__reset();
  const superadmin = User.__seed({ role: 'superadmin', email: 'sa@x.edu', username: 'sa' });
  const adminRole  = User.__seed({ role: 'admin', email: 'ad@x.edu', username: 'ad' });
  const vc         = User.__seed({ role: 'vc', email: 'vc@x.edu', username: 'vc' });
  const hod        = User.__seed({ role: 'hod', email: 'hod@x.edu', username: 'hod' });
  const faculty    = User.__seed({ role: 'faculty', email: 'f@x.edu', username: 'f' });
  const student    = User.__seed({ role: 'student', email: 's@x.edu', username: 's' });
  const iqac       = User.__seed({ role: 'iqac_director', email: 'iq@x.edu', username: 'iq' });
  const staffLib   = User.__seed({ role: 'staff', email: 'sl@x.edu', username: 'sl', modulePermissions: ['library'] });
  const facMmttc   = User.__seed({ role: 'faculty', email: 'fm@x.edu', username: 'fm', modulePermissions: ['mmttc'] });

  // ===== 1. Unauthorized account creation =====
  let r = await request(app).post(`${A}/librarian`).send({ name: 'Lib Rarian', email: 'lib@x.edu' });
  check('create librarian, no token -> 401', r.status === 401, r.body);
  for (const [label, u] of [['faculty', faculty], ['hod', hod], ['vc', vc], ['student', student], ['iqac_director', iqac], ['staff', staffLib]]) {
    r = await as(request(app).post(`${A}/librarian`), u).send({ name: 'Lib Rarian', email: 'lib@x.edu' });
    check(`create librarian as ${label} -> 403`, r.status === 403, r.body);
  }
  r = await as(request(app).get(A), vc);
  check('list institutional accounts as vc (passes router-level adminOrVc) -> still 403', r.status === 403, r.body);
  check('no librarian/mmttc account exists after denied attempts', !User.__all().some((u) => u.role === 'librarian' || u.role === 'mmttc_director'));

  // ===== 2. Authorized creation + correct role assignment =====
  r = await as(request(app).post(`${A}/librarian`), superadmin).send({ name: 'Lib Rarian', email: 'Lib@X.edu', phone: '9876543210', role: 'superadmin', modulePermissions: ['library', 'mmttc'], isActive: false });
  check('superadmin creates librarian -> 201', r.status === 201, r.body);
  check('role forced to librarian despite forged body role', r.body.account && r.body.account.role === 'librarian', r.body);
  check('forged modulePermissions/isActive ignored', (() => { const d = User.__all().find((u) => u.email === 'lib@x.edu'); return d && d.modulePermissions.length === 0 && d.isActive === true; })());
  check('email normalised to lowercase', r.body.account && r.body.account.email === 'lib@x.edu', r.body);
  check('temporary password returned once', typeof r.body.temporaryPassword === 'string' && r.body.temporaryPassword.length >= 10, r.body);
  check('response leaks no password/hash fields', !JSON.stringify(r.body.account).match(/password|hash|otp/i), r.body.account);
  const libPw = r.body.temporaryPassword;
  check('stored password is a bcrypt hash, not plaintext', (() => { const d = User.__all().find((u) => u.email === 'lib@x.edu'); return d.password !== libPw && d.password.startsWith('$2'); })());

  r = await as(request(app).post(`${A}/mmttc_director`), adminRole).send({ name: 'Dr Director', email: 'mmttc@x.edu' });
  check("'admin' role creates mmttc_director -> 201", r.status === 201 && r.body.account.role === 'mmttc_director', r.body);
  const mmPw = r.body.temporaryPassword;

  // ===== 3. Validation / duplicates / bad type =====
  r = await as(request(app).post(`${A}/librarian`), superadmin).send({ name: 'Second Lib', email: 'lib2@x.edu' });
  check('second librarian rejected (one account per role) -> 409', r.status === 409, r.body);
  r = await as(request(app).post(`${A}/mmttc_director`), superadmin).send({ name: 'Dup Email', email: 'lib@x.edu' });
  check('mmttc_director with librarian email rejected -> 409', r.status === 409, r.body);
  r = await as(request(app).post(`${A}/superadmin`), superadmin).send({ name: 'Evil', email: 'evil@x.edu' });
  check('creating via type "superadmin" -> 404 (role never client-chosen)', r.status === 404, r.body);
  r = await as(request(app).post(`${A}/__proto__`), superadmin).send({ name: 'Evil', email: 'evil@x.edu' });
  check('prototype-key type -> 404', r.status === 404, r.body);
  User.__all().splice(User.__all().findIndex((u) => u.role === 'mmttc_director'), 1);
  r = await as(request(app).post(`${A}/mmttc_director`), superadmin).send({ name: 'X', email: 'not-an-email' });
  check('invalid email -> 400', r.status === 400, r.body);
  r = await as(request(app).post(`${A}/mmttc_director`), superadmin).send({ name: '', email: 'ok@x.edu' });
  check('empty name -> 400', r.status === 400, r.body);
  r = await as(request(app).post(`${A}/mmttc_director`), superadmin).send({ name: 'Dr Director', email: 'ok@x.edu', phone: '12ab' });
  check('bad phone -> 400', r.status === 400, r.body);
  r = await as(request(app).post(`${A}/mmttc_director`), superadmin).send({ name: 'Dr Director', email: 'mmttc@x.edu' });
  check('re-create mmttc_director -> 201', r.status === 201, r.body);
  const mmPw2 = r.body.temporaryPassword;

  // ===== 4. View / edit =====
  r = await as(request(app).get(A), superadmin);
  check('GET lists both accounts', r.status === 200 && r.body.librarian && r.body.mmttc_director, r.body);
  check('GET response leaks no password/hash', !JSON.stringify(r.body).match(/password|\$2[aby]\$/i), r.body);
  r = await as(request(app).patch(`${A}/librarian`), superadmin).send({ name: 'Renamed Lib', phone: '9999999999', role: 'superadmin', password: 'hacked1234', isActive: false, modulePermissions: ['mmttc'] });
  check('edit librarian name/phone -> 200', r.status === 200 && r.body.account.name === 'Renamed Lib' && r.body.account.phone === '9999999999', r.body);
  const libDoc = () => User.__all().find((u) => u.email === 'lib@x.edu');
  check('edit cannot change role/password/status/modulePermissions', libDoc().role === 'librarian' && libDoc().isActive === true && libDoc().modulePermissions.length === 0 && libDoc().password.startsWith('$2'));
  r = await as(request(app).patch(`${A}/librarian`), superadmin).send({ email: 'mmttc@x.edu' });
  check('edit email to one already used -> 409', r.status === 409, r.body);
  r = await as(request(app).patch(`${A}/librarian`), faculty).send({ name: 'Nope Nope' });
  check('edit as faculty -> 403', r.status === 403, r.body);

  // ===== 5. Login + landing role =====
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'lib@x.edu', password: libPw });
  check('librarian login with temp password -> 200 + token', r.status === 200 && r.body.token, r.body);
  check('login returns role librarian (frontend routes to /institutional/library)', r.body.user && r.body.user.role === 'librarian', r.body);
  const tLib = r.body.token;
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'mmttc@x.edu', password: mmPw2 });
  check('mmttc_director login -> 200, role mmttc_director', r.status === 200 && r.body.user.role === 'mmttc_director', r.body);
  const tMm = r.body.token;
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'lib@x.edu', password: 'wrong-password' });
  check('wrong password -> 401', r.status === 401, r.body);
  check('old (discarded) temp password of first mmttc attempt not usable', (await bcrypt.compare(mmPw, User.__all().find((u) => u.role === 'mmttc_director').password)) === false);
  r = await request(app).get('/api/faculty/auth/me').set('Authorization', `Bearer ${tLib}`);
  check('/auth/me for librarian -> role librarian, no password', r.status === 200 && r.body.user.role === 'librarian' && !('password' in r.body.user), r.body);

  // ===== 6. Module access + cross-module denial =====
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tLib}`);
  check('librarian -> /api/library 200', r.status === 200, r.body);
  r = await request(app).post('/api/library').set('Authorization', `Bearer ${tLib}`).send({ academicYear: '2025-2026' });
  check('librarian can create Library record', r.status === 201, r.body);
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tLib}`);
  check('librarian -> /api/mmttc 403', r.status === 403, r.body);
  r = await request(app).post('/api/mmttc').set('Authorization', `Bearer ${tLib}`).send({ academicYear: '2025-2026' });
  check('librarian POST /api/mmttc 403', r.status === 403, r.body);
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tMm}`);
  check('mmttc_director -> /api/mmttc 200', r.status === 200, r.body);
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tMm}`);
  check('mmttc_director -> /api/library 403', r.status === 403, r.body);
  r = await request(app).delete('/api/library/2025-2026').set('Authorization', `Bearer ${tMm}`);
  check('mmttc_director DELETE /api/library 403', r.status === 403, r.body);
  r = await request(app).get('/api/library').set('x-role', 'superadmin').set('x-module-permissions', 'library,mmttc').set('Authorization', `Bearer ${tMm}`).query({ role: 'librarian' });
  check('forged headers/query do not open Library to mmttc_director', r.status === 403, r.body);

  // stray modulePermissions on an institutional account must not open a second module
  User.__all().find((u) => u.role === 'librarian').modulePermissions = ['mmttc'];
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tLib}`);
  check('librarian with stray modulePermissions:["mmttc"] still 403 on MMTTC', r.status === 403, r.body);
  User.__all().find((u) => u.role === 'librarian').modulePermissions = [];

  // ===== 7. Superadmin-only / restricted endpoints =====
  const restricted = [
    ['get', '/api/faculty/admin/faculty'], ['get', '/api/faculty/admin/stats'],
    ['get', '/api/faculty/admin/special-responsibilities'], ['put', '/api/faculty/admin/special-responsibilities/x'],
    ['get', A], ['post', `${A}/librarian`], ['post', `${A}/mmttc_director`], ['patch', `${A}/librarian/deactivate`],
    ['post', `${A}/librarian/reset-password`],
    ['get', '/api/faculty/directory'], ['get', '/api/faculty/directory/tree'], ['get', '/api/faculty/directory/export'],
    ['get', '/api/faculty/departments'], ['get', '/api/faculty/departments/CS/overview'], ['get', '/api/faculty/departments/CS/faculty'],
  ];
  for (const [who, t] of [['librarian', tLib], ['mmttc_director', tMm]]) {
    let allDenied = true; const bad = [];
    for (const [m, url] of restricted) {
      const rr = await request(app)[m](url).set('Authorization', `Bearer ${t}`).send({});
      if (rr.status !== 403) { allDenied = false; bad.push(`${m} ${url} -> ${rr.status}`); }
    }
    check(`${who} denied (403) on ${restricted.length} admin/directory/department endpoints`, allDenied, bad);
  }

  // ===== 8. Deactivation =====
  r = await as(request(app).patch(`${A}/librarian/deactivate`), superadmin);
  check('deactivate librarian -> 200, isActive false', r.status === 200 && r.body.account.isActive === false, r.body);
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tLib}`);
  check('deactivated librarian: existing token rejected on /api/library -> 403', r.status === 403, r.body);
  r = await request(app).get('/api/faculty/auth/me').set('Authorization', `Bearer ${tLib}`);
  check('deactivated librarian: existing token rejected on /auth/me -> 403', r.status === 403, r.body);
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'lib@x.edu', password: libPw });
  check('deactivated librarian cannot log in -> 403', r.status === 403, r.body);
  r = await as(request(app).patch(`${A}/librarian/reactivate`), superadmin);
  check('reactivate librarian -> 200', r.status === 200 && r.body.account.isActive === true, r.body);
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tLib}`);
  check('reactivated librarian regains Library access', r.status === 200, r.body);
  r = await as(request(app).patch(`${A}/mmttc_director/deactivate`), faculty);
  check('deactivate as faculty -> 403', r.status === 403, r.body);

  // ===== 9. Password reset =====
  r = await as(request(app).post(`${A}/librarian/reset-password`), superadmin);
  check('reset password -> 200 with new temp password', r.status === 200 && r.body.temporaryPassword && r.body.temporaryPassword !== libPw, r.body);
  const newPw = r.body.temporaryPassword;
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'lib@x.edu', password: libPw });
  check('old password no longer works -> 401', r.status === 401, r.body);
  r = await request(app).post('/api/faculty/auth/login').send({ username: 'lib@x.edu', password: newPw });
  check('new temp password works -> 200', r.status === 200, r.body);
  r = await as(request(app).post(`${A}/librarian/reset-password`), hod);
  check('reset as hod -> 403', r.status === 403, r.body);

  // ===== 10. Regression: existing roles =====
  const tokens = Object.fromEntries([['superadmin', superadmin], ['iqac', iqac], ['staffLib', staffLib], ['facMmttc', facMmttc], ['faculty', faculty], ['hod', hod], ['vc', vc], ['student', student]].map(([k, u]) => [k, tok(u)]));
  const get = async (url, t) => (await request(app).get(url).set('Authorization', `Bearer ${t}`)).status;
  check('superadmin -> library 200', await get('/api/library', tokens.superadmin) === 200);
  check('superadmin -> mmttc 200', await get('/api/mmttc', tokens.superadmin) === 200);
  check('iqac_director -> library 200', await get('/api/library', tokens.iqac) === 200);
  check('iqac_director -> mmttc 200', await get('/api/mmttc', tokens.iqac) === 200);
  check('staff with library permission -> library 200', await get('/api/library', tokens.staffLib) === 200);
  check('staff with library permission -> mmttc 403', await get('/api/mmttc', tokens.staffLib) === 403);
  check('faculty with mmttc permission -> mmttc 200', await get('/api/mmttc', tokens.facMmttc) === 200);
  check('faculty with mmttc permission -> library 403', await get('/api/library', tokens.facMmttc) === 403);
  check('plain faculty -> library 403', await get('/api/library', tokens.faculty) === 403);
  check('hod -> mmttc 403', await get('/api/mmttc', tokens.hod) === 403);
  check('vc -> library 403', await get('/api/library', tokens.vc) === 403);
  check('student -> library 403', await get('/api/library', tokens.student) === 403);
  check('superadmin -> /admin/faculty 200 (unchanged)', await get('/api/faculty/admin/faculty', tokens.superadmin) === 200);
  check('vc -> /admin/faculty 200 (unchanged adminOrVc)', await get('/api/faculty/admin/faculty', tokens.vc) === 200);
  check('hod -> /admin/faculty 403 (unchanged)', await get('/api/faculty/admin/faculty', tokens.hod) === 403);
  check('hod -> directory 200 (unchanged)', await get('/api/faculty/directory', tokens.hod) === 200);
  check('faculty -> directory 403 (unchanged)', await get('/api/faculty/directory', tokens.faculty) === 403);
  check('vc -> departments 200 (unchanged)', await get('/api/faculty/departments', tokens.vc) === 200);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
