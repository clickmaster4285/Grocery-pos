const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const SalesPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.TRANSACTION;

router.post('/', auth, checkPermission([SalesPermissions.CREATE]), saleController.createSale);
router.get('/history', auth, checkPermission([SalesPermissions.READ]), saleController.getAllSales);
router.get('/branch/:branchId', auth, checkPermission([SalesPermissions.READ]), saleController.getBranchSales);
router.get('/:id', auth, checkPermission([SalesPermissions.READ]), saleController.getSaleDetail);

module.exports = router;
