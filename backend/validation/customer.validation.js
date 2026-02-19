const Joi = require('joi');

const createCustomerSchema = Joi.object({
  firstName: Joi.string().required().trim(),
  lastName: Joi.string().allow('', null).trim(),
  phonePrimary: Joi.string().required().trim(),
  phoneAlternate: Joi.string().allow('', null).trim(),
  email: Joi.string().email().allow('', null).lowercase().trim(),
  streetAddress: Joi.string().allow('', null).trim(),
  city: Joi.string().allow('', null).trim(),
  state: Joi.string().allow('', null).trim(),
  zip: Joi.string().allow('', null).trim(),
  customerGroup: Joi.string().valid("Regular", "Silver", "Gold", "Platinum", "Staff").default("Regular"),
  loyaltyProgram: Joi.string().allow('', null).trim(),
  communicationEmail: Joi.boolean(),
  communicationSms: Joi.boolean(),
  communicationPush: Joi.boolean(),
  preferences: Joi.string().allow('', null),
  isActive: Joi.boolean()
});

const updateCustomerSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().allow('', null).trim(),
  phonePrimary: Joi.string().trim(),
  phoneAlternate: Joi.string().allow('', null).trim(),
  email: Joi.string().email().allow('', null).lowercase().trim(),
  streetAddress: Joi.string().allow('', null).trim(),
  city: Joi.string().allow('', null).trim(),
  state: Joi.string().allow('', null).trim(),
  zip: Joi.string().allow('', null).trim(),
  customerGroup: Joi.string().valid("Regular", "Silver", "Gold", "Platinum", "Staff"),
  loyaltyProgram: Joi.string().allow('', null).trim(),
  communicationEmail: Joi.boolean(),
  communicationSms: Joi.boolean(),
  communicationPush: Joi.boolean(),
  preferences: Joi.string().allow('', null),
  isActive: Joi.boolean()
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};
