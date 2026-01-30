const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPermissions,
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const PERMISSIONS = require('../config/permissions');

// All routes in this file are protected and require authentication
router.use(auth);

router.post('/', checkPermission(PERMISSIONS.USERS.CREATE), createUser);

router.get('/', checkPermission(PERMISSIONS.USERS.READ), getAllUsers);

router.get(
  '/permissions',
  checkPermission(PERMISSIONS.USERS.READ),
  getPermissions,
);
router.get('/:id', checkPermission(PERMISSIONS.USERS.READ), getUserById);

router.patch('/:id', checkPermission(PERMISSIONS.USERS.UPDATE), updateUser);

router.delete('/:id', checkPermission(PERMISSIONS.USERS.DELETE), deleteUser);

module.exports = router;
