const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// All dashboard routes are protected and require 'read' permission for the main dashboard
router.use(auth);
router.use(checkPermission('dashboard:main_dashboard:read'));

router.get('/summary', dashboardController.getSummaryStats);
router.get('/sales-chart', dashboardController.getSalesChartData);
router.get('/payment-methods', dashboardController.getPaymentMethodData);
router.get('/top-products', dashboardController.getTopSellingProducts);
router.get('/low-stock', dashboardController.getLowStockAlerts);
router.get('/active-promotions', dashboardController.getActivePromotions);

module.exports = router;
