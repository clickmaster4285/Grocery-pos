const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS_OBJECT } = require('../config/permissions');
const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch
} = require("../controllers/branch.controller");

// Local constant for easier permission management
const BranchPermissions = PERMISSIONS_OBJECT.BRANCH.BRANCH_MANAGEMENT;

router.use(auth);

router.post("/", checkPermission([BranchPermissions.CREATE]), createBranch);
router.get("/", checkPermission([BranchPermissions.READ]), getAllBranches);
router.get("/:id", checkPermission([BranchPermissions.READ]), getBranchById);
router.put("/:id", checkPermission([BranchPermissions.UPDATE]), updateBranch);
router.delete("/:id", checkPermission([BranchPermissions.DELETE]), deleteBranch);

module.exports = router;
