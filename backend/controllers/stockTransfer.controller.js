const StockTransfer = require('../models/stockTransfer.model');
const BranchStock = require('../models/branchStock.model');
const BranchStockLocation = require('../models/branchStockLocation.model');
const BranchLocation = require('../models/branchLocation.model');
const Branch = require('../models/branch.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const {
    checkStorageCompatibility,
    checkCapacity,
    getDefaultBackroomLocation,
    deductStockFromLocations,
    addStockToLocation
} = require('../utils/inventory.utils');

// Create a new stock transfer
exports.createTransfer = async (req, res) => {
    try {
        const { transferType, fromLocation, toLocation, items, notes } = req.body;
        const transferredBy = req.user._id;
        const branchId = req.user.branch;

        let fromLocObj, toLocObj;
        let destBranchDefaultBackroom;

        if (transferType === 'INTERNAL') {
            if (!branchId) {
                throw new Error('Branch ID is required for internal transfers.');
            }
            fromLocObj = await BranchLocation.findById(fromLocation);
            toLocObj = await BranchLocation.findById(toLocation);

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

        if (transferType === 'EXTERNAL') {
            // Pre-fetch destination default backroom and check its existence
            destBranchDefaultBackroom = await getDefaultBackroomLocation(toLocation);
        }

        // PRE-VALIDATION & DATA PREPARATION
        const productDocsMap = new Map(); // To group saves and avoid ParallelSaveError
        const preparedItems = [];

        for (const item of items) {
            const productId = item.productId || item.product;
            if (!productId) throw new Error('Product ID is required for transfer items.');

            // Reuse product docs to avoid version conflicts and multiple saves
            let productDoc = productDocsMap.get(productId);
            if (!productDoc) {
                productDoc = await Product.findById(productId);
                if (!productDoc) throw new Error(`Product not found with ID: ${productId}`);
                productDocsMap.set(productId, productDoc);
            }

            const variant = productDoc.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${productDoc.productName}.`);

            // Check stock availability
            if (transferType === 'EXTERNAL') {
                if (fromLocation === 'WAREHOUSE') {
                    if (variant.stock < item.quantity) {
                        throw new Error(`Insufficient stock in Warehouse for ${productDoc.productName} (${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`);
                    }
                } else {
                    // Branch to Branch / Warehouse: Check source branch's total availability
                    const branchStock = await BranchStock.findOne({ branch: fromLocation, product: productId, variantId: item.variantId });
                    if (!branchStock || branchStock.quantity < item.quantity) {
                        throw new Error(`Insufficient total stock in source branch for ${productDoc.productName} (${variant.sku}). Available: ${branchStock?.quantity || 0}, Requested: ${item.quantity}`);
                    }
                }

                // Check capacity at destination
                if (destBranchDefaultBackroom) {
                    await checkCapacity(destBranchDefaultBackroom._id, item.quantity);
                }

            } else if (transferType === 'INTERNAL') {
                // Strict check: Availability at the SPECIFIC source location (e.g., Storeroom)
                const sourceStockLocation = await BranchStockLocation.findOne({ 
                    branch: branchId, 
                    product: productId, 
                    variantId: item.variantId, 
                    location: fromLocation 
                });

                if (!sourceStockLocation || sourceStockLocation.quantity < item.quantity) {
                    throw new Error(`Insufficient stock in source location "${fromLocObj.name}" for ${productDoc.productName}. Available: ${sourceStockLocation?.quantity || 0}, Requested: ${item.quantity}`);
                }

                // Check storage compatibility and capacity
                checkStorageCompatibility(productDoc.storageRequirement, toLocObj.type);
                await checkCapacity(toLocObj._id, item.quantity);
            }

            preparedItems.push({
                productDoc,
                variantId: item.variantId,
                quantity: item.quantity,
                productId
            });
        }

        // MUTATION PASS
        const transferItems = [];
        for (const preparedItem of preparedItems) {
            const { productDoc, variantId, quantity, productId } = preparedItem;
            const variant = productDoc.variants.id(variantId);

            if (transferType === 'EXTERNAL') {
                if (fromLocation === 'WAREHOUSE') {
                    variant.stock -= quantity;
                    variant.stockHistory.push({
                        change: -quantity,
                        type: 'TRANSFER_OUT',
                        reason: `External transfer to branch ${toLocation}`,
                        performedBy: transferredBy
                    });
                    // Note: Doc is saved at the end of the logic to handle multi-variant updates safely
                } else {
                    await deductStockFromLocations(fromLocation, productId, variantId, quantity);
                }

                // Add to destination branch's default backroom
                await addStockToLocation(toLocation, productId, variantId, destBranchDefaultBackroom._id, quantity);

            } else if (transferType === 'INTERNAL') {
                // Deduct from SPECIFIC source location and add to specific target location
                await deductStockFromLocations(branchId, productId, variantId, quantity, null, fromLocation);
                await addStockToLocation(branchId, productId, variantId, toLocObj._id, quantity);
            }

            transferItems.push({ product: productId, variantId, quantity });
        }

        // Finalize all product document changes (Warehouse stock reductions)
        for (const doc of productDocsMap.values()) {
            await doc.save();
        }

        // Record the transfer
        const transfer = new StockTransfer({
            transferType,
            fromLocation: transferType === 'EXTERNAL' ? fromLocation : fromLocObj._id,
            toLocation: transferType === 'EXTERNAL' ? toLocation : toLocObj._id,
            branch: transferType === 'INTERNAL' ? branchId : undefined,
            items: transferItems,
            notes,
            transferredBy,
            status: 'COMPLETED'
        });
        await transfer.save();

        res.status(201).json({ success: true, data: transfer });

    } catch (error) {
        console.error('Stock Transfer Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all transfers with role-based filtering
exports.getTransfers = async (req, res) => {
    try {
        const { role, branch } = req.user;
        const isAdmin = role === 'admin';

        let query = {};

        if (isAdmin) {
            // Admins see all EXTERNAL transfers (Warehouse -> Branch, Branch -> Branch)
            query = { transferType: 'EXTERNAL' };
        } else {
            // Staff see only INTERNAL transfers within their own branch
            if (!branch) {
                return res.status(200).json({ success: true, data: [] });
            }
            query = {
                transferType: 'INTERNAL',
                branch: branch
            };
        }

        const transfers = await StockTransfer.find(query)
            .populate('branch', 'branch_name')
            .populate('transferredBy', 'firstName lastName')
            .populate('items.product', 'productName')
            .sort({ createdAt: -1 });

        const populatedTransfers = await Promise.all(transfers.map(async (transfer) => {
            let fromLocationDisplay = transfer.fromLocation;
            let toLocationDisplay = transfer.toLocation;

            // Handle fromLocation display
            if (transfer.fromLocation === 'WAREHOUSE') {
                fromLocationDisplay = 'Main Warehouse';
            } else if (mongoose.Types.ObjectId.isValid(transfer.fromLocation)) {
                if (transfer.transferType === 'EXTERNAL') {
                    const fromBranch = await Branch.findById(transfer.fromLocation).select('branch_name');
                    fromLocationDisplay = fromBranch ? fromBranch.branch_name : 'Unknown Branch';
                } else {
                    const fromLoc = await BranchLocation.findById(transfer.fromLocation).select('name');
                    fromLocationDisplay = fromLoc ? fromLoc.name : 'Unknown Location';
                }
            }

            // Handle toLocation display
            if (mongoose.Types.ObjectId.isValid(transfer.toLocation)) {
                if (transfer.transferType === 'EXTERNAL') {
                    const toBranch = await Branch.findById(transfer.toLocation).select('branch_name');
                    toLocationDisplay = toBranch ? toBranch.branch_name : 'Unknown Branch';
                } else {
                    const toLoc = await BranchLocation.findById(transfer.toLocation).select('name');
                    toLocationDisplay = toLoc ? toLoc.name : 'Unknown Location';
                }
            }

            return {
                ...transfer.toObject(),
                fromLocationDisplay,
                toLocationDisplay,
            };
        }));

        res.status(200).json({ success: true, data: populatedTransfers });
    } catch (error) {
        console.error('Get Transfers Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

        // Get stock for a specific branch
exports.getBranchStock = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { search } = req.query;
        const DiscountPromotion = require('../models/discount.model');

        if (!branchId || branchId === 'undefined' || !mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(200).json({ success: true, data: [] });
        }

        const searchTerms = (search || '').trim().split(/\s+/).filter(t => t !== '');
        let query = { branch: branchId };

        // Fetch active auto-apply discounts
        const now = new Date();
        const activeAutoDiscounts = await DiscountPromotion.find({
            status: 'active',
            autoApply: true,
            startDate: { $lte: now },
            $or: [{ endDate: { $exists: false } }, { endDate: { $gt: now } }],
            $or: [{ isGlobal: true }, { applicableBranches: branchId }]
        });

        // 1. Fetch Aggregated Stock
        let stock;
        const productSelect = 'productName category brand variants taxRate';
        
        if (searchTerms.length > 0) {
            const smartRegex = new RegExp(searchTerms.map(term => `(?=.*${term})`).join(''), 'i');
            stock = await BranchStock.find(query)
                .populate({
                    path: 'product',
                    select: productSelect,
                    match: {
                        $or: [
                            { productName: { $regex: smartRegex } },
                            { 'variants.sku': { $regex: smartRegex } }
                        ]
                    }
                })
                .populate('branch', 'branch_name');
        } else {
            stock = await BranchStock.find(query)
                .populate('product', select = productSelect)
                .populate('branch', 'branch_name');
        }

        let filteredStock = stock.filter(item => item.product !== null);

        // 2. Fallback to Fuzzy Search (skipped for brevity, but kept in logic)
        if (searchTerms.length > 0 && filteredStock.length === 0) {
             const allStock = await BranchStock.find(query)
                .populate('product', 'productName variants taxRate')
                .populate('branch', 'branch_name');

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
                threshold: 0.3,
                distance: 100
            });

            const fuseResults = fuse.search(search);
            filteredStock = fuseResults.map(result => result.item);
        }

        // 3. Re-hydrate and Attach Discounts
        const finalResults = await Promise.all(filteredStock.map(async (item) => {
            const itemObj = item.toObject ? item.toObject() : item;
            const product = item.product;
            const variantId = item.variantId.toString();

            // Find applicable discount
            const applicablePromo = activeAutoDiscounts.find(promo => 
                promo.qualifyingProducts.includes(product._id) || 
                promo.qualifyingVariants.includes(variantId) ||
                promo.qualifyingCategories.includes(product.category) ||
                promo.qualifyingBrands.includes(product.brand)
            );

            if (applicablePromo && applicablePromo.amountType === 'Percentage') {
                itemObj.autoDiscountPercent = applicablePromo.amountValue;
                itemObj.promotionName = applicablePromo.name;
            } else {
                itemObj.autoDiscountPercent = 0;
            }

            // Locations logic (kept from original)
            const locations = await BranchStockLocation.find({
                branch: branchId,
                product: item.product._id,
                variantId: item.variantId,
                quantity: { $gt: 0 }
            }).populate('location', 'name type');

            // Define location type priority for sorting
            const LOCATION_TYPE_PRIORITY = ['SALES_FLOOR', 'AISLE', 'SHELF', 'REFRIGERATOR', 'FREEZER', 'BACKROOM', 'STORAGE'];
            const getLocationTypePriority = (type) => {
                const index = LOCATION_TYPE_PRIORITY.indexOf(type);
                return index === -1 ? LOCATION_TYPE_PRIORITY.length : index;
            };

            locations.sort((a, b) => {
                const priorityA = getLocationTypePriority(a.location.type);
                const priorityB = getLocationTypePriority(b.location.type);
                if (priorityA === priorityB) return new Date(a.updatedAt) - new Date(b.updatedAt);
                return priorityA - priorityB;
            });

            itemObj.locationDisplay = locations.length > 0 ? locations.map(l => l.location.name).join(', ') : 'NAN';
            itemObj.locations = locations.map(l => ({
                locationId: l.location._id,
                name: l.location.name,
                type: l.location.type,
                quantity: l.quantity
            }));

            return itemObj;
        }));

        res.status(200).json({ success: true, data: finalResults });
    } catch (error) {
        console.error('Get Branch Stock Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
