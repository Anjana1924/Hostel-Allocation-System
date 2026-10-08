const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },

    // Student details (not used for admins)
    regNo: { type: String, trim: true, unique: true, sparse: true },
    gender: { type: String, enum: ['male', 'female'] },
    year: { type: Number, min: 1, max: 4 },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

// Never send the password hash to clients
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);