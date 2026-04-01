const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser } = require('./utils');
const User = require('../../models/User');
const Branch = require('../../models/branch.model');
const { generateUserId } = require('../../utils/userIdGenerator');
const { hashPassword } = require('../../utils/password');

const seedUsers = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Fetching branches...');
    const branches = await Branch.find({ isDeleted: false });
    if (branches.length === 0) {
        console.error('❌ No branches found. Seed branches first.');
        process.exit(1);
    }

    console.log('🌱 Seeding 100 users/employees...');
    
    const hashedPassword = await hashPassword('password123');
    const users = [];

    for (let i = 1; i <= 100; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const role = faker.helpers.arrayElement(['general_staff', 'cashier', 'manager']);
        const branch = faker.helpers.arrayElement(branches);

        const userId = generateUserId({ firstName, lastName, role });

        users.push({
            userId,
            firstName,
            lastName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            phone: faker.phone.number(),
            password: hashedPassword,
            role,
            branch: branch._id,
            isActive: true,
            salary: {
                baseAmount: faker.number.int({ min: 2000, max: 8000 }),
                payType: faker.helpers.arrayElement(['SALARY', 'HOURLY', 'FIXED']),
                paymentMethod: 'BANK_TRANSFER'
            },
            employment: {
                designation: faker.person.jobTitle(),
                department: faker.commerce.department(),
                status: 'ACTIVE'
            },
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zip: faker.location.zipCode(),
                country: faker.location.country()
            }
        });
    }

    try {
        await User.insertMany(users);
        console.log('✅ Successfully seeded 100 users/employees');
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

seedUsers();
