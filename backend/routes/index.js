const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const branchRoutes = require('./branch.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes'); // New Import
const brandRoutes = require('./brand.routes');     // New Import
const supplierRoutes = require('./supplier.routes'); // New Import
const stockTransferRoutes = require('./stockTransfer.routes');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes); // New Route
router.use('/brands', brandRoutes);       // New Route
router.use('/suppliers', supplierRoutes); // New Route
router.use('/stock-transfers', stockTransferRoutes);

module.exports = router;