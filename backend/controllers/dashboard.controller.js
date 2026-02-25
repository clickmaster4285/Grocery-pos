const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const DiscountPromotion = require('../models/discount.model');
const { endOfDay, startOfDay, subDays, subWeeks, subMonths, subYears, format } = require('date-fns');

// Helper function to get date range based on period
const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    let endDate = endOfDay(now); // Default to end of today

    switch (period) {
        case 'today':
            startDate = startOfDay(now);
            break;
        case 'yesterday':
            startDate = startOfDay(subDays(now, 1));
            endDate = endOfDay(subDays(now, 1));
            break;
        case 'last_7_days':
            startDate = startOfDay(subDays(now, 6));
            break;
        case 'last_30_days':
            startDate = startOfDay(subDays(now, 29));
            break;
        case 'this_month':
            startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
            break;
        case 'last_month':
            startDate = startOfDay(subMonths(new Date(now.getFullYear(), now.getMonth(), 1), 1));
            endDate = endOfDay(subDays(new Date(now.getFullYear(), now.getMonth(), 1), 1));
            break;
        case 'this_year':
            startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
            break;
        case 'last_year':
            startDate = startOfDay(subYears(new Date(now.getFullYear(), 0, 1), 1));
            endDate = endOfDay(subDays(new Date(now.getFullYear(), 0, 1), 1));
            break;
        default: // Default to today
            startDate = startOfDay(now);
            break;
    }
    return { startDate, endDate };
};

// 1. Get Summary Stats (KPIs)
exports.getSummaryStats = async (req, res, next) => {
    try {
        const { period = 'today' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        let matchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
        if (req.user.role !== 'admin' && req.user.branch_id) {
            matchQuery.branch = req.user.branch_id;
        }

        const stats = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: "$finalAmount" },
                    totalSales: { $sum: 1 },
                    totalItemsSold: { $sum: { $sum: "$items.quantity" } },
                    totalTax: { $sum: "$totalTax" },
                    totalDiscount: { $sum: { $add: ["$globalDiscountAmount", { $sum: "$items.discountAmount" }] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCollection: { $ifNull: ["$totalCollection", 0] },
                    totalSales: { $ifNull: ["$totalSales", 0] },
                    totalItemsSold: { $ifNull: ["$totalItemsSold", 0] },
                    totalTax: { $ifNull: ["$totalTax", 0] },
                    totalDiscount: { $ifNull: ["$totalDiscount", 0] },
                }
            }
        ]);

        const salesStats = stats[0] || {
            totalCollection: 0,
            totalSales: 0,
            totalItemsSold: 0,
            totalTax: 0,
            totalDiscount: 0,
        };

        // Calculate average transaction value
        salesStats.avgTransactionValue = salesStats.totalSales > 0
            ? salesStats.totalCollection / salesStats.totalSales
            : 0;

        res.status(200).json({ success: true, data: salesStats });
    } catch (error) {
        next(error);
    }
};

// 2. Get Sales Chart Data (e.g., sales by hour/day)
exports.getSalesChartData = async (req, res, next) => {
    try {
        const { period = 'today' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        let matchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
        if (req.user.role !== 'admin' && req.user.branch_id) {
            matchQuery.branch = req.user.branch_id;
        }

        let groupFormat;
        let projectFormat;
        // Adjust grouping format based on period for hourly, daily, monthly data
        switch (period) {
            case 'today':
            case 'yesterday':
                groupFormat = {
                    $dateToString: { format: "%H %p", date: "$createdAt", timezone: "Asia/Karachi" }
                };
                projectFormat = {
                    time: "$_id",
                    value: "$totalSales"
                };
                break;
            case 'last_7_days':
            case 'last_30_days':
                groupFormat = {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Karachi" }
                };
                projectFormat = {
                    time: "$_id",
                    value: "$totalSales"
                };
                break;
            case 'this_month':
            case 'last_month':
                groupFormat = {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Karachi" }
                };
                projectFormat = {
                    time: "$_id",
                    value: "$totalSales"
                };
                break;
            case 'this_year':
            case 'last_year':
                groupFormat = {
                    $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Karachi" }
                };
                projectFormat = {
                    time: "$_id",
                    value: "$totalSales"
                };
                break;
            default: // Default to hourly for today
                groupFormat = {
                    $dateToString: { format: "%H %p", date: "$createdAt", timezone: "Asia/Karachi" }
                };
                projectFormat = {
                    time: "$_id",
                    value: "$totalSales"
                };
                break;
        }

        const salesData = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupFormat,
                    totalSales: { $sum: "$finalAmount" }
                }
            },
            { $sort: { _id: 1 } },
            { $project: projectFormat }
        ]);

        res.status(200).json({ success: true, data: salesData });
    } catch (error) {
        next(error);
    }
};

