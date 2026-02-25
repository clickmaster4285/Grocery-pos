const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    sku: String,
    productName: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    originalUnitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    }
}, { _id: false });

const saleSchema = new mongoose.Schema({
    billNumber: {
        type: String,
        required: true,
        unique: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalTax: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: { // This is subtotal + totalTax
        type: Number,
        required: true,
        min: 0,
    },
    globalDiscountPercent: {
        type: Number,
        default: 0,
        min: 0,
    },
    globalDiscountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    finalAmount: { // totalAmount - globalDiscountAmount
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'ONLINE_TRANSFER', 'OTHER'],
        required: true,
        default: 'CASH',
    },
    terminal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Terminal',
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: {
        type: String,
        trim: true,
    },
    customerPhone: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'CANCELLED', 'REFUNDED'],
        default: 'COMPLETED',
    }
}, {
    timestamps: true,
});

// Index for faster searching by bill number and date
saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
