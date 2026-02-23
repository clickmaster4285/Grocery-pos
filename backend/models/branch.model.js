const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant', // If you have a tenant model
  },
  branch_code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  branch_name: {
    type: String,
    required: true,
    trim: true
  },
  tax_region: String,
  opening_time: String,
  closing_time: String,
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  },
  address: {
    city: String, 
    state: String,
    country: String,
    street: String,
    zipCode: String
  },
  terminals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Terminal'
    }
  ],
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
}, {
  timestamps: true
});

// Update index to handle soft delete and unique names per tenant
BranchSchema.index(
  { tenant_id: 1, branch_name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model("Branch", BranchSchema);
