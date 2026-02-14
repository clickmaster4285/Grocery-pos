const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createCategorySchema = Joi.object({
  category_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(200).allow(null, '').default(''),
  category_type: Joi.string().valid('PHYSICAL', 'SERVICE', 'DIGITAL').default('PHYSICAL'),
  isActive: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  category_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(50).optional(),
  description: Joi.string().trim().max(200).allow(null, '').optional(),
  category_type: Joi.string().valid('PHYSICAL', 'SERVICE', 'DIGITAL').optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};