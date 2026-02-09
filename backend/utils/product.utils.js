
const fs = require('fs');

const transformEmptyStringsToNull = (productData) => {
    const data = { ...productData };

    if (data.category === '') {
        data.category = null;
    }
    if (data.brand === '') {
        data.brand = null;
    }

    if (data.variants && Array.isArray(data.variants)) {
        data.variants = data.variants.map(variant => {
            if (variant.supplier === '') {
                variant.supplier = null;
            }
            return variant;
        });
    }

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

module.exports = {
    transformEmptyStringsToNull,
    cleanupUploadedFiles,
    createInitialVariantHistory,
};
