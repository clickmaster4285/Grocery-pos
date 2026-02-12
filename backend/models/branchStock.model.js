const mongoose = require('mongoose');

const branchStockSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

// Compound index to ensure unique stock entry per branch and variant
branchStockSchema.index({ branch: 1, product: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.model('BranchStock', branchStockSchema);
