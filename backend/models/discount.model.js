// models/DiscountPromotion.js
const mongoose = require("mongoose");

const discountPromotionSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["BOGO", "Discount", "Mix & Match", "Bundle"],
      default: "Discount",
    },

    couponCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    // Multi-Branch Support
    isGlobal: {
      type: Boolean,
      default: false,
    },
    applicableBranches: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }
    ],

    // Targeted Items
    qualifyingCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
    ],
    qualifyingBrands: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Brand" }
    ],
    qualifyingProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
    ],
    qualifyingVariants: [
      { type: String } 
    ],

    // Bundle / Combo Rules (e.g., Buy 1 from Cat A + 1 from Cat B)
    bundleRules: [
      {
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        minQuantity: { type: Number, default: 1 }
      }
    ],

    // Targeted Customers
    qualifyingCustomerGroups: [
      { type: String, enum: ["Regular", "Silver", "Gold", "Platinum", "Staff"] }
    ],

    // Discount Info
    discountDescription: {
      type: String,
    },
    amountType: {
      type: String,
      enum: ["Fixed", "Percentage", "Set Price"], 
    },
    amountValue: {
      type: Number,
      min: 0,
      default: 0
    },

    // Structured Logic for Calculation
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    minItemPrice: { // New: Apply only if item price is >= this
      type: Number,
      min: 0
    },
    maxItemPrice: { // New: Apply only if item price is <= this
      type: Number,
      min: 0
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1
    },

    // For BOGO logic
    buyQuantity: {
      type: Number,
      min: 1
    },
    getQuantity: {
      type: Number,
      min: 1
    },

    // Validity Period (General)
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
    },

    // Temporal Logic (Happy Hours / Specific Days)
    applicableDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: [] // Empty means all days
    },
    startTime: {
      type: String, // Format "HH:mm" e.g., "14:00"
    },
    endTime: {
      type: String, // Format "HH:mm" e.g., "16:00"
    },

    // Usage Tracking
    usageLimit: {
      type: Number,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    limitPerCustomer: {
      type: Number,
      default: 1,
    },

    // Auto-apply and Priority
    priority: {
      type: Number, // 1-10 for better conflict resolution
      default: 1,
    },
    autoApply: {
      type: Boolean,
      default: true,
    },

    // Flags for stacking / combination
    allowFurtherDiscounts: {
      type: Boolean,
      default: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for faster searching
discountPromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
discountPromotionSchema.index({ couponCode: 1 });
discountPromotionSchema.index({ applicableBranches: 1 });

module.exports = mongoose.model("DiscountPromotion", discountPromotionSchema);
