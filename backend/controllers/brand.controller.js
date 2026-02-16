const Brand = require('../models/brand.model');
const Counter = require('../models/counter.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createBrandSchema, updateBrandSchema } = require('../validation/brand.validation');

// Helper to delete old logo
const deleteOldLogo = (logoPath) => {
    if (logoPath) {
        const fullPath = path.join(__dirname, '..', logoPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

// Helper to generate brand code: BRD-[BASE36_SERIAL]
const generateBrandCode = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'brand_code' },
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
    return `BRD-${serial}`;
};

// Create a new brand
exports.createBrand = async (req, res, next) => {
  try {
    const { error, value } = createBrandSchema.validate(req.body, { abortEarly: false });
    if (error) {
      if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingBrand = await Brand.findOne({ 
      name: value.name, 
      isDeleted: false 
    });
    
    if (existingBrand) {
      if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
      return res.status(409).json({ 
        success: false,
        message: 'Brand with this name already exists.' 
      });
    }

    // Force generation if empty or missing
    if (!value.brand_code || value.brand_code.trim() === "") {
      value.brand_code = await generateBrandCode();
    }

    // Handle logo upload
    if (req.file) {
        value.logo = `uploads/brands/${req.file.filename}`;
    } else {
        // Ensure logo is not an object (prevents CastError)
        delete value.logo;
    }

    const brand = await Brand.create({
      ...value,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
    next(error);
  }
};

// Get all brands
exports.getAllBrands = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    let brands = await Brand.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      brands = brands.filter(b => 
        searchRegex.test(b.name) || 
        searchRegex.test(b.brand_code) || 
        searchRegex.test(b.origin)
      );
    }

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    next(error);
  }
};

// Get brand by ID
exports.getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid brand ID format.' 
      });
    }

    const brand = await Brand.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: 'Brand not found.' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

// Update brand by ID
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid brand ID format.' 
      });
    }

    const { error, value } = updateBrandSchema.validate(req.body, { abortEarly: false });
    if (error) {
      if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingDoc = await Brand.findOne({ _id: id, isDeleted: false });
    if (!existingDoc) {
      if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
      return res.status(404).json({ 
        success: false,
        message: 'Brand not found.' 
      });
    }

    if (value.name) {
      const duplicateBrand = await Brand.findOne({ 
        name: value.name, 
        _id: { $ne: id }, 
        isDeleted: false 
      });
      if (duplicateBrand) {
        if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
        return res.status(409).json({ 
          success: false,
          message: 'Brand with this name already exists.' 
        });
      }
    }

    // Logic for code: if incoming is empty/missing AND DB is missing, generate.
    // If incoming is empty but DB has one, keep DB one.
    if (!value.brand_code || value.brand_code.trim() === "") {
      if (!existingDoc.brand_code) {
        value.brand_code = await generateBrandCode();
      } else {
        value.brand_code = existingDoc.brand_code;
      }
    }

    // Handle logo upload
    if (req.file) {
        // Delete old logo if it exists
        if (existingDoc.logo) {
            deleteOldLogo(existingDoc.logo);
        }
        value.logo = `uploads/brands/${req.file.filename}`;
    } else {
        // If no new file, but logo was passed as something other than a string (e.g. {}),
        // we remove it to prevent Mongoose CastError. If it is a string, it's likely
        // the existing path being sent back, which is fine.
        if (value.logo !== undefined && typeof value.logo !== 'string') {
            delete value.logo;
        }
    }

    const brand = await Brand.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...value, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: 'Brand not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    if (req.file) deleteOldLogo(`uploads/brands/${req.file.filename}`);
    next(error);
  }
};

// Soft delete brand by ID
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid brand ID format.' 
      });
    }

    const brand = await Brand.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: req.user.id
      },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: 'Brand not found or already deleted.' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Brand deleted successfully.' 
    });
  } catch (error) {
    next(error);
  }
};
