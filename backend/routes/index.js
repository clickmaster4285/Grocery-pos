const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const branch = require('./branch.routes');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branch);

module.exports = router;