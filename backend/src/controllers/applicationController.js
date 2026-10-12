const Application = require('../models/Application');
const Allocation = require('../models/Allocation');
const Setting = require('../models/Setting');

const hostelsForGender = (gender) => (gender === 'female' ? ['A'] : ['B', 'C', 'D']);

// Student submits an application with optional hostel / floor preferences
exports.apply = async (req, res) => {
  try {
    const settings = await Setting.current();
    if (!settings.applicationsOpen) {
      return res.status(403).json({ message: 'Applications are currently closed' });
    }

    const { preferredHostel, preferredFloor } = req.body;
    const student = req.user;

    if (preferredHostel && !hostelsForGender(student.gender).includes(preferredHostel)) {
      return res
        .status(400)
        .json({ message: `Hostel ${preferredHostel} is not available for your gender` });
    }
    const floor = preferredFloor ? Number(preferredFloor) : undefined;
    if (floor !== undefined && (!Number.isInteger(floor) || floor < 1 || floor > 4)) {
      return res.status(400).json({ message: 'Floor must be between 1 and 4' });
    }

    const academicYear = settings.academicYear;

    if (await Allocation.exists({ student: student._id, academicYear, status: 'active' })) {
      return res.status(409).json({ message: 'You already have a bed allocated' });
    }

    const existing = await Application.findOne({ student: student._id, academicYear });
    if (existing && existing.status !== 'cancelled') {
      return res.status(409).json({ message: 'You have already applied for this year' });
    }

    let application;
    if (existing) {
      // Re-applying after cancelling: reuse the same record
      existing.status = 'pending';
      existing.preferredHostel = preferredHostel || undefined;
      existing.preferredFloor = floor;
      existing.submittedAt = new Date();
      application = await existing.save();
    } else {
      application = await Application.create({
        student: student._id,
        academicYear,
        preferredHostel: preferredHostel || undefined,
        preferredFloor: floor,
      });
    }

    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied for this year' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// The logged-in student's application for the current academic year
exports.myApplication = async (req, res) => {
  try {
    const settings = await Setting.current();
    const application = await Application.findOne({
      student: req.user._id,
      academicYear: settings.academicYear,
    });
    res.json({
      application,
      academicYear: settings.academicYear,
      applicationsOpen: settings.applicationsOpen,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Withdraw an application that has not been approved yet
exports.cancel = async (req, res) => {
  try {
    const settings = await Setting.current();
    const application = await Application.findOne({
      student: req.user._id,
      academicYear: settings.academicYear,
    });
    if (!application || application.status === 'cancelled') {
      return res.status(404).json({ message: 'No application to cancel' });
    }
    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Already allocated. Ask the warden to vacate your bed.' });
    }
    application.status = 'cancelled';
    await application.save();
    res.json({ application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};