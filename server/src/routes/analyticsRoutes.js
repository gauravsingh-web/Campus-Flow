const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
  getFacultyAnalytics,
  getStudentAnalytics,
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/admin', authorize('admin'), getAdminAnalytics);
router.get('/faculty', authorize('faculty', 'admin'), getFacultyAnalytics);
router.get('/student', authorize('student', 'faculty', 'admin'), getStudentAnalytics);

module.exports = router;
