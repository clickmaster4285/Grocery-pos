const DiscountPromotion = require('../models/discount.model');
const mongoose = require('mongoose');

/**
 * @desc    Create a new discount/promotion
 * @route   POST /api/discounts
 * @access  Private (Admin/Manager)
 */
const createDiscount = async (req, res, next) => {
  try {
    const discount = await DiscountPromotion.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all discounts with filtering and pagination
 * @route   GET /api/discounts
 * @access  Private
 */
const getAllDiscounts = async (req, res, next) => {
  try {
    const { status, type, branchId, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    
    // Filter by branch (either global or specific branch)
    if (branchId) {
      query.$or = [
        { isGlobal: true },
        { applicableBranches: branchId }
      ];
    }

    // Simple search by name or coupon code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } }
      ];
    }

    const [discounts, total] = await Promise.all([
      DiscountPromotion.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('applicableBranches', 'name branch_id')
        .populate('qualifyingCategories', 'name')
        .populate('qualifyingBrands', 'name')
        .populate('qualifyingProducts', 'productName'),
      DiscountPromotion.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: discounts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: discounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single discount by ID
 * @route   GET /api/discounts/:id
 * @access  Private
 */
const getDiscountById = async (req, res, next) => {
  try {
    const discount = await DiscountPromotion.findById(req.params.id)
      .populate('applicableBranches', 'name branch_id')
      .populate('qualifyingCategories', 'name')
      .populate('qualifyingBrands', 'name')
      .populate('qualifyingProducts', 'productName');

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    res.status(200).json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update discount
 * @route   PUT /api/discounts/:id
 * @access  Private (Admin/Manager)
 */
const updateDiscount = async (req, res, next) => {
  try {
    const discount = await DiscountPromotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete discount
 * @route   DELETE /api/discounts/:id
 * @access  Private (Admin/Manager)
 */
const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await DiscountPromotion.findByIdAndDelete(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate a coupon code
 * @route   POST /api/discounts/validate
 * @access  Private
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, branchId, customerGroup, cartTotal, cartItems } = req.body;
    const now = new Date();

    const discount = await DiscountPromotion.findOne({
      couponCode: code,
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: now } }
      ]
    });

    if (!discount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // 1. Branch Check
    if (!discount.isGlobal && branchId && !discount.applicableBranches.includes(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not valid at this branch'
      });
    }

    // 2. Customer Group Check
    if (discount.qualifyingCustomerGroups.length > 0 && !discount.qualifyingCustomerGroups.includes(customerGroup)) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this promotion'
      });
    }

    // 3. Min Purchase Check
    if (cartTotal < discount.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ${discount.minPurchaseAmount} required`
      });
    }

    // 4. Usage Limit Check
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // 5. Temporal Check (Day of Week)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[now.getDay()];
    if (discount.applicableDays.length > 0 && !discount.applicableDays.includes(today)) {
      return res.status(400).json({
        success: false,
        message: `This coupon is not valid on ${today}s`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  validateCoupon
};
