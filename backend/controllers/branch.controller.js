const mongoose = require("mongoose");
const Branch = require("../models/branch.model");
const Counter = require("../models/counter.model");

// Helper to generate branch code: BR-[BASE36_SERIAL]
const generateBranchCode = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'branch_code' },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] },
                    lastDate: new Date().toISOString().slice(0, 10).replace(/-/g, '')
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(3, '0');
    return `BR-${serial}`;
};

exports.createBranch = async (req, res) => {
  try {
    let { branch_code } = req.body;
    
    if (!branch_code) {
      branch_code = await generateBranchCode();
    }

    const branch = await Branch.create({
      ...req.body,
      branch_code,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

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

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isDeleted: { $ne: true } })
      .populate('createdBy', 'firstName lastName')
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
      isDeleted: { $ne: true }
    })
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

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

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    let { branch_code } = req.body;

    if (!branch_code) {
      const existingBranch = await Branch.findById(id);
      if (existingBranch && !existingBranch.branch_code) {
        branch_code = await generateBranchCode();
      }
    }

    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...req.body, branch_code, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
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

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { 
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: req.user.id
      },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or already deleted"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
