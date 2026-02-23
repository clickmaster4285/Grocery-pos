const mongoose = require('mongoose');

const terminalShiftReportSchema = new mongoose.Schema(
  {
    terminal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Terminal',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    openedAt: {
      type: Date,
      required: true,
    },
    closedAt: {
      type: Date,
      required: true,
    },
    openingFloat: {
      type: Number,
      required: true,
      default: 0,
    },
    closingFloat: { // Actual cash counted at the end of the shift
      type: Number,
      required: true,
    },
    expectedFloat: { // System calculated cash balance at the end of the shift
      type: Number,
      required: true,
    },
    variance: { // Difference between closingFloat and expectedFloat
      type: Number,
      required: true,
    },
    totalSalesCount: { // Number of sales transactions during this shift
      type: Number,
      default: 0,
    },
    totalSalesAmount: { // Sum of final amounts of sales during this shift
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Aborted', 'Unreconciled'], // e.g., shift completed, or forcibly closed
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TerminalShiftReport', terminalShiftReportSchema);
