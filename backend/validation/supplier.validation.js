const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createSupplierSchema = Joi.object({
  supplier_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(100).required(),
  contactPerson: Joi.string().trim().max(100).allow(null, '').default(''),
  email: Joi.string().trim().lowercase().email().allow(null, '').default(''),
  phone: Joi.string().trim().allow(null, '').default(''),
  address: Joi.object({
    street: Joi.string().allow(null, '').default(''),
    city: Joi.string().allow(null, '').default(''),
    state: Joi.string().allow(null, '').default(''),
    zipCode: Joi.string().allow(null, '').default(''),
    country: Joi.string().allow(null, '').default(''),
  }).optional(),
  tax_id: Joi.string().trim().allow(null, '').default(''),
  registration_number: Joi.string().trim().allow(null, '').default(''),
  bank_details: Joi.object({
    bank_name: Joi.string().allow(null, '').default(''),
    account_number: Joi.string().allow(null, '').default(''),
    account_holder_name: Joi.string().allow(null, '').default(''),
    branch_name: Joi.string().allow(null, '').default(''),
    iban: Joi.string().allow(null, '').default(''),
  }).optional(),
  payment_terms: Joi.string().valid('CASH', 'CREDIT', 'NET_30', 'NET_60', 'DUE_ON_RECEIPT').default('CASH'),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateSupplierSchema = Joi.object({
  supplier_code: Joi.string().trim().uppercase().allow('').optional(),
  name: Joi.string().trim().max(100).optional(),
  contactPerson: Joi.string().trim().max(100).allow(null, '').optional(),
  email: Joi.string().trim().lowercase().email().allow(null, '').optional(),
  phone: Joi.string().trim().allow(null, '').optional(),
  address: Joi.object({
    street: Joi.string().allow(null, '').optional(),
    city: Joi.string().allow(null, '').optional(),
    state: Joi.string().allow(null, '').optional(),
    zipCode: Joi.string().allow(null, '').optional(),
    country: Joi.string().allow(null, '').optional(),
  }).optional(),
  tax_id: Joi.string().trim().allow(null, '').optional(),
  registration_number: Joi.string().trim().allow(null, '').optional(),
  bank_details: Joi.object({
    bank_name: Joi.string().allow(null, '').optional(),
    account_number: Joi.string().allow(null, '').optional(),
    account_holder_name: Joi.string().allow(null, '').optional(),
    branch_name: Joi.string().allow(null, '').optional(),
    iban: Joi.string().allow(null, '').optional(),
  }).optional(),
  payment_terms: Joi.string().valid('CASH', 'CREDIT', 'NET_30', 'NET_60', 'DUE_ON_RECEIPT').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
};