// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    // Identifiers
    customerId: { 
      type: String, 
      unique: true, 
      uppercase: true,
      index: true 
    },
    loyaltyCardNumber: { 
      type: String, 
      unique: true, 
      sparse: true,
      index: true 
    },

    // Basic Info
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      trim: true 
    },
    
    // Contact Info
    phonePrimary: { 
      type: String, 
      required: true, 
      trim: true,
      index: true 
    },
    phoneAlternate: { 
      type: String, 
      trim: true 
    },
    email: { 
      type: String, 
      trim: true,
      lowercase: true,
      index: true 
    },

    // Address Info
    streetAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },

    // Loyalty & Grouping
    customerGroup: {
      type: String,
      enum: ["Regular", "Silver", "Gold", "Platinum", "Staff"],
      default: "Regular"
    },
    loyaltyProgram: { type: String, default: "Standard" },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    redeemedPoints: { type: Number, default: 0, min: 0 },

    // Marketing & Preferences
    communicationEmail: { type: Boolean, default: true },
    communicationSms: { type: Boolean, default: false },
    communicationPush: { type: Boolean, default: false },
    preferences: { type: String },

    // Analytics (Cached for performance)
    totalSpent: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    lastVisitDate: { type: Date },
    
    // Status
    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    // Add text index for powerful name searching
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Indexes for fast POS lookups
customerSchema.index({ firstName: 'text', lastName: 'text', phonePrimary: 1 });

module.exports = mongoose.model("Customer", customerSchema);
