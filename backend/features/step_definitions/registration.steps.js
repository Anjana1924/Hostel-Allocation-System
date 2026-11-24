const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { validateRegistration } = require('../../src/utils/validators');

Given('a registration form with valid details', function () {
  this.form = {
    name: 'Kasun Perera',
    email: 'kasun@university.edu',
    password: 'secret123',
    regNo: 'EG/2021/0001',
    gender: 'male',
    year: 2,
    department: 'EIE',
  };
});

Given('the password is {string}', function (password) {
  this.form.password = password;
});

Given('the year is {string}', function (year) {
  this.form.year = year;
});

When('I submit the registration', function () {
  this.error = validateRegistration(this.form);
});

Then('the registration is accepted', function () {
  assert.equal(this.error, null);
});

Then('the registration is rejected with {string}', function (message) {
  assert.equal(this.error, message);
});