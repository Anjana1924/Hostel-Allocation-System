const mongoose = require('mongoose');

// Room numbers look like 101..128 on floor 1, 201..228 on floor 2, and so on
const roomSchema = new mongoose.Schema({
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  floor: { type: Number, required: true, min: 1 },
  roomNo: { type: String, required: true },
  capacity: { type: Number, default: 4 },
});

roomSchema.index({ hostel: 1, roomNo: 1 }, { unique: true });
roomSchema.index({ hostel: 1, floor: 1 });

module.exports = mongoose.model('Room', roomSchema);