const Category = require('../models/category.model');
const Counter = require('../models/counter.model');
const mongoose = require('mongoose');
const { createCategorySchema, updateCategorySchema } = require('../validation/category.validation');

// Helper to generate category code: CAT-[BASE36_SERIAL]
const generateCategoryCode = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'category_code' },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] },
                    lastDate: new Date().toISOString().slice(0, 10).replace(/-/g, '')
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(3, '0');
    return `CAT-${serial}`;
};

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

    // Force generation if empty or missing
    if (!value.category_code || value.category_code.trim() === "") {
      value.category_code = await generateCategoryCode();
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

    const category = await Category.findOne({ _id: id,})
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

    // Fetch existing doc to check for missing code
    const existingDoc = await Category.findOne({ _id: id });
    if (!existingDoc) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Logic for code: if incoming is empty/missing AND DB is missing, generate.
    // If incoming is empty but DB has one, keep DB one.
    if (!value.category_code || value.category_code.trim() === "") {
      if (!existingDoc.category_code) {
        value.category_code = await generateCategoryCode();
      } else {
        value.category_code = existingDoc.category_code;
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: id},
      { ...value, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

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
