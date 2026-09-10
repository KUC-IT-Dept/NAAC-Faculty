const authorize = require('../../auth/middleware/authorize');
const { authorizeModule } = require('../../auth/middleware/authorize');
const { ROLES } = require('../../auth/constants/roles');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

function fakeRes() {
  const res = {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.body = o; return res; };
  return res;
}
function run(mw, user) {
  const req = { user };
  const res = fakeRes();
  let nextCalled = false;
  mw(req, res, () => { nextCalled = true; });
  return { nextCalled, status: res.statusCode, body: res.body };
}

// ============ EXISTING ROLE-BASED authorize() BEHAVIOR - MUST BE UNCHANGED ============

// 1. No req.user at all -> 401 (existing behavior)
let r = run(authorize(ROLES.SUPERADMIN), undefined);
check('authorize(): no req.user -> 401, next NOT called', r.status === 401 && !r.nextCalled, r);

// 2. Allowed role -> next() called, no status set
r = run(authorize(ROLES.FACULTY, ROLES.HOD), { role: 'faculty' });
check('authorize(): allowed role -> next() called', r.nextCalled === true && r.status === undefined, r);

// 3. Disallowed role -> 403, next NOT called
r = run(authorize(ROLES.HOD), { role: 'student' });
check('authorize(): disallowed role -> 403, next NOT called', r.status === 403 && !r.nextCalled, r);

// 4. Role group spread usage (as used in comments/docs) still works
const { ROLE_GROUPS } = require('../../auth/constants/roles');
r = run(authorize(...ROLE_GROUPS.FACULTY_AND_ABOVE), { role: 'vc' });
check('authorize(): ROLE_GROUPS spread usage still works', r.nextCalled === true, r);

r = run(authorize(...ROLE_GROUPS.ADMIN_ONLY), { role: 'staff' });
check('authorize(): ROLE_GROUPS spread rejects non-member role', r.status === 403, r);

// 5. Message format unchanged (exact string check, since a hypothetical
//    future caller could depend on parsing/displaying it)
r = run(authorize(ROLES.HOD), { role: 'student' });
check('authorize(): 403 message format unchanged',
  r.body.message === "Access denied. Your role 'student' is not permitted. Required: hod.", r.body);

// ============ NEW authorizeModule() BEHAVIOR ============

// 6. No req.user -> 401
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), undefined);
check('authorizeModule(): no req.user -> 401', r.status === 401 && !r.nextCalled, r);

// 7. Bypass role (iqac_director) -> allowed regardless of modulePermissions
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN), { role: 'iqac_director' });
check('authorizeModule(): bypass role (iqac_director) -> next() called', r.nextCalled === true, r);

r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN), { role: 'superadmin' });
check('authorizeModule(): bypass role (superadmin) -> next() called', r.nextCalled === true, r);

// 8. BACKWARD COMPATIBILITY: user with NO modulePermissions field at all
//    (simulates a JWT/user object from before this phase)
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'staff' });
check('authorizeModule(): staff with undefined modulePermissions -> 403 (no crash)', r.status === 403 && !r.nextCalled, r);

// 9. User with modulePermissions field present but empty array
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'staff', modulePermissions: [] });
check('authorizeModule(): staff with empty modulePermissions [] -> 403', r.status === 403 && !r.nextCalled, r);

// 10. Permitted: staff WITH the specific module permission
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'staff', modulePermissions: ['library', 'mmttc'] });
check('authorizeModule(): staff WITH "library" permission -> next() called', r.nextCalled === true, r);

// 11. Denied: staff with a DIFFERENT module permission, not this one
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'staff', modulePermissions: ['mmttc'] });
check('authorizeModule(): staff with only "mmttc" -> denied for "library"', r.status === 403 && !r.nextCalled, r);

// 12. A role NOT in bypassRoles and NOT holding the permission is denied,
//     even a normally-privileged role, if not explicitly listed as bypass
//     and not granted the permission (role checks and permission checks
//     are each explicit, no implicit hierarchy)
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'hod', modulePermissions: [] });
check('authorizeModule(): hod (not a bypass role here, no permission) -> 403', r.status === 403 && !r.nextCalled, r);

// ============ MANIPULATION RESISTANCE ============
// An attacker who can only control the REQUEST (query/body/headers), not
// req.user (which is set exclusively by decoding a server-signed JWT),
// cannot self-grant a role or a modulePermission via any request field.
// Simulate an attacker whose JWT-decoded identity is genuinely "student"
// but who stuffs extra claims into the request body/query trying to
// impersonate elevated access.

function simulateRequestWithForgedFields(decodedJwtUser, forgedRequestData) {
  // This is exactly how authenticate() populates req.user: only from the
  // verified JWT payload. Attacker-controlled req.body/req.query is never
  // read by authorize()/authorizeModule() - they only ever read req.user.
  const req = { user: decodedJwtUser, body: forgedRequestData, query: forgedRequestData };
  return req;
}

const attackerReq = simulateRequestWithForgedFields(
  { role: 'student', modulePermissions: [] },           // genuine decoded JWT
  { role: 'superadmin', modulePermissions: ['library'] } // forged body/query fields
);
let nextCalled = false;
const res2 = fakeRes();
authorizeModule('library', ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN)(attackerReq, res2, () => { nextCalled = true; });
check('Forged role/modulePermissions in req.body/req.query has NO effect (still 403)',
  res2.statusCode === 403 && !nextCalled, { status: res2.statusCode, body: res2.body });

// Same for authorize() - forged fields in body/query are never consulted
const attackerReq2 = simulateRequestWithForgedFields({ role: 'student' }, { role: 'superadmin' });
nextCalled = false;
const res3 = fakeRes();
authorize(ROLES.SUPERADMIN)(attackerReq2, res3, () => { nextCalled = true; });
check('authorize(): forged role in req.body has NO effect (still 403)',
  res3.statusCode === 403 && !nextCalled, { status: res3.statusCode, body: res3.body });

// Prototype-pollution-style attempt: forging modulePermissions as a
// non-array (e.g. a string) must not accidentally satisfy Array.includes
// via type coercion.
r = run(authorizeModule('library', ROLES.IQAC_DIRECTOR), { role: 'staff', modulePermissions: 'library' });
check('authorizeModule(): non-array modulePermissions (string) is safely rejected, not coerced', r.status === 403 && !r.nextCalled, r);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
