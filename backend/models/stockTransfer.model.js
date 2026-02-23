const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema({
    transferType: {
        type: String,
        enum: ['EXTERNAL', 'INTERNAL'],
        default: 'EXTERNAL',
        required: true,
    },
    fromLocation: {
        type: String, // 'WAREHOUSE', Branch ID, or BranchLocation ID (if INTERNAL)
        required: true,
    },
    toLocation: {
        type: String, // Branch ID or BranchLocation ID (if INTERNAL)
        required: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        // Required for INTERNAL transfers to identify the branch context
    },
    items: [{
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
            min: 1,
        },
        _id: false,
    }],
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
    },
    transferDate: {
        type: Date,
        default: Date.now,
    },
    transferredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
