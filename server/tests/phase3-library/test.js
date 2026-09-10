process.env.JWT_SECRET = 'harness5-secret';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./app.js');
const User = require('./auth/models/User.model');
const LibraryRecord = require('./modules/library/models/LibraryRecord');
const { ROLES } = require('./auth/constants/roles');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}
function tokenFor(id) { return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); }

(async () => {
  User.__reset();
  LibraryRecord.__reset();

  const superadmin   = User.__seed({ role: 'superadmin' });
  const iqacDirector = User.__seed({ role: 'iqac_director' });
  const staffWithLib = User.__seed({ role: 'staff', modulePermissions: ['library'] });
  const staffNoPerms = User.__seed({ role: 'staff', modulePermissions: [] });
  const staffOtherMod= User.__seed({ role: 'staff', modulePermissions: ['mmttc'] });
  const facultyUser  = User.__seed({ role: 'faculty' });
  const studentUser  = User.__seed({ role: 'student' });

  const tSuperadmin = tokenFor(superadmin._id);
  const tIqac       = tokenFor(iqacDirector._id);
  const tStaffLib   = tokenFor(staffWithLib._id);
  const tStaffNone  = tokenFor(staffNoPerms._id);
  const tStaffOther = tokenFor(staffOtherMod._id);
  const tFaculty    = tokenFor(facultyUser._id);
  const tStudent    = tokenFor(studentUser._id);

  // ============ 1. UNAUTHENTICATED -> 401 ============
  let r = await request(app).get('/api/library');
  check('GET /api/library no token -> 401', r.status === 401, r.body);

  r = await request(app).post('/api/library').send({ academicYear: '2025-2026' });
  check('POST /api/library no token -> 401', r.status === 401, r.body);

  // ============ 2. AUTHENTICATED BUT UNAUTHORIZED -> 403 ============
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tStudent}`);
  check('GET /api/library as student -> 403', r.status === 403, r.body);

  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tFaculty}`);
  check('GET /api/library as faculty (no bypass, no permission) -> 403', r.status === 403, r.body);

  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tStaffNone}`);
  check('GET /api/library as staff with modulePermissions:[] -> 403', r.status === 403, r.body);

  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tStaffOther}`);
  check('GET /api/library as staff with only "mmttc" permission -> 403', r.status === 403, r.body);

  // ============ 3. BYPASS ROLES ALLOWED ============
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tIqac}`);
  check('GET /api/library as iqac_director -> 200', r.status === 200, r.body);

  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tSuperadmin}`);
  check('GET /api/library as superadmin -> 200', r.status === 200, r.body);

  // ============ 4. PERMITTED STAFF ALLOWED ============
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${tStaffLib}`);
  check('GET /api/library as staff with "library" permission -> 200', r.status === 200, r.body);

  // ============ 5. CRUD FUNCTIONAL FLOW (as iqac_director) ============
  r = await request(app).post('/api/library').set('Authorization', `Bearer ${tIqac}`).send({
    academicYear: '2025-2026',
    librarian: { name: 'Dr. Test', qualifications: 'MLIS' },
    infrastructure: { totalFloorAreaSqFt: 5000 }
  });
  check('POST /api/library create -> 201', r.status === 201, r.body);
  check('Created record has createdBy = requesting user', r.body.record.createdBy === iqacDirector._id, r.body.record);

  r = await request(app).post('/api/library').set('Authorization', `Bearer ${tIqac}`).send({ academicYear: '2025-2026' });
  check('POST duplicate academicYear -> 400', r.status === 400, r.body);

  r = await request(app).post('/api/library').set('Authorization', `Bearer ${tIqac}`).send({});
  check('POST missing academicYear -> 400', r.status === 400, r.body);

  r = await request(app).get('/api/library/2025-2026').set('Authorization', `Bearer ${tStaffLib}`);
  check('GET /api/library/:year found -> 200', r.status === 200 && r.body.record.librarian.name === 'Dr. Test', r.body);

  r = await request(app).get('/api/library/1999-2000').set('Authorization', `Bearer ${tStaffLib}`);
  check('GET /api/library/:year not found -> 404', r.status === 404, r.body);

  r = await request(app).put('/api/library/2025-2026').set('Authorization', `Bearer ${tStaffLib}`).send({
    infrastructure: { totalFloorAreaSqFt: 7500 }
  });
  check('PUT /api/library/:year update -> 200', r.status === 200 && r.body.record.infrastructure.totalFloorAreaSqFt === 7500, r.body);
  check('updatedBy reflects the updating user', r.body.record.updatedBy === staffWithLib._id, r.body.record);

  r = await request(app).put('/api/library/2025-2026').set('Authorization', `Bearer ${tStaffLib}`).send({ academicYear: 'HACKED-YEAR' });
  check('PUT cannot change academicYear via body (identity protected)', r.body.record.academicYear === '2025-2026', r.body.record);

  r = await request(app).delete('/api/library/2025-2026').set('Authorization', `Bearer ${tSuperadmin}`);
  check('DELETE /api/library/:year -> 200', r.status === 200, r.body);

  r = await request(app).get('/api/library/2025-2026').set('Authorization', `Bearer ${tSuperadmin}`);
  check('Record actually gone after delete -> 404', r.status === 404, r.body);

  // ============ 6. REVOCATION WITHOUT WAITING FOR JWT EXPIRY ============
  const before = await request(app).get('/api/library').set('Authorization', `Bearer ${tStaffLib}`);
  check('Revocation test - BEFORE revoke: 200', before.status === 200, before.body);

  User.__setModulePermissions(staffWithLib._id, []); // revoke server-side

  const after = await request(app).get('/api/library').set('Authorization', `Bearer ${tStaffLib}`); // SAME token
  check('Revocation test - AFTER revoke, SAME token: 403', after.status === 403, after.body);

  User.__setModulePermissions(staffWithLib._id, ['library']); // restore for remaining tests

  // ============ 7. FORGED body/query/header PERMISSIONS HAVE NO EFFECT ============
  r = await request(app)
    .get('/api/library')
    .set('Authorization', `Bearer ${tStaffNone}`)
    .set('x-module-permissions', 'library')
    .set('x-role', 'superadmin')
    .query({ modulePermissions: 'library', role: 'iqac_director' });
  check('Forged headers/query on GET have no effect -> still 403', r.status === 403, r.body);

  r = await request(app)
    .post('/api/library')
    .set('Authorization', `Bearer ${tStaffNone}`)
    .send({ academicYear: '2030-2031', modulePermissions: ['library'], role: 'superadmin' });
  check('Forged fields in POST body have no effect -> still 403', r.status === 403, r.body);
  check('No record was created by the forged/denied POST', LibraryRecord.__all().length === 0, LibraryRecord.__all());

  // Valid JWT with permissions baked into the payload itself (not just DB) - still ignored,
  // since authenticate() replaces req.user with the fresh DB document.
  const bakedInToken = jwt.sign({ id: staffNoPerms._id, modulePermissions: ['library'], role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  r = await request(app).get('/api/library').set('Authorization', `Bearer ${bakedInToken}`);
  check('Valid JWT with forged claims baked into payload is ignored -> still 403 (DB state wins)', r.status === 403, r.body);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
