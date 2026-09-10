process.env.JWT_SECRET = 'harness-secret';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./app.js');

const Dropdown = require('./modules/student/models/Dropdown');
const Notification = require('./modules/student/models/Notification');
const ProfileUpdateRequest = require('./modules/student/models/ProfileUpdateRequest');
const ForgotPasswordRequest = require('./modules/student/models/ForgotPasswordRequest');
const StudentProfile = require('./modules/student/models/StudentProfile');
const User = require('./auth/models/User.model');

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS -', label); passed++; }
  else { console.log('FAIL -', label, extra !== undefined ? JSON.stringify(extra) : ''); failed++; }
}

function tokenFor(id, role = 'student') {
  return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

(async () => {
  // ================= DROPDOWNS =================
  Dropdown.__reset();
  let r = await request(app).get('/api/dropdowns');
  check('GET /api/dropdowns -> 404 when uninitialized', r.status === 404, r.body);

  r = await request(app).post('/api/dropdowns/init').send({ departments: ['CSE', 'ECE'] });
  check('POST /api/dropdowns/init -> 201', r.status === 201, r.body);

  r = await request(app).post('/api/dropdowns/init').send({ departments: ['X'] });
  check('POST /api/dropdowns/init second time -> 400 (already initialized)', r.status === 400, r.body);

  r = await request(app).get('/api/dropdowns');
  check('GET /api/dropdowns -> 200 success', r.status === 200 && r.body.success === true, r.body);
  check('GET /api/dropdowns data.departments includes CSE', (r.body.data.departments || []).includes('CSE'), r.body.data);

  r = await request(app).post('/api/dropdowns').send({ departments: ['Mech'] });
  check('POST /api/dropdowns adds value -> 200', r.status === 200, r.body);
  check('New value present after add', (r.body.data.departments || []).includes('Mech'), r.body.data);

  r = await request(app).post('/api/dropdowns').send({ notAKey: ['x'] });
  check('POST /api/dropdowns invalid key -> 400', r.status === 400, r.body);

  r = await request(app).delete('/api/dropdowns').send({ departments: ['Mech'] });
  check('DELETE /api/dropdowns removes value -> 200', r.status === 200, r.body);
  check('Value gone after delete', !(r.body.data.departments || []).includes('Mech'), r.body.data);

  r = await request(app).post('/api/dropdowns').send({ states: { Kerala: ['Kollam', 'Kannur'] } });
  check('POST /api/dropdowns states merge -> 200', r.status === 200, r.body);
  check('states.Kerala has both districts', (r.body.data.states.Kerala || []).includes('Kannur') && r.body.data.states.Kerala.includes('Kollam'), r.body.data.states);

  // ================= NOTIFICATIONS =================
  Notification.__reset();
  const studentId = 'stu-1';
  const studentToken = tokenFor(studentId);

  r = await request(app).get('/api/notifications');
  check('GET /api/notifications no token -> 401', r.status === 401, r.body);

  r = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
  check('GET /api/notifications authed empty -> 200, count 0', r.status === 200 && r.body.count === 0, r.body);

  await Notification.create({ studentId, title: 'T', message: 'M', type: 'info' });
  r = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
  check('GET /api/notifications after seeding -> count 1', r.body.count === 1, r.body);

  // another student's notification must not leak
  await Notification.create({ studentId: 'other-student', title: 'T2', message: 'M2' });
  r = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
  check('Notifications scoped to own studentId only (still 1, not 2)', r.body.count === 1, r.body);

  r = await request(app).delete('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
  check('DELETE /api/notifications (bulk) -> 200', r.status === 200, r.body);

  r = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
  check('Own notifications empty after delete', r.body.count === 0, r.body);

  check("Other student's notification untouched by bulk delete", Notification.__all().some(n => n.studentId === 'other-student'), Notification.__all());

  // ================= PROFILE UPDATE REQUEST =================
  ProfileUpdateRequest.__reset();

  r = await request(app).post('/api/profile-update-request').send({ updateType: 'field_correction', changes: [{ a: 1 }] });
  check('POST /api/profile-update-request no token -> 401', r.status === 401, r.body);

  r = await request(app).post('/api/profile-update-request')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ updateType: 'bogus', changes: [{ a: 1 }] });
  check('POST invalid updateType -> 400', r.status === 400, r.body);

  r = await request(app).post('/api/profile-update-request')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ updateType: 'field_correction', changes: [] });
  check('POST empty changes array -> 400', r.status === 400, r.body);

  r = await request(app).post('/api/profile-update-request')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ updateType: 'field_correction', changes: [{ section: 'personal', field: 'phone', requestedValue: '123' }], remarks: 'fix' });
  check('POST valid field_correction -> 201', r.status === 201, r.body);
  check('Created request status pending', r.body.request.status === 'pending', r.body.request);
  check('Created request stores updateType', r.body.request.updateType === 'field_correction', r.body.request);
  check('Created request requestNo starts with CORRECTION-', String(r.body.request.requestNo).startsWith('CORRECTION-'), r.body.request);

  r = await request(app).post('/api/profile-update-request')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ updateType: 'full_profile', changes: { personal_details: { fullName: 'X' } } });
  check('POST valid full_profile -> 201', r.status === 201, r.body);
  check('full_profile requestNo starts with PROFILE-', String(r.body.request.requestNo).startsWith('PROFILE-'), r.body.request);

  r = await request(app).get('/api/profile-update-request/my').set('Authorization', `Bearer ${studentToken}`);
  check('GET /my -> 200, count 2', r.status === 200 && r.body.count === 2, r.body);

  r = await request(app).get('/api/profile-update-request/my');
  check('GET /my no token -> 401', r.status === 401, r.body);

  // ================= FORGOT PASSWORD REQUEST =================
  ForgotPasswordRequest.__reset();
  User.__reset();
  const seededUser = User.__seed({ email: 'known@example.com', name: 'Known Student' });

  r = await request(app).post('/api/forgot-password-request').send({});
  check('POST /forgot-password-request missing email -> 400', r.status === 400, r.body);

  r = await request(app).post('/api/forgot-password-request').send({ email: 'unknown@example.com' });
  check('POST unknown email -> 404', r.status === 404, r.body);

  r = await request(app).post('/api/forgot-password-request').send({ email: 'known@example.com' });
  check('POST known email (no auth header needed) -> 201', r.status === 201, r.body);
  check('Notification side-effect created', Notification.__all().some(n => String(n.studentId) === String(seededUser._id) && n.title.includes('Password Reset Request Submitted')), Notification.__all());

  r = await request(app).post('/api/forgot-password-request').send({ email: 'known@example.com' });
  check('Duplicate pending request -> 400', r.status === 400, r.body);

  const knownToken = tokenFor(seededUser._id);
  r = await request(app).get('/api/forgot-password-request/my').set('Authorization', `Bearer ${knownToken}`);
  check('GET /forgot-password-request/my (authed) -> 200, count 1', r.status === 200 && r.body.count === 1, r.body);

  r = await request(app).get('/api/forgot-password-request/my');
  check('GET /forgot-password-request/my no token -> 401 (bug fixed vs old backend)', r.status === 401, r.body);

  // ================= DELETE PROFILE RECORD =================
  StudentProfile.__reset();
  const profStudentId = 'prof-stu-1';
  const profToken = tokenFor(profStudentId);
  const profile = await StudentProfile.create({
    userId: profStudentId,
    education_details: { education: [{ qualType: 'SSLC', institution: 'Test School' }], competitiveExams: [] },
    family_details: { siblings: [] },
    professional_details: { publications: [], conferences: [], experience: [], patents: [], membershipUrl: [] }
  });
  const recId = profile.education_details.education[0]._id;

  r = await request(app).delete(`/api/student/record/education/${recId}`);
  check('DELETE record no token -> 401', r.status === 401, r.body);

  r = await request(app).delete(`/api/student/record/notasection/${recId}`).set('Authorization', `Bearer ${profToken}`);
  check('DELETE record invalid section -> 400', r.status === 400, r.body);

  r = await request(app).delete(`/api/student/record/scholarships/${recId}`).set('Authorization', `Bearer ${profToken}`);
  check('DELETE record "scholarships" (dropped, non-array in this schema) -> 400', r.status === 400, r.body);

  r = await request(app).delete(`/api/student/record/education/${recId}`).set('Authorization', `Bearer ${profToken}`);
  check('DELETE record valid -> 200', r.status === 200, r.body);

  const after = StudentProfile.__all().find(d => d.userId === profStudentId);
  check('Record actually removed from array', after.education_details.education.length === 0, after.education_details.education);

  // ownership: a different user's token, profile does not exist for them -> 404
  const otherToken = tokenFor('some-other-user');
  r = await request(app).delete(`/api/student/record/education/${recId}`).set('Authorization', `Bearer ${otherToken}`);
  check('Different user with no profile -> 404 (not able to touch someone else\'s data)', r.status === 404, r.body);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
