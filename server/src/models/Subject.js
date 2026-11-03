const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    sNo: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    upcCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      index: true,
      default: 'General',
    },
    paperType: {
      type: String,
      trim: true,
      index: true,
      default: 'DSC',
    },
    semester: {
      type: String,
      trim: true,
      default: '-',
    },
    lectureHours: {
      type: Number,
      default: 0,
    },
    tutorialHours: {
      type: Number,
      default: 0,
    },
    practicalHours: {
      type: Number,
      default: 0,
    },
    totalCredits: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ name: 'text', upcCode: 'text' });

module.exports = mongoose.model('Subject', subjectSchema);
