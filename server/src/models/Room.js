const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Room code/ID is required (e.g. LH-101)'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Classroom', 'Laboratory', 'Seminar Hall', 'Auditorium', 'Conference Room'],
      required: true,
      index: true,
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: 1,
    },
    facilities: {
      type: [String],
      default: ['Projector', 'Whiteboard'],
    },
    status: {
      type: String,
      enum: ['Available', 'Maintenance', 'Inactive'],
      default: 'Available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);
