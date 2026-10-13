const Allocation = require('../models/Allocation');
const Bed = require('../models/Bed');
const Setting = require('../models/Setting');

// The logged-in student's bed, with the roommates sharing the same room
exports.myAllocation = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();
    const allocation = await Allocation.findOne({
      student: req.user._id,
      academicYear,
      status: 'active',
    })
      .populate('hostel', 'name genderType')
      .populate('bed', 'floor roomNo bedNo room');

    if (!allocation) return res.json({ allocation: null, roommates: [] });

    const roomBeds = await Bed.find({ room: allocation.bed.room }).select('_id bedNo');
    const others = await Allocation.find({
      bed: { $in: roomBeds.map((b) => b._id) },
      status: 'active',
      student: { $ne: req.user._id },
    }).populate('student', 'name department year');

    const bedNo = new Map(roomBeds.map((b) => [String(b._id), b.bedNo]));
    const roommates = others.map((o) => ({
      name: o.student.name,
      department: o.student.department,
      year: o.student.year,
      bedNo: bedNo.get(String(o.bed)),
    }));

    res.json({
      allocation: {
        _id: allocation._id,
        academicYear: allocation.academicYear,
        allocatedAt: allocation.allocatedAt,
        hostel: allocation.hostel.name,
        floor: allocation.bed.floor,
        roomNo: allocation.bed.roomNo,
        bedNo: allocation.bed.bedNo,
      },
      roommates,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};