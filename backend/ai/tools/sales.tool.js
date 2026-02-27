const Sale = require('../../models/sale.model');
const mongoose = require('mongoose');

/**
 * SalesTool - Handles AI requests related to revenue and transaction history.
 * 
 * @param {string} action - The action to perform (e.g., TODAY_SUMMARY, TOP_PRODUCTS)
 * @param {object} params - Parameters extracted by the AI (e.g., timeframe, limit)
 * @param {string} branchId - The branch ID of the current user (for security)
 */
async function salesTool(action, params, branchId) {
   const startOfToday = new Date();
   startOfToday.setHours(0, 0, 0, 0);

   const endOfToday = new Date();
   endOfToday.setHours(23, 59, 59, 999);

   switch (action) {
      
      case 'TODAY_SUMMARY':
         // Provides total collection and transaction count for the current shift/day
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
         // Identifies the highest-moving items in the specified timeframe
         const limit = params.limit || 5;
         const topProducts = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               status: 'COMPLETED'
               // Timeframe logic can be added here based on params.timeframe
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
         // Simplified version for now: returns daily revenue trend for the last 7 days
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

      default:
         throw new Error(`SalesTool does not support action: ${action}`);
   }
}

module.exports = salesTool;