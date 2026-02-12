const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema({
    fromLocation: {
        type: String,
        required: true,
        // Could be 'WAREHOUSE' or a Branch ID
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
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
