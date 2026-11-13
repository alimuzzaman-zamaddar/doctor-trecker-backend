// ---------------------------------------------------------------------------
// controllers/doctorController.js
// Purpose: all business logic for doctors. Routes only map URLs to these
// functions; keeping the logic here makes it reusable and easy to test.
// ---------------------------------------------------------------------------

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const {
  escapeRegex,
  getPagination,
  buildDateFilter,
  buildPaginationMeta,
} = require('../utils/queryHelpers');

/** Attach patientCount to a list of Mongoose doctor documents. */
async function attachPatientCounts(doctors) {
  if (doctors.length === 0) return [];

  const counts = await Patient.aggregate([
    { $match: { doctor: { $in: doctors.map((doctor) => doctor._id) } } },
    { $group: { _id: '$doctor', count: { $sum: 1 } } },
  ]);

  const countByDoctorId = new Map(
    counts.map((item) => [item._id.toString(), item.count])
  );

  return doctors.map((doctor) => ({
    ...doctor.toObject(),
    patientCount: countByDoctorId.get(doctor._id.toString()) || 0,
  }));
}

/** POST /api/doctors */
async function createDoctor(req, res, next) {
  try {
    const { name, specialization, hospital, phone, email } = req.body;

    const duplicate = await Doctor.findOne({ email: email.toLowerCase() });
    if (duplicate) {
      return res
        .status(409)
        .json({ message: 'A doctor with this email already exists.' });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      hospital,
      phone,
      email,
    });

    return res.status(201).json({
      message: 'Doctor added successfully.',
      doctor: { ...doctor.toObject(), patientCount: 0 },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/doctors
 * Supported query params: search, specialization, dateFrom, dateTo,
 * sortBy, sortOrder, page, limit.
 */
async function getDoctors(req, res, next) {
  try {
    const {
      search,
      specialization,
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
        { specialization: regex },
        { hospital: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    if (specialization) filter.specialization = specialization;

    const dateFilter = buildDateFilter(dateFrom, dateTo);
    if (dateFilter) filter.createdAt = dateFilter;

    const { page, limit, skip } = getPagination(req.query);

    const allowedSortFields = ['createdAt', 'name', 'specialization', 'hospital'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter).sort(sort).skip(skip).limit(limit),
      Doctor.countDocuments(filter),
    ]);

    return res.json({
      doctors: await attachPatientCounts(doctors),
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/doctors/:id */
async function getDoctorById(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const patientCount = await Patient.countDocuments({ doctor: doctor._id });

    return res.json({
      doctor: { ...doctor.toObject(), patientCount },
    });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/doctors/:id */
async function updateDoctor(req, res, next) {
  try {
    const { name, specialization, hospital, phone, email } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    // Allow the same email on the same doctor, but block another doctor's email.
    const duplicate = await Doctor.findOne({
      email: email.toLowerCase(),
      _id: { $ne: doctor._id },
    });
    if (duplicate) {
      return res
        .status(409)
        .json({ message: 'Another doctor already uses this email.' });
    }

    doctor.name = name;
    doctor.specialization = specialization;
    doctor.hospital = hospital;
    doctor.phone = phone;
    doctor.email = email;
    await doctor.save();

    const patientCount = await Patient.countDocuments({ doctor: doctor._id });

    return res.json({
      message: 'Doctor updated successfully.',
      doctor: { ...doctor.toObject(), patientCount },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/doctors/:id
 *
 * Assumption documented in the README: a doctor cannot be deleted while
 * patients are still assigned to them. This prevents orphaned patient records
 * and forces an explicit decision about those patients. The UI explains this
 * before the admin confirms.
 */
async function deleteDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const patientCount = await Patient.countDocuments({ doctor: doctor._id });
    if (patientCount > 0) {
      return res.status(409).json({
        message: `This doctor still has ${patientCount} patient(s). Reassign or delete those patients first.`,
      });
    }

    await doctor.deleteOne();

    return res.json({ message: 'Doctor deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/doctors/:id/patients
 * Same search/date/pagination support as GET /api/patients, scoped to one
 * doctor. Used by the Doctor Details page.
 */
async function getDoctorPatients(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const { search, condition, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } =
      req.query;

    const filter = { doctor: doctor._id };

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
        .populate('doctor', 'name specialization hospital'),
      Patient.countDocuments(filter),
    ]);

    return res.json({
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
      },
      patients,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
};
