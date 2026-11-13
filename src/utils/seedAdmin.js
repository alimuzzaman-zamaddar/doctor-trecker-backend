// ---------------------------------------------------------------------------
// utils/seedAdmin.js
// Purpose: create (or update) the administrator account from .env values.
//
// Run with: npm run seed:admin
// This is the recommended way to get a secure admin account because it never
// exposes a public registration form in a deployed application.
// ---------------------------------------------------------------------------

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || 'Administrator';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding the admin.'
    );
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  await connectDB();

  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser) {
    existingUser.name = name;
    existingUser.password = password;
    await existingUser.save();
    console.log(`Admin account updated for ${email}.`);
  } else {
    await User.create({ name, email, password });
    console.log(`Admin account created for ${email}.`);
  }

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
  });
