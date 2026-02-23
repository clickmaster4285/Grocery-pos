const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const errorHandler = require('./errorHandler');
const { getModulesFromPermissions } = require('../utils/getModules'); // Import the utility

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. Invalid token.',
      });
    }

    // Attach the full user object to the request, excluding the password.
    // Populate allowedTerminals so frontend knows which terminals are permitted.
    const user = await User.findOne({ userId: decoded.userId, isDeleted: false })
      .select('-password')
      .populate('allowedTerminals', 'name terminalId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. User not found.',
      });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Your account has been deactivated.',
        });
    }

    // Populate availableModules for the user, respecting their current security protocol status
    const availableModules = getModulesFromPermissions(user.permissions, user.hasSystemAccess, user.role);
    req.user = { ...user.toObject(), availableModules }; // Convert Mongoose document to plain object

    next();
  } catch (error) {
    // Pass to the generic error handler
    return errorHandler(error, req, res);
  }
};

module.exports = auth;
