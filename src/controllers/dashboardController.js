// ---------------------------------------------------------------------------
// controllers/dashboardController.js
// Purpose: provide real, database-driven analytics for the dashboard.
//
// MongoDB aggregation pipelines do the counting and grouping inside the
// database, which is much faster than loading every patient into Node.
// The main endpoint (/stats) combines the smaller queries in parallel.
// ---------------------------------------------------------------------------

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

/** First moment of the current month, used for "added this month" counts. */
function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Number of patients assigned to each doctor, highest first. */
async function fetchPatientsPerDoctor() {
  return Patient.aggregate([
    { $match: { doctor: { $ne: null } } },
    { $group: { _id: '$doctor', patientCount: { $sum: 1 } } },
    {
      $lookup: {
        from: 'doctors',
        localField: '_id',
        foreignField: '_id',
        as: 'doctor',
      },
    },
    { $unwind: '$doctor' },
    {
      $project: {
        _id: 0,
        doctorId: '$_id',
        name: '$doctor.name',
        specialization: '$doctor.specialization',
        patientCount: 1,
      },
    },
    { $sort: { patientCount: -1, name: 1 } },
    { $limit: 10 },
  ]);
}

/** How many patients exist for each medical condition. */
async function fetchConditionDistribution() {
  return Patient.aggregate([
    { $group: { _id: '$condition', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, condition: '$_id', count: 1 } },
  ]);
}

/**
 * Patient registrations for the last N months, including months with zero
 * patients (the chart should show a continuous timeline).
 */
async function fetchMonthlyRegistrations(monthCount = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);

  const rows = await Patient.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const months = [];
  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      count: 0,
    });
  }

  rows.forEach((row) => {
    const key = `${row._id.year}-${row._id.month}`;
    const month = months.find((item) => item.key === key);
    if (month) month.count = row.count;
  });

  return months.map(({ label, count }) => ({ label, count }));
}

/** Latest patient registrations with the assigned doctor. */
async function fetchRecentPatients(limit = 5) {
  return Patient.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('doctor', 'name specialization');
}

/**
 * GET /api/dashboard/stats
 * One request for the whole dashboard so the page loads with a single round
 * trip. The separate endpoints below are also available for reuse.
 */
async function getDashboardStats(req, res, next) {
  try {
    const startOfMonth = getStartOfMonth();

    const [
      totalDoctors,
      totalPatients,
      newDoctorsThisMonth,
      newPatientsThisMonth,
      patientsPerDoctor,
      conditionDistribution,
      monthlyRegistrations,
      recentPatients,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Doctor.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
      fetchPatientsPerDoctor(),
      fetchConditionDistribution(),
      fetchMonthlyRegistrations(),
      fetchRecentPatients(),
    ]);

    return res.json({
      totals: {
        doctors: totalDoctors,
        patients: totalPatients,
        newDoctorsThisMonth,
        newPatientsThisMonth,
      },
      patientsPerDoctor,
      conditionDistribution,
      monthlyRegistrations,
      recentPatients,
    });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/dashboard/patients-per-doctor */
async function getPatientsPerDoctor(req, res, next) {
  try {
    return res.json({ patientsPerDoctor: await fetchPatientsPerDoctor() });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/dashboard/condition-distribution */
async function getConditionDistribution(req, res, next) {
  try {
    return res.json({ conditionDistribution: await fetchConditionDistribution() });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/dashboard/monthly-registrations */
async function getMonthlyRegistrations(req, res, next) {
  try {
    return res.json({ monthlyRegistrations: await fetchMonthlyRegistrations() });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/dashboard/recent-patients */
async function getRecentPatients(req, res, next) {
  try {
    return res.json({ recentPatients: await fetchRecentPatients() });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboardStats,
  getPatientsPerDoctor,
  getConditionDistribution,
  getMonthlyRegistrations,
  getRecentPatients,
};
