const SaleReturn = require('../models/saleReturn.model');
const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const BranchStockLocation = require('../models/branchStockLocation.model');
const BranchLocation = require('../models/branchLocation.model');
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');
const DiscountPromotion = require('../models/discount.model');
const mongoose = require('mongoose');
const { addStockToLocation, deductStockFromLocations, getDefaultBackroomLocation } = require('../utils/inventory.utils');

// Helper to generate Return Number: RTN-YYYYMMDD-[BASE36]
const generateReturnNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await Counter.findOneAndUpdate(
        { id: 'sale_return' },
        [{ $set: { 
            seq: { $cond: { if: { $eq: ["$lastDate", dateStr] }, then: { $add: ["$seq", 1] }, else: 1 } },
            lastDate: dateStr 
        }}],
        { upsert: true, new: true }
    );
    const serial = counter.seq.toString(36).toUpperCase().padStart(4, '0');
    return `RTN-${dateStr}-${serial}`;
};

exports.processReturn = async (req, res) => {
    try {
        const { saleId, type, returnedItems, exchangedItems } = req.body;
        const userId = req.user._id;

        if (!returnedItems || returnedItems.length === 0) {
            throw new Error('No items selected for return');
        }

        // 1. Fetch Original Sale
        const originalSale = await Sale.findById(saleId);
        if (!originalSale) throw new Error('Original sale not found');

        const returnNumber = await generateReturnNumber();
        let totalRefundValue = 0; // Credit from items handed back (Price paid + Tax)

        const branchDefaultBackroom = await getDefaultBackroomLocation(originalSale.branch);

        // 2. Process Returned Items (Credit Calculation)
        const cleanedReturnedItems = [];
        for (const item of returnedItems) {
            const productId = item.product?._id || item.product;
            const variantId = item.variantId?._id || item.variantId;

            if (!productId || !variantId) throw new Error('Invalid product or variant ID in return list');

            const originalItem = originalSale.items.find(
                i => i.product.toString() === productId.toString() && i.variantId.toString() === variantId.toString()
            );

            if (!originalItem) throw new Error(`Item ${item.productName || productId} was not part of the original sale`);
            
            // Calculate credit: What the customer actually paid (unitPrice) + the tax on that paid amount
            const itemCredit = (originalItem.unitPrice * item.quantity);
            const itemTaxCredit = (itemCredit * (originalItem.taxRate || 0)) / 100;
            
            totalRefundValue += (itemCredit + itemTaxCredit);

            if (item.condition === 'GOOD') {
                await addStockToLocation(originalSale.branch, productId, variantId, branchDefaultBackroom._id, item.quantity);
            }

            cleanedReturnedItems.push({
                product: productId,
                variantId: variantId,
                productName: item.productName || originalItem.productName,
                sku: item.sku || originalItem.sku,
                quantity: item.quantity,
                unitPrice: originalItem.unitPrice,
                condition: item.condition || 'GOOD',
                reason: item.reason || ''
            });
        }

        // 3. Process Exchanged Items (New Debt Calculation)
        const processedExchanges = [];
        let totalNewItemsValue = 0;

        if (type === 'EXCHANGE' && exchangedItems && exchangedItems.length > 0) {
            const now = new Date();
            const activeAutoDiscounts = await DiscountPromotion.find({
                status: 'active',
                autoApply: true,
                startDate: { $lte: now },
                $or: [{ endDate: { $exists: false } }, { endDate: { $gt: now } }],
                $or: [{ isGlobal: true }, { applicableBranches: originalSale.branch }]
            });

            for (const item of exchangedItems) {
                const product = await Product.findById(item.product);
                if (!product) throw new Error(`Product ${item.product} not found.`);

                const variant = product.variants.id(item.variantId);
                if (!variant) throw new Error(`Variant ${item.variantId} not found.`);

                const originalUnitPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
                
                // Calculate Auto Discount for new item
                let autoDiscountPercent = 0;
                const promo = activeAutoDiscounts.find(p => 
                    p.qualifyingProducts.includes(product._id) || 
                    p.qualifyingVariants.includes(item.variantId.toString()) ||
                    p.qualifyingCategories.includes(product.category) ||
                    p.qualifyingBrands.includes(product.brand)
                );
                if (promo && promo.amountType === 'Percentage') autoDiscountPercent = promo.amountValue;

                const discountAmount = (originalUnitPrice * autoDiscountPercent) / 100;
                const unitPrice = originalUnitPrice - discountAmount;
                const subtotal = unitPrice * item.quantity;
                const taxAmount = (subtotal * (product.taxRate || 0)) / 100;
                const lineTotal = subtotal + taxAmount;

                await deductStockFromLocations(originalSale.branch, item.product, item.variantId, item.quantity);

                totalNewItemsValue += lineTotal;
                processedExchanges.push({
                    product: item.product,
                    variantId: item.variantId,
                    productName: product.productName,
                    sku: variant.sku,
                    quantity: item.quantity,
                    originalUnitPrice,
                    discountPercent: autoDiscountPercent,
                    discountAmount: discountAmount * item.quantity,
                    unitPrice,
                    taxRate: product.taxRate || 0,
                    taxAmount,
                    subtotal
                });
            }

            // 4. Exchange Validation: New Value >= Return Credit
            if (totalNewItemsValue < totalRefundValue) {
                throw new Error(`The value of replacement items (${totalNewItemsValue.toFixed(2)}) must be greater than or equal to the return credit (${totalRefundValue.toFixed(2)}).`);
            }
        }

        // 5. Create Return Record
        const saleReturn = new SaleReturn({
            returnNumber,
            originalSale: saleId,
            branch: originalSale.branch,
            type,
            returnedItems: cleanedReturnedItems,
            exchangedItems: processedExchanges,
            totalRefundAmount: type === 'RETURN' ? totalRefundValue : 0,
            totalExchangeDifference: type === 'EXCHANGE' ? (totalNewItemsValue - totalRefundValue) : 0,
            performedBy: userId
        });

        await saleReturn.save();

        res.status(201).json({ success: true, data: saleReturn });

    } catch (error) {
        console.error('Process Return Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET COMPLETE HISTORY OF A BILL
exports.getSaleHistory = async (req, res) => {
    try {
        const { saleId } = req.params;
        
        const query = { _id: saleId };
        // Apply branch filter from middleware
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        // 1. Fetch original sale
        const sale = await Sale.findOne(query)
            .populate('branch', 'branch_name')
            .populate('cashier', 'firstName lastName')
            .populate('customer', 'firstName lastName phonePrimary customerGroup email') // Added customer populate
            .populate('items.product', 'productName');

        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found or access denied' });

        // 2. Fetch all returns/exchanges for this sale
        const activityLog = await SaleReturn.find({ originalSale: saleId })
            .populate('performedBy', 'firstName lastName')
            .sort({ createdAt: 1 });

        // 3. CALCULATE REMAINING RETURNABLE QUANTITIES
        const returnedCounts = {};
        activityLog.forEach(activity => {
            activity.returnedItems.forEach(item => {
                const key = item.variantId.toString();
                returnedCounts[key] = (returnedCounts[key] || 0) + item.quantity;
            });
        });

        // 4. Attach 'remainingQty' to each item in the original sale
        const itemsWithBalance = sale.items.map(item => {
            const itemObj = item.toObject();
            const alreadyReturned = returnedCounts[item.variantId.toString()] || 0;
            itemObj.remainingQty = Math.max(0, item.quantity - alreadyReturned);
            return itemObj;
        });

        res.status(200).json({
            success: true,
            data: {
                originalSale: { ...sale.toObject(), items: itemsWithBalance },
                activityLog,
                summary: {
                    totalOriginal: sale.finalAmount,
                    totalRefunded: activityLog.reduce((acc, act) => acc + (act.totalRefundAmount || 0), 0),
                    isFullyReturned: itemsWithBalance.every(i => i.remainingQty === 0)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET ALL RETURNS
exports.getAllReturns = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let query = {};

        // Use branch filter from middleware (req.query.branch)
        if (req.query.branch) {
            query.branch = req.query.branch;
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Branch context missing.' });
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            query.returnNumber = { $regex: search, $options: 'i' };
        }

        const [returns, stats] = await Promise.all([
            SaleReturn.find(query)
                .populate('originalSale', 'billNumber')
                .populate('branch', 'branch_name')
                .populate('performedBy', 'firstName lastName')
                .sort({ createdAt: -1 }),
            
            SaleReturn.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalRefunded: { $sum: "$totalRefundAmount" },
                        exchangeBalance: { $sum: "$totalExchangeDifference" },
                        inventoryRestored: {
                            $sum: {
                                $reduce: {
                                    input: "$returnedItems",
                                    initialValue: 0,
                                    in: { $add: ["$$value", { $cond: [{ $eq: ["$$this.condition", "GOOD"] }, "$$this.quantity", 0] }] }
                                }
                            }
                        },
                        totalDamages: {
                            $sum: {
                                $reduce: {
                                    input: "$returnedItems",
                                    initialValue: 0,
                                    in: { $add: ["$$value", { $cond: [{ $eq: ["$$this.condition", "DAMAGED"] }, "$$this.quantity", 0] }] }
                                }
                            }
                        }
                    }
                }
            ])
        ]);
        
        res.status(200).json({ 
            success: true, 
            data: returns,
            stats: stats[0] || { totalRefunded: 0, exchangeBalance: 0, inventoryRestored: 0, totalDamages: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
