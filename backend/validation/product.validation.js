const Joi = require('joi');

const objectIdSchema = Joi.string().hex().length(24).allow(null, '');

const attributeSchema = Joi.object({
  key: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
}).unknown(true);

const priceHistorySchema = Joi.object({
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  effectiveDate: Joi.date().iso().default(Joi.ref('$now')),
  changedBy: Joi.any(), // Allow object or ID
}).unknown(true);

const stockHistorySchema = Joi.object({
  change: Joi.number().required(),
  type: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT').required(),
  reason: Joi.string().trim().max(200),
  date: Joi.date().iso().default(Joi.ref('$now')),
  performedBy: Joi.any(), // Allow object or ID
}).unknown(true);

const variantSchema = Joi.object({
  _id: Joi.any().optional(), // Be extremely permissive with IDs during updates
  sku: Joi.string().trim().uppercase().max(50).allow('').optional(),
  attributes: Joi.array().items(attributeSchema).default([]),
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  stock: Joi.number().min(0).default(0),
  priceHistory: Joi.any().strip(),
  stockHistory: Joi.any().strip(),
  images: Joi.array().items(Joi.string().trim().allow('')).max(5).default([]),
  supplier: Joi.any().optional().allow(null, ''),
  barcode: Joi.string().trim().max(100).allow(null, ''),
  qrCode: Joi.string().trim().max(200).allow(null, ''),
  isDeleted: Joi.boolean().default(false),
  deletedAt: Joi.date().iso().allow(null),
  minStockLevel: Joi.number().min(0).default(0),
  maxStockLevel: Joi.number().min(0).default(0),
  stockChangeAmount: Joi.number().optional(),
  stockChangeType: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', null, '').optional(),
  stockChangeReason: Joi.string().trim().max(200).allow(null, '').optional(),
  createdAt: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  __v: Joi.any().strip(),
}).unknown(true);

// A variant schema specifically for updates, including stock adjustment validation
const variantSchemaForUpdate = variantSchema.keys({
  stock: Joi.number().min(0).default(0)
    .when('stockChangeAmount', {
      is: Joi.exist().not(null),
      then: Joi.number()
        .custom((value, helpers) => {
          const currentStock = value;
          const stockChangeAmount = helpers.state.ancestors[0].stockChangeAmount;

          if (currentStock + stockChangeAmount < 0) {
            return helpers.error('any.custom', {
              message: `Resulting stock (${currentStock + stockChangeAmount}) cannot be negative for SKU ${helpers.state.ancestors[0].sku || 'N/A'}.`,
              label: 'resultingStock'
            });
          }
          return value;
        }, 'resulting stock cannot be negative'),
    }),
  stockChangeType: Joi.string().valid('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT')
    .allow(null, '')
    .when('stockChangeAmount', {
      is: Joi.number().not(0).exist().not(null),
      then: Joi.required(),
    }),
  stockChangeReason: Joi.string().trim().max(200).allow(null, '').optional(),
}).unknown(true);

const createProductSchema = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(1000).allow(null, ''),
  category: Joi.any().optional().allow(null, ''),
  brand: Joi.any().optional().allow(null, ''),
  unit: Joi.string().valid('PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'DOZEN').default('PIECE'),
  storageRequirement: Joi.string().valid('AMBIENT', 'REFRIGERATED', 'FROZEN').default('AMBIENT'),
  taxRate: Joi.number().min(0).default(0),
  variants: Joi.array().items(variantSchema).min(1).required(),
  isActive: Joi.boolean().default(true),
}).unknown(true);

const updateProductSchema = Joi.object({
  _id: Joi.any().strip(),
  productName: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  category: Joi.any().optional().allow(null, ''),
  brand: Joi.any().optional().allow(null, ''),
  unit: Joi.string().valid('PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'DOZEN').optional(),
  storageRequirement: Joi.string().valid('AMBIENT', 'REFRIGERATED', 'FROZEN').optional(),
  taxRate: Joi.number().min(0).optional(),
  variants: Joi.array().items(variantSchemaForUpdate).min(0).optional(),
  isActive: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional(),
  totalStock: Joi.any().strip(), // Strip calculated field
  lastRestocked: Joi.any().strip(), // Strip calculated field
  createdAt: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  __v: Joi.any().strip(),
}).unknown(true);

module.exports = {
  attributeSchema,
  priceHistorySchema,
  stockHistorySchema,
  variantSchema,
  createProductSchema,
  updateProductSchema,
};