const mongoose = require('mongoose');

const dateSheetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    academicSession: {
      type: String,
      default: '2026-27',
    },
    semester: {
      type: String,
      default: 'Odd Semester (Dec 2026)',
    },
    department: {
      type: String,
      default: 'All',
    },
    fileName: {
      type: String,
      default: 'Exam theory datesheet-December,2026.pdf',
    },
    fileUrl: {
      type: String,
      default: '/source-data/Exam theory datesheet-December,2026.pdf',
    },
    fileSize: {
      type: String,
      default: '307 KB',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: 'Official University of Delhi End-Term Theory Date Sheet - December 2026',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DateSheet', dateSheetSchema);
