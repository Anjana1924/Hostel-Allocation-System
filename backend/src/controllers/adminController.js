const Application = require('../models/Application');
const Allocation = require('../models/Allocation');
const Setting = require('../models/Setting');
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