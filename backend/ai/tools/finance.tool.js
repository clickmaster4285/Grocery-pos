const Sale = require('../../models/sale.model');
const SaleReturn = require('../../models/saleReturn.model');
const Product = require('../../models/product.model');
const mongoose = require('mongoose');

/**
 * FinanceTool - Handles AI requests related to revenue, returns, and profits.
 * 
 * @param {string} action - The action to perform (e.g., RETURNS_SUMMARY, PROFIT_ANALYSIS)
 * @param {object} params - Parameters extracted by the AI
 * @param {string} branchId - The branch ID
 */
async function financeTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'RETURNS_SUMMARY':
         // Aggregates returns and exchanges for the branch
         const returns = await SaleReturn.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               status: 'COMPLETED'
            }},
            { $group: {
               _id: "$type",
               count: { $count: {} },
               totalRefund: { $sum: "$totalRefundAmount" },
               totalDifference: { $sum: "$totalExchangeDifference" }
            }}
         ]);

         return returns.map(r => ({
            type: r._id,
            count: r.count,
            total_refunded: r.totalRefund,
            exchange_difference: r.totalDifference
         }));

      case 'PROFIT_ANALYSIS':
         // Estimates profit by comparing sale price with current buying price
         // Note: This is an estimation as historical buying price isn't stored in Sale.
         const sales = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               status: 'COMPLETED'
            }},
            { $unwind: "$items" },
            { $group: {
               _id: "$items.product",
               totalRevenue: { $sum: "$items.subtotal" },
               totalQuantity: { $sum: "$items.quantity" }
            }},
            { $lookup: {
               from: 'products',
               localField: '_id',
               foreignField: '_id',
               as: 'productDetails'
            }},
            { $unwind: "$productDetails" }
         ]);

         let totalEstimatedProfit = 0;
         let totalRevenue = 0;

         const analysis = sales.map(s => {
            // Get the latest buying price for the product
            const latestPrice = s.productDetails.variants[0]?.priceHistory?.slice(-1)[0] || { buyingPrice: 0 };
            const estimatedCost = latestPrice.buyingPrice * s.totalQuantity;
            const profit = s.totalRevenue - estimatedCost;
            
            totalEstimatedProfit += profit;
            totalRevenue += s.totalRevenue;

            return {
               product: s.productDetails.productName,
               revenue: s.totalRevenue,
               estimated_cost: estimatedCost,
               estimated_profit: profit,
               margin: s.totalRevenue > 0 ? ((profit / s.totalRevenue) * 100).toFixed(2) + '%' : '0%'
            };
         });

         return {
            summary: {
               total_revenue: totalRevenue,
               total_estimated_profit: totalEstimatedProfit,
               overall_margin: totalRevenue > 0 ? ((totalEstimatedProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%'
            },
            top_profitable_items: analysis.sort((a, b) => b.estimated_profit - a.estimated_profit).slice(0, 5)
         };

      default:
         throw new Error(`FinanceTool does not support action: ${action}`);
   }
}

module.exports = financeTool;