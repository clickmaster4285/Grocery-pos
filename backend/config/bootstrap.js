const mongoose = require('mongoose');
const User = require('../models/User');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { PERMISSIONS } = require('./permissions'); 

const initializeAdminAccount = async () => {
  const {
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_ROLE = 'admin', 
  } = process.env;

  if (!ADMIN_FIRST_NAME || !ADMIN_LAST_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing required environment variables for default admin creation.');
    console.error('Please set ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.');
    process.exit(1);
  }

  try {
    const existingAdmin = await User.findOne({
      role: ADMIN_ROLE, 
      isDeleted: false,
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists.');
      const allPermissions = PERMISSIONS.map(p => p.id);
      const existingPermissionsSet = new Set(existingAdmin.permissions);
      const permissionsToAdd = allPermissions.filter(p => !existingPermissionsSet.has(p));

      if (permissionsToAdd.length > 0) {
        existingAdmin.permissions = [...existingAdmin.permissions, ...permissionsToAdd];
        await existingAdmin.save();
        console.log(`✅ Updated admin user with new permissions: ${permissionsToAdd.join(', ')}`);
      } else {
        console.log('Admin user permissions are already up to date.');
      }
      return;
    }

    console.log('No admin user found. Creating default admin...');

    const allPermissions = PERMISSIONS.map(p => p.id);

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    const userId = generateUserId({
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: ADMIN_ROLE,
    });
    
    const adminUser = new User({
        userId,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: ADMIN_ROLE,
        permissions: allPermissions, 
        isActive: true,
      });

    await adminUser.save();

    console.log('✅ Default admin user created successfully.');
    
  } catch (error) {
    console.error('❌ Error during admin user initialization:', error.message);
    // Exit gracefully without exposing sensitive details
    process.exit(1);
  }
};

module.exports = { initializeAdminAccount };