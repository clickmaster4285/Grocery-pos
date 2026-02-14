const Supplier = require('../models/supplier.model');
const Counter = require('../models/counter.model');
const mongoose = require('mongoose');
const { createSupplierSchema, updateSupplierSchema } = require('../validation/supplier.validation');

// Helper to generate supplier code: SUP-[BASE36_SERIAL]
const generateSupplierCode = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'supplier_code' },
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
    return `SUP-${serial}`;
};

// Create a new supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const { error, value } = createSupplierSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const existingSupplier = await Supplier.findOne({ 
      name: value.name, 
      isDeleted: false 
    });
    
    if (existingSupplier) {
      return res.status(409).json({ 
        success: false,
        message: 'Supplier with this name already exists.' 
      });
    }

    // Force generation if empty or missing
    if (!value.supplier_code || value.supplier_code.trim() === "") {
      value.supplier_code = await generateSupplierCode();
    }

    const supplier = await Supplier.create({
      ...value,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    let suppliers = await Supplier.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      suppliers = suppliers.filter(s => 
        searchRegex.test(s.name) || 
        searchRegex.test(s.supplier_code) || 
        searchRegex.test(s.contactPerson) ||
        searchRegex.test(s.email) ||
        searchRegex.test(s.address?.city)
      );
    }

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid supplier ID format.' 
      });
    }

    const supplier = await Supplier.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: 'Supplier not found.' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Update supplier by ID
exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid supplier ID format.' 
      });
    }

    const { error, value } = updateSupplierSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    if (value.name) {
      const existingSupplier = await Supplier.findOne({ 
        name: value.name, 
        _id: { $ne: id }, 
        isDeleted: false 
      });
      if (existingSupplier) {
        return res.status(409).json({ 
          success: false,
          message: 'Supplier with this name already exists.' 
        });
      }
    }

    const existingDoc = await Supplier.findOne({ _id: id, isDeleted: false });
    if (!existingDoc) {
      return res.status(404).json({ 
        success: false,
        message: 'Supplier not found.' 
      });
    }

    // Logic for code: if incoming is empty/missing AND DB is missing, generate.
    // If incoming is empty but DB has one, keep DB one.
    if (!value.supplier_code || value.supplier_code.trim() === "") {
      if (!existingDoc.supplier_code) {
        value.supplier_code = await generateSupplierCode();
      } else {
        value.supplier_code = existingDoc.supplier_code;
      }
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...value, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete supplier by ID
exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid supplier ID format.' 
      });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: req.user.id
      },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: 'Supplier not found or already deleted.' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Supplier deleted successfully.' 
    });
  } catch (error) {
    next(error);
  }
};
