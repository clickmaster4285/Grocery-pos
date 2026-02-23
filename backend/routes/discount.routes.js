const express = require('express');
const { 
  createDiscount, 
  getAllDiscounts, 
  getDiscountById, 
  updateDiscount, 
  deleteDiscount,
  validateCoupon
} = require('../controllers/discount.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const router = express.Router();

const PromotionPermissions = PERMISSIONS_OBJECT.PROMOTIONS.PROMOTIONS_MANAGEMENT;

// Apply auth middleware to all routes
router.use(auth);

router.get('/', checkPermission([PromotionPermissions.READ]), getAllDiscounts);
router.get('/:id', checkPermission([PromotionPermissions.READ]), getDiscountById);

router.post('/', checkPermission([PromotionPermissions.CREATE]), createDiscount);
router.put('/:id', checkPermission([PromotionPermissions.UPDATE]), updateDiscount);
router.delete('/:id', checkPermission([PromotionPermissions.DELETE]), deleteDiscount);

router.post('/validate', validateCoupon); // General validation, might be used by cashiers/POS

module.exports = router;
