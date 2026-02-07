const Brand = require('../models/brand.model');
const mongoose = require('mongoose');
const { createBrandSchema, updateBrandSchema } = require('../validation/brand.validation');

// Create a new brand
exports.createBrand = async (req, res, next) => {
  try {
    const { error, value } = createBrandSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingBrand = await Brand.findOne({ name: value.name, isActive: true });
    if (existingBrand) {
      return res.status(409).json({ message: 'Brand with this name already exists.' });
    }

    const brand = await Brand.create(value);
    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
};

// Get all brands
exports.getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brand by ID
exports.getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid brand ID format.' });
    }

    const brand = await Brand.findOne({ _id: id, isActive: true });
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found or is inactive.' });
    }
    res.status(200).json(brand);
  } catch (error) {
    next(error);
  }
};

// Update brand by ID
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid brand ID format.' });
    }

    const { error, value } = updateBrandSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    if (value.name) {
      const existingBrand = await Brand.findOne({ name: value.name, _id: { $ne: id }, isActive: true });
      if (existingBrand) {
        return res.status(409).json({ message: 'Brand with this name already exists.' });
      }
    }

    const brand = await Brand.findOneAndUpdate(
      { _id: id, isActive: true },
      value,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found or is inactive.' });
    }
    res.status(200).json(brand);
  } catch (error) {
    next(error);
  }
};

// Soft delete brand by ID (sets isActive to false)
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid brand ID format.' });
    }

    const brand = await Brand.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found or already inactive.' });
    }
    res.status(200).json({ message: 'Brand deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};
