const express = require('express');
const router = express.Router();
const terminalShiftReportController = require('../controllers/terminalShiftReport.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Get all terminal shift reports (requires 'reporting_analytics:terminal_shift_reports:read' permission)
router.get(
  '/',
  auth,
  checkPermission('reporting_analytics:terminal_shift_reports:read'),
  terminalShiftReportController.getAllTerminalShiftReports
);

// Get a single terminal shift report by ID (requires 'reporting_analytics:terminal_shift_reports:read' permission)
router.get(
  '/:id',
  auth,
  checkPermission('reporting_analytics:terminal_shift_reports:read'),
  terminalShiftReportController.getTerminalShiftReportById
);

module.exports = router;
