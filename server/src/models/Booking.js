const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'Booking purpose is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time in HH:mm is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time in HH:mm is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.bookingId = `BKG-${Date.now().toString().slice(-4)}-${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
