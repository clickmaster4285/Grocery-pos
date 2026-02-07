const Supplier = require('../models/supplier.model');
const mongoose = require('mongoose');
const { createSupplierSchema, updateSupplierSchema } = require('../validation/supplier.validation');

// Create a new supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const { error, value } = createSupplierSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingSupplier = await Supplier.findOne({ name: value.name, isActive: true });
    if (existingSupplier) {
      return res.status(409).json({ message: 'Supplier with this name already exists.' });
    }

    const supplier = await Supplier.create(value);
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(suppliers);
  } catch (error) {
    next(error);
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid supplier ID format.' });
    }

    const supplier = await Supplier.findOne({ _id: id, isActive: true });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found or is inactive.' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
};

// Update supplier by ID
exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid supplier ID format.' });
    }

    const { error, value } = updateSupplierSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    if (value.name) {
      const existingSupplier = await Supplier.findOne({ name: value.name, _id: { $ne: id }, isActive: true });
      if (existingSupplier) {
        return res.status(409).json({ message: 'Supplier with this name already exists.' });
      }
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, isActive: true },
      value,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found or is inactive.' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
};

// Soft delete supplier by ID (sets isActive to false)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid supplier ID format.' });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found or already inactive.' });
    }
    res.status(200).json({ message: 'Supplier deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};
