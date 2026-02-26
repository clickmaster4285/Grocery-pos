const mongoose = require('mongoose');

/**
 * Middleware to enforce branch isolation.
 * Standardizes on the field name 'branch'.
 */
const branchAuth = (req, res, next) => {
    // Admins have full access
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Non-admin users MUST have a branch assigned
    // After standardizing User model, it's req.user.branch
    if (!req.user || !req.user.branch) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied: User is not assigned to a branch.' 
        });
    }

    const userBranchId = req.user.branch.toString();

    // 1. For GET requests (Listing and Detail)
    if (req.method === 'GET') {
        // Automatically inject branch filter into req.query
        // This will be used by controllers in their find() calls
        if (!req.query.branch) {
            req.query.branch = userBranchId;
        } else if (req.query.branch.toString() !== userBranchId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Cannot query data from other branches.' 
            });
        }
    } 
    
    // 2. For POST (Creation)
    else if (req.method === 'POST') {
        // Ensure the resource is created in the user's branch
        if (!req.body.branch) {
            req.body.branch = userBranchId;
        } else if (req.body.branch.toString() !== userBranchId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Cannot create resources for other branches.' 
            });
        }
    }

    // 3. For PUT/PATCH/DELETE (Updates and Deletion)
    // For these, the controller MUST verify ownership before proceeding.
    // The middleware has already verified the user has a branch context.
    // We add it to req.query just in case some controllers use it for filtering updateOne/deleteOne
    else if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        req.query.branch = userBranchId;
    }

    next();
};

module.exports = branchAuth;
