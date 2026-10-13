const Bed = require('../models/Bed');
const Hostel = require('../models/Hostel');
const Allocation = require('../models/Allocation');
const Application = require('../models/Application');
const User = require('../models/User');
const Setting = require('../models/Setting');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const releaseBed = (bedId) => Bed.updateOne({ _id: bedId }, { status: 'available' });

// Atomically take the next free bed. Because "find an available bed" and
// "mark it occupied" happen in ONE database operation, two requests can never
// get the same bed. Beds are handed out floor by floor, room by room.
function claimBed(hostelId, floor) {
  const filter = { status: 'available', hostel: hostelId };
  if (floor) filter.floor = floor;
  return Bed.findOneAndUpdate(
    filter,
    { status: 'occupied' },
    { sort: { floor: 1, roomNo: 1, bedNo: 1 }, new: true }
  );
}

// Turn a claimed bed into an allocation record. If the record cannot be
// saved (e.g. the unique index rejects it), the bed is given back.
async function assignBed(studentId, bed, academicYear) {
  try {
    return await Allocation.create({
      student: studentId,
      bed: bed._id,
      hostel: bed.hostel,
      academicYear,
    });
  } catch (err) {
    await releaseBed(bed._id);
    throw err;
  }
}

// Hostels the student may use: the preferred one first, then the rest with
// the most free beds first (this spreads boys evenly across B, C and D).
async function candidateHostels(gender, preferredName) {
  const hostels = await Hostel.find({ genderType: gender });
  const free = await Bed.aggregate([
    { $match: { status: 'available', hostel: { $in: hostels.map((h) => h._id) } } },
    { $group: { _id: '$hostel', n: { $sum: 1 } } },
  ]);
  const freeCount = new Map(free.map((f) => [String(f._id), f.n]));

  return hostels
    .filter((h) => freeCount.get(String(h._id)) > 0)
    .sort((a, b) => {
      if (a.name === preferredName) return -1;
      if (b.name === preferredName) return 1;
      return freeCount.get(String(b._id)) - freeCount.get(String(a._id));
    });
}

// Find and claim a bed that respects gender, then hostel, then floor preference
async function findBedFor(student, application) {
  const hostels = await candidateHostels(student.gender, application.preferredHostel);

  for (const hostel of hostels) {
    if (application.preferredFloor && hostel.name === application.preferredHostel) {
      const onFloor = await claimBed(hostel._id, application.preferredFloor);
      if (onFloor) return onFloor;
    }
    const bed = await claimBed(hostel._id);
    if (bed) return bed;
  }
  return null;
}

/**
 * Automatic allocation for every pending or waitlisted application.
 * strategy "fcfs": first come, first served (earliest application first)
 * strategy "year": senior students first, then by application time
 */
async function allocateAll(strategy = 'fcfs') {
  const { academicYear } = await Setting.current();

  const applications = await Application.find({
    academicYear,
    status: { $in: ['pending', 'waitlisted'] },
  }).populate('student');

  applications.sort((a, b) => {
    if (strategy === 'year' && a.student && b.student && a.student.year !== b.student.year) {
      return b.student.year - a.student.year;
    }
    return a.submittedAt - b.submittedAt;
  });

  const result = { total: applications.length, allocated: 0, waitlisted: 0, skipped: 0 };

  for (const app of applications) {
    const student = app.student;
    if (!student) {
      result.skipped++;
      continue;
    }

    // Already has a bed (e.g. allocated manually): just fix the application status
    if (await Allocation.exists({ student: student._id, academicYear, status: 'active' })) {
      app.status = 'approved';
      await app.save();
      result.skipped++;
      continue;
    }

    const bed = await findBedFor(student, app);
    if (!bed) {
      app.status = 'waitlisted';
      await app.save();
      result.waitlisted++;
      continue;
    }

    try {
      await assignBed(student._id, bed, academicYear);
      app.status = 'approved';
      await app.save();
      result.allocated++;
    } catch (err) {
      if (err.code === 11000) {
        result.skipped++; // duplicate blocked by the unique index; bed already released
        continue;
      }
      throw err;
    }
  }

  return result;
}

// The warden picks a student and a specific bed
async function allocateManually(studentId, bedId) {
  const { academicYear } = await Setting.current();

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) throw new HttpError(404, 'Student not found');

  if (await Allocation.exists({ student: student._id, academicYear, status: 'active' })) {
    throw new HttpError(409, 'Student already has a bed this year');
  }

  const bed = await Bed.findOneAndUpdate(
    { _id: bedId, status: 'available' },
    { status: 'occupied' },
    { new: true }
  );
  if (!bed) throw new HttpError(409, 'Bed not found or already occupied');

  const hostel = await Hostel.findById(bed.hostel);
  if (hostel.genderType !== student.gender) {
    await releaseBed(bed._id);
    throw new HttpError(400, `Hostel ${hostel.name} is not for ${student.gender} students`);
  }

  let allocation;
  try {
    allocation = await assignBed(student._id, bed, academicYear);
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Student already has a bed this year');
    throw err;
  }

  await Application.updateOne(
    { student: student._id, academicYear },
    { status: 'approved' }
  );
  return allocation;
}

// Free a student's bed so it can be given to someone else
async function vacate(allocationId) {
  const allocation = await Allocation.findOneAndUpdate(
    { _id: allocationId, status: 'active' },
    { status: 'vacated', vacatedAt: new Date() },
    { new: true }
  );
  if (!allocation) throw new HttpError(404, 'Active allocation not found');

  await releaseBed(allocation.bed);
  await Application.updateOne(
    { student: allocation.student, academicYear: allocation.academicYear },
    { status: 'cancelled' }
  );
  return allocation;
}

module.exports = { allocateAll, allocateManually, vacate, HttpError };