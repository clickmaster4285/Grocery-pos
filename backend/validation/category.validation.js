const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createCategorySchema = Joi.object({
  name: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(200).allow(null, '').default(''),
  isActive: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().max(50).optional(),
  description: Joi.string().trim().max(200).allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};