const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransfer.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const StockPermissions = PERMISSIONS_OBJECT.INVENTORY.STOCK_MANAGEMENT;

router.post('/', auth, checkPermission([StockPermissions.CREATE]), stockTransferController.createTransfer);
router.get('/', auth, checkPermission([StockPermissions.READ]), stockTransferController.getTransfers);
router.get('/branch/:branchId', auth, checkPermission([StockPermissions.READ]), stockTransferController.getBranchStock);

module.exports = router;
