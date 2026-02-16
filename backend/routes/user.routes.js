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
const UserPermissions = PERMISSIONS_OBJECT.EMPLOYEE.EMPLOYEE_DATABASE
// All routes in this file are protected and require authentication
router.use(auth);

router.post('/', checkPermission([UserPermissions.CREATE]), createUser);

router.get('/', checkPermission([UserPermissions.READ]), getAllUsers);

router.get(
  '/permissions', // Updated route path for getPermissions
  checkPermission([UserPermissions.CREATE, UserPermissions.READ]),
  getPermissions,
);

router.get('/:id', checkPermission([UserPermissions.READ]), getUserById);

router.patch('/:id', checkPermission([UserPermissions.UPDATE]), updateUser);

router.delete('/:id', checkPermission([UserPermissions.DELETE]), deleteUser);

module.exports = router;
