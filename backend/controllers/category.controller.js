const Category = require('../models/category.model');
const mongoose = require('mongoose');
const { createCategorySchema, updateCategorySchema } = require('../validation/category.validation');

// Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingCategory = await Category.findOne({ 
      name: value.name, 
      isDeleted: false 
    });
    
    if (existingCategory) {
      return res.status(409).json({ message: 'Category with this name already exists.' });
    }

    const category = await Category.create({
      ...value,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Get category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID format.' });
    }

    const category = await Category.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Update category by ID
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID format.' });
    }

    const { error, value } = updateCategorySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    if (value.name) {
      const existingCategory = await Category.findOne({ 
        name: value.name, 
        _id: { $ne: id }, 
        isDeleted: false 
      });
      if (existingCategory) {
        return res.status(409).json({ message: 'Category with this name already exists.' });
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...value, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete category by ID
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID format.' });
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: req.user.id
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found or already deleted.' });
    }
    res.status(200).json({ 
      success: true,
      message: 'Category deleted successfully.' 
    });
  } catch (error) {
    next(error);
  }
};
