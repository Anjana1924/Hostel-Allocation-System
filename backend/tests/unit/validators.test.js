// Unit tests for registration validation (no database needed).
//   cd backend && npm run test:unit
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration } = require('../../src/utils/validators');

// A valid base record; each test changes only the field under test
const valid = {
  name: 'Kasun Perera',
  email: 'kasun@university.edu',
  password: 'secret123',
  regNo: 'EG/2021/0001',
  gender: 'male',
  year: 2,
  department: 'EIE',
};
const withField = (field, value) => ({ ...valid, [field]: value });

describe('Equivalence partitioning: gender', () => {
  test('valid class: male', () => assert.equal(validateRegistration(withField('gender', 'male')), null));
  test('valid class: female', () => assert.equal(validateRegistration(withField('gender', 'female')), null));
  test('invalid class: other word', () =>
    assert.equal(validateRegistration(withField('gender', 'other')), 'Gender must be male or female'));
  test('invalid class: wrong case', () =>
    assert.equal(validateRegistration(withField('gender', 'Male')), 'Gender must be male or female'));
});

describe('Boundary value analysis: year (valid 1 to 4)', () => {
  const cases = [
    [0, false], [1, true], [2, true], [3, true], [4, true], [5, false],
    [-1, false], [1.5, false], ['abc', false], ['3', true],
  ];
  for (const [year, ok] of cases) {
    test(`year = ${JSON.stringify(year)} is ${ok ? 'accepted' : 'rejected'}`, () => {
      const result = validateRegistration(withField('year', year));
      if (ok) assert.equal(result, null);
      else assert.equal(result, 'Year must be between 1 and 4');
    });
  }
  test('missing year is rejected', () => {
    const { year, ...noYear } = valid;
    assert.equal(validateRegistration(noYear), 'Year must be between 1 and 4');
  });
});

describe('Boundary value analysis: password length (minimum 6)', () => {
  for (const [pw, ok] of [['12345', false], ['123456', true], ['1234567', true]]) {
    test(`password of ${pw.length} characters is ${ok ? 'accepted' : 'rejected'}`, () => {
      const result = validateRegistration(withField('password', pw));
      if (ok) assert.equal(result, null);
      else assert.equal(result, 'Password must be at least 6 characters');
    });
  }
});

describe('Required fields: each missing field is rejected', () => {
  for (const field of ['name', 'email', 'password', 'regNo', 'gender', 'department']) {
    test(`missing ${field}`, () =>
      assert.equal(validateRegistration(withField(field, '')), 'All fields are required'));
  }
  test('undefined body', () => assert.equal(validateRegistration(undefined), 'All fields are required'));
});

describe('Rule order (decision table behaviour)', () => {
  test('missing field is reported before a bad gender', () =>
    assert.equal(validateRegistration({ ...valid, name: '', gender: 'x' }), 'All fields are required'));
  test('bad gender is reported before a short password', () =>
    assert.equal(validateRegistration({ ...valid, gender: 'x', password: '1' }), 'Gender must be male or female'));
  test('short password is reported before a bad year', () =>
    assert.equal(validateRegistration({ ...valid, password: '1', year: 9 }), 'Password must be at least 6 characters'));
  test('a fully valid record returns null', () => assert.equal(validateRegistration(valid), null));
});