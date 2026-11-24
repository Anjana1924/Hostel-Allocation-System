// Pure validation logic for registration. It has no database or Express code,
// so it can be unit tested quickly and measured for cyclomatic complexity.
// Returns an error message, or null when the input is valid.
function validateRegistration(body) {
  const { name, email, password, regNo, gender, year, department } = body || {};

  if (!name || !email || !password || !regNo || !gender || !department) {
    return 'All fields are required';
  }
  if (!['male', 'female'].includes(gender)) {
    return 'Gender must be male or female';
  }
  if (String(password).length < 6) {
    return 'Password must be at least 6 characters';
  }
  const yearNum = Number(year);
  if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
    return 'Year must be between 1 and 4';
  }
  return null;
}

module.exports = { validateRegistration };