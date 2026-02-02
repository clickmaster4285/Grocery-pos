const mongoose = require("mongoose");
const Branch = require("../models/branch.model");

/**
 * CREATE BRANCH
 */
exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET ALL BRANCHES (ACTIVE ONLY)
 */
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find(
      {
        // status: { $ne: "INACTIVE" }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET SINGLE BRANCH
 */
exports.getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch id"
      });
    }

    const branch = await Branch.findOne({
      _id: id,
      // status: { $ne: "INACTIVE" }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE BRANCH
 */
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findOneAndUpdate(
      { _id: id, status: { $ne: "INACTIVE" } },
      req.body,
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or inactive"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



exports.toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // 🔁 TOGGLE STATUS
    const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    branch.status = newStatus;
    await branch.save();

    res.status(200).json({
      success: true,
      message: `Branch ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

