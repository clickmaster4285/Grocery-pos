const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot be more than 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // System Access & Security
    hasSystemAccess: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      select: false,
    },
    pin: {
      type: String,
      required: [true, 'PIN is required for attendance tracking'],
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // Role & Permissions
    role: {
      type: String,
      required: true,
      default: 'general_staff',
    },
    permissions: {
      type: [String],
      default: [],
    },

    // Employment Details
    hireDate: {
      type: Date,
      default: Date.now,
    },
    terminationDate: {
      type: Date,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    employmentStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
      default: 'ACTIVE',
    },

    // Financial / Salary Management
    salary: {
      baseAmount: {
        type: Number,
        default: 0,
      },
      payType: {
        type: String,
        enum: ['HOURLY', 'SALARY', 'FIXED'],
        default: 'SALARY',
      },
      paymentMethod: {
        type: String,
        enum: ['CASH', 'BANK_TRANSFER', 'CHECK'],
        default: 'CASH',
      },
      bankDetails: {
        bankName: String,
        accountNumber: String,
        iban: String,
      }
    },

    // Personal & Emergency
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);