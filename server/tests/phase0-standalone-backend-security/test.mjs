process.env.JWT_SECRET = 'test-secret';
import { register } from './controllers/auth.controller.mjs';
import Users from './models/users.mjs';

function fakeRes() {
  const res = {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.body = o; return res; };
  return res;
}

async function run(label, body) {
  Users.__reset();
  const res = fakeRes();
  await register({ body }, res);
  const created = Users.__getCreated();
  console.log(`--- ${label} ---`);
  console.log('status:', res.statusCode, 'response role:', res.body?.user?.role, 'DB role:', created[0]?.role);
}

await run('Legit, no role', { name:'A', email:'a@x.com', phone:'1234567890', password:'p' });
await run('ATTACK role=superadmin', { name:'E', email:'e@x.com', phone:'1234567891', password:'p', role:'superadmin' });
await run('ATTACK role=admin', { name:'M', email:'m@x.com', phone:'1234567892', password:'p', role:'admin' });
