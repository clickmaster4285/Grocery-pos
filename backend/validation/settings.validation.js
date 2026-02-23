const Joi = require('joi');

const updateSettingsSchema = Joi.object({
  companyName: Joi.string().required().trim(),
  companyAddress: Joi.string().allow('', null).trim(),
  companyPhone: Joi.string().allow('', null).trim(),
  companyEmail: Joi.string().email().allow('', null).trim(),
  companyWebsite: Joi.string().uri().allow('', null).trim(),
  
  receiptFooterMessage: Joi.string().allow('', null),
  receiptTerms: Joi.string().allow('', null),
  
  taxPercentage: Joi.number().min(0).default(0),
  taxName: Joi.string().allow('', null).trim(),
  taxNumber: Joi.string().allow('', null).trim(),
  
  currency: Joi.string().required().trim(),
  currencySymbol: Joi.string().required().trim(),
  
  lowStockThreshold: Joi.number().min(0).default(10),
  language: Joi.string().default('en'),
  timezone: Joi.string().default('UTC'),
  
  notifications: Joi.object({
    emailNotifications: Joi.boolean(),
    smsNotifications: Joi.boolean(),
    salesAlerts: Joi.boolean(),
    inventoryAlerts: Joi.boolean(),
    systemUpdates: Joi.boolean(),
    dailyReports: Joi.boolean(),
    weeklyReports: Joi.boolean()
  })
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim().allow('', null),
  phone: Joi.string().trim(),
  email: Joi.string().email().trim(),
  currentPassword: Joi.string().allow('', null),
  oldPassword: Joi.string().allow('', null),
  newPassword: Joi.string().min(6).allow('', null),
  confirmPassword: Joi.string().allow('', null)
});

module.exports = {
  updateSettingsSchema,
  updateProfileSchema
};
