const mongoose = require('mongoose');

const complaintHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Infrastructure',
        'Classroom',
        'Laboratory',
        'Electricity',
        'Internet/Wi-Fi',
        'Cleanliness',
        'Other',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location on campus is required'],
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected',
      ],
      default: 'Submitted',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    history: [complaintHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Auto-generate human-friendly unique Complaint ID before saving
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    this.complaintId = `CMP-${year}-${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
