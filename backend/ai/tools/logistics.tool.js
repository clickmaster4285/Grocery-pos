const Supplier = require('../../models/supplier.model');
const StockTransfer = require('../../models/stockTransfer.model');
const mongoose = require('mongoose');

/**
 * LogisticsTool - Handles AI requests related to suppliers and stock movement.
 * 
 * @param {string} action - The action to perform (e.g., SUPPLIER_LIST, STOCK_TRANSFERS)
 * @param {object} params - Parameters extracted by the AI
 * @param {string} branchId - The branch ID
 */
async function logisticsTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'SUPPLIER_LIST':
         // Returns a list of active suppliers with their contact info
         const suppliers = await Supplier.find({ 
            status: 'ACTIVE', 
            isDeleted: false 
         })
         .select('name contactPerson phone email payment_terms')
         .limit(params.limit || 10);

         return suppliers.map(s => ({
            name: s.name,
            contact: s.contactPerson,
            phone: s.phone,
            email: s.email,
            payment_terms: s.payment_terms
         }));

      case 'STOCK_TRANSFERS':
         // Returns recent transfers involving the current branch
         const transfers = await StockTransfer.find({
            $or: [
               { fromLocation: branchId },
               { toLocation: branchId },
               { branch: branchId } // For INTERNAL transfers
            ]
         })
         .sort({ createdAt: -1 })
         .limit(params.limit || 5)
         .populate('items.product', 'productName');

         return transfers.map(t => ({
            type: t.transferType,
            from: t.fromLocation,
            to: t.toLocation,
            status: t.status,
            date: t.transferDate.toLocaleDateString(),
            items_count: t.items.length,
            notes: t.notes
         }));

      default:
         throw new Error(`LogisticsTool does not support action: ${action}`);
   }
}

module.exports = logisticsTool;