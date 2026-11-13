// ---------------------------------------------------------------------------
// models/Patient.js
// Purpose: describe a patient and its relationship to a doctor.
//
// Relationship: one doctor has many patients. Each patient stores a single
// "doctor" ObjectId (a foreign key in MongoDB terms). We never copy the
// doctor's name or hospital into the patient document, so a doctor edit is
// reflected everywhere immediately.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');

const CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Arthritis',
  'Heart Disease',
  'Skin Allergy',
  'Migraine',
  'Kidney Disease',
  'Thyroid Disorder',
  'Other',
];

const GENDERS = ['Male', 'Female', 'Other'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()0-9][0-9+\-().\s]{6,19}$/;

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Patient name must be at least 2 characters'],
      maxlength: [80, 'Patient name cannot be longer than 80 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age must be 120 or less'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: GENDERS,
        message: 'Please choose a valid gender',
      },
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
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Please provide a valid email address'],
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: CONDITIONS,
        message: 'Please choose a valid condition',
      },
    },
    // The ObjectId relationship. "ref: Doctor" lets us use .populate('doctor').
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'A doctor must be assigned'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be longer than 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Common dashboard and list queries.
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ name: 1 });
patientSchema.index({ email: 1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
module.exports.CONDITIONS = CONDITIONS;
module.exports.GENDERS = GENDERS;
