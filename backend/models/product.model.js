const mongoose = require('mongoose');
const Category = require('./category.model');
const Brand = require('./brand.model');
const Supplier = require('./supplier.model');

// Defines the structure for price change history for each variant
const priceHistorySchema = new mongoose.Schema({
    buyingPrice: {
        type: Number,
        required: [true, 'Buying price is required for price history.'],
        min: [0, 'Buying price cannot be negative.'],
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required for price history.'],
        min: [0, 'Selling price cannot be negative.'],
    },
    effectiveDate: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { _id: false });

// Defines the structure for stock change history for each variant
const stockHistorySchema = new mongoose.Schema({
    change: {
        type: Number,
        required: [true, 'Stock change amount is required.'],
    },
    type: {
        type: String,
        required: [true, 'Type of stock change is required.'],
        enum: ['RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT'],
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [200, 'Reason cannot be more than 200 characters.'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { _id: false });

// Defines the structure for product variants
const variantSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'SKU is required for each variant.'],
        unique: true,
        trim: true,
        uppercase: true,
        sparse: true, // Required for unique constraint to ignore null values in soft-deleted docs
    },
    attributes: [{
        key: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: String,
            required: true,
            trim: true,
        },
        _id: false,
    }],
    stock: {
        type: Number,
        required: [true, 'Variant stock quantity is required.'],
        min: [0, 'Variant stock cannot be negative.'],
        default: 0,
    },
    stockHistory: [stockHistorySchema],
    priceHistory: [priceHistorySchema],
    images: [{
        type: String,
        trim: true,
    }],
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier is required for each variant.'],
    },
    barcode: {
        type: String,
        unique: true,
        trim: true,
        sparse: true, // Allows multiple null/undefined values
        maxlength: [100, 'Barcode cannot be more than 100 characters.'],
    },
    qrCode: {
        type: String,
        unique: true,
        trim: true,
        sparse: true, // Allows multiple null/undefined values
        maxlength: [200, 'QR Code data cannot be more than 200 characters.'],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true }); // Adds createdAt and updatedAt to variants

// Main product schema
const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required.'],
        trim: true,
        maxlength: [100, 'Product name cannot be more than 100 characters.'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Product description cannot be more than 1000 characters.'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required.'],
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        trim: true,
        maxlength: [100, 'Brand name cannot be more than 100 characters.'],
    },
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch ID is required.'],
    },
    totalStock: {
        type: Number,
        min: [0, 'Total stock cannot be negative.'],
        default: 0,
    },
    lastRestocked: {
        type: Date,
        default: null,
    },
    variants: [variantSchema],
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

// Middleware to calculate totalStock before saving
productSchema.pre('save', function(next) {
    this.totalStock = this.variants.reduce((acc, variant) => {
        // Only include stock from non-deleted variants in the total
        return variant.isDeleted ? acc : acc + variant.stock;
    }, 0);
    next();
});

// Create a compound index for product name and branch to ensure uniqueness per branch
productSchema.index({ productName: 1, branch_id: 1, isDeleted: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });


module.exports = mongoose.model('Product', productSchema);