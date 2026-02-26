const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/branch.model');
const BranchLocation = require('../models/branchLocation.model');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { PERMISSIONS } = require('./permissions'); 

const initializeDefaultBranch = async () => {
  try {
    let defaultBranch = await Branch.findOne({ isDeleted: false });

    if (!defaultBranch) {
      console.log('No branches found. Creating default branch...');
      defaultBranch = await Branch.create({
        branch_code: 'BR-MAIN',
        branch_name: 'Main Branch',
        status: 'ACTIVE',
        address: {
          city: 'Default City',
          state: 'Default State',
          country: 'Default Country',
          street: 'Default Street',
          zipCode: '00000'
        }
      });
      console.log('✅ Default branch created successfully.');
    }

    return defaultBranch;
  } catch (error) {
    console.error('❌ Error initializing default branch:', error.message);
  }
};

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
    const defaultBranch = await initializeDefaultBranch();

    const existingAdmin = await User.findOne({
      role: ADMIN_ROLE, 
      isDeleted: false,
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists.');
      
      let updated = false;
      const allPermissions = PERMISSIONS.map(p => p.id);
      const existingPermissionsSet = new Set(existingAdmin.permissions);
      const permissionsToAdd = allPermissions.filter(p => !existingPermissionsSet.has(p));

      if (permissionsToAdd.length > 0) {
        existingAdmin.permissions = [...existingAdmin.permissions, ...permissionsToAdd];
        updated = true;
        console.log(`✅ Updated admin user with new permissions: ${permissionsToAdd.join(', ')}`);
      }

      if (!existingAdmin.branch && defaultBranch) {
        existingAdmin.branch = defaultBranch._id;
        updated = true;
        console.log('✅ Assigned existing admin to default branch.');
      }

      if (updated) {
        await existingAdmin.save();
      } else {
        console.log('Admin user is already up to date.');
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
        branch: defaultBranch ? defaultBranch._id : null
      });

    await adminUser.save();

    console.log('✅ Default admin user created successfully.');
    
  } catch (error) {
    console.error('❌ Error during admin user initialization:', error.message);
    process.exit(1);
  }
};

const initializeBranchLocations = async () => {
  try {
    const branches = await Branch.find({ isDeleted: false });
    
    for (const branch of branches) {
      const existingBackroom = await BranchLocation.findOne({
        branch: branch._id,
        type: 'BACKROOM'
      });

      if (!existingBackroom) {
        await BranchLocation.create({
          branch: branch._id,
          name: 'Default Warehouse',
          type: 'BACKROOM',
          floor: 0,
          capacity: 0 // Unlimited
        });
        console.log(`✅ Created Default Warehouse for branch: ${branch.branch_name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing branch locations:', error.message);
  }
};

module.exports = { initializeAdminAccount, initializeBranchLocations };