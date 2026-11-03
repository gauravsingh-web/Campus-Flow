const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const { bookingSchema } = require('../validators/schemas');
const { checkBookingConflict } = require('../services/bookingService');
const { notifyUser, notifyRole } = require('../sockets/socketHandler');

const getBookings = async (req, res, next) => {
  try {
    const { room, date, status } = req.query;
    const user = req.user;

    const query = {};

    if (user.role === 'student') {
      query.requester = user._id;
    }

    if (room) query.room = room;
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const bookings = await Booking.find(query)
      .populate('room')
      .populate('requester', 'name email role department')
      .populate('reviewedBy', 'name role')
      .sort({ date: -1, startTime: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const validatedData = bookingSchema.parse(req.body);

    const targetRoom = await Room.findById(validatedData.room);
    if (!targetRoom) {
      return res.status(404).json({
        success: false,
        message: 'Selected room does not exist.',
      });
    }

    if (targetRoom.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Room is currently marked as ${targetRoom.status} and cannot be reserved.`,
      });
    }

    // Strict Backend Concurrency Conflict Check
    const conflictResult = await checkBookingConflict(
      validatedData.room,
      validatedData.date,
      validatedData.startTime,
      validatedData.endTime
    );

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflictResult.message,
        conflict: conflictResult.conflictingBooking,
      });
    }

    // Auto-approve if requester is Admin or Faculty (optional campus policy) or mark Pending
    const initialStatus = req.user.role === 'admin' ? 'Approved' : 'Pending';

    const booking = new Booking({
      ...validatedData,
      requester: req.user._id,
      status: initialStatus,
      reviewedBy: req.user.role === 'admin' ? req.user._id : undefined,
    });

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('room')
      .populate('requester', 'name email role department');

    // Notify administrators if pending
    if (initialStatus === 'Pending') {
      notifyRole('admin', 'booking:new_request', populated);
    }

    return res.status(201).json({
      success: true,
      message: `Booking request registered (${initialStatus}) for ${targetRoom.roomId}.`,
      booking: populated,
    });
  } catch (err) {
    next(err);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected.',
      });
    }

    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // If approving, re-verify conflict in case another booking was approved in the interim
    if (status === 'Approved') {
      const conflictResult = await checkBookingConflict(
        booking.room._id,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking._id // exclude self
      );

      if (conflictResult.hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Cannot approve: ' + conflictResult.message,
        });
      }
    }

    booking.status = status;
    booking.reviewedBy = req.user._id;
    if (rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('room')
      .populate('requester', 'name email role')
      .populate('reviewedBy', 'name role');

    // Notify requester in real-time
    notifyUser(booking.requester, 'booking:status_change', populated);

    await Notification.create({
      recipient: booking.requester,
      sender: req.user._id,
      type: 'Booking_Update',
      title: `Booking ${status}: ${booking.room.roomId}`,
      message: `Your booking request for "${booking.room.name}" on ${new Date(booking.date).toLocaleDateString()} (${booking.startTime}-${booking.endTime}) has been ${status.toLowerCase()}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      link: `/bookings`,
    });

    return res.status(200).json({
      success: true,
      message: `Booking has been ${status.toLowerCase()}.`,
      booking: populated,
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Must be requester or admin
    if (booking.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking.',
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking reservation cancelled.',
      booking,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
};
