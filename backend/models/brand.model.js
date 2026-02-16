const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    brand_code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Brand name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Brand description cannot be more than 200 characters'],
    },
    logo: {
      type: String, // URL or file path
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    origin: {
      type: String, // Country/Region
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    // Audit & Soft Delete Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

// Index to prevent duplicate names if not deleted
brandSchema.index(
  { name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Brand', brandSchema);
