const mongoose = require("mongoose");

const terminalSchema = new mongoose.Schema(
  {
    // Identity & Location
    terminalId: { type: String, required: true, unique: true, index: true }, // e.g., TRM-001
    name: { type: String, required: true }, // e.g., "Checkout Lane 1"
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    department: { type: String, default: "General" }, // e.g., "Bakery", "Pharmacy"

    // Hardware Configuration (Menu 8.2)
    ipAddress: { type: String }, // For security whitelisting
    macAddress: { type: String }, // Physical device binding
    deviceType: { 
      type: String, 
      enum: ["Desktop", "Tablet", "Kiosk", "Mobile"], 
      default: "Desktop" 
    },
    
    // Peripherals Status (connected/disconnected logic)
    peripherals: {
      printer: {
        name: { type: String },
        connectionType: { type: String, enum: ["USB", "Ethernet", "Bluetooth", "None"], default: "None" },
        status: { type: String, enum: ["Connected", "Disconnected", "Error"], default: "Disconnected" }
      },
      scanner: {
        name: { type: String },
        connectionType: { type: String, enum: ["USB", "Bluetooth", "None"], default: "None" },
        status: { type: String, enum: ["Connected", "Disconnected"], default: "Disconnected" }
      },
      scale: {
        name: { type: String },
        connectionType: { type: String, enum: ["USB", "Serial", "None"], default: "None" },
        isCalibrated: { type: Boolean, default: false }
      },
      cashDrawer: {
        isConnected: { type: Boolean, default: false },
        lastOpened: { type: Date }
      },
      customerDisplay: {
        isConnected: { type: Boolean, default: false }
      }
    },

    // Operational Status
    status: {
      type: String,
      enum: ["Available", "Occupied", "Locked", "Closed", "Maintenance"],
      default: "Closed"
    },
    
    // Live Session State (Module 7: Cash Management)
    // Tracks the CURRENT open shift/session. Reset to null on close.
    activeSession: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // The cashier currently logged in
      openedAt: { type: Date },
      openingFloat: { type: Number, default: 0 }, // Starting cash
      currentDrawerBalance: { type: Number, default: 0 }, // Running total (Cash Sales - Cash Refunds)
      transactionCount: { type: Number, default: 0 },
      lastTransactionId: { type: String } // Ref to last Sale ID
    },

    softwareVersion: { type: String },
    lastMaintenanceDate: { type: Date },
    
    isActive: { type: Boolean, default: true } // Soft delete flag
  },
  { timestamps: true }
);

module.exports = mongoose.model("Terminal", terminalSchema);