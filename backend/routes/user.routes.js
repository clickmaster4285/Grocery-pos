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
const { PERMISSIONS_OBJECT } = require('../config/permissions');

// All routes in this file are protected and require authentication
router.use(auth);

router.post('/', checkPermission(PERMISSIONS_OBJECT.USERS.CREATE), createUser);

router.get('/', checkPermission(PERMISSIONS_OBJECT.USERS.READ), getAllUsers);

router.get(
  '/permissions', // Updated route path for getPermissions
  checkPermission([PERMISSIONS_OBJECT.USERS.CREATE, PERMISSIONS_OBJECT.USERS.READ]),
  getPermissions,
);

router.get('/:id', checkPermission(PERMISSIONS_OBJECT.USERS.READ), getUserById);

router.patch('/:id', checkPermission(PERMISSIONS_OBJECT.USERS.UPDATE), updateUser);

router.delete('/:id', checkPermission(PERMISSIONS_OBJECT.USERS.DELETE), deleteUser);

module.exports = router;
