const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const CategoryPermissions = PERMISSIONS_OBJECT.INVENTORY.CATEGORIES_DEPARTMENTS;

// All routes in this file require authentication
router.use(auth);

// Create a new category
router.post(
  '/',
  checkPermission([CategoryPermissions.CREATE]),
  categoryController.createCategory
);

// Get all categories
router.get(
  '/',
  checkPermission([CategoryPermissions.READ]),
  categoryController.getAllCategories
);

// Get a single category by ID
router.get(
  '/:id',
  checkPermission([CategoryPermissions.READ]),
  categoryController.getCategoryById
);

// Update a category by ID
router.put(
  '/:id',
  checkPermission([CategoryPermissions.UPDATE]),
  categoryController.updateCategory
);

// Soft delete a category by ID
router.delete(
  '/:id',
  checkPermission([CategoryPermissions.DELETE]),
  categoryController.deleteCategory
);

module.exports = router;
