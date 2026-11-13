// ---------------------------------------------------------------------------
// validators/doctorValidator.js
// Purpose: validate every value accepted by the doctor create/update routes.
// The same rules are used for POST and PUT because both send a complete doctor.
// ---------------------------------------------------------------------------

const { body, param } = require('express-validator');
const { SPECIALIZATIONS } = require('../models/Doctor');

const doctorRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Doctor name must be between 2 and 80 characters'),
  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('Specialization is required')
    .isIn(SPECIALIZATIONS)
    .withMessage('Please choose a valid specialization'),
  body('hospital')
    .trim()
    .notEmpty()
    .withMessage('Hospital is required')
    .isLength({ max: 120 })
    .withMessage('Hospital cannot be longer than 120 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+()0-9][0-9+\-().\s]{6,19}$/)
    .withMessage('Please enter a valid phone number'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
];

const createDoctorValidator = doctorRules;
const updateDoctorValidator = doctorRules;

// Used by routes containing ":id" (details, update, delete, patients).
const doctorIdValidator = [
  param('id').isMongoId().withMessage('Invalid doctor id'),
];

module.exports = {
  createDoctorValidator,
  updateDoctorValidator,
  doctorIdValidator,
};
