const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  updateStudentStatus,
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Faculty and Admin can view student listings
router.get('/', authorize('admin', 'faculty'), getStudents);
router.get('/:id', authorize('admin', 'faculty'), getStudentById);

// Admin only can change student status
router.patch('/:id/status', authorize('admin'), updateStudentStatus);

module.exports = router;
