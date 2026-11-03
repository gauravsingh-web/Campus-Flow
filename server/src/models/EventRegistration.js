const mongoose = require('mongoose');
const crypto = require('crypto');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketToken: {
      type: String,
      unique: true,
      index: true,
    },
    attended: {
      type: Boolean,
      default: false,
      index: true,
    },
    attendedAt: {
      type: Date,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate user registrations for the same event
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

eventRegistrationSchema.pre('save', function (next) {
  if (!this.ticketToken) {
    this.ticketToken = 'EVT-TKT-' + crypto.randomBytes(12).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
