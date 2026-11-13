// ---------------------------------------------------------------------------
// validators/patientValidator.js
// Purpose: validate patient create/update payloads, including the doctor
// relationship and enum fields.
// ---------------------------------------------------------------------------

const { body, param } = require('express-validator');
const { CONDITIONS, GENDERS } = require('../models/Patient');

const patientRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Patient name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Patient name must be between 2 and 80 characters'),
  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be a whole number between 0 and 120'),
  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(GENDERS)
    .withMessage('Please choose a valid gender'),
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
  body('condition')
    .trim()
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(CONDITIONS)
    .withMessage('Please choose a valid condition'),
  body('doctor')
    .notEmpty()
    .withMessage('A doctor must be assigned')
    .isMongoId()
    .withMessage('Invalid doctor id'),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be longer than 500 characters'),
];

const createPatientValidator = patientRules;
const updatePatientValidator = patientRules;

const patientIdValidator = [
  param('id').isMongoId().withMessage('Invalid patient id'),
];

module.exports = {
  createPatientValidator,
  updatePatientValidator,
  patientIdValidator,
};
