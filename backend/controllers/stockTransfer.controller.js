const StockTransfer = require('../models/stockTransfer.model');
const BranchStock = require('../models/branchStock.model');
const BranchStockLocation = require('../models/branchStockLocation.model'); // Added
const BranchLocation = require('../models/branchLocation.model'); // Added
const Branch = require('../models/branch.model'); // Added
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const Fuse = require('fuse.js');

// Helper function to check storage compatibility
const checkStorageCompatibility = (productStorageReq, locationType) => {
    // Define compatible location types for each storage requirement
    const compatibilityMap = {
        'AMBIENT': ['AISLE', 'RACK', 'SHELF', 'GONDOLA', 'DISPLAY', 'BACKROOM'],
        'REFRIGERATED': ['REFRIGERATOR', 'DISPLAY', 'BACKROOM'],
        'FROZEN': ['FREEZER', 'BACKROOM']
    };

    if (!compatibilityMap[productStorageReq].includes(locationType)) {
        throw new Error(`Incompatible storage: Product requires ${productStorageReq} but location is ${locationType}.`);
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
        throw new Error(`Capacity exceeded: Location ${location.name} (${location.currentOccupancy}/${location.capacity}) cannot accommodate ${newQuantity} more items.`);
    }
    return location;
};

// Create a new stock transfer
// Create a new stock transfer
exports.createTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { transferType, fromLocation, toLocation, items, notes } = req.body;
        const transferredBy = req.user._id;
        const branchId = req.user.branch_id; // Assuming user making internal transfer is from that branch

        let fromLocObj, toLocObj;
        if (transferType === 'INTERNAL') {
            if (!branchId) {
                throw new Error('Branch ID is required for internal transfers.');
            }
            // Validate internal locations
            fromLocObj = await BranchLocation.findById(fromLocation).session(session);
            toLocObj = await BranchLocation.findById(toLocation).session(session);

            if (!fromLocObj || !toLocObj) {
                throw new Error('Invalid source or destination physical location for internal transfer.');
            }
            if (!fromLocObj.branch.equals(branchId) || !toLocObj.branch.equals(branchId)) {
                throw new Error('Internal transfer locations must belong to the user\'s branch.');
            }
            if (fromLocObj._id.equals(toLocObj._id)) {
                throw new Error('Source and destination locations cannot be the same for internal transfer.');
            }
        }

        const transferItems = [];

        for (const item of items) {
            const productDoc = await Product.findById(item.product).session(session);
            if (!productDoc) throw new Error(`Product ${item.product} not found.`);

            const variant = productDoc.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${productDoc.productName}.`);
            
            // Validate storage compatibility for internal transfers
            if (transferType === 'INTERNAL') {
                checkStorageCompatibility(productDoc.storageRequirement, toLocObj.type);
                // Capacity check is now inside addStockToLocation
            }

            // Deduct stock from source
            if (transferType === 'EXTERNAL') {
                if (fromLocation === 'WAREHOUSE') {
                    if (variant.stock < item.quantity) {
                        throw new Error(`Insufficient stock in Warehouse for ${productDoc.productName} (${variant.sku || 'Variant'}).`);
                    }
                    variant.stock -= item.quantity;
                    variant.stockHistory.push({
                        change: -item.quantity,
                        type: 'TRANSFER_OUT',
                        reason: `External transfer to branch ${toLocation}`,
                        performedBy: transferredBy
                    });
                    await productDoc.save({ session });
                } else { // From another branch (deduct from its default backroom)
                    // The deductStockFromLocations function already handles finding the right stock location
                    // For external transfers, we assume deduction happens from the default backroom of the source branch.
                    await deductStockFromLocations(fromLocation, item.product, item.variantId, item.quantity, session);
                }

                // Add stock to destination (External) - always to the default backroom of the destination branch
                const destBranchDefaultBackroom = await getDefaultBackroomLocation(toLocation, session);
                await addStockToLocation(toLocation, item.product, item.variantId, destBranchDefaultBackroom._id, item.quantity, session);

            } else if (transferType === 'INTERNAL') {
                // Deduct from source internal location
                await deductStockFromLocations(branchId, item.product, item.variantId, item.quantity, session);
                
                // Add to destination internal location (capacity and storage check done above)
                await addStockToLocation(branchId, item.product, item.variantId, toLocObj._id, item.quantity, session);
            }
            transferItems.push({ product: item.product, variantId: item.variantId, quantity: item.quantity });
        }

        // Record the transfer
        const transfer = new StockTransfer({
            transferType,
            fromLocation: transferType === 'EXTERNAL' ? fromLocation : fromLocObj._id,
            toLocation: transferType === 'EXTERNAL' ? toLocation : toLocObj._id,
            branch: transferType === 'INTERNAL' ? branchId : undefined, // For internal transfers, record the branch
            items: transferItems,
            notes,
            transferredBy,
            status: 'COMPLETED'
        });
        await transfer.save({ session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: transfer });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Get all transfers
exports.getTransfers = async (req, res) => {
    try {
        const transfers = await StockTransfer.find()
            .populate('branch', 'branch_name') // Populate for INTERNAL transfers
            .populate('transferredBy', 'firstName lastName')
            .populate('items.product', 'productName');

        const populatedTransfers = await Promise.all(transfers.map(async (transfer) => {
            let fromLocationName = transfer.fromLocation;
            let toLocationName = transfer.toLocation;

            if (transfer.transferType === 'EXTERNAL') {
                if (transfer.fromLocation !== 'WAREHOUSE' && mongoose.Types.ObjectId.isValid(transfer.fromLocation)) {
                    const fromBranch = await Branch.findById(transfer.fromLocation).select('branch_name');
                    fromLocationName = fromBranch ? fromBranch.branch_name : 'Unknown Branch';
                }
                if (mongoose.Types.ObjectId.isValid(transfer.toLocation)) {
                    const toBranch = await Branch.findById(transfer.toLocation).select('branch_name');
                    toLocationName = toBranch ? toBranch.branch_name : 'Unknown Branch';
                }
            } else if (transfer.transferType === 'INTERNAL') {
                if (mongoose.Types.ObjectId.isValid(transfer.fromLocation)) {
                    const fromLoc = await BranchLocation.findById(transfer.fromLocation).select('name');
                    fromLocationName = fromLoc ? fromLoc.name : 'Unknown Location';
                }
                if (mongoose.Types.ObjectId.isValid(transfer.toLocation)) {
                    const toLoc = await BranchLocation.findById(transfer.toLocation).select('name');
                    toLocationName = toLoc ? toLoc.name : 'Unknown Location';
                }
            }

            return {
                ...transfer.toObject(),
                fromLocationDisplay: fromLocationName,
                toLocationDisplay: toLocationName,
            };
        }));
        
        res.status(200).json({ success: true, data: populatedTransfers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get stock for a specific branch
exports.getBranchStock = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { search } = req.query;
        
        // Return empty if no search term is provided (to keep catalog empty initially)
        if (!search || search.trim() === '') {
            return res.status(200).json({ success: true, data: [] });
        }

        const searchTerms = search.trim().split(/\s+/);
        // Create a regex that ensures all search terms are present (order-independent)
        const smartRegex = new RegExp(searchTerms.map(term => `(?=.*${term})`).join(''), 'i');

        let query = { branch: branchId };
        
        // First, attempt a high-performance DB search using regex
        let stock = await BranchStock.find(query)
            .populate({
                path: 'product',
                select: 'productName category brand variants',
                match: {
                    $or: [
                        { productName: { $regex: smartRegex } },
                        { 'variants.sku': { $regex: smartRegex } }
                    ]
                }
            })
            .populate('branch', 'branch_name');
        
        // Filter out items where the product didn't match the regex criteria
        let finalResults = stock.filter(item => item.product !== null);

        // If no results found with regex, use Fuse.js for fuzzy matching
        if (finalResults.length === 0) {
            // Fetch all stock for this branch to perform fuzzy search in memory
            const allStock = await BranchStock.find(query)
                .populate('product', 'productName variants')
                .populate('branch', 'branch_name');
            
            // Prepare data for Fuse - flatten nested fields for searching
            const searchData = allStock.map(item => {
                const variant = item.product?.variants.find(v => v._id.toString() === item.variantId.toString());
                return {
                    ...item.toObject(),
                    searchableName: item.product?.productName || '',
                    searchableSku: variant?.sku || ''
                };
            });

            const fuse = new Fuse(searchData, {
                keys: ['searchableName', 'searchableSku'],
                threshold: 0.3, // 0.0 is perfect match, 1.0 matches everything
                distance: 100
            });

            const fuseResults = fuse.search(search);
            finalResults = fuseResults.map(result => result.item);
        }
        
        res.status(200).json({ success: true, data: finalResults });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
