process.env.JWT_SECRET = 'test-secret';
const { register } = require('./modules/student/controllers/auth.controller.js');
const UserModel = require('./auth/models/User.model.js');

function fakeRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

async function run(label, body) {
  UserModel.__reset();
  const req = { body };
  const res = fakeRes();
  await register(req, res);
  const created = UserModel.__getCreated();
  console.log(`--- ${label} ---`);
  console.log('HTTP status:', res.statusCode);
  console.log('Response role field:', res.body && res.body.user && res.body.user.role);
  console.log('Role actually written to DB:', created[0] && created[0].role);
  console.log();
}

(async () => {
  // 1. Legitimate registration, no role field at all
  await run('Legit student, no role field', {
    name: 'Alice Student', email: 'alice@example.com', phone: '9876543210',
    password: 'Str0ngPass!23', department: 'CSE'
  });

  // 2. Legitimate registration, role explicitly "student" (harmless, matches default anyway)
  await run('Legit student, role="student" explicitly', {
    name: 'Bob Student', email: 'bob@example.com', phone: '9876543211',
    password: 'Str0ngPass!23', department: 'ECE', role: 'student'
  });

  // 3. Attack: client tries to self-assign superadmin
  await run('ATTACK: role="superadmin"', {
    name: 'Eve Attacker', email: 'eve@example.com', phone: '9876543212',
    password: 'Str0ngPass!23', role: 'superadmin'
  });

  // 4. Attack: client tries iqac_director
  await run('ATTACK: role="iqac_director"', {
    name: 'Mallory Attacker', email: 'mallory@example.com', phone: '9876543213',
    password: 'Str0ngPass!23', role: 'iqac_director'
  });

  // 5. Attack: nonsense/garbage role value
  await run('ATTACK: role="DROP TABLE users"', {
    name: 'Garbage Attacker', email: 'garbage@example.com', phone: '9876543214',
    password: 'Str0ngPass!23', role: 'DROP TABLE users'
  });
})();
