const mongoose = require('mongoose');

// Academic year starts around August: Oct 2026 -> "2026/2027", Feb 2027 -> "2026/2027"
function defaultAcademicYear(date = new Date()) {
  const start = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

// A single document that holds system-wide settings
const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  academicYear: { type: String, default: () => defaultAcademicYear() },
  applicationsOpen: { type: Boolean, default: true },
});

settingSchema.statics.current = function () {
  return this.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { academicYear: defaultAcademicYear(), applicationsOpen: true } },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Setting', settingSchema);