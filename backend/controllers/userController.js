const User = require('../models/User');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');

const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role = 'customer', permissions = [] } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const userId = generateUserId({ firstName, lastName, role });
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      userId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role, 
      permissions, 
    });

   const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.role = user.role;
    userResponse.permissions = user.permissions;


    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.id, isDeleted: false }).select('-password');
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
    const {userId, ...updateFields } = req.body;
    // Basic validation for role and permissions
    if (updateFields.role && typeof updateFields.role !== 'string') {
      return res.status(400).json({ message: 'Role must be a string.' });
    }
    if (updateFields.permissions && (!Array.isArray(updateFields.permissions) || !updateFields.permissions.every(p => typeof p === 'string'))) {
      return res.status(400).json({ message: 'Permissions must be an array of strings.' });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.id, isDeleted: false },
      updateFields, // Use the filtered updateFields
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
        { userId: req.params.id, isDeleted: false },
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
    const PERMISSIONS = require('../config/permissions');
    res.status(200).json(PERMISSIONS);
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
