const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID / Roll Number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    enrolmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    formNo: {
      type: String,
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required (1-8)'],
      min: 1,
      max: 8,
      default: 3,
    },
    section: {
      type: String,
      default: 'A',
      trim: true,
      uppercase: true,
    },
    batch: {
      type: String,
      default: '2025-2029',
    },
    admissionYear: {
      type: Number,
      default: 2025,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
