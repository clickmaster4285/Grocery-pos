const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const branchAuth = require('../middleware/branchAuth'); // Import branchAuth middleware
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const VendorPermissions = PERMISSIONS_OBJECT.INVENTORY.VENDOR_MANAGEMENT;

// All routes in this file require authentication and branchAuth
router.use(auth);
router.use(branchAuth); // Apply branchAuth to all routes

// Create a new supplier
router.post(
  '/',
  checkPermission([VendorPermissions.CREATE]),
  supplierController.createSupplier
);

// Get all suppliers
router.get(
  '/',
  checkPermission([VendorPermissions.READ]),
  supplierController.getAllSuppliers
);

// Get a single supplier by ID
router.get(
  '/:id',
  checkPermission([VendorPermissions.READ]),
  supplierController.getSupplierById
);

// Update a supplier by ID
router.put(
  '/:id',
  checkPermission([VendorPermissions.UPDATE]),
  supplierController.updateSupplier
);

// Soft delete a supplier by ID
router.delete(
  '/:id',
  checkPermission([VendorPermissions.DELETE]),
  supplierController.deleteSupplier
);

module.exports = router;