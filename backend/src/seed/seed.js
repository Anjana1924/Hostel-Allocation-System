require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const { seedHostels } = require('./seedHostels');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@hostel.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  if (await User.exists({ email })) return `Admin ${email}: already exists, skipped`;

  await User.create({
    name: 'Warden',
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin',
  });
  return `Admin created: ${email} / ${password}  (change this password!)`;
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    // Make sure indexes exist before inserting
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

    for (const line of await seedHostels()) console.log(line);
    console.log(await seedAdmin());
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();