const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransfer.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

router.post('/', auth, checkPermission('stock:create'), stockTransferController.createTransfer);
router.get('/', auth, checkPermission('stock:read'), stockTransferController.getTransfers);
router.get('/branch/:branchId', auth, checkPermission('stock:read'), stockTransferController.getBranchStock);

module.exports = router;
