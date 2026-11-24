// Integration tests. They need a running MongoDB and use a separate database
// (MONGO_URI_TEST, default mongodb://127.0.0.1:27017/hostel_test) which is wiped.
//   cd backend && npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test-secret';
const createApp = require('../src/app');
const User = require('../src/models/User');
const Bed = require('../src/models/Bed');
// Load every model up front so their indexes are built before the tests run
['Allocation', 'Application', 'Setting', 'Room', 'Hostel'].forEach((m) => require(`../src/models/${m}`));
const { seedHostels } = require('../src/seed/seedHostels');

let server;
let base;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let counter = 0;
async function registerStudent(gender, extra = {}) {
  counter++;
  const res = await call('POST', '/api/auth/register', {
    body: {
      name: `Student ${counter}`,
      email: `s${counter}@test.com`,
      password: 'secret123',
      regNo: `REG${counter}`,
      gender,
      year: 1 + (counter % 4),
      department: 'CS',
      ...extra,
    },
  });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  return { token: res.data.token, user: res.data.user };
}

let adminToken;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/hostel_test');
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  await seedHostels();

  await User.create({
    name: 'Warden',
    email: 'admin@test.com',
    passwordHash: await bcrypt.hash('adminpass', 10),
    role: 'admin',
  });

  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  const login = await call('POST', '/api/auth/login', {
    body: { email: 'admin@test.com', password: 'adminpass' },
  });
  adminToken = login.data.token;
});

after(async () => {
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('seed creates 4 hostels with 448 beds each (4 floors x 28 rooms x 4 beds)', async () => {
  assert.equal(await Bed.countDocuments(), 4 * 448);
  const res = await call('GET', '/api/hostels', { token: adminToken });
  assert.deepEqual(res.data.hostels.map((h) => h.name), ['A', 'B', 'C', 'D']);
  for (const h of res.data.hostels) {
    assert.equal(h.total, 448);
    assert.equal(h.floors.length, 4);
  }
  assert.equal(res.data.hostels[0].genderType, 'female');
});

test('register rejects duplicates and bad input, login works', async () => {
  const s = await registerStudent('male');
  const dup = await call('POST', '/api/auth/register', {
    body: {
      name: 'x', email: s.user.email, password: 'secret123',
      regNo: 'OTHER', gender: 'male', year: 1, department: 'CS',
    },
  });
  assert.equal(dup.status, 409);

  const short = await call('POST', '/api/auth/register', {
    body: {
      name: 'x', email: 'new@test.com', password: '123',
      regNo: 'NEW1', gender: 'male', year: 1, department: 'CS',
    },
  });
  assert.equal(short.status, 400);

  const ok = await call('POST', '/api/auth/login', {
    body: { email: s.user.email, password: 'secret123' },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.passwordHash, undefined);

  const bad = await call('POST', '/api/auth/login', {
    body: { email: s.user.email, password: 'wrong' },
  });
  assert.equal(bad.status, 401);
});

test('students cannot use admin routes', async () => {
  const s = await registerStudent('female');
  const res = await call('GET', '/api/admin/applications', { token: s.token });
  assert.equal(res.status, 403);
  const anon = await call('GET', '/api/admin/applications');
  assert.equal(anon.status, 401);
});

test('a girl cannot prefer a boys hostel', async () => {
  const girl = await registerStudent('female');
  const res = await call('POST', '/api/applications', {
    token: girl.token,
    body: { preferredHostel: 'B' },
  });
  assert.equal(res.status, 400);
});

test('automatic allocation puts girls in A and boys in B, C or D', async () => {
  const girl = await registerStudent('female');
  const boy = await registerStudent('male');
  for (const s of [girl, boy]) {
    const r = await call('POST', '/api/applications', { token: s.token, body: {} });
    assert.equal(r.status, 201);
    const again = await call('POST', '/api/applications', { token: s.token, body: {} });
    assert.equal(again.status, 409);
  }

  const run = await call('POST', '/api/admin/allocate', { token: adminToken, body: {} });
  assert.equal(run.status, 200);
  assert.ok(run.data.allocated >= 2);

  const g = await call('GET', '/api/allocations/me', { token: girl.token });
  assert.equal(g.data.allocation.hostel, 'A');
  const b = await call('GET', '/api/allocations/me', { token: boy.token });
  assert.ok(['B', 'C', 'D'].includes(b.data.allocation.hostel));
});

test('hostel and floor preferences are honoured when beds are free', async () => {
  const boy = await registerStudent('male');
  await call('POST', '/api/applications', {
    token: boy.token,
    body: { preferredHostel: 'D', preferredFloor: 3 },
  });
  await call('POST', '/api/admin/allocate', { token: adminToken, body: {} });
  const res = await call('GET', '/api/allocations/me', { token: boy.token });
  assert.equal(res.data.allocation.hostel, 'D');
  assert.equal(res.data.allocation.floor, 3);
});

test('a bed can never be given to two students at once (race test)', async () => {
  const students = [];
  for (let i = 0; i < 10; i++) students.push(await registerStudent('male'));

  const hostelC = await mongoose.model('Hostel').findOne({ name: 'C' });
  const bed = await Bed.findOne({ hostel: hostelC._id, status: 'available' });
  const results = await Promise.all(
    students.map((s) =>
      call('POST', '/api/admin/allocations/manual', {
        token: adminToken,
        body: { studentId: s.user._id, bedId: String(bed._id) },
      })
    )
  );

  const created = results.filter((r) => r.status === 201).length;
  assert.equal(created, 1, 'exactly one request should win the bed');
  assert.equal((await Bed.findById(bed._id)).status, 'occupied');
});

test('manual allocation checks gender and vacate frees the bed', async () => {
  const girl = await registerStudent('female');
  const hostelB = await mongoose.model('Hostel').findOne({ name: 'B' });
  const bedInB = await Bed.findOne({ hostel: hostelB._id, status: 'available' });

  const wrong = await call('POST', '/api/admin/allocations/manual', {
    token: adminToken,
    body: { studentId: girl.user._id, bedId: String(bedInB._id) },
  });
  assert.equal(wrong.status, 400);
  assert.equal((await Bed.findById(bedInB._id)).status, 'available', 'bed must be released');

  const hostelA = await mongoose.model('Hostel').findOne({ name: 'A' });
  const bedInA = await Bed.findOne({ hostel: hostelA._id, status: 'available' });
  const ok = await call('POST', '/api/admin/allocations/manual', {
    token: adminToken,
    body: { studentId: girl.user._id, bedId: String(bedInA._id) },
  });
  assert.equal(ok.status, 201);

  const del = await call('DELETE', `/api/admin/allocations/${ok.data.allocation._id}`, {
    token: adminToken,
  });
  assert.equal(del.status, 200);
  assert.equal((await Bed.findById(bedInA._id)).status, 'available');
});

test('closing applications blocks new ones', async () => {
  await call('PUT', '/api/admin/settings', { token: adminToken, body: { applicationsOpen: false } });
  const s = await registerStudent('male');
  const res = await call('POST', '/api/applications', { token: s.token, body: {} });
  assert.equal(res.status, 403);
  await call('PUT', '/api/admin/settings', { token: adminToken, body: { applicationsOpen: true } });
});