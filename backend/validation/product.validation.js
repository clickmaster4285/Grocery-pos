const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

// Schema for variant attributes (key-value pairs)
const attributeSchema = Joi.object({
  key: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

// Schema for price history entries
const priceHistorySchema = Joi.object({
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  effectiveDate: Joi.date().iso().default(Joi.ref('$now')),
  changedBy: Joi.objectId(),
});

// Schema for stock history entries (for future StockTransaction integration, but also used in embedded history)
const stockHistorySchema = Joi.object({
  change: Joi.number().required(),
  type: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT').required(),
  reason: Joi.string().trim().max(200),
  date: Joi.date().iso().default(Joi.ref('$now')),
  performedBy: Joi.objectId().required(),
});


// Schema for a single product variant
const variantSchema = Joi.object({
  _id: Joi.objectId().optional(), // _id is optional for new variants, required for existing ones
  sku: Joi.string().trim().uppercase().max(50).allow('').optional(),
  attributes: Joi.array().items(attributeSchema).default([]),
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  stock: Joi.number().min(0).default(0),
  priceHistory: Joi.array().items(priceHistorySchema).default([]),
  stockHistory: Joi.array().items(stockHistorySchema).default([]),
  images: Joi.array().items(Joi.string().trim().allow('')).max(5).default([]),
  supplier: Joi.objectId().optional().allow(null, ''),
  barcode: Joi.string().trim().max(100).allow(null, ''),
  qrCode: Joi.string().trim().max(200).allow(null, ''),
  isDeleted: Joi.boolean().default(false),
  deletedAt: Joi.date().iso().allow(null),
  stockChangeType: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT').optional(),
  stockChangeReason: Joi.string().trim().max(200).optional(),
});

// Schema for creating a new product
const createProductSchema = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(1000).allow(null, ''),
  category: Joi.objectId().optional().allow(null, ''),
  brand: Joi.objectId().optional().allow(null, ''),
  variants: Joi.array().items(variantSchema).min(1).required(),
  isActive: Joi.boolean().default(true),
});

// Schema for updating an existing product
const updateProductSchema = Joi.object({
  // _id: Joi.objectId().required(), // Product ID is typically from URL params, not body for update
  productName: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  category: Joi.objectId().optional().allow(null, ''),
  brand: Joi.objectId().optional().allow(null, ''),
  variants: Joi.array().items(variantSchema).min(0).optional(),
  isActive: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional(),
});

module.exports = {
  attributeSchema,
  priceHistorySchema,
  stockHistorySchema,
  variantSchema,
  createProductSchema,
  updateProductSchema,
};