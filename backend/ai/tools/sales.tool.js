const Sale = require('../../models/sale.model');
const Branch = require('../../models/branch.model');
const mongoose = require('mongoose');

/**
 * SalesTool - Handles AI requests related to revenue and transaction history.
 * 
 * @param {string} action - The action to perform (e.g., TODAY_SUMMARY, TOP_PRODUCTS)
 * @param {object} params - Parameters extracted by the AI (e.g., timeframe, limit, filter)
 * @param {string} branchId - The branch ID
 * @param {string} userRole - The role of the current user
 */
async function salesTool(action, params, branchId, userRole) {
   const startOfToday = new Date();
   startOfToday.setHours(0, 0, 0, 0);

   const endOfToday = new Date();
   endOfToday.setHours(23, 59, 59, 999);

   switch (action) {
      
      case 'TODAY_SUMMARY':
         const summary = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               createdAt: { $gte: startOfToday, $lte: endOfToday },
               status: 'COMPLETED'
            }},
            { $group: {
               _id: null,
               totalRevenue: { $sum: "$finalAmount" },
               transactionCount: { $count: {} },
               avgOrderValue: { $avg: "$finalAmount" }
            }}
         ]);

         return {
            date: startOfToday.toLocaleDateString(),
            total_revenue: summary[0]?.totalRevenue || 0,
            transactions: summary[0]?.transactionCount || 0,
            average_ticket: Math.round(summary[0]?.avgOrderValue || 0)
         };

      case 'TOP_PRODUCTS':
         const limit = params.limit || 5;
         const topProducts = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               status: 'COMPLETED'
            }},
            { $unwind: "$items" },
            { $group: {
               _id: "$items.productName",
               totalQuantity: { $sum: "$items.quantity" },
               totalRevenue: { $sum: "$items.subtotal" }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
         ]);

         return topProducts.map(p => ({
            product: p._id,
            units_sold: p.totalQuantity,
            revenue: p.totalRevenue
         }));

      case 'BRANCH_PERFORMANCE':
         const sevenDaysAgo = new Date();
         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

         const trend = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               createdAt: { $gte: sevenDaysAgo },
               status: 'COMPLETED'
            }},
            { $group: {
               _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
               revenue: { $sum: "$finalAmount" }
            }},
            { $sort: { "_id": 1 } }
         ]);

         return trend.map(t => ({
            day: t._id,
            revenue: t.revenue
         }));

      case 'SALES_COMPARISON':
         // Allows comparing sales between multiple branches (Admin Only)
         if (userRole !== 'admin') {
            return { error: "Access Denied. Only administrators can perform sales comparisons across branches." };
         }

         const branchFilters = params.filter ? params.filter.split(',').map(s => s.trim()) : [];
         let matchQuery = { status: 'COMPLETED' };

         if (branchFilters.length > 0) {
            const branches = await Branch.find({ 
               branch_name: { $in: branchFilters.map(f => new RegExp(f, 'i')) } 
            }).select('_id branch_name');
            
            if (branches.length > 0) {
               matchQuery.branch = { $in: branches.map(b => b._id) };
            }
         }

         const comparison = await Sale.aggregate([
            { $match: matchQuery },
            { $group: {
               _id: "$branch",
               totalRevenue: { $sum: "$finalAmount" },
               transactionCount: { $count: {} }
            }},
            { $lookup: {
               from: 'branches',
               localField: '_id',
               foreignField: '_id',
               as: 'branchDetails'
            }},
            { $unwind: "$branchDetails" }
         ]);

         return comparison.map(c => ({
            branch: c.branchDetails.branch_name,
            total_revenue: c.totalRevenue,
            transactions: c.transactionCount,
            average_sale: Math.round(c.totalRevenue / c.transactionCount)
         }));

      default:
         throw new Error(`SalesTool does not support action: ${action}`);
   }
}

module.exports = salesTool;