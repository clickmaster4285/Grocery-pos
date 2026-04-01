const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser, generateBase36Code } = require('./utils');
const Category = require('../../models/category.model');

const seedCategories = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Seeding 100 categories...');
    
    const categories = [];
    for (let i = 1; i <= 100; i++) {
        const category_code = await generateBase36Code('category_code', 'CAT');
        categories.push({
            category_code,
            name: faker.commerce.department() + ' ' + i, // Adding index to ensure uniqueness
            description: faker.commerce.productDescription().substring(0, 200),
            category_type: faker.helpers.arrayElement(['PHYSICAL', 'SERVICE', 'DIGITAL']),
            isActive: true,
            createdBy: admin._id,
            updatedBy: admin._id
        });
    }

    try {
        await Category.insertMany(categories);
        console.log('✅ Successfully seeded 100 categories');
    } catch (error) {
        console.error('❌ Error seeding categories:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

seedCategories();
