const mongoose = require('mongoose');

// One document per hostel: A (girls), B, C, D (boys)
const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true, trim: true },
  genderType: { type: String, enum: ['male', 'female'], required: true },
  floors: { type: Number, default: 4 },
  roomsPerFloor: { type: Number, default: 28 },
  bedsPerRoom: { type: Number, default: 4 },
});

hostelSchema.virtual('totalBeds').get(function () {
  return this.floors * this.roomsPerFloor * this.bedsPerRoom;
});

module.exports = mongoose.model('Hostel', hostelSchema);