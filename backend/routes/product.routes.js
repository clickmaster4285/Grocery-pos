const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const branchAuth = require('../middleware/branchAuth'); // Import branchAuth middleware
const { productUpload } = require('../middleware/upload');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const ProductPermissions = PERMISSIONS_OBJECT.INVENTORY.PRODUCT_DATABASE;

// All routes in this file are protected and require authentication and branchAuth
router.use(auth); // Apply auth to all routes
router.use(branchAuth); // Apply branchAuth to all routes

// Create a new product
router.post(
  '/', checkPermission([ProductPermissions.CREATE]), productUpload.any(),
  productController.createProduct
);

// Get product statistics
router.get(
  '/stats', productController.getProductStats
);

// Get all products
router.get(
  '/', checkPermission([ProductPermissions.READ]),
  productController.getAllProducts
);

// Get a single product by ID
router.get(
  '/:id', checkPermission([ProductPermissions.READ]),
  productController.getProductById
);

// Update a product by ID
router.put(
  '/:id', checkPermission([ProductPermissions.UPDATE]), productUpload.any(),
  productController.updateProduct
);

// Delete a product by ID (soft delete)
router.delete(
  '/:id', checkPermission([ProductPermissions.DELETE]),
  productController.deleteProduct
);

module.exports = router;
