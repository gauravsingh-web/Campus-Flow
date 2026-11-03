const express = require('express');
const router = express.Router();
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  assignComplaint,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post('/', authorize('student'), upload.single('attachment'), createComplaint);
router.patch('/:id/assign', authorize('admin'), assignComplaint);
router.patch('/:id/status', authorize('admin', 'faculty'), updateComplaintStatus);

module.exports = router;
