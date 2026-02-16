const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { productUpload } = require('../middleware/upload');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const ProductPermissions = PERMISSIONS_OBJECT.INVENTORY.PRODUCT_DATABASE;

// Create a new product
router.post(
  '/', auth, checkPermission([ProductPermissions.CREATE]), productUpload.any(),
  productController.createProduct
);

// Get product statistics
router.get(
  '/stats', auth, productController.getProductStats
);

// Get all products
router.get(
  '/', auth, checkPermission([ProductPermissions.READ]),
  productController.getAllProducts
);

// Get a single product by ID
router.get(
  '/:id', auth, checkPermission([ProductPermissions.READ]),
  productController.getProductById
);

// Update a product by ID
router.put(
  '/:id', auth, checkPermission([ProductPermissions.UPDATE]), productUpload.any(),
  productController.updateProduct
);

// Delete a product by ID (soft delete)
router.delete(
  '/:id', auth, checkPermission([ProductPermissions.DELETE]),
  productController.deleteProduct
);

module.exports = router;
