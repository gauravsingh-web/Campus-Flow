const express = require('express');
const router = express.Router();
const {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFacultyStatus,
} = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// All authenticated roles can view faculty directory
router.get('/', getFacultyList);
router.get('/:id', getFacultyById);

// Admin only operations
router.post('/', authorize('admin'), createFaculty);
router.patch('/:id/status', authorize('admin'), updateFacultyStatus);

module.exports = router;
