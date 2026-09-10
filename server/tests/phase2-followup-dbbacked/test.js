process.env.JWT_SECRET = 'harness4-secret';
const jwt = require('jsonwebtoken');
const authenticate = require('./auth/middleware/authenticate');
const authorize = require('./auth/middleware/authorize');
const { authorizeModule } = require('./auth/middleware/authorize');
const { auth: facultyAuth } = require('./modules/faculty/middleware/auth');
const { ROLES, ROLE_GROUPS } = require('./auth/constants/roles');
const User = require('./auth/models/User.model');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

function fakeRes(onSent) {
  const res = {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.body = o; if (onSent) onSent(); return res; };
  return res;
}

function runChain(middlewares, req) {
  return new Promise((resolve) => {
    let settled = false;
    const res = fakeRes(() => {
      if (settled) return;
      settled = true;
      resolve({ nextCalled: false, status: res.statusCode, body: res.body, req });
    });
    let i = 0;
    function next(err) {
      if (settled) return;
      if (err) { settled = true; return resolve({ error: err, status: res.statusCode, body: res.body, req }); }
      if (i >= middlewares.length) {
        settled = true;
        return resolve({ nextCalled: true, status: res.statusCode, body: res.body, req });
      }
      const mw = middlewares[i++];
      const maybePromise = mw(req, res, next);
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch((e) => { if (!settled) { settled = true; resolve({ error: e, status: res.statusCode, body: res.body, req }); } });
      }
    }
    next();
  });
}

