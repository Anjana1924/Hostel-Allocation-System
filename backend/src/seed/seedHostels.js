const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Bed = require('../models/Bed');

// A is for girls, B/C/D are for boys
const HOSTELS = [
  { name: 'A', genderType: 'female' },
  { name: 'B', genderType: 'male' },
  { name: 'C', genderType: 'male' },
  { name: 'D', genderType: 'male' },
];

const FLOORS = 4;
const ROOMS_PER_FLOOR = 28;
const BEDS_PER_ROOM = 4;

// Safe to run more than once: hostels that already have rooms are skipped.
async function seedHostels() {
  const summary = [];

  for (const def of HOSTELS) {
    const hostel = await Hostel.findOneAndUpdate(
      { name: def.name },
      {
        $setOnInsert: {
          genderType: def.genderType,
          floors: FLOORS,
          roomsPerFloor: ROOMS_PER_FLOOR,
          bedsPerRoom: BEDS_PER_ROOM,
        },
      },
      { upsert: true, new: true }
    );

    if (await Room.exists({ hostel: hostel._id })) {
      summary.push(`Hostel ${def.name}: already seeded, skipped`);
      continue;
    }

    const rooms = [];
    for (let floor = 1; floor <= FLOORS; floor++) {
      for (let n = 1; n <= ROOMS_PER_FLOOR; n++) {
        rooms.push({
          hostel: hostel._id,
          floor,
          roomNo: String(floor * 100 + n), // 101..128, 201..228, ...
          capacity: BEDS_PER_ROOM,
        });
      }
    }
    const savedRooms = await Room.insertMany(rooms);

    const beds = [];
    for (const room of savedRooms) {
      for (let b = 1; b <= BEDS_PER_ROOM; b++) {
        beds.push({
          room: room._id,
          hostel: hostel._id,
          floor: room.floor,
          roomNo: room.roomNo,
          bedNo: b,
        });
      }
    }
    await Bed.insertMany(beds);
    summary.push(`Hostel ${def.name} (${def.genderType}): ${savedRooms.length} rooms, ${beds.length} beds`);
  }

  return summary;
}

module.exports = { seedHostels, HOSTELS, FLOORS, ROOMS_PER_FLOOR, BEDS_PER_ROOM };