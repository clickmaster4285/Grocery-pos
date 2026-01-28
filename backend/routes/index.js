const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

// Mount the routers on their respective paths
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
