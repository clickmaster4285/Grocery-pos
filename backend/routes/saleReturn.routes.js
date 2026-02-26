const express = require('express');
const router = express.Router();
const saleReturnController = require('../controllers/saleReturn.controller');
const auth = require('../middleware/auth');
const branchAuth = require('../middleware/branchAuth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const ReturnPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.RETURNS_EXCHANGES;

router.use(auth);

router.post('/process', checkPermission([ReturnPermissions.UPDATE]), branchAuth, saleReturnController.processReturn);
router.get('/all', checkPermission([ReturnPermissions.READ]), branchAuth, saleReturnController.getAllReturns);
router.get('/history/:saleId', checkPermission([ReturnPermissions.READ]), branchAuth, saleReturnController.getSaleHistory);

module.exports = router;
