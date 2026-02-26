const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const branchRoutes = require('./branch.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const brandRoutes = require('./brand.routes');    
const supplierRoutes = require('./supplier.routes');
const stockTransferRoutes = require('./stockTransfer.routes');
const saleRoutes = require('./sale.routes');
const saleReturnRoutes = require('./saleReturn.routes');
const discountRoutes = require('./discount.routes');
const customerRoutes = require('./customer.routes');
const settingsRoutes = require('./settings.routes');
const branchLocationRoutes = require('./branchLocation.routes'); 
const terminalRoutes = require('./terminal.routes'); 
const terminalShiftReportRoutes = require('./terminalShiftReport.routes'); // Import new route
const aiRoutes = require('./ai.routes');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes); 
router.use('/brands', brandRoutes);       
router.use('/suppliers', supplierRoutes); 
router.use('/stock-transfers', stockTransferRoutes);
router.use('/sales', saleRoutes);
router.use('/sale-returns', saleReturnRoutes);
router.use('/discounts', discountRoutes);
router.use('/customers', customerRoutes);
router.use('/settings', settingsRoutes);
router.use('/branch-locations', branchLocationRoutes); 
router.use('/terminals', terminalRoutes); 
router.use('/terminal-shift-reports', terminalShiftReportRoutes);

// later ai routes
router.use('/ai', aiRoutes);

module.exports = router;