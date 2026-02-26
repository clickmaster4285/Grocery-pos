const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');
const Terminal = require('../models/terminal.model');
const DiscountPromotion = require('../models/discount.model');
const User = require('../models/User');
const mongoose = require('mongoose');
const BranchStockLocation = require('../models/branchStockLocation.model'); 
const BranchLocation = require('../models/branchLocation.model'); 
const { deductStockFromLocations } = require('../utils/inventory.utils'); 

// Helper to generate bill number: SALE-YYYYMMDD-[BASE36_SERIAL]
const generateBillNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); 
    
    const counter = await Counter.findOneAndUpdate(
        { id: 'sale_bill' },
        [
            {
                $set: {
                    seq: {
                        $cond: {
                            if: { $eq: ["$lastDate", dateStr] },
                            then: { $add: ["$seq", 1] },
                            else: 1 
                        }
                    },
                    lastDate: dateStr
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(4, '0');
    return `SALE-${dateStr}-${serial}`;
};

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        const { 
            branchId, 
            terminalId, 
            items, 
            globalDiscountPercent = 0, 
            paymentMethod, 
            customer, // New: customer ID
            customerName, 
            customerPhone 
        } = req.body;
        const cashierId = req.user._id;
        const maxAllowedDiscount = req.user.transactionLimits?.maxDiscountPercent || 0;

        if (!items || items.length === 0) {
            throw new Error('No items in the sale.');
        }

        // 1. Terminal Validation
        if (!terminalId) {
            throw new Error('Terminal ID is required for POS transactions.');
        }

        const terminal = await Terminal.findById(terminalId);
        if (!terminal) throw new Error('Terminal not found.');
        
        if (terminal.status !== 'Available') {
            throw new Error(`Terminal is currently ${terminal.status}. Please open a session or unlock terminal.`);
        }

        if (!terminal.activeSession || terminal.activeSession.userId.toString() !== cashierId.toString()) {
            throw new Error('You do not have an active session on this terminal.');
        }

        // Validate Global Discount
        if (globalDiscountPercent > maxAllowedDiscount) {
            throw new Error(`You are not authorized to give more than ${maxAllowedDiscount}% global discount.`);
        }

        let totalSubtotal = 0;
        let totalTax = 0;
        const processedItems = [];

        // Fetch all active auto-apply discounts once to optimize
        const now = new Date();
        const activeAutoDiscounts = await DiscountPromotion.find({
            status: 'active',
            autoApply: true,
            startDate: { $lte: now },
            $or: [{ endDate: { $exists: false } }, { endDate: { $gt: now } }],
            $or: [{ isGlobal: true }, { applicableBranches: branchId }]
        });

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Product ${item.product} not found.`);

            const variant = product.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${product.productName}.`);

            // Deduct stock
            await deductStockFromLocations(branchId, item.product, item.variantId, item.quantity);

            // Get original price
            const originalUnitPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
            
            // Calculate Automatic Discount
            let autoDiscountPercent = 0;
            const applicablePromo = activeAutoDiscounts.find(promo => 
                promo.qualifyingProducts.includes(product._id) || 
                promo.qualifyingVariants.includes(item.variantId.toString()) ||
                promo.qualifyingCategories.includes(product.category) ||
                promo.qualifyingBrands.includes(product.brand)
            );

            if (applicablePromo && applicablePromo.amountType === 'Percentage') {
                autoDiscountPercent = applicablePromo.amountValue;
            }

            // Manual Item Discount
            const manualDiscountPercent = item.manualDiscountPercent || 0;
            if (manualDiscountPercent > maxAllowedDiscount) {
                throw new Error(`You are not authorized to give more than ${maxAllowedDiscount}% discount on ${product.productName}.`);
            }

            const totalItemDiscountPercent = autoDiscountPercent + manualDiscountPercent;
            const discountAmountPerUnit = (originalUnitPrice * totalItemDiscountPercent) / 100;
            const unitPriceAfterDiscount = originalUnitPrice - discountAmountPerUnit;
            
            const itemSubtotal = unitPriceAfterDiscount * item.quantity;
            const itemTaxAmount = (itemSubtotal * (product.taxRate || 0)) / 100;

            totalSubtotal += itemSubtotal;
            totalTax += itemTaxAmount;

            processedItems.push({
                product: item.product,
                variantId: item.variantId,
                sku: variant.sku,
                productName: product.productName,
                quantity: item.quantity,
                originalUnitPrice,
                discountPercent: totalItemDiscountPercent,
                discountAmount: discountAmountPerUnit * item.quantity,
                unitPrice: unitPriceAfterDiscount,
                taxRate: product.taxRate || 0,
                taxAmount: itemTaxAmount,
                subtotal: itemSubtotal
            });
        }

        const totalAmount = totalSubtotal + totalTax;
        const globalDiscountAmount = (totalSubtotal * globalDiscountPercent) / 100;
        const finalAmount = totalAmount - globalDiscountAmount;
        
        const billNumber = await generateBillNumber();

        const sale = new Sale({
            billNumber,
            branch: branchId,
            terminal: terminalId,
            items: processedItems,
            subtotal: totalSubtotal,
            totalTax,
            totalAmount,
            globalDiscountPercent,
            globalDiscountAmount,
            finalAmount,
            paymentMethod,
            cashier: cashierId,
            customer, // Save customer ID
            customerName,
            customerPhone
        });

        await sale.save();

        // Populate customer before returning
        const populatedSale = await Sale.findById(sale._id)
            .populate('customer', 'firstName lastName phonePrimary customerGroup email');

        // 2. Update Terminal Session State
        const drawerUpdate = paymentMethod === 'CASH' ? finalAmount : 0;
        
        await Terminal.findByIdAndUpdate(terminalId, {
            $inc: {
                'activeSession.currentDrawerBalance': drawerUpdate,
                'activeSession.transactionCount': 1
            },
            $set: {
                'activeSession.lastTransactionId': sale.billNumber
            }
        });

        res.status(201).json({ success: true, data: populatedSale });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get sales history for a branch
exports.getBranchSales = async (req, res) => {
    try {
        const { branchId } = req.params;
        
        // If not admin, ensure they are only querying their own branch
        if (req.user.role !== 'admin' && branchId !== req.user.branch.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied: Cannot query other branches.' });
        }

        const sales = await Sale.find({ branch: branchId })
            .populate('cashier', 'firstName lastName')
            .populate('branch', 'branch_name')
            .populate('customer', 'firstName lastName phonePrimary customerGroup') // Added customer populate
            .populate('items.product', 'productName')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get sales history with advanced filtering and pagination
exports.getAllSales = async (req, res) => {
    try {
        const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        
        // 1. Role-based Branch Isolation
        // Use branch filter from middleware (req.query.branch)
        if (req.query.branch) {
            query.branch = req.query.branch;
        } else if (req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Access denied: Branch context missing.' });
        }

        // 2. Search Filter
        if (search) {
            query.$or = [
                { billNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        // 3. Date Range Filter
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
        } else {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: todayStart, $lte: todayEnd };
        }

        // 4. Execution with Pagination and Stats
        const [sales, total, stats] = await Promise.all([
            Sale.find(query)
                .populate('branch', 'branch_name')
                .populate('cashier', 'firstName lastName')
                .populate('customer', 'firstName lastName phonePrimary customerGroup') // Added customer populate
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Sale.countDocuments(query),
            // Aggregate Stats
            Sale.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalCollection: { $sum: "$finalAmount" },
                        totalSales: { $sum: 1 },
                        totalItems: { $sum: { $sum: "$items.quantity" } },
                        totalTax: { $sum: "$totalTax" },
                        totalDiscount: { $sum: { $add: ["$globalDiscountAmount", { $sum: "$items.discountAmount" }] } }
                    }
                }
            ])
        ]);
        
        res.status(200).json({ 
            success: true, 
            data: sales,
            stats: stats[0] || { totalCollection: 0, totalSales: 0, totalItems: 0, totalTax: 0, totalDiscount: 0 },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single sale detail
exports.getSaleDetail = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        
        // Apply branch filter from middleware
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const sale = await Sale.findOne(query)
            .populate('branch', 'branch_name')
            .populate('cashier', 'firstName lastName')
            .populate('customer', 'firstName lastName phonePrimary customerGroup email') // Added customer populate
            .populate('items.product', 'productName category brand');
            
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found or access denied' });
        
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
