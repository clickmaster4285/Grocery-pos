const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplier_code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Supplier name cannot be more than 100 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Financial & Tax Info
    tax_id: {
      type: String,
      trim: true
    },
    registration_number: {
      type: String,
      trim: true
    },
    bank_details: {
      bank_name: String,
      account_number: String,
      account_holder_name: String,
      branch_name: String,
      iban: String
    },
    payment_terms: {
      type: String,
      enum: ['CASH', 'CREDIT', 'NET_30', 'NET_60', 'DUE_ON_RECEIPT'],
      default: 'CASH'
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
supplierSchema.index(
  { name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Supplier', supplierSchema);
