const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. User not authenticated or permissions not found.',
      });
    }

    let userHasPermission = false;

    if (Array.isArray(requiredPermission)) {
      userHasPermission = requiredPermission.some(permission =>
        req.user.permissions.includes(permission)
      );
    } else {
      userHasPermission = req.user.permissions.includes(requiredPermission);
    }

    if (userHasPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden. You do not have the necessary permissions.',
    });
  };
};

module.exports = checkPermission;
