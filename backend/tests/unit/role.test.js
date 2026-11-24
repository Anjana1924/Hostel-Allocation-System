// Unit tests for the role middleware, using fake req/res objects.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const role = require('../../src/middleware/role');

function run(middleware, req) {
  const out = { status: null, body: null, nextCalled: false };
  const res = {
    status(code) { out.status = code; return this; },
    json(body) { out.body = body; return this; },
  };
  middleware(req, res, () => { out.nextCalled = true; });
  return out;
}

test('admin passes role("admin")', () => {
  const out = run(role('admin'), { user: { role: 'admin' } });
  assert.equal(out.nextCalled, true);
  assert.equal(out.status, null);
});

test('student is blocked from role("admin") with 403', () => {
  const out = run(role('admin'), { user: { role: 'student' } });
  assert.equal(out.nextCalled, false);
  assert.equal(out.status, 403);
});

test('missing user is blocked with 403', () => {
  const out = run(role('admin'), {});
  assert.equal(out.status, 403);
});

test('role("student", "admin") allows both roles', () => {
  assert.equal(run(role('student', 'admin'), { user: { role: 'student' } }).nextCalled, true);
  assert.equal(run(role('student', 'admin'), { user: { role: 'admin' } }).nextCalled, true);
});