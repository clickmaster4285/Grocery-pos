const User = require('../models/User');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');


const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role = 'customer' } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
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
      roles: [role],
    });

    // Exclude password from the response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};


const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.id }).select('-password');
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
    // Exclude fields that should not be updated directly via this endpoint
    const { password, userId, ...updateData } = req.body;

    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      updateData,
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
      { userId: req.params.id },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deactivated successfully' });
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
};
