const BranchLocation = require('../models/branchLocation.model');
const mongoose = require('mongoose');
const { createBranchLocationSchema, updateBranchLocationSchema } = require('../validation/branchLocation.validation');

// Create a new BranchLocation
exports.createBranchLocation = async (req, res, next) => {
    try {
        const { error, value } = createBranchLocationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        const { branch, name, type, floor, direction, capacity } = value;

        const existingLocation = await BranchLocation.findOne({ branch, name, isDeleted: false });
        if (existingLocation) {
            return res.status(409).json({ success: false, message: 'Location with this name already exists in this branch.' });
        }

        const branchLocation = await BranchLocation.create({
            branch,
            name,
            type,
            floor,
            direction,
            capacity
        });

        res.status(201).json({ success: true, data: branchLocation });

    } catch (error) {
        next(error);
    }
};

// Get all BranchLocations for a specific branch
exports.getBranchLocations = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ success: false, message: 'Invalid branch ID format.' });
        }

        const locations = await BranchLocation.find({ branch: branchId }).populate('branch', 'branch_name');
        res.status(200).json({ success: true, data: locations });

    } catch (error) {
        next(error);
    }
};

// Get a single BranchLocation by ID
exports.getBranchLocationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid location ID format.' });
        }

        const location = await BranchLocation.findById(id).populate('branch', 'branch_name');
        if (!location) {
            return res.status(404).json({ success: false, message: 'Branch location not found.' });
        }
        res.status(200).json({ success: true, data: location });

    } catch (error) {
        next(error);
    }
};

// Update a BranchLocation
exports.updateBranchLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid location ID format.' });
        }

        const { error, value } = updateBranchLocationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        const { name, branch } = value;

        if (name) {
            const existingLocation = await BranchLocation.findOne({ branch, name, _id: { $ne: id } });
            if (existingLocation) {
                return res.status(409).json({ success: false, message: 'Location with this name already exists in this branch.' });
            }
        }

        const branchLocation = await BranchLocation.findByIdAndUpdate(
            id,
            { $set: value },
            { new: true, runValidators: true }
        );

        if (!branchLocation) {
            return res.status(404).json({ success: false, message: 'Branch location not found.' });
        }
        res.status(200).json({ success: true, data: branchLocation });

    } catch (error) {
        next(error);
    }
};

// Delete a BranchLocation (soft delete if applicable, or hard delete)
exports.deleteBranchLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid location ID format.' });
        }

        // Check if there's any stock in this location before deleting
        const stockCount = await BranchStockLocation.countDocuments({ location: id, quantity: { $gt: 0 } });
        if (stockCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete location with existing stock. Please transfer stock out first.' });
        }

        const branchLocation = await BranchLocation.findByIdAndDelete(id); // Using hard delete for now

        if (!branchLocation) {
            return res.status(404).json({ success: false, message: 'Branch location not found.' });
        }
        res.status(200).json({ success: true, message: 'Branch location deleted successfully.' });

    } catch (error) {
        next(error);
    }
};
