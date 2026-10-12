const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  // Optional preferences, small and fixed, so they are embedded as plain fields
  preferredHostel: { type: String, enum: ['A', 'B', 'C', 'D'] },
  preferredFloor: { type: Number, min: 1, max: 4 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'waitlisted', 'cancelled'],
    default: 'pending',
  },
  submittedAt: { type: Date, default: Date.now },
});

// A student can only have one application per academic year
applicationSchema.index({ student: 1, academicYear: 1 }, { unique: true });
applicationSchema.index({ status: 1, submittedAt: 1 });

module.exports = mongoose.model('Application', applicationSchema);