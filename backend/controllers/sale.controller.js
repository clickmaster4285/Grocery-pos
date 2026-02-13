const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');
const mongoose = require('mongoose');

// Helper to generate bill number: SALE-YYYYMMDD-[BASE36_SERIAL]
// Base-36 uses 0-9 and A-Z, allowing 1,679,616 unique IDs in just 4 characters.
const generateBillNumber = async () => {
    // 1. Get current date in YYYYMMDD format for the bill prefix
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); 
    
    // 2. ATOMIC COUNTER UPDATE
    // We use findOneAndUpdate with an aggregation pipeline to ensure atomicity.
    // This prevents "race conditions" where two sales get the same number.
    const counter = await Counter.findOneAndUpdate(
        { id: 'sale_bill' },
        [
            {
                $set: {
                    // 3. DAILY RESET LOGIC
                    // If the stored 'lastDate' matches today, increment the sequence.
                    // Otherwise, it's a new day, so we reset the counter to 1.
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

    // 4. BASE-36 CONVERSION
    // .toString(36) converts the number (e.g., 1234) into alphanumeric (e.g., 'ya').
    // .toUpperCase() ensures the bill looks professional (e.g., 'YA').
    // .padStart(4, '0') ensures the length is always 4 characters (e.g., '00YA').
    const serial = counter.seq.toString(36).toUpperCase().padStart(4, '0');

    // Result Example: SALE-20260213-0A2F
    return `SALE-${dateStr}-${serial}`;
};

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        const { branchId, items, discount, paymentMethod, customerName, customerPhone } = req.body;
        const cashierId = req.user._id;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in the sale.' });
        }

        let totalAmount = 0;
        const processedItems = [];

        // Validate items and check branch stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Product ${item.product} not found`);

            const variant = product.variants.id(item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found`);

            // Check Branch Stock
            const branchStock = await BranchStock.findOne({
                branch: branchId,
                product: item.product,
                variantId: item.variantId
            });

            if (!branchStock || branchStock.quantity < item.quantity) {
                throw new Error(`Insufficient stock in branch for ${product.productName} (${variant.sku})`);
            }

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

            // Deduct from Branch Stock
            branchStock.quantity -= item.quantity;
            await branchStock.save();
        }

        const finalAmount = totalAmount - (discount || 0);
        const billNumber = await generateBillNumber();

        const sale = new Sale({
            billNumber,
            branch: branchId,
            items: processedItems,
            totalAmount,
            discount: discount || 0,
            finalAmount,
            paymentMethod,
            cashier: cashierId,
            customerName,
            customerPhone
        });

        await sale.save();

        res.status(201).json({ success: true, data: sale });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get sales history for a branch
exports.getBranchSales = async (req, res) => {
    try {
        const { branchId } = req.params;
        const sales = await Sale.find({ branch: branchId })
            .populate('cashier', 'firstName lastName')
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
