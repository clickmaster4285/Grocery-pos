const mongoose = require('mongoose');
const BranchLocation = require('../models/branchLocation.model');
const Product = require('../models/product.model');
const BranchStockLocation = require('../models/branchStockLocation.model');

// Helper function to check storage compatibility
const checkStorageCompatibility = (productStorageReq, locationType) => {
    // Define compatible location types for each storage requirement
    const compatibilityMap = {
        'AMBIENT': ['AISLE', 'RACK', 'SHELF', 'GONDOLA', 'DISPLAY', 'BACKROOM'],
        'REFRIGERATED': ['REFRIGERATOR', 'DISPLAY', 'BACKROOM'],
        'FROZEN': ['FREEZER', 'BACKROOM']
    };

    if (!productStorageReq || !locationType) {
        // If either is undefined, assume no strict requirement or default compatibility
        return true;
    }

    if (!compatibilityMap[productStorageReq] || !compatibilityMap[productStorageReq].includes(locationType)) {
        throw new Error(`Incompatible storage: Product requires ${productStorageReq} but location type is ${locationType}.`);
    }
    return true;
};

// Helper function to check if a location has enough capacity for new items
const checkCapacity = async (locationId, newQuantity, session) => {
    const location = await BranchLocation.findById(locationId).session(session);
    if (!location) {
        throw new Error(`Destination location ${locationId} not found.`);
    }

    // Capacity of 0 or less means unlimited
    if (location.capacity > 0 && (location.currentOccupancy + newQuantity > location.capacity)) {
        throw new Error(`Capacity exceeded: Location "${location.name}" (${location.currentOccupancy}/${location.capacity}) cannot accommodate ${newQuantity} more items.`);
    }
    return location;
};

// Helper function to find the default backroom for a branch
const getDefaultBackroomLocation = async (branchId, session) => {
    const defaultBackroom = await BranchLocation.findOne({ branch: branchId, type: 'BACKROOM' }).session(session);
    if (!defaultBackroom) {
        throw new Error(`Default Backroom not found for branch ${branchId}. Please ensure it's initialized.`);
    }
    return defaultBackroom;
};

// Helper function to deduct stock from BranchStockLocation based on FIFO/Sales Floor priority
const deductStockFromLocations = async (branchId, productId, variantId, quantityToDeduct, session) => {
    const stockLocations = await BranchStockLocation.find({
        branch: branchId,
        product: productId,
        variantId: variantId,
        quantity: { $gt: 0 }
    })
    .populate('location')
    .sort({ 'location.type': 1, 'updatedAt': 1 }) // Prioritize sales floor types (e.g., AISLE < BACKROOM) and then FIFO
    .session(session);

    let remainingQuantityToDeduct = quantityToDeduct;
    let currentTotalStock = stockLocations.reduce((sum, loc) => sum + loc.quantity, 0);

    if (currentTotalStock < quantityToDeduct) {
        throw new Error(`Insufficient total stock in branch for variant ${variantId}. Requested: ${quantityToDeduct}, Available: ${currentTotalStock}`);
    }

    for (const stockLocation of stockLocations) {
        if (remainingQuantityToDeduct <= 0) break;

        const deductedQty = Math.min(remainingQuantityToDeduct, stockLocation.quantity);
        stockLocation.quantity -= deductedQty;
        remainingQuantityToDeduct -= deductedQty;
        
        await stockLocation.save({ session });

        // Update currentOccupancy of the BranchLocation
        const branchLocation = await BranchLocation.findById(stockLocation.location._id).session(session);
        if (branchLocation) {
            branchLocation.currentOccupancy -= deductedQty;
            await branchLocation.save({ session });
        }
    }
};

// Helper function to add stock to a specific BranchStockLocation
const addStockToLocation = async (branchId, productId, variantId, locationId, quantityToAdd, session) => {
    // Check capacity before adding
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
    // Update currentOccupancy of the BranchLocation
    const branchLocation = await BranchLocation.findById(locationId).session(session);
    if (branchLocation) {
        branchLocation.currentOccupancy += quantityToAdd;
        await branchLocation.save({ session });
    }
};


module.exports = {
    checkStorageCompatibility,
    checkCapacity,
    getDefaultBackroomLocation,
    deductStockFromLocations,
    addStockToLocation,
};