const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createBrandSchema = Joi.object({
  brand_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(200).allow(null, '').default(''),
  logo: Joi.any().optional(),
  website: Joi.string().trim().allow(null, '').default(''),
  origin: Joi.string().trim().allow(null, '').default(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateBrandSchema = Joi.object({
  brand_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(50).optional(),
  description: Joi.string().trim().max(200).allow(null, '').optional(),
  logo: Joi.any().optional(),
  website: Joi.string().trim().allow(null, '').optional(),
  origin: Joi.string().trim().allow(null, '').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});

module.exports = {
  createBrandSchema,
  updateBrandSchema,
};