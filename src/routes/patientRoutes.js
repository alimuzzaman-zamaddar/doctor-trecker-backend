// ---------------------------------------------------------------------------
// routes/patientRoutes.js
// REST endpoints for patients. All routes are protected by JWT authentication.
// ---------------------------------------------------------------------------

const express = require('express');
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const {
  createPatientValidator,
  updatePatientValidator,
  patientIdValidator,
} = require('../validators/patientValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPatients)
  .post(createPatientValidator, validateRequest, createPatient);

router
  .route('/:id')
  .get(patientIdValidator, validateRequest, getPatientById)
  .put(updatePatientValidator, validateRequest, updatePatient)
  .delete(patientIdValidator, validateRequest, deletePatient);

module.exports = router;
