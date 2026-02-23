const Customer = require('../models/customer.model');
const Counter = require('../models/counter.model');
const mongoose = require('mongoose');
const { createCustomerSchema, updateCustomerSchema } = require('../validation/customer.validation');

// Helper to generate customer code: CST-[BASE36_SERIAL]
const generateCustomerCode = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'customer_id' },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] }
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(4, '0');
    return `CST-${serial}`;
};

// Helper to generate loyalty card number: LC-[BASE36_SERIAL]
const generateLoyaltyCardNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'loyalty_card' },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] }
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(6, '0');
    return `LC-${serial}`;
};

// Create a new customer
exports.createCustomer = async (req, res, next) => {
  try {
    const { error, value } = createCustomerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Auto-generate IDs
    value.customerId = await generateCustomerCode();
    value.loyaltyCardNumber = await generateLoyaltyCardNumber();

    const customer = await Customer.create(value);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Get all customers with pagination and search
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search, customerGroup, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    if (customerGroup && customerGroup !== 'all') {
      query.customerGroup = customerGroup;
    }

    if (search) {
      query.$or = [
        { customerId: { $regex: search, $options: 'i' } },
        { loyaltyCardNumber: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phonePrimary: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if it's a valid ObjectId or a customerId/loyaltyNumber
    let customer;
    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    } else {
      customer = await Customer.findOne({
        $or: [
          { customerId: id.toUpperCase() },
          { loyaltyCardNumber: id.toUpperCase() },
          { phonePrimary: id }
        ]
      });
    }

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found.' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Update customer by ID
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateCustomerSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check unique constraints if email or phone is being updated
    if (value.email || value.phonePrimary) {
      const existing = await Customer.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [
            { email: value.email || '' },
            { phonePrimary: value.phonePrimary || '' }
          ]}
        ]
      });
      
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email or phone number is already in use by another customer.'
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      value,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer (Soft delete using isActive flag)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found.' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Customer deactivated successfully.' 
    });
  } catch (error) {
    next(error);
  }
};
