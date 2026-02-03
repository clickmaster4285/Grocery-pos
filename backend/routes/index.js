const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const branchRoutes = require('./branch.routes');
const productRoutes = require('./product.routes'); 

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes); 
router.use('/products', productRoutes); 

module.exports = router;