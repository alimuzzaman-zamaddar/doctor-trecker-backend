// ---------------------------------------------------------------------------
// routes/dashboardRoutes.js
// Read-only analytics endpoints used by the dashboard. Everything comes from
// MongoDB aggregation results, never hardcoded values.
// ---------------------------------------------------------------------------

const express = require('express');
const {
  getDashboardStats,
  getPatientsPerDoctor,
  getConditionDistribution,
  getMonthlyRegistrations,
  getRecentPatients,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/patients-per-doctor', getPatientsPerDoctor);
router.get('/condition-distribution', getConditionDistribution);
router.get('/monthly-registrations', getMonthlyRegistrations);
router.get('/recent-patients', getRecentPatients);

module.exports = router;
