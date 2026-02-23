const Joi = require('joi');

const createTerminalSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Terminal name is required',
    }),
    branch: Joi.string().optional().messages({
        'any.required': 'Branch ID is required',
    }),
    department: Joi.string().optional().allow(''),
    ipAddress: Joi.string().ip().optional().allow(''),
    macAddress: Joi.string().optional().allow(''),
    deviceType: Joi.string().valid("Desktop", "Tablet", "Kiosk", "Mobile").optional(),
    peripherals: Joi.object({
        printer: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Ethernet", "Bluetooth", "None").optional(),
            status: Joi.string().valid("Connected", "Disconnected", "Error").optional()
        }).optional(),
        scanner: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Bluetooth", "None").optional(),
            status: Joi.string().valid("Connected", "Disconnected").optional()
        }).optional(),
        scale: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Serial", "None").optional(),
            isCalibrated: Joi.boolean().optional()
        }).optional(),
        cashDrawer: Joi.object({
            isConnected: Joi.boolean().optional(),
            lastOpened: Joi.date().optional()
        }).optional(),
        customerDisplay: Joi.object({
            isConnected: Joi.boolean().optional()
        }).optional()
    }).optional(),
    softwareVersion: Joi.string().optional().allow(''),
    status: Joi.string().valid("Available", "Occupied", "Locked", "Closed", "Maintenance").optional(),
    lastMaintenanceDate: Joi.date().optional().allow('', null),
});

const updateTerminalSchema = Joi.object({
    name: Joi.string().optional().allow(''),
    department: Joi.string().optional().allow(''),
    ipAddress: Joi.string().ip().optional().allow(''),
    macAddress: Joi.string().optional().allow(''),
    deviceType: Joi.string().valid("Desktop", "Tablet", "Kiosk", "Mobile").optional(),
    status: Joi.string().valid("Available", "Occupied", "Locked", "Closed", "Maintenance").optional(),
    peripherals: Joi.object({
        printer: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Ethernet", "Bluetooth", "None").optional(),
            status: Joi.string().valid("Connected", "Disconnected", "Error").optional()
        }).optional(),
        scanner: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Bluetooth", "None").optional(),
            status: Joi.string().valid("Connected", "Disconnected").optional()
        }).optional(),
        scale: Joi.object({
            name: Joi.string().optional().allow(''),
            connectionType: Joi.string().valid("USB", "Serial", "None").optional(),
            isCalibrated: Joi.boolean().optional()
        }).optional(),
        cashDrawer: Joi.object({
            isConnected: Joi.boolean().optional(),
            lastOpened: Joi.date().optional()
        }).optional(),
        customerDisplay: Joi.object({
            isConnected: Joi.boolean().optional()
        }).optional()
    }).optional(),
    softwareVersion: Joi.string().optional().allow(''),
    isActive: Joi.boolean().optional(),
    lastMaintenanceDate: Joi.date().optional().allow('', null),
});

const openSessionSchema = Joi.object({
    openingFloat: Joi.number().min(0).required().messages({
        'any.required': 'Opening float is required',
        'number.min': 'Opening float cannot be negative'
    })
});

const closeSessionSchema = Joi.object({
    actualCash: Joi.number().min(0).required().messages({
        'any.required': 'Actual cash count is required',
        'number.min': 'Actual cash cannot be negative'
    }),
    notes: Joi.string().optional()
});

module.exports = {
    createTerminalSchema,
    updateTerminalSchema,
    openSessionSchema,
    closeSessionSchema
};
