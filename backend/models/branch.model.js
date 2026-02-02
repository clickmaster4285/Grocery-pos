const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    //required: true
  },
  branch_name: {
    type: String,
    required: true
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
    country: String
  }
}, {
  timestamps: true
});

BranchSchema.index(
  { tenant_id: 1, branch_name: 1, "address.city": 1, status: 1 },
  { unique: true }
);
module.exports = mongoose.model("Branch", BranchSchema);
