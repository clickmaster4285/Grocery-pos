const express = require('express');
const router = express.Router();
const terminalShiftReportController = require('../controllers/terminalShiftReport.controller');
const auth = require('../middleware/auth');
const branchAuth = require('../middleware/branchAuth');
const checkPermission = require('../middleware/checkPermission');

router.use(auth);

// Get all terminal shift reports (requires 'reporting_analytics:terminal_shift_reports:read' permission)
router.get(
  '/',
  checkPermission('reporting_analytics:terminal_shift_reports:read'),
  branchAuth,
  terminalShiftReportController.getAllTerminalShiftReports
);

// Get a single terminal shift report by ID (requires 'reporting_analytics:terminal_shift_reports:read' permission)
router.get(
  '/:id',
  checkPermission('reporting_analytics:terminal_shift_reports:read'),
  branchAuth,
  terminalShiftReportController.getTerminalShiftReportById
);

module.exports = router;
