const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createBranchLocationSchema = Joi.object({
    branch: Joi.objectId().required(),
    name: Joi.string().trim().required().messages({
        'any.required': 'Location name is required.',
        'string.empty': 'Location name cannot be empty.'
    }),
    type: Joi.string().valid('AISLE', 'RACK', 'SHELF', 'GONDOLA', 'REFRIGERATOR', 'FREEZER', 'DISPLAY', 'BACKROOM').default('BACKROOM').messages({
        'any.only': 'Invalid location type provided.'
    }),
    floor: Joi.number().min(0).default(0).messages({
        'number.base': 'Floor must be a number.',
        'number.min': 'Floor cannot be negative.'
    }),
    direction: Joi.string().trim().allow(null, '').optional(),
    capacity: Joi.number().min(0).default(0).messages({
        'number.base': 'Capacity must be a number.',
        'number.min': 'Capacity cannot be negative.'
    }),
    isActive: Joi.boolean().default(true),
});

const updateBranchLocationSchema = Joi.object({
    branch: Joi.objectId().optional(),
    name: Joi.string().trim().optional().messages({
        'string.empty': 'Location name cannot be empty.'
    }),
    type: Joi.string().valid('AISLE', 'RACK', 'SHELF', 'GONDOLA', 'REFRIGERATOR', 'FREEZER', 'DISPLAY', 'BACKROOM').optional().messages({
        'any.only': 'Invalid location type provided.'
    }),
    floor: Joi.number().min(0).optional().messages({
        'number.base': 'Floor must be a number.',
        'number.min': 'Floor cannot be negative.'
    }),
    direction: Joi.string().trim().allow(null, '').optional(),
    capacity: Joi.number().min(0).optional().messages({
        'number.base': 'Capacity must be a number.',
        'number.min': 'Capacity cannot be negative.'
    }),
    isActive: Joi.boolean().optional(),
});

module.exports = {
    createBranchLocationSchema,
    updateBranchLocationSchema
};
