const Hostel = require('../models/Hostel');
const Bed = require('../models/Bed');

// Occupancy for every hostel, with a per-floor breakdown.
// Students only see hostels that match their gender.
exports.listHostels = async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { genderType: req.user.gender } : {};
    const hostels = await Hostel.find(filter).sort({ name: 1 });

    const rows = await Bed.aggregate([
      {
        $group: {
          _id: { hostel: '$hostel', floor: '$floor' },
          total: { $sum: 1 },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
        },
      },
    ]);

    const result = hostels.map((h) => {
      const floors = rows
        .filter((r) => String(r._id.hostel) === String(h._id))
        .map((r) => ({
          floor: r._id.floor,
          total: r.total,
          occupied: r.occupied,
          available: r.total - r.occupied,
        }))
        .sort((a, b) => a.floor - b.floor);

      const total = floors.reduce((s, f) => s + f.total, 0);
      const occupied = floors.reduce((s, f) => s + f.occupied, 0);
      return {
        _id: h._id,
        name: h.name,
        genderType: h.genderType,
        floorsCount: h.floors,
        roomsPerFloor: h.roomsPerFloor,
        bedsPerRoom: h.bedsPerRoom,
        total,
        occupied,
        available: total - occupied,
        floors,
      };
    });

    res.json({ hostels: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};