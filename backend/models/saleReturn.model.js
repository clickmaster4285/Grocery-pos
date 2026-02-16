const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    productName: String,
    sku: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: Number, // Price at the time of original sale
    reason: String,
    condition: {
        type: String,
        enum: ['GOOD', 'DAMAGED', 'EXPIRED'],
        default: 'GOOD'
    }
}, { _id: false });

const saleReturnSchema = new mongoose.Schema({
    returnNumber: {
        type: String,
        required: true,
        unique: true,
    },
    originalSale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    type: {
        type: String,
        enum: ['RETURN', 'EXCHANGE'],
        required: true,
    },
    returnedItems: [returnItemSchema],
    // Only used if type is 'EXCHANGE'
    exchangedItems: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: mongoose.Schema.Types.ObjectId,
        productName: String,
        sku: String,
        quantity: Number,
        unitPrice: Number,
        subtotal: Number
    }],
    totalRefundAmount: {
        type: Number,
        default: 0,
    },
    totalExchangeDifference: {
        type: Number, // Positive if customer pays more, negative if we refund difference
        default: 0,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'CANCELLED'],
        default: 'COMPLETED',
    }
}, {
    timestamps: true,
});

// Index for fast lookups
saleReturnSchema.index({ originalSale: 1 });

module.exports = mongoose.model('SaleReturn', saleReturnSchema);
