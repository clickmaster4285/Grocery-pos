const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { connectDB, getAdminUser } = require('./utils');
const Product = require('../../models/product.model');
const Category = require('../../models/category.model');
const Brand = require('../../models/brand.model');
const Supplier = require('../../models/supplier.model');

const generateUniqueSku = (productName, i) => {
    const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) : 'PROD';
    const productPart = sanitize(productName);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${productPart}-${i}-${randomSuffix}`.substring(0, 50);
};

const seedProducts = async () => {
    await connectDB();
    const admin = await getAdminUser();
    
    console.log('🌱 Fetching dependencies...');
    const [categories, brands, suppliers] = await Promise.all([
        Category.find({ isDeleted: false }),
        Brand.find({ isDeleted: false }),
        Supplier.find({ isDeleted: false })
    ]);

    if (categories.length === 0 || brands.length === 0 || suppliers.length === 0) {
        console.error('❌ Missing categories, brands, or suppliers. Seed them first.');
        process.exit(1);
    }

    console.log('🌱 Seeding 10,000 products (this may take a while)...');
    
    const BATCH_SIZE = 500;
    const TOTAL_PRODUCTS = 10000;

    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
        const productsBatch = [];
        const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);

        for (let j = 1; j <= currentBatchSize; j++) {
            const productIdx = i + j;
            const productName = faker.commerce.productName() + ' ' + productIdx;
            const category = faker.helpers.arrayElement(categories);
            const brand = faker.helpers.arrayElement(brands);
            
            // Generate 1-3 variants per product
            const numVariants = faker.number.int({ min: 1, max: 2 });
            const variants = [];

            for (let v = 1; v <= numVariants; v++) {
                const buyingPrice = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
                const sellingPrice = buyingPrice * (1 + faker.number.float({ min: 0.1, max: 0.5 }));
                const stock = faker.number.int({ min: 10, max: 200 });
                const sku = generateUniqueSku(productName, `${productIdx}-${v}`);

                variants.push({
                    sku: sku,
                    barcode: faker.string.numeric(13),
                    stock: stock,
                    minStockLevel: 5,
                    maxStockLevel: 500,
                    supplier: faker.helpers.arrayElement(suppliers)._id,
                    priceHistory: [{
                        buyingPrice: buyingPrice,
                        sellingPrice: sellingPrice,
                        changedBy: admin._id,
                        effectiveDate: new Date()
                    }],
                    stockHistory: [{
                        change: stock,
                        type: 'RESTOCK',
                        reason: 'Initial Seed',
                        performedBy: admin._id,
                        date: new Date()
                    }],
                    attributes: [
                        { key: 'Size', value: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']) },
                        { key: 'Color', value: faker.color.human() }
                    ]
                });
            }

            productsBatch.push({
                productName,
                description: faker.commerce.productDescription(),
                category: category._id,
                brand: brand._id,
                unit: faker.helpers.arrayElement(['PIECE', 'KG', 'PACK', 'DOZEN']),
                storageRequirement: faker.helpers.arrayElement(['AMBIENT', 'REFRIGERATED', 'FROZEN']),
                taxRate: faker.helpers.arrayElement([0, 5, 12, 18]),
                isActive: true,
                variants: variants,
                totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
                createdBy: admin._id,
                updatedBy: admin._id
            });
        }

        try {
            await Product.insertMany(productsBatch);
            console.log(`   ✅ Seeded ${i + currentBatchSize} products...`);
        } catch (error) {
            console.error(`❌ Error seeding batch starting at ${i}:`, error.message);
        }
    }

    console.log('✅ Successfully seeded 10,000 products');
    mongoose.connection.close();
};

seedProducts();
