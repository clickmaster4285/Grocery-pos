const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  toggleBranchStatus
} = require("../controllers/branch.controller");


router.post("/", auth,checkPermission("branches:create"), createBranch);

router.get("/", auth, checkPermission("branches:read"),getAllBranches);

router.get("/:id", checkPermission("branches:read"),auth, getBranchById);

router.put("/:id", auth, checkPermission("branches:update"), updateBranch);

router.delete("/:id", auth, checkPermission("branches:delete"), toggleBranchStatus);

module.exports = router;
