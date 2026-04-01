const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser, generateBase36Code } = require('./utils');
const Supplier = require('../../models/supplier.model');

const seedSuppliers = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Seeding 100 suppliers...');
    
    const suppliers = [];
    for (let i = 1; i <= 100; i++) {
        const supplier_code = await generateBase36Code('supplier_code', 'SUP');
        suppliers.push({
            supplier_code,
            name: faker.company.name() + ' ' + i,
            contactPerson: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },
            status: 'ACTIVE',
            payment_terms: faker.helpers.arrayElement(['CASH', 'CREDIT', 'NET_30', 'NET_60', 'DUE_ON_RECEIPT']),
            createdBy: admin._id,
            updatedBy: admin._id
        });
    }

    try {
        await Supplier.insertMany(suppliers);
        console.log('✅ Successfully seeded 100 suppliers');
    } catch (error) {
        console.error('❌ Error seeding suppliers:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

seedSuppliers();
