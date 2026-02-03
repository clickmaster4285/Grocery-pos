const mongoose = require('mongoose');

// Sub-schema for Price History
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
      default: Date.now, // The date this price became effective
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User who made the price change
      default: null,
    },
  },
  { _id: false } // Do not create a default _id for sub-documents
);

// Sub-schema for Product Variants
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
    // SKU suffix to uniquely identify this variant (e.g., "-S", "-RED")
    skuSuffix: {
      type: String,
      trim:
        true,
      uppercase: true,
      maxlength: [20, 'SKU suffix cannot be more than 20 characters'],
    },
    // Adjustment to the base product price for this variant (can be negative)
    priceAdjustment: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      min: [0, 'Variant stock cannot be negative'],
      default: 0,
    },
    // A specific image for this variant, if different from the main product image
    imageUrl: {
      type: String,
      trim: true,
      // Stores path or filename for uploaded images
    },
  },
  { _id: false } // Do not create a default _id for sub-documents
);

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'], // e.g., 'Organic Apples', 'Whole Wheat Bread'
      unique: true, // Product name must be unique
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters'],
    },
    // Stock Keeping Unit (SKU) - unique identifier for inventory tracking
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true, // SKUs are typically uppercase
      maxlength: [50, 'SKU cannot be more than 50 characters'],
      // Example: 'OA-GRN-1KG', 'WWB-SLI-500G'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Product description cannot be more than 1000 characters'], // Increased max length
      // Example: 'Fresh, organic green apples, perfect for snacking or baking.'
    },
    basePrice: { // Renamed from 'price' to 'basePrice' as variants will adjust this
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    // Array to store price changes over time
    priceHistory: [priceHistorySchema],

    category: {
      type: String,
      trim: true,
      // Example: 'Fruits & Vegetables', 'Bakery', 'Dairy', 'Beverages', 'Snacks'
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand name cannot be more than 100 characters'],
      // Example: 'Nature\'s Best', 'Wholesome Foods'
    },
    supplier: {
      type: String, // Can be changed to ObjectId ref 'Supplier' later if needed
      trim: true,
      maxlength: [100, 'Supplier name cannot be more than 100 characters'],
      // Example: 'Local Farms Inc.'
    },
    imageUrl: {
      type: String,
      trim: true,
      // Stores path or filename for uploaded images
    },
    // Total stock quantity for the product (can be a sum of variant stocks if variants exist)
    totalStock: {
      type: Number,
      required: [true, 'Total stock quantity is required'],
      min: [0, 'Total stock cannot be negative'],
      default: 0,
    },
    // Date when the product was last restocked or had its stock updated significantly
    lastRestocked: {
      type: Date,
      default: null,
    },
    // Array of product variants (e.g., different sizes, colors)
    variants: [variantSchema],

    isActive: {
      type: Boolean,
      default: true, // Products are active by default
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
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model('Product', productSchema);