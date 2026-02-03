const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middleware/auth'); // Assuming auth middleware
const { checkPermission } = require('../middleware/checkPermission'); // Assuming permission middleware

// Create a new product
router.post(
  '/',
  protect,
  checkPermission('products:create'),
  productController.createProduct
);

// Get all products
router.get(
  '/',
  protect,
  checkPermission('products:read'),
  productController.getAllProducts
);

// Get a single product by ID
router.get(
  '/:id',
  protect,
  checkPermission('products:read'),
  productController.getProductById
);

// Update a product by ID
router.put(
  '/:id',
  protect,
  checkPermission('products:update'),
  productController.updateProduct
);

// Delete a product by ID (soft delete)
router.delete(
  '/:id',
  protect,
  checkPermission('products:delete'),
  productController.deleteProduct
);

module.exports = router;
