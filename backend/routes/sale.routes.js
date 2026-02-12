const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

router.post('/', auth, checkPermission('sales:create'), saleController.createSale);
router.get('/branch/:branchId', auth, checkPermission('sales:read'), saleController.getBranchSales);
router.get('/:id', auth, checkPermission('sales:read'), saleController.getSaleDetail);

module.exports = router;
