const QRCode = require('qrcode');
const User = require('../models/User');
const EventRegistration = require('../models/EventRegistration');

/**
 * Generate a Base64 QR Code image string from a payload string
 */
async function generateQrDataUrl(dataString) {
  try {
    return await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#1E1B4B',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + err.message);
  }
}

/**
 * Verify campus identity QR token
 */
async function verifyCampusIdentityToken(token) {
  if (!token) {
    return { valid: false, message: 'Identity token is missing' };
  }

  const user = await User.findOne({ qrToken: token.trim() })
    .populate('department', 'name code')
    .populate('studentProfile')
    .populate('facultyProfile');

  if (!user) {
    return { valid: false, message: 'Invalid or unregistered CampusFlow QR identity token' };
  }

  if (user.status !== 'active') {
    return {
      valid: false,
      message: `Identity card flagged: Account is currently ${user.status}`,
      user,
    };
  }

  return {
    valid: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ? user.department.name : 'N/A',
      studentProfile: user.studentProfile,
      facultyProfile: user.facultyProfile,
      avatar: user.avatar,
      status: user.status,
    },
  };
}

/**
 * Verify event ticket attendance token
 */
async function verifyEventTicket(eventId, ticketToken) {
  if (!ticketToken) {
    return { valid: false, message: 'Ticket token is missing' };
  }

  const registration = await EventRegistration.findOne({
    event: eventId,
    ticketToken: ticketToken.trim(),
  }).populate('user', 'name email role department');

  if (!registration) {
    return { valid: false, message: 'Invalid ticket token for this event' };
  }

  if (registration.attended) {
    return {
      valid: false,
      alreadyAttended: true,
      registration,
      message: `Already checked in at ${new Date(registration.attendedAt).toLocaleTimeString()}`,
    };
  }

  registration.attended = true;
  registration.attendedAt = new Date();
  await registration.save();

  return {
    valid: true,
    alreadyAttended: false,
    registration,
    message: 'Attendance recorded successfully!',
  };
}

module.exports = {
  generateQrDataUrl,
  verifyCampusIdentityToken,
  verifyEventTicket,
};
