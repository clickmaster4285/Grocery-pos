const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const branchAuth = require('../middleware/branchAuth');
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

router.post("/", checkPermission([BranchPermissions.CREATE]), branchAuth, createBranch);
router.get("/", checkPermission([BranchPermissions.READ]), branchAuth, getAllBranches);
router.get("/:id", checkPermission([BranchPermissions.READ]), branchAuth, getBranchById);
router.put("/:id", checkPermission([BranchPermissions.UPDATE]), branchAuth, updateBranch);
router.delete("/:id", checkPermission([BranchPermissions.DELETE]), branchAuth, deleteBranch);

module.exports = router;
