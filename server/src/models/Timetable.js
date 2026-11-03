const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
      default: '2026-27',
      index: true,
    },
    effectiveDate: {
      type: String,
      default: '17th September 2026',
    },
    department: {
      type: String,
      required: true,
      enum: ['CSE', 'ECE', 'EE'],
      index: true,
    },
    year: {
      type: String,
      required: true,
      default: '2nd Year',
      index: true,
    },
    semester: {
      type: Number,
      default: 3,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    facultyAcronym: {
      type: String,
      trim: true,
      default: '',
    },
    facultyName: {
      type: String,
      trim: true,
      default: '',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: 'TBD',
    },
    type: {
      type: String,
      enum: ['Lecture', 'Practical', 'Tutorial'],
      default: 'Lecture',
    },
    subGroup: {
      type: String,
      trim: true,
      default: 'All',
    },
  },
  {
    timestamps: true,
  }
);

timetableSchema.index({ department: 1, year: 1, section: 1, day: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
