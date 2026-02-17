const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/branch.model');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { PERMISSIONS } = require('../config/permissions');

const createUser = async (req, res, next) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      email, 
      password, 
      pin,
      hasSystemAccess = false,
      isTwoFactorEnabled = false,
      role = 'general_staff', 
      permissions = [], 
      branch_id,
      // New fields
      hireDate,
      designation,
      department,
      employmentStatus,
      salary,
      address,
      emergencyContact
    } = req.body;

    // Base validation
    if (!firstName) {
      return res.status(400).json({ message: 'First name is required' });
    }

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required for all staff members' });
    }

    // Conditional validation for system access
    if (hasSystemAccess) {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required for system access' });
      }
    }

    if (branch_id) {
      if (!mongoose.Types.ObjectId.isValid(branch_id)) {
        return res.status(400).json({ message: 'Invalid branch ID format' });
      }
      const branchExists = await Branch.findOne({ _id: branch_id, status: 'ACTIVE' });
      if (!branchExists) {
        return res.status(400).json({ message: 'Branch not found or is inactive' });
      }
    }

    // Email check (if provided)
    if (email) {
      const existingUser = await User.findOne({ email, isDeleted: false });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
    }

    const userId = generateUserId({ firstName, lastName, role });
    
    // Security: Hash both password and PIN
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const hashedPin = await hashPassword(pin.toString());

    const userData = {
      userId,
      firstName,
      lastName,
      email: email || undefined,
      phone,
      hasSystemAccess,
      password: hashedPassword,
      pin: hashedPin,
      isTwoFactorEnabled,
      role,
      permissions: hasSystemAccess ? permissions : [],
      branch_id,
      // New Fields
      hireDate: hireDate || Date.now(),
      designation,
      department,
      employmentStatus: employmentStatus || 'ACTIVE',
      salary,
      address,
      emergencyContact
    };

    const user = await User.create(userData);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.pin;

    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [users, total] = await Promise.all([
      User.find({ isDeleted: false, role: { $ne: 'admin' } })
        .populate('branch_id', 'branch_name')
        .populate('deletedBy', 'firstName lastName')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments({ isDeleted: false, role: { $ne: 'admin' } })
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate('branch_id', 'branch_name')
      .populate('deletedBy', 'firstName lastName')
      .select('-password');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId, ...updateFields } = req.body;

    // Fetch the user being updated to check their role
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Security check: Prevent non-admin users from editing admin profiles
    if (req.user.role !== 'admin' && targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to edit an admin user.' });
    }

    // Security check: Only an admin can set a user's role to 'admin'
    if (updateFields.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only an admin can assign the "admin" role.' });
    }

    // Hash password if it's being updated
    if (updateFields.password) {
      updateFields.password = await hashPassword(updateFields.password);
    }

    // Hash PIN if it's being updated
    if (updateFields.pin) {
      updateFields.pin = await hashPassword(updateFields.pin.toString());
    }

    if (updateFields.branch_id) {
      if (!mongoose.Types.ObjectId.isValid(updateFields.branch_id)) {
        return res.status(400).json({ message: 'Invalid branch ID format' });
      }
      const branchExists = await Branch.findOne({ _id: updateFields.branch_id, status: 'ACTIVE' });
      if (!branchExists) {
        return res.status(400).json({ message: 'Branch not found or is inactive' });
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        isActive: false,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getPermissions = (req, res, next) => {
  try {
    // Group all available permissions by module
    const allModulesStructured = PERMISSIONS.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = {
          moduleName: perm.module,
          permissions: [],
        };
      }
      acc[perm.module].permissions.push(perm.id);
      return acc;
    }, {});

    res.status(200).json(Object.values(allModulesStructured));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPermissions,
};