function tokenFor(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

(async () => {
  User.__reset();

  // ============ SETUP: seed real DB-shaped users ============
  const staffLibrary = User.__seed({ role: 'staff', modulePermissions: ['library'] });
  const staffNoPerms = User.__seed({ role: 'staff', modulePermissions: [] });
  const staffLegacy  = User.__seed({ role: 'staff' }); delete staffLegacy.modulePermissions; // simulate pre-Phase-2 doc, field truly absent
  const iqacDirector = User.__seed({ role: 'iqac_director' });
  const inactiveUser = User.__seed({ role: 'staff', modulePermissions: ['library'], isActive: false });
  const facultyUser  = User.__seed({ role: 'faculty', username: 'profx' });
  const studentIsh   = User.__seed({ role: 'student' });

  // ============ 1. EXISTING ROLE-BASED authorize() STILL PASSES (repeat of Phase 2 checks, now through real authenticate()) ============
  {
    const token = tokenFor(iqacDirector._id, 'iqac_director');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorize(ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN)], req);
    check('authorize(): iqac_director through real authenticate() -> allowed', r.nextCalled === true, r);
  }
  {
    const token = tokenFor(studentIsh._id, 'student');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorize(ROLES.IQAC_DIRECTOR)], req);
    check('authorize(): student through real authenticate() -> 403 denied', r.status === 403, r);
  }
  {
    const req = { headers: {} };
    const r = await runChain([authenticate, authorize(ROLES.IQAC_DIRECTOR)], req);
    check('authorize(): no auth header -> 401 (authenticate rejects first)', r.status === 401, r);
  }
  {
    const r = await runChain([authorize(ROLES.SUPERADMIN)], {}); // req.user never set
    check('authorize(): still 401 if authenticate() skipped entirely (defense in depth)', r.status === 401, r);
  }

  // ============ 2. BACKWARD COMPATIBILITY: user with NO modulePermissions field at all ============
  {
    const token = tokenFor(staffLegacy._id, 'staff');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('Legacy user (no modulePermissions field) -> 403, no crash', r.status === 403 && !r.error, r);
  }

  // ============ 3. staff with modulePermissions:["library"] passes authorizeModule("library") ============
  {
    const token = tokenFor(staffLibrary._id, 'staff');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('staff with modulePermissions:["library"] -> authorizeModule("library") allowed', r.nextCalled === true, r);
    check('req.user.modulePermissions reflects live DB value (not JWT)', JSON.stringify(r.req.user.modulePermissions) === JSON.stringify(['library']), r.req && r.req.user);
  }

  // ============ 4. Same user CANNOT pass authorizeModule("mmttc") ============
  {
    const token = tokenFor(staffLibrary._id, 'staff');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorizeModule('mmttc', ROLES.IQAC_DIRECTOR)], req);
    check('Same staff user (library only) -> authorizeModule("mmttc") denied 403', r.status === 403, r);
  }

  // ============ 5. Bypass roles still work ============
  {
    const token = tokenFor(iqacDirector._id, 'iqac_director');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN)], req);
    check('iqac_director bypass role -> authorizeModule("library") allowed w/o explicit permission', r.nextCalled === true, r);
  }

  // ============ 6. REVOCATION TAKES EFFECT WITHOUT WAITING FOR JWT EXPIRY ============
  {
    const token = tokenFor(staffLibrary._id, 'staff'); // token signed once, reused across both checks below
    const reqBefore = { headers: { authorization: `Bearer ${token}` } };
    const before = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], reqBefore);
    check('Revocation test - BEFORE revoke: access allowed', before.nextCalled === true, before);

    // Revoke server-side (simulates an admin removing the permission in the DB)
    User.__setModulePermissions(staffLibrary._id, []);

    const reqAfter = { headers: { authorization: `Bearer ${token}` } }; // SAME still-valid, unexpired token
    const after = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], reqAfter);
    check('Revocation test - AFTER revoke, SAME unexpired token: access now denied (no JWT wait needed)', after.status === 403, after);

    // restore for cleanliness of subsequent assertions (not required, but tidy)
    User.__setModulePermissions(staffLibrary._id, ['library']);
  }

  // ============ 6b. Deactivation also takes effect immediately (isActive, same mechanism) ============
  {
    const token = tokenFor(inactiveUser._id, 'staff');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('Deactivated user (isActive:false) -> authenticate() itself rejects with 403, never reaches authorizeModule', r.status === 403, r);
  }

  // ============ 7. FORGED body/query/headers CANNOT grant access ============
  {
    const token = tokenFor(staffNoPerms._id, 'staff');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
        'x-module-permissions': 'library,mmttc',
        'x-role': 'superadmin'
      },
      body: { modulePermissions: ['library'], role: 'superadmin' },
      query: { modulePermissions: 'library', role: 'iqac_director' }
    };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('Forged body/query/header fields have NO effect - still 403 (real DB state wins)', r.status === 403, r);
  }
  {
    // Attacker crafts their OWN JWT locally (no valid secret) claiming modulePermissions inside the payload itself
    const forgedToken = jwt.sign({ id: staffNoPerms._id, role: 'staff', modulePermissions: ['library'] }, 'wrong-secret-attacker-guessed', { expiresIn: '7d' });
    const req = { headers: { authorization: `Bearer ${forgedToken}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('Forged JWT (wrong signing secret, permissions stuffed into payload) -> rejected at authenticate() itself (401)', r.status === 401, r);
  }
  {
    // Even a VALID token (correct secret) with modulePermissions baked into the JWT payload is IGNORED,
    // because authenticate() replaces req.user with the fresh DB document, not the decoded payload.
    const tokenWithBakedInPerms = jwt.sign({ id: staffNoPerms._id, role: 'staff', modulePermissions: ['library', 'mmttc'] }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const req = { headers: { authorization: `Bearer ${tokenWithBakedInPerms}` } };
    const r = await runChain([authenticate, authorizeModule('library', ROLES.IQAC_DIRECTOR)], req);
    check('Valid JWT with modulePermissions baked into payload is IGNORED (DB state, not JWT, wins) -> still 403', r.status === 403, r);
  }

  // ============ 8. Student/Faculty authentication still works ============
  {
    // Faculty path: through the ALREADY-existing modules/faculty/middleware/auth.js (untouched file)
    const token = tokenFor(facultyUser._id, 'faculty'); // faculty JWTs are signed with {id, role, username}
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([facultyAuth], req);
    check('Faculty middleware (untouched) still authenticates correctly', r.nextCalled === true && r.req.user.role === 'faculty', r);
    check('Faculty middleware req.user now also carries modulePermissions (schema field, unrelated to any code change there)', Array.isArray(r.req.user.modulePermissions), r.req && r.req.user);
  }
  {
    // Generic authenticate() path (upgraded file) works the same way for any role, incl. what would be a student-shaped id/role pair
    const token = tokenFor(studentIsh._id, 'student');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const r = await runChain([authenticate], req);
    check('authenticate() authenticates a student-role user correctly too', r.nextCalled === true && r.req.user.role === 'student', r);
  }
  {
    // Malformed header
    const r = await runChain([authenticate], { headers: { authorization: 'NotBearer sometoken' } });
    check('authenticate(): malformed header -> 401', r.status === 401, r);
  }
  {
    // Unknown user id (token valid, user deleted from DB since)
    const token = tokenFor('does-not-exist', 'staff');
    const r = await runChain([authenticate], { headers: { authorization: `Bearer ${token}` } });
    check('authenticate(): valid token, deleted/unknown user -> 401', r.status === 401, r);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
