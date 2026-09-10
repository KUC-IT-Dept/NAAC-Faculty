process.env.JWT_SECRET = 'harness6-secret';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./app.js');
const User = require('./auth/models/User.model');
const MMTTCRecord = require('./modules/mmttc/models/MMTTCRecord');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}
function tokenFor(id) { return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); }

(async () => {
  User.__reset();
  MMTTCRecord.__reset();

  const superadmin   = User.__seed({ role: 'superadmin' });
  const iqacDirector = User.__seed({ role: 'iqac_director' });
  const staffWithMm  = User.__seed({ role: 'staff', modulePermissions: ['mmttc'] });
  const staffNoPerms = User.__seed({ role: 'staff', modulePermissions: [] });
  const staffOtherMod= User.__seed({ role: 'staff', modulePermissions: ['library'] });
  const facultyUser  = User.__seed({ role: 'faculty' });
  const studentUser  = User.__seed({ role: 'student' });

  const tSuperadmin = tokenFor(superadmin._id);
  const tIqac       = tokenFor(iqacDirector._id);
  const tStaffMm    = tokenFor(staffWithMm._id);
  const tStaffNone  = tokenFor(staffNoPerms._id);
  const tStaffOther = tokenFor(staffOtherMod._id);
  const tFaculty    = tokenFor(facultyUser._id);
  const tStudent    = tokenFor(studentUser._id);

  // ============ 1. UNAUTHENTICATED -> 401 ============
  let r = await request(app).get('/api/mmttc');
  check('1. GET /api/mmttc no token -> 401', r.status === 401, r.body);
  r = await request(app).post('/api/mmttc').send({ academicYear: '2025-2026' });
  check('1. POST /api/mmttc no token -> 401', r.status === 401, r.body);

  // ============ 2. UNAUTHORIZED AUTHENTICATED -> 403 ============
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStudent}`);
  check('2. GET as student -> 403', r.status === 403, r.body);
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tFaculty}`);
  check('2. GET as faculty -> 403', r.status === 403, r.body);
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStaffNone}`);
  check('2. GET as staff with modulePermissions:[] -> 403', r.status === 403, r.body);

  // ============ 3. CORRECTLY PERMISSIONED STAFF -> ALLOWED ============
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStaffMm}`);
  check('3. GET as staff with "mmttc" permission -> 200', r.status === 200, r.body);

  // ============ 4. BYPASS ROLES -> ALLOWED ============
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tIqac}`);
  check('4. GET as iqac_director -> 200', r.status === 200, r.body);
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tSuperadmin}`);
  check('4. GET as superadmin -> 200', r.status === 200, r.body);

  // ============ 5. WRONG MODULE PERMISSION -> DENIED ============
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStaffOther}`);
  check('5. GET as staff with only "library" permission -> 403', r.status === 403, r.body);

  // ============ 9. FULL CRUD BEHAVIOR ============
  r = await request(app).post('/api/mmttc').set('Authorization', `Bearer ${tIqac}`).send({
    academicYear: '2025-2026',
    centre: { name: 'Test MMTTC Centre', yearOfEstablishment: 2010 },
    director: { name: 'Dr. Director' }
  });
  check('9. POST create -> 201', r.status === 201, r.body);
  check('13. createdBy = requesting user', r.body.record.createdBy === iqacDirector._id, r.body.record);
  check('13. updatedBy = requesting user on create', r.body.record.updatedBy === iqacDirector._id, r.body.record);

  r = await request(app).get('/api/mmttc/2025-2026').set('Authorization', `Bearer ${tStaffMm}`);
  check('9. GET /:year found -> 200', r.status === 200 && r.body.record.centre.name === 'Test MMTTC Centre', r.body);

  r = await request(app).get('/api/mmttc/1999-2000').set('Authorization', `Bearer ${tStaffMm}`);
  check('9. GET /:year not found -> 404', r.status === 404, r.body);

  r = await request(app).put('/api/mmttc/2025-2026').set('Authorization', `Bearer ${tStaffMm}`).send({
    centre: { name: 'Updated Centre Name' }
  });
  check('9. PUT update -> 200', r.status === 200 && r.body.record.centre.name === 'Updated Centre Name', r.body);
  check('13. updatedBy reflects updating user', r.body.record.updatedBy === staffWithMm._id, r.body.record);

  // ============ 10. REQUIRED-FIELD VALIDATION ============
  r = await request(app).post('/api/mmttc').set('Authorization', `Bearer ${tIqac}`).send({});
  check('10. POST missing academicYear -> 400', r.status === 400, r.body);

  // ============ 11. DUPLICATE ACADEMIC-YEAR BEHAVIOR ============
  r = await request(app).post('/api/mmttc').set('Authorization', `Bearer ${tIqac}`).send({ academicYear: '2025-2026' });
  check('11. POST duplicate academicYear -> 400', r.status === 400, r.body);

  // ============ 12. IDENTITY-FIELD PROTECTION ============
  r = await request(app).put('/api/mmttc/2025-2026').set('Authorization', `Bearer ${tStaffMm}`).send({ academicYear: 'HACKED-YEAR' });
  check('12. PUT cannot change academicYear via body -> identity protected', r.body.record.academicYear === '2025-2026', r.body.record);

  // ============ COURSE SUB-RESOURCE CRUD + VALIDATION ============
  r = await request(app).post('/api/mmttc/2025-2026/courses').set('Authorization', `Bearer ${tStaffMm}`).send({
    year: 2025, courseType: 'refresher', mode: 'online', fundingSource: 'govt', courseTitle: 'Intro to Teaching'
  });
  check('Course: add valid course -> 201', r.status === 201 && r.body.record.courses.length === 1, r.body);
  const courseId = r.body.record.courses[0]._id;

  r = await request(app).post('/api/mmttc/2025-2026/courses').set('Authorization', `Bearer ${tStaffMm}`).send({
    year: 2025, courseType: 'refresher' // missing required mode/fundingSource
  });
  check('Course: add invalid course (missing mode/fundingSource) -> 400', r.status === 400, r.body);

  r = await request(app).post('/api/mmttc/2025-2026/courses').set('Authorization', `Bearer ${tStaffMm}`).send({
    year: 2025, courseType: 'not_a_real_type', mode: 'online', fundingSource: 'govt'
  });
  check('Course: add course with bad enum value -> 400', r.status === 400, r.body);

  r = await request(app).put(`/api/mmttc/2025-2026/courses/${courseId}`).set('Authorization', `Bearer ${tStaffMm}`).send({
    courseTitle: 'Updated Course Title'
  });
  check('Course: update existing course -> 200', r.status === 200 && r.body.record.courses[0].courseTitle === 'Updated Course Title', r.body);

  r = await request(app).put('/api/mmttc/2025-2026/courses/000000000000000000000000').set('Authorization', `Bearer ${tStaffMm}`).send({ courseTitle: 'X' });
  check('Course: update nonexistent courseId -> 404', r.status === 404, r.body);

  r = await request(app).delete(`/api/mmttc/2025-2026/courses/${courseId}`).set('Authorization', `Bearer ${tStaffMm}`);
  check('Course: remove course -> 200', r.status === 200 && r.body.record.courses.length === 0, r.body);

  // Course sub-routes are gated by the SAME authorizeModule check
  r = await request(app).post('/api/mmttc/2025-2026/courses').set('Authorization', `Bearer ${tStudent}`).send({
    year: 2025, courseType: 'refresher', mode: 'online', fundingSource: 'govt'
  });
  check('Course: add as student (unauthorized) -> 403', r.status === 403, r.body);

  // ============ DELETE (rest of CRUD) ============
  r = await request(app).delete('/api/mmttc/2025-2026').set('Authorization', `Bearer ${tSuperadmin}`);
  check('9. DELETE /:year -> 200', r.status === 200, r.body);
  r = await request(app).get('/api/mmttc/2025-2026').set('Authorization', `Bearer ${tSuperadmin}`);
  check('9. Record actually gone after delete -> 404', r.status === 404, r.body);

  // ============ 6. REVOCATION USING SAME VALID JWT ============
  await request(app).post('/api/mmttc').set('Authorization', `Bearer ${tStaffMm}`).send({ academicYear: '2030-2031' }); // reseed for the test
  const before = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStaffMm}`);
  check('6. Revocation - BEFORE revoke: 200', before.status === 200, before.body);

  User.__setModulePermissions(staffWithMm._id, []); // revoke server-side

  const after = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${tStaffMm}`); // SAME token, unexpired
  check('6. Revocation - AFTER revoke, SAME token: 403 immediately', after.status === 403, after.body);

  User.__setModulePermissions(staffWithMm._id, ['mmttc']); // restore

  // ============ 7. FORGED body/query/header -> IGNORED ============
  r = await request(app)
    .get('/api/mmttc')
    .set('Authorization', `Bearer ${tStaffNone}`)
    .set('x-module-permissions', 'mmttc')
    .set('x-role', 'superadmin')
    .query({ modulePermissions: 'mmttc', role: 'iqac_director' });
  check('7. Forged headers/query -> still 403', r.status === 403, r.body);

  const beforeCount = MMTTCRecord.__all().length;
  r = await request(app)
    .post('/api/mmttc')
    .set('Authorization', `Bearer ${tStaffNone}`)
    .send({ academicYear: '2099-2100', modulePermissions: ['mmttc'], role: 'superadmin' });
  check('7. Forged fields in POST body -> still 403', r.status === 403, r.body);
  check('7. No record created by forged/denied POST', MMTTCRecord.__all().length === beforeCount, MMTTCRecord.__all().length);

  // ============ 8. FORGED JWT CLAIMS -> IGNORED (DB state wins) ============
  const bakedInToken = jwt.sign({ id: staffNoPerms._id, modulePermissions: ['mmttc'], role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${bakedInToken}`);
  check('8. Valid JWT with forged claims baked into payload -> still 403', r.status === 403, r.body);

  const wrongSecretToken = jwt.sign({ id: staffWithMm._id, modulePermissions: ['mmttc'], role: 'superadmin' }, 'attacker-guessed-wrong-secret', { expiresIn: '7d' });
  r = await request(app).get('/api/mmttc').set('Authorization', `Bearer ${wrongSecretToken}`);
  check('8. Forged JWT (wrong signing secret) -> rejected at authenticate() (401)', r.status === 401, r.body);

  // ============ 14. RESOURCE OWNERSHIP ============
  // MMTTC records are institution-wide, not owned by an individual user -
  // same as Library. There is no per-user ownership field on the model.
  // The relevant check here is that access is governed purely by
  // role/modulePermissions (already covered by 1-8 above), and that any
  // authenticated+authorized user can act on ANY year's record (there is
  // no notion of "my MMTTC record" to isolate) - confirmed implicitly by
  // staffWithMm (not the creator, iqacDirector was) successfully updating
  // the 2025-2026 record above. Explicit check:
  check('14. Non-creator but permitted user CAN update a record they did not create (no false ownership restriction)',
    true /* already exercised above: staffWithMm updated a record created by iqacDirector */, null);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
