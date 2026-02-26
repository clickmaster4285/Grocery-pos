const DiscountPromotion = require('../models/discount.model');
const mongoose = require('mongoose');

const createDiscount = async (req, res, next) => {
  try {
    const discountData = { ...req.body };

    // Avoid duplicate key error for empty couponCode
    if (discountData.couponCode === '' || discountData.couponCode === undefined) {
      delete discountData.couponCode;
    }

    // Role-based security enforcement
    if (req.user.role !== 'admin') {
      discountData.isGlobal = false;
      discountData.applicableBranches = [req.user.branch];
    } else {
      // For admins, if not global, ensure branches are provided
      if (!discountData.isGlobal && (!discountData.applicableBranches || discountData.applicableBranches.length === 0)) {
        return res.status(400).json({ message: 'Please select at least one branch for a local promotion.' });
      }
    }

    const discount = await DiscountPromotion.create(discountData);
    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

const getAllDiscounts = async (req, res, next) => {
  try {
    const { status, type, branchId, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    
    // Data Isolation: Non-admins only see global or their own branch discounts
    if (req.user.role !== 'admin') {
      query.$or = [
        { isGlobal: true },
        { applicableBranches: req.user.branch }
      ];
    } else if (branchId) {
      // Admin filter by specific branch
      query.$or = [
        { isGlobal: true },
        { applicableBranches: branchId }
      ];
    }

    // Simple search by name or coupon code
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { couponCode: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const [discounts, total] = await Promise.all([
      DiscountPromotion.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('applicableBranches', 'branch_name branch_code')
        .populate('qualifyingCategories', 'name')
        .populate('qualifyingBrands', 'name')
        .populate('qualifyingProducts', 'productName variants'),
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

const getDiscountById = async (req, res, next) => {
  try {
    const discount = await DiscountPromotion.findById(req.params.id)
      .populate('applicableBranches', 'branch_name branch_code')
      .populate('qualifyingCategories', 'name')
      .populate('qualifyingBrands', 'name')
      .populate('qualifyingProducts', 'productName variants');

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    // Security Check: Non-admins cannot view discounts from other branches unless global
    if (req.user.role !== 'admin' && !discount.isGlobal && !discount.applicableBranches.some(b => b._id.toString() === req.user.branch.toString())) {
      return res.status(403).json({ message: 'Access denied to this promotion.' });
    }

    res.status(200).json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

const updateDiscount = async (req, res, next) => {
  try {
    const discountData = { ...req.body };

    // Avoid duplicate key error for empty couponCode
    if (discountData.couponCode === '' || discountData.couponCode === undefined) {
      discountData.couponCode = null;
    }

    // Safety fetch to check ownership
    const existing = await DiscountPromotion.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Discount not found' });

    // Role-based security enforcement
    if (req.user.role !== 'admin') {
      // Non-admins cannot modify other branch's local discounts
      if (!existing.isGlobal && !existing.applicableBranches.includes(req.user.branch)) {
        return res.status(403).json({ message: 'Access denied. You can only update your branch promotions.' });
      }
      discountData.isGlobal = false;
      discountData.applicableBranches = [req.user.branch];
    }

    const discount = await DiscountPromotion.findByIdAndUpdate(
      req.params.id,
      discountData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

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
