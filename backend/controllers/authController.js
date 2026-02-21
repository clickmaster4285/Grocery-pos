const User = require('../models/User');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { getModulesFromPermissions } = require('../utils/getModules');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email, isDeleted: false }).select('+password');

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const userPermissions = user.permissions;
    const availableModules = getModulesFromPermissions(userPermissions);

    const token = generateToken({
      userId: user.userId,
      role: user.role,
      // permissions: userPermissions,
      // availableModules: availableModules, // Add structured modules to JWT
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
        permissions: userPermissions,
        availableModules: availableModules, // Add structured modules to response
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  // The user object is attached to the request by the `auth` middleware
  // We just need to return it. It now contains availableModules.
  res.status(200).json(req.user);
};

module.exports = {
  login,
  getMe,
};
