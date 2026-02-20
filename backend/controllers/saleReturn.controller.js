const SaleReturn = require('../models/saleReturn.model');
const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const BranchStockLocation = require('../models/branchStockLocation.model'); // Added
const BranchLocation = require('../models/branchLocation.model'); // Added
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');
const { addStockToLocation, deductStockFromLocations, getDefaultBackroomLocation } = require('../utils/inventory.utils'); // Added

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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { saleId, type, returnedItems, exchangedItems } = req.body;
        const userId = req.user._id;

        // 1. Fetch Original Sale
        const originalSale = await Sale.findById(saleId).session(session);
        if (!originalSale) throw new Error('Original sale not found');

        const returnNumber = await generateReturnNumber();
        let totalRefundValue = 0;
        let totalExchangeValue = 0;

        const branchDefaultBackroom = await getDefaultBackroomLocation(originalSale.branch, session);

        // 2. Process Returned Items
        for (const item of returnedItems) {
            // Ensure we are comparing ID strings (handles cases where product might be an object)
            const productId = typeof item.product === 'object' ? item.product._id : item.product;
            const variantId = typeof item.variantId === 'object' ? item.variantId._id : item.variantId;

            // Find item in original sale to validate
            const originalItem = originalSale.items.find(
                i => i.product.toString() === productId.toString() && i.variantId.toString() === variantId.toString()
            );

            if (!originalItem) throw new Error(`Item ${item.productName} was not part of the original sale`);
            if (item.quantity > originalItem.quantity) throw new Error(`Cannot return more than purchased for ${item.productName}`);

            totalRefundValue += (originalItem.unitPrice * item.quantity);

            // Update Stock if condition is GOOD - add back to default backroom
            if (item.condition === 'GOOD') {
                const productDoc = await Product.findById(productId).session(session);
                if (!productDoc) throw new Error(`Product ${productId} not found.`);
                
                await addStockToLocation(
                    originalSale.branch,
                    productId,
                    variantId,
                    branchDefaultBackroom._id,
                    item.quantity,
                    session
                );
            }
        }

        // 3. Process Exchanged Items (if any)
        const processedExchanges = [];
        if (type === 'EXCHANGE' && exchangedItems) {
            for (const item of exchangedItems) {
                const product = await Product.findById(item.product).session(session);
                if (!product) throw new Error(`Product ${item.product} not found.`);

                const variant = product.variants.id(item.variantId);
                if (!variant) throw new Error(`Variant ${item.variantId} not found.`);

                const price = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
                const subtotal = price * item.quantity;

                // Deduct stock for new items from branch stock locations
                await deductStockFromLocations(originalSale.branch, item.product, item.variantId, item.quantity, session);

                totalExchangeValue += subtotal;
                processedExchanges.push({
                    product: item.product,
                    variantId: item.variantId,
                    productName: product.productName,
                    sku: variant.sku,
                    quantity: item.quantity,
                    unitPrice: price,
                    subtotal
                });
            }
        }

        // 4. Create Return Record
        const saleReturn = new SaleReturn({
            returnNumber,
            originalSale: saleId,
            branch: originalSale.branch,
            type,
            returnedItems,
            exchangedItems: processedExchanges,
            totalRefundAmount: type === 'RETURN' ? totalRefundValue : 0,
            totalExchangeDifference: type === 'EXCHANGE' ? (totalExchangeValue - totalRefundValue) : 0,
            performedBy: userId
        });

        await saleReturn.save({ session });
        await session.commitTransaction();

        res.status(201).json({ success: true, data: saleReturn });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// GET COMPLETE HISTORY OF A BILL
exports.getSaleHistory = async (req, res) => {
    try {
        const { saleId } = req.params;
        
        // 1. Fetch original sale
        const sale = await Sale.findById(saleId)
            .populate('branch', 'branch_name')
            .populate('cashier', 'firstName lastName')
            .populate('items.product', 'productName');

        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // 2. Fetch all returns/exchanges for this sale
        const activityLog = await SaleReturn.find({ originalSale: saleId })
            .populate('performedBy', 'firstName lastName')
            .sort({ createdAt: 1 });

        // 3. CALCULATE REMAINING RETURNABLE QUANTITIES
        // We create a map of SKU -> Total Returned
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

// GET ALL RETURNS (For the new sidebar menu)
exports.getAllReturns = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let query = {};

        // 1. Role-based Branch Isolation
        if (req.user.role !== 'admin') {
            query.branch = req.user.branch_id;
        }

        // 2. Date Filtering
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

        // 3. Search (Return Number)
        if (search) {
            query.returnNumber = { $regex: search, $options: 'i' };
        }

        // 4. Fetch Data and Stats
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
                        // Count items by condition
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
