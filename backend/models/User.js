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
      // required: [true, 'PIN is required for attendance tracking'], it is not required for now because we also got some gereral staff
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
    allowedTerminals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Terminal',
      }
    ],
    transactionLimits: {
      maxDiscountPercent: { type: Number, default: 10 },
      maxVoidAmount: { type: Number, default: 500 },
      requireManagerForPriceOverride: { type: Boolean, default: true }
    },

    // Employment Details
    employment: {
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
      status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
        default: 'ACTIVE',
      },
    },

    // Current Shift Configuration
    shift: {
      startTime: String, // e.g. "09:00"
      endTime: String,   // e.g. "17:00"
      workDays: [String], // e.g. ["Monday", "Tuesday"]
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

    // Historical Records
    salaryHistory: [
      {
        baseAmount: Number,
        payType: String,
        effectiveDate: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    designationHistory: [
      {
        designation: String,
        department: String,
        effectiveDate: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    shiftHistory: [
      {
        startTime: String,
        endTime: String,
        workDays: [String],
        effectiveDate: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Personal & Emergency
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
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