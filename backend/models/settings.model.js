const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  // Basic Company Info
  companyName: {
    type: String,
    required: true,
    trim: true,
    default: "Supermarket POS"
  },
  companyAddress: {
    type: String,
    trim: true
  },
  companyPhone: {
    type: String,
    trim: true
  },
  companyEmail: {
    type: String,
    trim: true
  },
  companyWebsite: {
    type: String,
    trim: true
  },

  logo: {
    type: String   // store URL or file path
  },

  // POS & Receipt Configuration
  receiptFooterMessage: {
    type: String,
    default: "Thank you for shopping with us!"
  },
  receiptTerms: {
    type: String,
    default: "Goods once sold are not returnable without a valid receipt."
  },

  // Financial Configuration
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0
  },
  taxName: {
    type: String,
    default: "VAT"
  },
  taxNumber: { // e.g., VAT ID or Tax ID for receipts
    type: String,
    trim: true
  },

  currency: {
    type: String,
    default: "USD"
  },
  currencySymbol: {
    type: String,
    default: "$"
  },

  // System Configuration
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  language: {
    type: String,
    default: "en"
  },
  timezone: {
    type: String,
    default: "UTC"
  },

  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    salesAlerts: {
      type: Boolean,
      default: true
    },
    inventoryAlerts: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: true
    },
    dailyReports: {
      type: Boolean,
      default: false
    },
    weeklyReports: {
      type: Boolean,
      default: false
    }
  }

}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
