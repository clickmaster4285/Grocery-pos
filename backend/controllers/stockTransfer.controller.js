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
    getDefaultBackroomLocation, 
    deductStockFromLocations, 
    addStockToLocation 
} = require('../utils/inventory.utils');

// Create a new stock transfer
exports.createTransfer = async (req, res) => {
    try {
        const { transferType, fromLocation, toLocation, items, notes } = req.body;
        const transferredBy = req.user._id;
        const branchId = req.user.branch_id; 

        let fromLocObj, toLocObj;
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

        const transferItems = [];

        for (const item of items) {
            const productId = item.productId || item.product; 
            if (!productId) throw new Error('Product ID is required for transfer items.');

            const productDoc = await Product.findById(productId);
            if (!productDoc) throw new Error(`Product ${productId} not found.`);

            const variant = productDoc.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${productDoc.productName}.`);
            
            if (transferType === 'INTERNAL') {
                checkStorageCompatibility(productDoc.storageRequirement, toLocObj.type);
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
                    await productDoc.save();
                } else { // From another branch
                    await deductStockFromLocations(fromLocation, productId, item.variantId, item.quantity);
                }

                // Add stock to destination
                const destBranchDefaultBackroom = await getDefaultBackroomLocation(toLocation);
                await addStockToLocation(toLocation, productId, item.variantId, destBranchDefaultBackroom._id, item.quantity);

            } else if (transferType === 'INTERNAL') {
                await deductStockFromLocations(branchId, productId, item.variantId, item.quantity);
                await addStockToLocation(branchId, productId, item.variantId, toLocObj._id, item.quantity);
            }
            transferItems.push({ product: productId, variantId: item.variantId, quantity: item.quantity });
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
        const { role, branch_id } = req.user;
        const isAdmin = role === 'admin';
        
        let query = {};
        
        if (isAdmin) {
            // Admins see all EXTERNAL transfers (Warehouse -> Branch, Branch -> Branch)
            query = { transferType: 'EXTERNAL' };
        } else {
            // Staff see only INTERNAL transfers within their own branch
            if (!branch_id) {
                return res.status(200).json({ success: true, data: [] });
            }
            query = { 
                transferType: 'INTERNAL',
                branch: branch_id 
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
        
        if (!branchId || branchId === 'undefined' || !mongoose.Types.ObjectId.isValid(branchId)) {
             return res.status(200).json({ success: true, data: [] });
        }

        const searchTerms = (search || '').trim().split(/\s+/).filter(t => t !== '');
        let query = { branch: branchId };
        
        let stock;
        if (searchTerms.length > 0) {
            const smartRegex = new RegExp(searchTerms.map(term => `(?=.*${term})`).join(''), 'i');
            stock = await BranchStock.find(query)
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
        } else {
            stock = await BranchStock.find(query)
                .populate('product', 'productName category brand variants')
                .populate('branch', 'branch_name');
        }
        
        let finalResults = stock.filter(item => item.product !== null);

        if (searchTerms.length > 0 && finalResults.length === 0) {
            const allStock = await BranchStock.find(query)
                .populate('product', 'productName variants')
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
            finalResults = fuseResults.map(result => result.item);
        }
        
        res.status(200).json({ success: true, data: finalResults });
    } catch (error) {
        console.error('Get Branch Stock Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
