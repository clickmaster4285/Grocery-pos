
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Import Product model

const transformEmptyStringsToNull = (productData) => {
    console.log('--- transformEmptyStringsToNull Start ---');
    console.log('Incoming productData to transformEmptyStringsToNull:', productData);
    const data = { ...productData };

    if (data.category === '') {
        data.category = null;
    }
    if (data.brand === '') {
        data.brand = null;
    }

    if (data.variants && Array.isArray(data.variants)) {
        console.log('data.variants before map:', data.variants);
        data.variants = data.variants.map(variant => {
            if (variant.supplier === '') {
                variant.supplier = null;
            }
            if (variant.barcode === '') {
                variant.barcode = null;
            }
            if (variant.qrCode === '') {
                variant.qrCode = null;
            }
            return variant;
        });
        console.log('data.variants after map:', data.variants);
    } else {
        console.log('data.variants is not an array or is undefined/null:', data.variants);
    }
    console.log('Transformed productData:', data);
    console.log('--- transformEmptyStringsToNull End ---');
    return data;
};


const cleanupUploadedFiles = (files) => {
    if (files && files.length > 0) {
        files.forEach(file => {
            try {
                fs.unlinkSync(file.path);
            } catch (e) {
                console.error("Error cleaning up file:", e);
            }
        });
    }
};


const createInitialVariantHistory = (mutableVariant, userId) => {
    // Create initial price history
    const priceHistory = [{
        buyingPrice: Number(mutableVariant.buyingPrice),
        sellingPrice: Number(mutableVariant.sellingPrice),
        changedBy: userId,
    }];

    // Create initial stock history if stock is added
    const stockHistory = [];
    const initialStock = Number(mutableVariant.stock) || 0;
    if (initialStock > 0) {
        stockHistory.push({
            change: initialStock,
            type: 'RESTOCK',
            reason: 'Initial stock',
            performedBy: userId,
        });
    }
    return { priceHistory, stockHistory, initialStock };
};


const checkVariantUniqueness = async (field, value, currentProductId = null, currentVariantId = null) => {
    if (!value) return true; // Empty values are considered unique (handled by Joi .allow('') or .allow(null))

    const query = {
        isDeleted: false,
        'variants.isDeleted': false,
    };

    // Construct the specific query for the field
    query[`variants.${field}`] = value;

    // If updating a product, exclude the current product from the uniqueness check
    if (currentProductId) {
        query._id = { $ne: currentProductId };
    }

    const existingProduct = await Product.findOne(query);

    if (existingProduct) {
        // If a product is found, check if the conflicting variant is the one being updated
        const conflictingVariant = existingProduct.variants.find(v =>
            v[field] === value &&
            (currentVariantId ? !v._id.equals(currentVariantId) : true) && // Exclude if it's the same variant being updated
            !v.isDeleted
        );
        return !conflictingVariant; // If a conflicting variant is found (and it's not the current one), it's not unique
    }

    return true; // No existing product found with the value, so it's unique
};


module.exports = {
    transformEmptyStringsToNull,
    cleanupUploadedFiles,
    createInitialVariantHistory,
    checkVariantUniqueness
};
