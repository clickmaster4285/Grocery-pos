const express = require('express');
const router = express.Router();
const saleReturnController = require('../controllers/saleReturn.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// Local constant for easier permission management
const ReturnPermissions = PERMISSIONS_OBJECT.POINT_OF_SALE.RETURNS_EXCHANGES;

router.post('/process', auth, checkPermission([ReturnPermissions.UPDATE]), saleReturnController.processReturn);
router.get('/all', auth, checkPermission([ReturnPermissions.READ]), saleReturnController.getAllReturns);
router.get('/history/:saleId', auth, checkPermission([ReturnPermissions.READ]), saleReturnController.getSaleHistory);

module.exports = router;
