const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');
const { brandUpload } = require('../middleware/upload');

// All routes in this file require authentication
router.use(auth);

// Create a new brand
router.post(
  '/',
  checkPermission(PERMISSIONS_OBJECT.BRANDS.CREATE),
  brandUpload.single('logo'),
  brandController.createBrand
);

// Get all brands
router.get(
  '/',
  checkPermission(PERMISSIONS_OBJECT.BRANDS.READ),
  brandController.getAllBrands
);

// Get a single brand by ID
router.get(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.BRANDS.READ),
  brandController.getBrandById
);

// Update a brand by ID
router.put(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.BRANDS.UPDATE),
  brandUpload.single('logo'),
  brandController.updateBrand
);

// Soft delete a brand by ID
router.delete(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.BRANDS.DELETE),
  brandController.deleteBrand
);

module.exports = router;
