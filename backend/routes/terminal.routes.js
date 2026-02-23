const express = require('express');
const router = express.Router();
const terminalController = require('../controllers/terminal.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const POS_PERMS = PERMISSIONS_OBJECT.POINT_OF_SALE.TERMINAL_MANAGEMENT;

// All terminal routes are protected
router.use(auth);

router.route('/')
    .get(checkPermission(POS_PERMS.READ), terminalController.getAllTerminals)
    .post(checkPermission(POS_PERMS.CREATE), terminalController.createTerminal);

router.route('/:id')
    .get(checkPermission(POS_PERMS.READ), terminalController.getTerminalById)
    .put(checkPermission(POS_PERMS.UPDATE), terminalController.updateTerminal)
    .delete(checkPermission(POS_PERMS.DELETE), terminalController.deleteTerminal);

// Session (Shift) Management
router.put('/:id/open', checkPermission(POS_PERMS.UPDATE), terminalController.openSession);
router.put('/:id/close', checkPermission(POS_PERMS.UPDATE), terminalController.closeSession);

module.exports = router;
