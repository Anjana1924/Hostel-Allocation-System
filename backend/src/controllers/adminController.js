const Application = require('../models/Application');
const Allocation = require('../models/Allocation');
const Setting = require('../models/Setting');
const Bed = require('../models/Bed');
const Hostel = require('../models/Hostel');
const User = require('../models/User');
const { allocateAll, allocateManually, vacate, HttpError } = require('../services/allocationService');

function sendError(res, err) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}
exports.sendError = sendError;

exports.listApplications = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();
    const filter = { academicYear };
    if (req.query.status) filter.status = req.query.status;

    const applications = await Application.find(filter)
      .populate('student', 'name regNo gender year department email')
      .sort({ submittedAt: 1 });
    res.json({ applications, academicYear });
  } catch (err) {
    sendError(res, err);
  }
};

exports.runAllocation = async (req, res) => {
  try {
    const strategy = req.body.strategy === 'year' ? 'year' : 'fcfs';
    const result = await allocateAll(strategy);
    res.json({ strategy, ...result });
  } catch (err) {
    sendError(res, err);
  }
};

exports.manualAllocation = async (req, res) => {
  try {
    const { studentId, bedId } = req.body;
    if (!studentId || !bedId) {
      return res.status(400).json({ message: 'studentId and bedId are required' });
    }
    const allocation = await allocateManually(studentId, bedId);
    res.status(201).json({ allocation });
  } catch (err) {
    sendError(res, err);
  }
};

exports.listAllocations = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();
    const rows = await Allocation.find({ academicYear, status: 'active' })
      .populate('student', 'name regNo gender year department')
      .populate('hostel', 'name')
      .populate('bed', 'floor roomNo bedNo')
      .sort({ allocatedAt: -1 });
    res.json({ allocations: rows, academicYear });
  } catch (err) {
    sendError(res, err);
  }
};

exports.vacateAllocation = async (req, res) => {
  try {
    const allocation = await vacate(req.params.id);
    res.json({ allocation });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getSettings = async (req, res) => {
  try {
    res.json({ settings: await Setting.current() });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.applicationsOpen === 'boolean') {
      update.applicationsOpen = req.body.applicationsOpen;
    }
    if (typeof req.body.academicYear === 'string' && /^\d{4}\/\d{4}$/.test(req.body.academicYear)) {
      update.academicYear = req.body.academicYear;
    }
    await Setting.current(); 
    const settings = await Setting.findOneAndUpdate({ key: 'main' }, update, { new: true });
    res.json({ settings });
  } catch (err) {
    sendError(res, err);
  }
};



exports.hostelRooms = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    const floor = Number(req.query.floor) || 1;
    const beds = await Bed.find({ hostel: hostel._id, floor })
      .sort({ roomNo: 1, bedNo: 1 })
      .lean();

    const allocations = await Allocation.find({
      bed: { $in: beds.map((b) => b._id) },
      status: 'active',
    })
      .populate('student', 'name regNo')
      .lean();
    const byBed = new Map(allocations.map((a) => [String(a.bed), a]));

    const rooms = new Map();
    for (const bed of beds) {
      if (!rooms.has(bed.roomNo)) rooms.set(bed.roomNo, { roomNo: bed.roomNo, beds: [] });
      const alloc = byBed.get(String(bed._id));
      rooms.get(bed.roomNo).beds.push({
        _id: bed._id,
        bedNo: bed.bedNo,
        status: bed.status,
        allocationId: alloc ? alloc._id : null,
        student: alloc ? alloc.student : null,
      });
    }

    res.json({
      hostel: { _id: hostel._id, name: hostel.name, genderType: hostel.genderType },
      floor,
      rooms: [...rooms.values()],
    });
  } catch (err) {
    sendError(res, err);
  }
};


exports.unallocatedStudents = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();
    const taken = await Allocation.find({ academicYear, status: 'active' }).distinct('student');

    const filter = { role: 'student', _id: { $nin: taken } };
    if (['male', 'female'].includes(req.query.gender)) filter.gender = req.query.gender;

    const students = await User.find(filter)
      .select('name regNo gender year department')
      .sort({ name: 1 });
    res.json({ students });
  } catch (err) {
    sendError(res, err);
  }
};


exports.exportAllocations = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();
    const rows = await Allocation.find({ academicYear, status: 'active' })
      .populate('student', 'name regNo gender year department')
      .populate('hostel', 'name')
      .populate('bed', 'floor roomNo bedNo')
      .lean();

   
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Name', 'Reg No', 'Gender', 'Year', 'Department', 'Hostel', 'Floor', 'Room', 'Bed']
        .map(cell)
        .join(','),
    ];
    for (const r of rows) {
      lines.push(
        [
          r.student?.name, r.student?.regNo, r.student?.gender, r.student?.year,
          r.student?.department, r.hostel?.name, r.bed?.floor, r.bed?.roomNo, r.bed?.bedNo,
        ]
          .map(cell)
          .join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="allocations-${academicYear.replace('/', '-')}.csv"`
    );
    res.send(lines.join('\n'));
  } catch (err) {
    sendError(res, err);
  }
};



exports.summaryReport = async (req, res) => {
  try {
    const { academicYear } = await Setting.current();

    const [beds, applicationRows, byDepartment, totalStudents, housed] = await Promise.all([
      Bed.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          },
        },
      ]),
      Application.aggregate([
        { $match: { academicYear } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      
      Allocation.aggregate([
        { $match: { academicYear, status: 'active' } },
        { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $group: { _id: '$student.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments({ role: 'student' }),
      Allocation.countDocuments({ academicYear, status: 'active' }),
    ]);

    const applications = { pending: 0, approved: 0, waitlisted: 0, cancelled: 0 };
    for (const r of applicationRows) applications[r._id] = r.count;

    const total = beds[0]?.total || 0;
    const occupied = beds[0]?.occupied || 0;

    res.json({
      academicYear,
      beds: { total, occupied, available: total - occupied },
      students: { total: totalStudents, housed, withoutBed: totalStudents - housed },
      applications,
      byDepartment: byDepartment.map((d) => ({ department: d._id, count: d.count })),
    });
  } catch (err) {
    sendError(res, err);
  }
};