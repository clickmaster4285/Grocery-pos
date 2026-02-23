const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');
const Terminal = require('../models/terminal.model');
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { branchId, terminalId, items, discount, paymentMethod, customerName, customerPhone } = req.body;
        const cashierId = req.user._id;

        if (!items || items.length === 0) {
            throw new Error('No items in the sale.');
        }

        // 1. Terminal Validation
        if (!terminalId) {
            throw new Error('Terminal ID is required for POS transactions.');
        }

        const terminal = await Terminal.findById(terminalId).session(session);
        if (!terminal) throw new Error('Terminal not found.');
        
        if (terminal.status !== 'Available') {
            throw new Error(`Terminal is currently ${terminal.status}. Please open a session or unlock terminal.`);
        }

        if (!terminal.activeSession || terminal.activeSession.userId.toString() !== cashierId.toString()) {
            throw new Error('You do not have an active session on this terminal.');
        }

        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) throw new Error(`Product ${item.product} not found.`);

            const variant = product.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${product.productName}.`);

            // Deduct stock from BranchStockLocations using the utility function
            await deductStockFromLocations(branchId, item.product, item.variantId, item.quantity, session);

            // Get latest price
            const latestPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
            const itemSubtotal = latestPrice * item.quantity;
            totalAmount += itemSubtotal;

            processedItems.push({
                product: item.product,
                variantId: item.variantId,
                sku: variant.sku,
                productName: product.productName,
                quantity: item.quantity,
                unitPrice: latestPrice,
                subtotal: itemSubtotal
            });
        }

        const finalAmount = totalAmount - (discount || 0);
        const billNumber = await generateBillNumber();

        const sale = new Sale({
            billNumber,
            branch: branchId,
            terminal: terminalId, // Linked to terminal
            items: processedItems,
            totalAmount,
            discount: discount || 0,
            finalAmount,
            paymentMethod,
            cashier: cashierId,
            customerName,
            customerPhone
        });

        await sale.save({ session });

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
        }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: sale });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Get sales history for a branch
exports.getBranchSales = async (req, res) => {
    try {
        const { branchId } = req.params;
        const sales = await Sale.find({ branch: branchId })
            .populate('cashier', 'firstName lastName')
            .populate('branch', 'branch_name') // Added populate for branch
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
        if (req.user.role !== 'admin') {
            if (!req.user.branch_id) {
                return res.status(400).json({ success: false, message: 'User is not assigned to any branch' });
            }
            query.branch = req.user.branch_id;
        }

        // 2. Search Filter (Bill Number or Customer Name/Phone)
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
            // Default: Only today's records
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
                        totalItems: { $sum: { $sum: "$items.quantity" } }
                    }
                }
            ])
        ]);
        
        res.status(200).json({ 
            success: true, 
            data: sales,
            stats: stats[0] || { totalCollection: 0, totalSales: 0, totalItems: 0 },
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
        const sale = await Sale.findById(req.params.id)
            .populate('branch', 'branch_name')
            .populate('cashier', 'firstName lastName')
            .populate('items.product', 'productName');
            
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