// 3. Get Sales Data by Payment Method
exports.getPaymentMethodData = async (req, res, next) => {
    try {
        const { period = 'today' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        let matchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
        if (req.user.role !== 'admin' && req.user.branch_id) {
            matchQuery.branch = req.user.branch_id;
        }

        const paymentData = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$paymentMethod",
                    totalAmount: { $sum: "$finalAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: "$totalAmount"
                }
            }
        ]);

        res.status(200).json({ success: true, data: paymentData });
    } catch (error) {
        next(error);
    }
};

// 4. Get Top Selling Products
exports.getTopSellingProducts = async (req, res, next) => {
    try {
        const { period = 'today', limit = 4 } = req.query;
        const { startDate, endDate } = getDateRange(period);

        let matchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
        if (req.user.role !== 'admin' && req.user.branch_id) {
            matchQuery.branch = req.user.branch_id;
        }

        const topProducts = await Sale.aggregate([
            { $match: matchQuery },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
                    totalQuantity: { $sum: "$items.quantity" },
                    productName: { $first: "$items.productName" } // Assuming productName is stored in items
                }
            },
            { $sort: { totalRevenue: -1 } }, // Sort by revenue
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    name: "$productName",
                    revenue: "$totalRevenue",
                    quantity: "$totalQuantity"
                }
            }
        ]);

        res.status(200).json({ success: true, data: topProducts });
    } catch (error) {
        next(error);
    }
};

// 5. Get Low Stock Alerts
exports.getLowStockAlerts = async (req, res, next) => {
    try {
        const { limit = 3 } = req.query; // Default to 3 alerts
        
        let matchQuery = { isDeleted: false, 'variants.isDeleted': false };
        if (req.user.role !== 'admin' && req.user.branch_id) {
             // This logic assumes BranchStock documents exist for products in the user's branch
             // A more robust solution might involve a lookup to BranchStock first
             // For now, we'll rely on the frontend filtering or assume general low stock across all branches for an admin
        }

        const lowStockProducts = await Product.aggregate([
            { $match: matchQuery },
            { $unwind: "$variants" },
            {
                $lookup: {
                    from: 'branchstocks',
                    let: { productId: "$_id", variantId: "$variants._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$product", "$$productId"] },
                                        { $eq: ["$variantId", "$$variantId"] },
                                        req.user.role !== 'admin' && req.user.branch_id ? { $eq: ["$branch", req.user.branch_id] } : true
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'branchStockInfo'
                }
            },
            { $unwind: "$branchStockInfo" },
            {
                $match: {
                    $expr: { $lt: ["$branchStockInfo.quantity", "$variants.minStockLevel"] }
                }
            },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    name: "$productName",
                    variantSku: "$variants.sku",
                    currentStock: "$branchStockInfo.quantity",
                    minStockLevel: "$variants.minStockLevel",
                    branch: "$branchStockInfo.branch"
                }
            }
        ]);

        // Further populate branch details if needed, or rely on frontend to lookup branch name by ID
        res.status(200).json({ success: true, data: lowStockProducts });
    } catch (error) {
        next(error);
    }
};

// 6. Get Active Promotions
exports.getActivePromotions = async (req, res, next) => {
    try {
        const now = new Date();
        let matchQuery = {
            status: 'active',
            startDate: { $lte: now },
            $or: [{ endDate: { $exists: false } }, { endDate: { $gt: now } }]
        };

        // Role-based access control for promotions
        if (req.user.role !== 'admin' && req.user.branch_id) {
            matchQuery.$or = [
                { isGlobal: true },
                { applicableBranches: req.user.branch_id }
            ];
        }

        const promotions = await DiscountPromotion.find(matchQuery)
            .select('name description amountValue amountType validOn minPurchaseAmount applicableBranches qualifyingCustomerGroups')
            .populate('applicableBranches', 'name');

        res.status(200).json({ success: true, data: promotions });
    } catch (error) {
        next(error);
    }
};
