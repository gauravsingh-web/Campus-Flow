const express = require('express');
const router = express.Router();
const {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id/status', authorize('admin', 'faculty'), updateBookingStatus);
router.delete('/:id', cancelBooking);

module.exports = router;
