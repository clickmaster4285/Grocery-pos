const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser, generateBase36Code } = require('./utils');
const Branch = require('../../models/branch.model');
const BranchLocation = require('../../models/branchLocation.model');

const seedBranches = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Seeding 110 branches...');
    
    for (let i = 1; i <= 110; i++) {
        const branch_code = await generateBase36Code('branch_code', 'BR');
        const branch = await Branch.create({
            branch_code,
            branch_name: faker.company.name() + ' Branch ' + i,
            status: 'ACTIVE',
            address: {
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
                street: faker.location.streetAddress(),
                zipCode: faker.location.zipCode()
            },
            createdBy: admin._id,
            updatedBy: admin._id
        });

        // Create default warehouse for each branch as per branch controller logic
        await BranchLocation.create({
            branch: branch._id,
            name: 'Main Warehouse',
            type: 'BACKROOM',
            floor: 0,
            capacity: 0 // Unlimited
        });
        
        if (i % 10 === 0) console.log(`   - Seeded ${i} branches...`);
    }

    console.log('✅ Successfully seeded 110 branches with default warehouses');
    mongoose.connection.close();
};

seedBranches();
