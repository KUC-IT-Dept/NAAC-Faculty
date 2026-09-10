process.env.JWT_SECRET = 'test-secret';
const { register } = require('./modules/student/controllers/auth.controller.js');
const UserModel = require('./auth/models/User.model.js');

function fakeRes() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

(async () => {
  UserModel.__reset();
  UserModel.__setExisting('dup@example.com');
  const res = fakeRes();
  await register({ body: { name:'Dup', email:'dup@example.com', phone:'1112223333', password:'x', role:'superadmin' } }, res);
  console.log('Duplicate email -> status:', res.statusCode, 'body:', JSON.stringify(res.body));
})();
