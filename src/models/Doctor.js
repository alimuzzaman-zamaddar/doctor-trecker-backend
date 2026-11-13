// ---------------------------------------------------------------------------
// models/Doctor.js
// Purpose: describe a doctor and the specialties used across the application.
//
// A doctor is a top-level record. Patients reference a doctor with their
// ObjectId, so the doctor document does not store a copy of patient data.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');

// Keeping the list in one place means the Mongoose enum, the API validator and
// the frontend dropdown all use the same values.
const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Dentistry',
  'Psychiatry',
  'Other',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Allows international prefixes, spaces, dashes, dots and parentheses.
const PHONE_PATTERN = /^[+()0-9][0-9+\-().\s]{6,19}$/;

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
      minlength: [2, 'Doctor name must be at least 2 characters'],
      maxlength: [80, 'Doctor name cannot be longer than 80 characters'],
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: {
        values: SPECIALIZATIONS,
        message: 'Please choose a valid specialization',
      },
      trim: true,
    },
    hospital: {
      type: String,
      required: [true, 'Hospital is required'],
      trim: true,
      maxlength: [120, 'Hospital cannot be longer than 120 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [PHONE_PATTERN, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Please provide a valid email address'],
    },
  },
  { timestamps: true }
);

// Indexes make the list endpoint and dashboard filtering faster.
doctorSchema.index({ name: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
module.exports.SPECIALIZATIONS = SPECIALIZATIONS;
