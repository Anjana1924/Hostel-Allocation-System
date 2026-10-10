const mongoose = require('mongoose');

// floor and roomNo are copied from the room so beds can be sorted and
// filtered without a join (this is the usual MongoDB trade-off).
const bedSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  floor: { type: Number, required: true },
  roomNo: { type: String, required: true },
  bedNo: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied'], default: 'available' },
});

bedSchema.index({ room: 1, bedNo: 1 }, { unique: true });
// Used when looking for the next free bed
bedSchema.index({ hostel: 1, status: 1, floor: 1, roomNo: 1, bedNo: 1 });

module.exports = mongoose.model('Bed', bedSchema);