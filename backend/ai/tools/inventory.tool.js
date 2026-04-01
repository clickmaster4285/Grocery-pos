const Product = require('../../models/product.model');
const BranchStock = require('../../models/branchStock.model');
const Category = require('../../models/category.model');
const BranchLocation = require('../../models/branchLocation.model');
const BranchStockLocation = require('../../models/branchStockLocation.model');
const mongoose = require('mongoose');

/**
 * InventoryTool - Handles AI requests related to product inventory.
 * 
 * @param {string} action - The action to perform (e.g., LOW_STOCK, SEARCH_PRODUCT)
 * @param {object} params - Parameters extracted by the AI (e.g., threshold, filter)
 * @param {string} branchId - The branch ID
 */
async function inventoryTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'LOW_STOCK':
         const threshold = params.threshold || 10;
         const lowStockItems = await BranchStock.find({
            branch: branchId,
            quantity: { $lte: threshold }
         })
         .populate('product', 'productName unit variants')
         .limit(params.limit || 10);

         return lowStockItems.map(item => {
            const variant = item.product.variants.find(v => v._id.toString() === item.variantId.toString());
            return {
               name: item.product.productName,
               sku: variant ? variant.sku : 'N/A',
               current_quantity: item.quantity,
               unit: item.product.unit
            };
         });

      case 'SEARCH_PRODUCT':
         const searchQuery = params.filter;
         if (!searchQuery) return { error: "No search term provided" };

         const products = await Product.find({
            $or: [
               { productName: { $regex: searchQuery, $options: 'i' } },
               { "variants.sku": { $regex: searchQuery, $options: 'i' } },
               { "variants.barcode": searchQuery }
            ],
            isDeleted: false
         })
         .select('productName unit variants category brand')
         .populate('category', 'name')
         .populate('brand', 'name')
         .limit(5);

         return products.map(p => ({
            name: p.productName,
            category: p.category?.name,
            brand: p.brand?.name,
            variants: p.variants.map(v => ({
               sku: v.sku,
               barcode: v.barcode,
               price: v.priceHistory?.[v.priceHistory.length - 1]?.sellingPrice || 'N/A'
            }))
         }));

      case 'CATEGORY_SUMMARY':
         const categoryName = params.filter;
         if (!categoryName) return { error: "No category name provided" };

         const category = await Category.findOne({ name: { $regex: categoryName, $options: 'i' } });
         if (!category) return { error: "Category not found" };

         const productIds = await Product.find({ category: category._id, isDeleted: false }).distinct('_id');

         const stockData = await BranchStock.aggregate([
            { $match: { branch: new mongoose.Types.ObjectId(branchId), product: { $in: productIds } } },
            { $group: {
               _id: null,
               totalItems: { $count: {} },
               totalQuantity: { $sum: "$quantity" }
            }}
         ]);

         return {
            category: category.name,
            unique_skus: stockData[0]?.totalItems || 0,
            total_stock_units: stockData[0]?.totalQuantity || 0
         };

      case 'LOCATION_STATUS':
         // Checks stock levels at a specific physical location (e.g., Aisle 1)
         const locName = params.filter;
         if (!locName) return { error: "No location name provided." };

         const location = await BranchLocation.findOne({ 
            branch: branchId, 
            name: { $regex: locName, $options: 'i' } 
         });

         if (!location) return { error: "Location not found in this branch." };

         const itemsAtLocation = await BranchStockLocation.find({ 
            location: location._id 
         })
         .populate('product', 'productName')
         .limit(10);

         return {
            location: location.name,
            type: location.type,
            occupancy: location.currentOccupancy,
            capacity: location.capacity,
            items: itemsAtLocation.map(i => ({
               product: i.product.productName,
               quantity: i.quantity
            }))
         };

      default:
         throw new Error(`InventoryTool does not support action: ${action}`);
   }
}

module.exports = inventoryTool;