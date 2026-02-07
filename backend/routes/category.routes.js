const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// All routes in this file require authentication
router.use(auth);

// Create a new category
router.post(
  '/',
  checkPermission(PERMISSIONS_OBJECT.CATEGORIES.CREATE),
  categoryController.createCategory
);

// Get all categories
router.get(
  '/',
  checkPermission(PERMISSIONS_OBJECT.CATEGORIES.READ),
  categoryController.getAllCategories
);

// Get a single category by ID
router.get(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.CATEGORIES.READ),
  categoryController.getCategoryById
);

// Update a category by ID
router.put(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.CATEGORIES.UPDATE),
  categoryController.updateCategory
);

// Soft delete a category by ID
router.delete(
  '/:id',
  checkPermission(PERMISSIONS_OBJECT.CATEGORIES.DELETE),
  categoryController.deleteCategory
);

module.exports = router;
