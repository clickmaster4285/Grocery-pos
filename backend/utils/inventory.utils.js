const mongoose = require('mongoose');
const BranchLocation = require('../models/branchLocation.model');
const Product = require('../models/product.model');
const BranchStockLocation = require('../models/branchStockLocation.model');
const BranchStock = require('../models/branchStock.model');

// Helper function to check storage compatibility
const checkStorageCompatibility = (productStorageReq, locationType) => {
    const compatibilityMap = {
        'AMBIENT': ['AISLE', 'RACK', 'SHELF', 'GONDOLA', 'DISPLAY', 'BACKROOM'],
        'REFRIGERATED': ['REFRIGERATOR', 'DISPLAY', 'BACKROOM'],
        'FROZEN': ['FREEZER', 'BACKROOM']
    };

    if (!productStorageReq || !locationType) {
        return true;
    }

    if (!compatibilityMap[productStorageReq] || !compatibilityMap[productStorageReq].includes(locationType)) {
        throw new Error(`Incompatible storage: Product requires ${productStorageReq} but location type is ${locationType}.`);
    }
    return true;
};

// Helper function to check capacity
const checkCapacity = async (locationId, newQuantity, session) => {
    const location = await BranchLocation.findById(locationId).session(session);
    if (!location) {
        throw new Error(`Destination location ${locationId} not found.`);
    }

    if (location.capacity > 0 && (location.currentOccupancy + newQuantity > location.capacity)) {
        throw new Error(`Capacity exceeded: Location "${location.name}" (${location.currentOccupancy}/${location.capacity}) cannot accommodate ${newQuantity} more items.`);
    }
    return location;
};

// Helper function to find the default warehouse
const getDefaultBackroomLocation = async (branchId, session) => {
    const defaultBackroom = await BranchLocation.findOne({ branch: branchId, type: 'BACKROOM' }).session(session);
    if (!defaultBackroom) {
        throw new Error(`Default Warehouse not found for branch ${branchId}. Please ensure it's initialized.`);
    }
    return defaultBackroom;
};

// Sync high-level BranchStock cache
const syncBranchStock = async (branchId, productId, variantId, session) => {
    const locations = await BranchStockLocation.find({
        branch: branchId,
        product: productId,
        variantId: variantId
    }).session(session);

    const totalQuantity = locations.reduce((sum, loc) => sum + loc.quantity, 0);

    await BranchStock.findOneAndUpdate(
        { branch: branchId, product: productId, variantId: variantId },
        { quantity: totalQuantity },
        { upsert: true, session }
    );
};

// Helper function to deduct stock
const deductStockFromLocations = async (branchId, productId, variantId, quantityToDeduct, session, specificLocationId = null) => {
    const query = {
        branch: branchId,
        product: productId,
        variantId: variantId,
        quantity: { $gt: 0 }
    };

    if (specificLocationId) {
        query.location = specificLocationId;
    }

    const stockLocations = await BranchStockLocation.find(query)
    .populate('location')
    .sort({ 'location.type': 1, 'updatedAt': 1 })
    .session(session);

    let remainingQuantityToDeduct = quantityToDeduct;
    let currentTotalStock = stockLocations.reduce((sum, loc) => sum + loc.quantity, 0);

    if (currentTotalStock < quantityToDeduct) {
        const locationInfo = specificLocationId ? `in specified location` : `in branch`;
        throw new Error(`Insufficient stock ${locationInfo} for variant ${variantId}. Requested: ${quantityToDeduct}, Available: ${currentTotalStock}`);
    }

    for (const stockLocation of stockLocations) {
        if (remainingQuantityToDeduct <= 0) break;

        const deductedQty = Math.min(remainingQuantityToDeduct, stockLocation.quantity);
        stockLocation.quantity -= deductedQty;
        remainingQuantityToDeduct -= deductedQty;
        
        await stockLocation.save({ session });

        const branchLocation = await BranchLocation.findById(stockLocation.location._id).session(session);
        if (branchLocation) {
            branchLocation.currentOccupancy -= deductedQty;
            await branchLocation.save({ session });
        }
    }

    // Sync total cache
    await syncBranchStock(branchId, productId, variantId, session);
};

// Helper function to add stock
const addStockToLocation = async (branchId, productId, variantId, locationId, quantityToAdd, session) => {
    await checkCapacity(locationId, quantityToAdd, session);

    let branchStockLoc = await BranchStockLocation.findOne({
        branch: branchId,
        product: productId,
        variantId: variantId,
        location: locationId
    }).session(session);

    if (branchStockLoc) {
        branchStockLoc.quantity += quantityToAdd;
        await branchStockLoc.save({ session });
    } else {
        branchStockLoc = new BranchStockLocation({
            branch: branchId,
            product: productId,
            variantId: variantId,
            location: locationId,
            quantity: quantityToAdd
        });
        await branchStockLoc.save({ session });
    }

    const branchLocation = await BranchLocation.findById(locationId).session(session);
    if (branchLocation) {
        branchLocation.currentOccupancy += quantityToAdd;
        await branchLocation.save({ session });
    }

    // Sync total cache
    await syncBranchStock(branchId, productId, variantId, session);
};


module.exports = {
    checkStorageCompatibility,
    checkCapacity,
    getDefaultBackroomLocation,
    deductStockFromLocations,
    addStockToLocation,
    syncBranchStock
};