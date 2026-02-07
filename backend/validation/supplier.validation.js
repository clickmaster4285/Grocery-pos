const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createSupplierSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  contactPerson: Joi.string().trim().max(100).allow(null, '').default(''),
  email: Joi.string().trim().lowercase().email().allow(null, '').default(''),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).messages({'string.pattern.base': 'Please enter a valid phone number'}).allow(null, '').default(''),
  address: Joi.object({
    street: Joi.string().allow(null, '').default(''),
    city: Joi.string().allow(null, '').default(''),
    state: Joi.string().allow(null, '').default(''),
    zip: Joi.string().allow(null, '').default(''),
    country: Joi.string().allow(null, '').default(''),
  }).optional(),
  isActive: Joi.boolean().default(true),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  contactPerson: Joi.string().trim().max(100).allow(null, '').optional(),
  email: Joi.string().trim().lowercase().email().allow(null, '').optional(),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).messages({'string.pattern.base': 'Please enter a valid phone number'}).allow(null, '').optional(),
  address: Joi.object({
    street: Joi.string().allow(null, '').optional(),
    city: Joi.string().allow(null, '').optional(),
    state: Joi.string().allow(null, '').optional(),
    zip: Joi.string().allow(null, '').optional(),
    country: Joi.string().allow(null, '').optional(),
  }).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
};