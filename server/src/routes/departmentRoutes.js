const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Public/authenticated access to list departments (needed for student registration too)
router.get('/', getDepartments);
router.post('/', authenticate, authorize('admin'), createDepartment);

module.exports = router;
