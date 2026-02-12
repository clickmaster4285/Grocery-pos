const StockTransfer = require('../models/stockTransfer.model');
const BranchStock = require('../models/branchStock.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

// Create a new stock transfer
exports.createTransfer = async (req, res) => {
    try {
        const { fromLocation, toLocation, items, notes } = req.body;
        const transferredBy = req.user._id;

        // items: [{ product, variantId, quantity }]
        
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Product ${item.product} not found`);

            const variant = product.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found`);

            if (fromLocation === 'WAREHOUSE') {
                // Check if warehouse has enough stock
                if (variant.stock < item.quantity) {
                    throw new Error(`Insufficient stock in Warehouse for ${product.productName} (${variant.sku || 'Variant'})`);
                }

                // Deduct from Warehouse
                variant.stock -= item.quantity;
                variant.stockHistory.push({
                    change: -item.quantity,
                    type: 'TRANSFER_OUT',
                    reason: `Transfer to branch ${toLocation}`,
                    performedBy: transferredBy
                });
                await product.save();

            } else {
                // Deduct from another Branch
                const sourceBranchStock = await BranchStock.findOne({
                    branch: fromLocation,
                    product: item.product,
                    variantId: item.variantId
                });

                if (!sourceBranchStock || sourceBranchStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock in source branch for ${product.productName}`);
                }

                sourceBranchStock.quantity -= item.quantity;
                await sourceBranchStock.save();
            }

            // Add to Destination Branch
            let destBranchStock = await BranchStock.findOne({
                branch: toLocation,
                product: item.product,
                variantId: item.variantId
            });

            if (destBranchStock) {
                destBranchStock.quantity += item.quantity;
                destBranchStock.lastUpdated = Date.now();
                await destBranchStock.save();
            } else {
                destBranchStock = new BranchStock({
                    branch: toLocation,
                    product: item.product,
                    variantId: item.variantId,
                    quantity: item.quantity
                });
                await destBranchStock.save();
            }
        }

        // Record the transfer
        const transfer = new StockTransfer({
            fromLocation,
            toLocation,
            items,
            notes,
            transferredBy,
            status: 'COMPLETED'
        });
        await transfer.save();

        res.status(201).json({ success: true, data: transfer });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all transfers
exports.getTransfers = async (req, res) => {
    try {
        const transfers = await StockTransfer.find()
            .populate('toLocation', 'branch_name')
            .populate('transferredBy', 'firstName lastName')
            .populate('items.product', 'productName')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: transfers });
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

        let query = { branch: branchId };
        
        let stock = await BranchStock.find(query)
            .populate({
                path: 'product',
                select: 'productName category brand variants',
                match: {
                    $or: [
                        { productName: { $regex: search, $options: 'i' } },
                        { 'variants.sku': { $regex: search, $options: 'i' } }
                    ]
                }
            })
            .populate('branch', 'branch_name');
        
        // Filter out items where the product didn't match the search criteria
        stock = stock.filter(item => item.product !== null);
        
        res.status(200).json({ success: true, data: stock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
