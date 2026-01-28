const User = require('../models/User');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({ userId: user.userId, roles: user.roles });

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  // The user object is attached to the request by the `auth` middleware
  // We just need to return it.
  res.status(200).json(req.user);
};

module.exports = {
  login,
  getMe,
};
