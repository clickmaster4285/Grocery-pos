const express = require('express');
const customerController = require('../controllers/customer.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');

const router = express.Router();

// Local constant for easier permission management
const CustomerPermissions = PERMISSIONS_OBJECT.CUSTOMER_MANAGEMENT.CUSTOMER_DATABASE;

router.use(auth);

router.get('/', 
  checkPermission([CustomerPermissions.READ]), 
  customerController.getAllCustomers
);

router.get('/:id', 
  checkPermission([CustomerPermissions.READ]), 
  customerController.getCustomerById
);

router.post('/', 
  checkPermission([CustomerPermissions.CREATE]), 
  customerController.createCustomer
);

router.put('/:id', 
  checkPermission([CustomerPermissions.UPDATE]), 
  customerController.updateCustomer
);

router.delete('/:id', 
  checkPermission([CustomerPermissions.DELETE]), 
  customerController.deleteCustomer
);

module.exports = router;
