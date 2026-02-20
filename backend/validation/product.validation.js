const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const attributeSchema = Joi.object({
  key: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

const priceHistorySchema = Joi.object({
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  effectiveDate: Joi.date().iso().default(Joi.ref('$now')),
  changedBy: Joi.objectId(),
});

const stockHistorySchema = Joi.object({
  change: Joi.number().required(),
  type: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT').required(),
  reason: Joi.string().trim().max(200),
  date: Joi.date().iso().default(Joi.ref('$now')),
  performedBy: Joi.objectId().required(),
});

const variantSchema = Joi.object({
  _id: Joi.objectId().optional(),
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
  minStockLevel: Joi.number().min(0).default(0),
  maxStockLevel: Joi.number().min(0).default(0),
  stockChangeAmount: Joi.number().optional(),
  stockChangeType: Joi.valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', null, '').optional(), // Allow null/empty in base schema
  stockChangeReason: Joi.string().trim().max(200).allow(null, '').optional(), // Allow null/empty in base schema
});

// A variant schema specifically for updates, including stock adjustment validation
const variantSchemaForUpdate = variantSchema.keys({
  stock: Joi.number().min(0).default(0) // Ensure base stock is non-negative
    .when('stockChangeAmount', {
      is: Joi.exist().not(null), // If stockChangeAmount is provided
      then: Joi.number()
        .custom((value, helpers) => {
          const currentStock = value; // This 'value' is the variant.stock from the incoming payload
          const stockChangeAmount = helpers.state.ancestors[0].stockChangeAmount; // Access stockChangeAmount from the parent object

          if (currentStock + stockChangeAmount < 0) {
            return helpers.error('any.custom', {
              message: `Resulting stock (${currentStock + stockChangeAmount}) cannot be negative for SKU ${helpers.state.ancestors[0].sku || 'N/A'}.`,
              label: 'resultingStock'
            });
          }
          return value;
        }, 'resulting stock cannot be negative'),
    }),
  stockChangeType: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT')
    .when('stockChangeAmount', {
      is: Joi.number().not(0).exist().not(null), // Only required if stockChangeAmount is a non-zero number
      then: Joi.required(),
      // No 'otherwise' needed, as base schema already allows null/empty
    }),
  stockChangeReason: Joi.string().trim().max(200)
    .when('stockChangeAmount', { // Also make stockChangeReason conditionally required if amount is present
      is: Joi.number().not(0).exist().not(null), // Only required if stockChangeAmount is a non-zero number
      then: Joi.required(),
      // No 'otherwise' needed, as base schema already allows null/empty
    }),
});

const createProductSchema = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(1000).allow(null, ''),
  category: Joi.objectId().optional().allow(null, ''),
  brand: Joi.objectId().optional().allow(null, ''),
  unit: Joi.string().valid('PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'DOZEN').default('PIECE'),
  storageRequirement: Joi.string().valid('AMBIENT', 'REFRIGERATED', 'FROZEN').default('AMBIENT'),
  taxRate: Joi.number().min(0).default(0),
  variants: Joi.array().items(variantSchema).min(1).required(),
  isActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object({
  productName: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  category: Joi.objectId().optional().allow(null, ''),
  brand: Joi.objectId().optional().allow(null, ''),
  unit: Joi.string().valid('PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'DOZEN').optional(),
  storageRequirement: Joi.string().valid('AMBIENT', 'REFRIGERATED', 'FROZEN').optional(),
  taxRate: Joi.number().min(0).optional(),
  variants: Joi.array().items(variantSchemaForUpdate).min(0).optional(), // Use the update-specific variant schema
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