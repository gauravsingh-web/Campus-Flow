const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proofDescription: {
    type: String,
    required: [true, 'Proof of ownership or identifying details are required'],
  },
  contactPhone: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewNotes: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const lostFoundItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Electronics',
        'ID & Cards',
        'Books & Stationery',
        'Keys & Wallets',
        'Clothing',
        'Accessories',
        'Other',
      ],
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['Lost', 'Found'],
      required: true,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location is required (e.g. Library 2nd floor)'],
      trim: true,
    },
    dateLostFound: {
      type: Date,
      required: [true, 'Date when item was lost or found is required'],
      index: true,
    },
    contactPreference: {
      type: String,
      enum: ['Email', 'Phone', 'In-Person Admin Desk'],
      default: 'Email',
    },
    status: {
      type: String,
      enum: ['Open', 'Claimed', 'Returned', 'Closed'],
      default: 'Open',
      index: true,
    },
    claims: [claimSchema],
  },
  {
    timestamps: true,
  }
);

lostFoundItemSchema.index({ reportType: 1, status: 1 });

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
