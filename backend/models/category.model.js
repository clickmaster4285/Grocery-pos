const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    category_code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Category description cannot be more than 200 characters'],
    },
    category_type: {
      type: String,
      enum: ['PHYSICAL', 'SERVICE', 'DIGITAL'],
      default: 'PHYSICAL'
    },
    isActive: {
      type: Boolean,
      default: true,
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
categorySchema.index(
  { name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Category', categorySchema);
