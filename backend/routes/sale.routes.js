const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const auth = require('../middleware/auth');
const branchAuth = require('../middleware/branchAuth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const SalesPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.TRANSACTION;

router.use(auth);

router.post('/', checkPermission([SalesPermissions.CREATE]), branchAuth, saleController.createSale);
router.get('/history', checkPermission([SalesPermissions.READ]), branchAuth, saleController.getAllSales);
router.get('/branch/:branchId', checkPermission([SalesPermissions.READ]), branchAuth, saleController.getBranchSales);
router.get('/:id', checkPermission([SalesPermissions.READ]), branchAuth, saleController.getSaleDetail);

module.exports = router;
