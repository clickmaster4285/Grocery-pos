const mongoose = require('mongoose');
const BranchLocation = require('../models/branchLocation.model');
const Product = require('../models/product.model');
const BranchStockLocation = require('../models/branchStockLocation.model');
const BranchStock = require('../models/branchStock.model');

// Define location type priority for sorting (consistent with stockTransfer.controller.js)
const LOCATION_TYPE_PRIORITY = [
    'SALES_FLOOR',
    'AISLE',
    'SHELF',
    'REFRIGERATOR',
    'FREEZER',
    'BACKROOM',
    'STORAGE'
];

// Helper to get priority index
const getLocationTypePriority = (type) => {
    const index = LOCATION_TYPE_PRIORITY.indexOf(type);
    return index === -1 ? LOCATION_TYPE_PRIORITY.length : index; // Unknown types get lowest priority
};

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
const checkCapacity = async (locationId, newQuantity) => {
    const location = await BranchLocation.findById(locationId);
    if (!location) {
        throw new Error(`Destination location ${locationId} not found.`);
    }

    if (location.capacity > 0 && (location.currentOccupancy + newQuantity > location.capacity)) {
        throw new Error(`Capacity exceeded: Location "${location.name}" (${location.currentOccupancy}/${location.capacity}) cannot accommodate ${newQuantity} more items.`);
    }
    return location;
};

// Helper function to find the default warehouse
const getDefaultBackroomLocation = async (branchId) => {
    const defaultBackroom = await BranchLocation.findOne({ branch: branchId, type: 'BACKROOM' });
    if (!defaultBackroom) {
        throw new Error(`Default Warehouse not found for branch ${branchId}. Please ensure it's initialized.`);
    }
    return defaultBackroom;
};

// Sync high-level BranchStock cache
const syncBranchStock = async (branchId, productId, variantId) => {
    const locations = await BranchStockLocation.find({
        branch: branchId,
        product: productId,
        variantId: variantId
    });

    const totalQuantity = locations.reduce((sum, loc) => sum + loc.quantity, 0);

    await BranchStock.findOneAndUpdate(
        { branch: branchId, product: productId, variantId: variantId },
        { quantity: totalQuantity },
        { upsert: true }
    );
};

// Helper function to deduct stock
const deductStockFromLocations = async (branchId, productId, variantId, quantityToDeduct, specificLocationId = null, sourceLocationId = null) => {
    const query = {
        branch: branchId,
        product: productId,
        variantId: variantId,
        quantity: { $gt: 0 }
    };

    if (specificLocationId) {
        query.location = specificLocationId;
    }
    if (sourceLocationId) { // For internal transfers from a specific location
        query.location = sourceLocationId;
    }

    let stockLocations = await BranchStockLocation.find(query)
    .populate('location');

    // Custom sort based on priority and then FIFO
    stockLocations.sort((a, b) => {
        const priorityA = getLocationTypePriority(a.location.type);
        const priorityB = getLocationTypePriority(b.location.type);
        if (priorityA === priorityB) {
            return new Date(a.updatedAt) - new Date(b.updatedAt); // FIFO for same priority
        }
        return priorityA - priorityB;
    });

    let remainingQuantityToDeduct = quantityToDeduct;
    let currentTotalStock = stockLocations.reduce((sum, loc) => sum + loc.quantity, 0);

    if (currentTotalStock < quantityToDeduct) {
        const locationInfo = specificLocationId || sourceLocationId ? `in specified location` : `in branch`;
        throw new Error(`Insufficient stock ${locationInfo} for variant ${variantId}. Requested: ${quantityToDeduct}, Available: ${currentTotalStock}`);
    }

    for (const stockLocation of stockLocations) {
        if (remainingQuantityToDeduct <= 0) break;

        const deductedQty = Math.min(remainingQuantityToDeduct, stockLocation.quantity);
        stockLocation.quantity -= deductedQty;
        remainingQuantityToDeduct -= deductedQty;
        
        await stockLocation.save();

        const branchLocation = await BranchLocation.findById(stockLocation.location._id);
        if (branchLocation) {
            branchLocation.currentOccupancy -= deductedQty;
            await branchLocation.save();
        }
    }

    // Sync total cache
    await syncBranchStock(branchId, productId, variantId);
};

// Helper function to add stock
const addStockToLocation = async (branchId, productId, variantId, locationId, quantityToAdd) => {
    await checkCapacity(locationId, quantityToAdd);

    let branchStockLoc = await BranchStockLocation.findOne({
        branch: branchId,
        product: productId,
        variantId: variantId,
        location: locationId
    });

    if (branchStockLoc) {
        branchStockLoc.quantity += quantityToAdd;
        await branchStockLoc.save();
    } else {
        branchStockLoc = new BranchStockLocation({
            branch: branchId,
            product: productId,
            variantId: variantId,
            location: locationId,
            quantity: quantityToAdd
        });
        await branchStockLoc.save();
    }

    const branchLocation = await BranchLocation.findById(locationId);
    if (branchLocation) {
        branchLocation.currentOccupancy += quantityToAdd;
        await branchLocation.save();
    }

    // Sync total cache
    await syncBranchStock(branchId, productId, variantId);
};


module.exports = {
    checkStorageCompatibility,
    checkCapacity,
    getDefaultBackroomLocation,
    deductStockFromLocations,
    addStockToLocation,
    syncBranchStock
};