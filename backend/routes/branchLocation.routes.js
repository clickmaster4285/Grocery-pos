const express = require('express');
const router = express.Router();
const branchLocationController = require('../controllers/branchLocation.controller');
const auth = require('../middleware/auth'); 
const branchAuth = require('../middleware/branchAuth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions'); 

// Local constant for easier permission management
const BranchLocationPermissions = PERMISSIONS_OBJECT.INVENTORY.LOCATION_DATABASE;

// Protect all routes
router.use(auth);

// Get all locations for a specific branch
router.get(
    '/branch/:branchId',
    checkPermission([BranchLocationPermissions.READ]),
    branchAuth,
    branchLocationController.getBranchLocations
);

// Get a single location by ID
router.get(
    '/:id',
    checkPermission([BranchLocationPermissions.READ]),
    branchAuth,
    branchLocationController.getBranchLocationById
);

// Create a new location
router.post(
    '/',
    checkPermission([BranchLocationPermissions.CREATE]),
    branchAuth,
    branchLocationController.createBranchLocation
);

// Update a location
router.put(
    '/:id',
    checkPermission([BranchLocationPermissions.UPDATE]),
    branchAuth,
    branchLocationController.updateBranchLocation
);

// Delete a location
router.delete(
    '/:id',
    checkPermission([BranchLocationPermissions.DELETE]),
    branchAuth,
    branchLocationController.deleteBranchLocation
);

module.exports = router;
