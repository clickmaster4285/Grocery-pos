const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser, generateBase36Code } = require('./utils');
const Brand = require('../../models/brand.model');

const seedBrands = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Seeding 100 brands...');
    
    const brands = [];
    for (let i = 1; i <= 100; i++) {
        const brand_code = await generateBase36Code('brand_code', 'BRD');
        brands.push({
            brand_code,
            name: faker.company.name() + ' ' + i,
            description: faker.company.catchPhrase().substring(0, 200),
            origin: faker.location.country(),
            status: 'ACTIVE',
            createdBy: admin._id,
            updatedBy: admin._id
        });
    }

    try {
        await Brand.insertMany(brands);
        console.log('✅ Successfully seeded 100 brands');
    } catch (error) {
        console.error('❌ Error seeding brands:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

seedBrands();
