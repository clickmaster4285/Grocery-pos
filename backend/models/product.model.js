const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price is required for price history'],
      min: [0, 'Buying price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required for price history'],
      min: [0, 'Selling price cannot be negative'],
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Variant name cannot be more than 50 characters'],
    },
    value: {
      type: String,
      trim: true,
      maxlength: [50, 'Variant value cannot be more than 50 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required for variant'],
      unique: true, // SKU must be unique across all variants of all products
      trim: true,
      uppercase: true,
      maxlength: [50, 'SKU cannot be more than 50 characters'],
    },
    priceHistory: [priceHistorySchema],
    stock: {
      type: Number,
      min: [0, 'Variant stock cannot be negative'],
      default: 0,
    },
    imageUrl: [{
      type: String,
      trim: true,
    }],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Product description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand name cannot be more than 100 characters'],
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot be more than 100 characters'],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required'],
    },
    imageUrls: [{
      type: String,
      trim: true,
    }],
    totalStock: {
      type: Number,
      required: [true, 'Total stock quantity is required'],
      min: [0, 'Total stock cannot be negative'],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);