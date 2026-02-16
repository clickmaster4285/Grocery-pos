const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { productUpload } = require('../middleware/upload');

// Create a new product
router.post(
  '/', auth, checkPermission('products:create'), productUpload.any(),
  productController.createProduct
);

// Get product statistics
router.get(
  '/stats', auth, productController.getProductStats
);

// Get all products
router.get(
  '/', auth, checkPermission('products:read'),
  productController.getAllProducts
);

// Get a single product by ID
router.get(
  '/:id', auth, checkPermission('products:read'),
  productController.getProductById
);

// Update a product by ID
router.put(
  '/:id', auth, checkPermission('products:update'), productUpload.any(),
  productController.updateProduct
);

// Delete a product by ID (soft delete)
router.delete(
  '/:id', auth, checkPermission('products:delete'),
  productController.deleteProduct
);

module.exports = router;
