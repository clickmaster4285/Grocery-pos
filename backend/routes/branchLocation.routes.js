const express = require('express');
const router = express.Router();
const branchLocationController = require('../controllers/branchLocation.controller');
const auth = require('../middleware/auth'); 
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
    branchLocationController.getBranchLocations
);

// Get a single location by ID
router.get(
    '/:id',
    checkPermission([BranchLocationPermissions.READ]),
    branchLocationController.getBranchLocationById
);

// Create a new location
router.post(
    '/',
    checkPermission([BranchLocationPermissions.CREATE]),
    branchLocationController.createBranchLocation
);

// Update a location
router.put(
    '/:id',
    checkPermission([BranchLocationPermissions.UPDATE]),
    branchLocationController.updateBranchLocation
);

// Delete a location
router.delete(
    '/:id',
    checkPermission([BranchLocationPermissions.DELETE]),
    branchLocationController.deleteBranchLocation
);

module.exports = router;
