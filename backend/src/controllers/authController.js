const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, regNo, gender, year, department } = req.body;

    if (!name || !email || !password || !regNo || !gender || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Gender must be male or female' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
      return res.status(400).json({ message: 'Year must be between 1 and 4' });
    }

    const exists = await User.findOne({
      $or: [{ email: String(email).toLowerCase().trim() }, { regNo: String(regNo).trim() }],
    });
    if (exists) {
      return res.status(409).json({ message: 'Email or registration number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Public registration always creates a student; admins are created by the seed script
    const user = await User.create({
      name,
      email,
      passwordHash,
      regNo,
      gender,
      year: yearNum,
      department,
      role: 'student',
    });

    res.status(201).json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email or registration number already registered' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // Same message for both cases so attackers can't tell which emails exist
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};
