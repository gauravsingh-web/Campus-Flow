const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  registerForEvent,
  cancelRegistration,
  getEventAttendees,
  verifyAttendance,
} = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authorize('admin', 'faculty'), upload.single('banner'), createEvent);
router.post('/:id/register', authorize('student', 'faculty'), registerForEvent);
router.delete('/:id/register', authorize('student', 'faculty'), cancelRegistration);
router.get('/:id/attendees', authorize('admin', 'faculty'), getEventAttendees);
router.post('/:id/verify-attendance', authorize('admin', 'faculty'), verifyAttendance);

module.exports = router;
