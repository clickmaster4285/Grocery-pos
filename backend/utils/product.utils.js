const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/product.model');

const transformEmptyStringsToNull = (productData) => {
    const data = { ...productData };

    // Helper to recursively remove null/empty strings
    const cleanObject = (obj) => {
        const cleaned = { ...obj };
        for (const key in cleaned) {
            if (cleaned[key] === '' || cleaned[key] === null) {
                delete cleaned[key];
            } else if (Array.isArray(cleaned[key])) {
                // Don't recursively clean arrays of objects here unless needed, 
                // but let's handle variants specifically below.
            } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null && !(cleaned[key] instanceof mongoose.Types.ObjectId)) {
                cleaned[key] = cleanObject(cleaned[key]);
            }
        }
        return cleaned;
    };

    // Clean top level first
    let cleanedData = cleanObject(data);

    // Specifically handle variants array
    if (cleanedData.variants && Array.isArray(cleanedData.variants)) {
        cleanedData.variants = cleanedData.variants.map(variant => {
            const newVariant = { ...variant };
            for (const key in newVariant) {
                if (newVariant[key] === '' || newVariant[key] === null) {
                    delete newVariant[key];
                }
            }
            return newVariant;
        });
    }

    // Re-set category and brand to null if they were deleted but are expected to be null for DB
    // Actually, for ObjectIds, null is often better than missing if we want to clear them.
    // But for unique fields like barcode, missing is MANDATORY.
    
    if (productData.category === '' || productData.category === null) {
        cleanedData.category = null;
    }
    if (productData.brand === '' || productData.brand === null) {
        cleanedData.brand = null;
    }

    return cleanedData;
};


const cleanupUploadedFiles = (files) => {
    if (files && files.length > 0) {
        files.forEach(file => {
            try {
                fs.unlinkSync(file.path);
            } catch (e) {
                // Intentionally ignore errors during cleanup
            }
        });
    }
};


const createInitialVariantHistory = (mutableVariant, userId) => {
    const priceHistory = [{
        buyingPrice: Number(mutableVariant.buyingPrice),
        sellingPrice: Number(mutableVariant.sellingPrice),
        changedBy: userId,
    }];

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
    if (!value) return true; // Empty values are considered unique

    const otherProductQuery = {
        isDeleted: false,
        'variants.isDeleted': false,
        [`variants.${field}`]: value,
    };
    if (currentProductId) {
        otherProductQuery._id = { $ne: currentProductId };
    }
    const conflictingOtherProduct = await Product.findOne(otherProductQuery);
    if (conflictingOtherProduct) {
        return false; // Found a conflict in another product
    }

    if (currentProductId) {
        const currentProduct = await Product.findById(currentProductId);
        if (currentProduct) {
            const conflictingVariantInSameProduct = currentProduct.variants.some(v =>
                v[field] === value &&
                !v.isDeleted &&
                (currentVariantId ? !v._id.equals(currentVariantId) : true)
            );
            if (conflictingVariantInSameProduct) {
                return false; // Found a conflict within the same product
            }
        }
    }

    return true; // No conflict found
};


module.exports = {
    transformEmptyStringsToNull,
    cleanupUploadedFiles,
    createInitialVariantHistory,
    checkVariantUniqueness
};
