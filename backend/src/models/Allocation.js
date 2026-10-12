const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  academicYear: { type: String, required: true },
  status: { type: String, enum: ['active', 'vacated'], default: 'active' },
  allocatedAt: { type: Date, default: Date.now },
  vacatedAt: Date,
});

// Safety net: even if the code has a bug, MongoDB refuses to give one student
// two active beds in a year, or one bed to two active students.
allocationSchema.index(
  { student: 1, academicYear: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
allocationSchema.index({ bed: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

module.exports = mongoose.model('Allocation', allocationSchema);