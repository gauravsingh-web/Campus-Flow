const Booking = require('../models/Booking');

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if a proposed room reservation overlaps with existing approved or pending bookings
 * @param {string} roomId
 * @param {Date|string} date
 * @param {string} startTime 'HH:mm'
 * @param {string} endTime 'HH:mm'
 * @param {string} [excludeBookingId] optional booking ID to exclude (for updates)
 */
async function checkBookingConflict(roomId, date, startTime, endTime, excludeBookingId = null) {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  if (reqStart >= reqEnd) {
    return {
      hasConflict: true,
      message: 'End time must be strictly after start time.',
    };
  }

  // Normalize date to YYYY-MM-DD midnight
  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const query = {
    room: roomId,
    date: {
      $gte: targetDate,
      $lt: nextDay,
    },
    status: { $in: ['Approved', 'Pending'] },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query).populate('requester', 'name email role');

  for (const existing of existingBookings) {
    const existStart = timeToMinutes(existing.startTime);
    const existEnd = timeToMinutes(existing.endTime);

    // Overlap condition:
    // (existStart < reqEnd) && (existEnd > reqStart)
    if (existStart < reqEnd && existEnd > reqStart) {
      return {
        hasConflict: true,
        conflictingBooking: existing,
        message: `Time slot ${startTime} - ${endTime} conflicts with an existing ${existing.status.toLowerCase()} reservation (${existing.startTime} - ${existing.endTime}) for "${existing.purpose}".`,
      };
    }
  }

  return { hasConflict: false };
}

module.exports = {
  checkBookingConflict,
  timeToMinutes,
};
