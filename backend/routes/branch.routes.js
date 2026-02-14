const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch
} = require("../controllers/branch.controller");


router.post("/", auth, checkPermission("branches:create"), createBranch);
router.get("/", auth, checkPermission("branches:read"), getAllBranches);
router.get("/:id", auth, checkPermission("branches:read"), getBranchById);
router.put("/:id", auth, checkPermission("branches:update"), updateBranch);
router.delete("/:id", auth, checkPermission("branches:delete"), deleteBranch);

module.exports = router;
