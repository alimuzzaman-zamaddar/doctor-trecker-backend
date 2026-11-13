// ---------------------------------------------------------------------------
// routes/doctorRoutes.js
// REST endpoints for doctors. Every route below is private: router.use(protect)
// runs before any handler.
// ---------------------------------------------------------------------------

const express = require('express');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
} = require('../controllers/doctorController');
const {
  createDoctorValidator,
  updateDoctorValidator,
  doctorIdValidator,
} = require('../validators/doctorValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDoctors)
  .post(createDoctorValidator, validateRequest, createDoctor);

router.get('/:id/patients', doctorIdValidator, validateRequest, getDoctorPatients);

router
  .route('/:id')
  .get(doctorIdValidator, validateRequest, getDoctorById)
  .put(updateDoctorValidator, validateRequest, updateDoctor)
  .delete(doctorIdValidator, validateRequest, deleteDoctor);

module.exports = router;
