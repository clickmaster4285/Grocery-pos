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

module.exports = router;