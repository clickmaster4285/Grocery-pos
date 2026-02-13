const express = require('express');
const router = express.Router();
const saleReturnController = require('../controllers/saleReturn.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

router.post('/process', auth, checkPermission('sales:update'), saleReturnController.processReturn);
router.get('/all', auth, checkPermission('returns:read'), saleReturnController.getAllReturns);
router.get('/history/:saleId', auth, checkPermission('sales:read'), saleReturnController.getSaleHistory);

module.exports = router;
