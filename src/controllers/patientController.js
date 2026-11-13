// ---------------------------------------------------------------------------
// controllers/patientController.js
// Purpose: all business logic for patients, including the doctor relationship.
// Every read populates the doctor's name/specialization so the frontend can
// display it without extra requests.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const {
  escapeRegex,
  getPagination,
  buildDateFilter,
  buildPaginationMeta,
} = require('../utils/queryHelpers');

const DOCTOR_POPULATE = {
  path: 'doctor',
  select: 'name specialization hospital',
};

/** POST /api/patients */
async function createPatient(req, res, next) {
  try {
    const { name, age, gender, phone, email, condition, doctor, notes } = req.body;

    const doctorExists = await Doctor.exists({ _id: doctor });
    if (!doctorExists) {
      return res.status(404).json({ message: 'Selected doctor does not exist.' });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      email,
      condition,
      doctor,
      notes,
    });

    await patient.populate(DOCTOR_POPULATE);

    return res.status(201).json({
      message: 'Patient added successfully.',
      patient,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/patients
 * Supported query params: search, condition, doctor, gender, dateFrom,
 * dateTo, sortBy, sortOrder, page, limit.
 */
async function getPatients(req, res, next) {
  try {
    const {
      search,
      condition,
      doctor,
      gender,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { condition: regex },
      ];
    }

    if (condition) filter.condition = condition;
    if (gender) filter.gender = gender;

    if (doctor) {
      // A malformed id would otherwise make Mongoose throw a CastError.
      if (!mongoose.isValidObjectId(doctor)) {
        return res.status(400).json({ message: 'Invalid doctor id filter.' });
      }
      filter.doctor = doctor;
    }

    const dateFilter = buildDateFilter(dateFrom, dateTo);
    if (dateFilter) filter.createdAt = dateFilter;

    const { page, limit, skip } = getPagination(req.query);

    const allowedSortFields = ['createdAt', 'name', 'age', 'condition'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(DOCTOR_POPULATE),
      Patient.countDocuments(filter),
    ]);

    return res.json({
      patients,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/patients/:id */
async function getPatientById(req, res, next) {
  try {
    const patient = await Patient.findById(req.params.id).populate(DOCTOR_POPULATE);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    return res.json({ patient });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/patients/:id */
async function updatePatient(req, res, next) {
  try {
    const { name, age, gender, phone, email, condition, doctor, notes } = req.body;

    const doctorExists = await Doctor.exists({ _id: doctor });
    if (!doctorExists) {
      return res.status(404).json({ message: 'Selected doctor does not exist.' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, age, gender, phone, email, condition, doctor, notes },
      { new: true, runValidators: true }
    ).populate(DOCTOR_POPULATE);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    return res.json({
      message: 'Patient updated successfully.',
      patient,
    });
  } catch (error) {
    return next(error);
  }
}

/** DELETE /api/patients/:id */
async function deletePatient(req, res, next) {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    return res.json({ message: 'Patient deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
