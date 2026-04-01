const Customer = require('../../models/customer.model');
const Sale = require('../../models/sale.model');
const mongoose = require('mongoose');

/**
 * CRMTool - Handles AI requests related to customers and loyalty.
 * 
 * @param {string} action - The action to perform (e.g., TOP_CUSTOMERS, CUSTOMER_HISTORY)
 * @param {object} params - Parameters extracted by the AI
 * @param {string} branchId - The branch ID (for filtering or context)
 */
async function crmTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'TOP_CUSTOMERS':
         // Finds customers with the highest spending or transaction count
         const limit = params.limit || 5;
         const topCustomers = await Sale.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               status: 'COMPLETED'
            }},
            { $group: {
               _id: "$customer",
               totalSpent: { $sum: "$finalAmount" },
               orderCount: { $count: {} }
            }},
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            { $lookup: {
               from: 'customers',
               localField: '_id',
               foreignField: '_id',
               as: 'customerDetails'
            }},
            { $unwind: "$customerDetails" }
         ]);

         return topCustomers.map(c => ({
            name: c.customerDetails.firstName + ' ' + c.customerDetails.lastName,
            phone: c.customerDetails.phone,
            total_spent: c.totalSpent,
            orders: c.orderCount,
            loyalty_points: c.customerDetails.loyaltyPoints
         }));

      case 'CUSTOMER_HISTORY':
         // Retrieves the last few transactions for a specific customer
         const searchTerm = params.filter;
         if (!searchTerm) return { error: "Please provide a customer name or phone number." };

         const customer = await Customer.findOne({
            $or: [
               { firstName: { $regex: searchTerm, $options: 'i' } },
               { lastName: { $regex: searchTerm, $options: 'i' } },
               { phone: searchTerm }
            ]
         });

         if (!customer) return { error: "Customer not found." };

         const history = await Sale.find({ 
            customer: customer._id,
            status: 'COMPLETED'
         })
         .sort({ createdAt: -1 })
         .limit(5)
         .select('invoiceNo finalAmount createdAt items');

         return {
            customer: `${customer.firstName} ${customer.lastName}`,
            history: history.map(h => ({
               invoice: h.invoiceNo,
               amount: h.finalAmount,
               date: h.createdAt.toLocaleDateString(),
               items_count: h.items.length
            }))
         };

      default:
         throw new Error(`CRMTool does not support action: ${action}`);
   }
}

module.exports = crmTool;